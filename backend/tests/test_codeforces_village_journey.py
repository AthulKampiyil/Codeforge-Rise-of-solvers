"""End-to-end acceptance for the verified Codeforces-to-village journey.

This deliberately uses the PostgreSQL ``db`` fixture and real application
routes/services. Only the Codeforces HTTP boundary and scheduler lock are
isolated; no live judge account or production database is used.
"""
from datetime import datetime, timezone

import httpx
import pytest
import respx

from app.core.config import settings
from app.modules.m1_auth.models import JudgeAccount
from app.modules.m2_platform_sync.models import CodeforcesSyncCheckpoint, SolvedProblem
from app.modules.m2_platform_sync.sync_scheduler import SyncScheduler
from app.modules.m3_village.models import Topic, VillageProfile, VillageTopicProgress
from app.modules.m10_economy.models import EconomyLedger, Wallet
from app.modules.m8_notifications.models import Notification, NotificationOutbox


USER_INFO_URL = f"{settings.CODEFORCES_API_BASE}/user.info"
USER_STATUS_URL = f"{settings.CODEFORCES_API_BASE}/user.status"


class _LockRedis:
    """Deterministic per-test implementation of the scheduler's Redis lock."""

    held = set()

    async def set(self, key, token, nx=False, ex=None):
        if key in self.held:
            return None
        self.held.add(key)
        return True

    async def eval(self, script, count, key, token):
        self.held.discard(key)
        return 1

    async def aclose(self):
        pass


@pytest.mark.asyncio
async def test_verified_codeforces_solve_updates_village_and_rewards_once(
    client, db, engine, make_user, monkeypatch,
):
    """Exercise M1 verify -> M2 import -> M3 read + M10 reward/event once."""
    database_name = (engine.url.database or "").lower()
    assert "test" in database_name, f"Refusing to write test data to database {database_name!r}"
    monkeypatch.setattr("app.core.redis.get_async_redis", _LockRedis)
    _LockRedis.held.clear()

    user_payload, headers, _ = make_user()
    link_response = client.post(
        "/auth/judge-accounts",
        json={"judge_type": "codeforces", "handle": "journey_test_handle"},
        headers=headers,
    )
    assert link_response.status_code == 200, link_response.text
    linked = link_response.json()["judge_account"]
    proof = link_response.json()["verification_token"]

    with respx.mock:
        account_info = respx.get(USER_INFO_URL).mock(
            return_value=httpx.Response(200, json={
                "status": "OK",
                "result": [{"handle": "journey_test_handle", "firstName": proof}],
            })
        )
        verify_response = client.post(
            f"/auth/judge-accounts/{linked['id']}/verify", headers=headers,
        )
    assert verify_response.status_code == 200, verify_response.text
    assert verify_response.json()["judge_account"]["verified_flag"] is True
    assert account_info.called
    account = db.query(JudgeAccount).filter_by(id=linked["id"]).one()
    assert account.verified_flag is True

    topic = db.query(Topic).filter_by(name="dynamic-programming").one()
    # A rating of 800 yields one progress point. Seed just below this
    # database-seeded topic's first threshold so this
    # single fact deterministically crosses its level boundary regardless of
    # seeded balance values.
    earned_points = 1
    initial_points = max(0, topic.base_threshold - earned_points)
    db.add(VillageTopicProgress(
        user_id=account.user_id, topic_id=topic.id,
        progress_points=initial_points, level=0,
    ))
    db.commit()

    accepted_submission = {
        "id": 987654321,
        "verdict": "OK",
        "creationTimeSeconds": int(datetime.now(timezone.utc).timestamp()),
        "problem": {
            "contestId": 19001,
            "index": "A",
            "tags": ["dp"],
            "rating": 800,
        },
    }

    def status_response(request):
        offset = int(request.url.params.get("from", "1"))
        rows = [accepted_submission] if offset == 1 else []
        return httpx.Response(200, json={"status": "OK", "result": rows})

    with respx.mock:
        status_route = respx.get(USER_STATUS_URL).mock(side_effect=status_response)
        assert await SyncScheduler(db).sync_judge_account(str(account.id)) is True

    solve = db.query(SolvedProblem).filter_by(
        judge_account_id=account.id, problem_ext_id="19001-A",
    ).one()
    progress = db.query(VillageTopicProgress).filter_by(
        user_id=account.user_id, topic_id=topic.id,
    ).one()
    profile = db.query(VillageProfile).filter_by(user_id=account.user_id).one()
    ledger = db.query(EconomyLedger).filter_by(solved_problem_id=solve.id).one()
    wallet = db.query(Wallet).filter_by(user_id=account.user_id).one()
    outbox = db.query(NotificationOutbox).filter(
        NotificationOutbox.event_type == "VILLAGE_UPDATED",
        NotificationOutbox.target_user_ids == [str(account.user_id)],
    ).one()
    notification = db.query(Notification).filter(
        Notification.event_type == "VILLAGE_UPDATED",
        Notification.user_id == account.user_id,
    ).one()

    assert solve.rating == 800
    assert progress.progress_points == initial_points + earned_points
    assert progress.level == 1
    assert profile.total_solved == 1
    assert ledger.coin_delta > 0
    assert wallet.coins == ledger.coin_delta
    assert wallet.rewarded_solves == 1
    assert outbox.target_user_ids == [str(account.user_id)]
    assert outbox.payload["topic_name"] == topic.name
    assert notification.payload == outbox.payload

    village_response = client.get("/village/me", headers=headers)
    assert village_response.status_code == 200, village_response.text
    village = village_response.json()
    village_topic = next(item for item in village["topics"] if item["name"] == topic.name)
    assert village["user_id"] == user_payload["id"]
    assert village["total_solved"] == 1
    assert village_topic["progress_points"] == progress.progress_points
    assert village_topic["level"] == progress.level

    # Rewind only the sync watermark/checkpoint, then make the adapter see the
    # identical accepted submission again. This exercises scheduler idempotency
    # rather than allowing the incremental-scan watermark to hide the fact.
    account.last_sync_at = None
    checkpoint = db.query(CodeforcesSyncCheckpoint).filter_by(
        judge_account_id=account.id,
    ).one()
    checkpoint.history_status = "pending"
    checkpoint.history_cursor_submission_id = None
    db.commit()
    with respx.mock:
        repeat_status_route = respx.get(USER_STATUS_URL).mock(side_effect=status_response)
        assert await SyncScheduler(db).sync_judge_account(str(account.id)) is True

    db.refresh(progress)
    db.refresh(profile)
    db.refresh(wallet)
    assert status_route.call_count == 1
    assert repeat_status_route.call_count == 1
    assert db.query(SolvedProblem).filter_by(judge_account_id=account.id).count() == 1
    assert db.query(EconomyLedger).filter_by(user_id=account.user_id).count() == 1
    assert db.query(NotificationOutbox).filter(
        NotificationOutbox.event_type == "VILLAGE_UPDATED",
        NotificationOutbox.target_user_ids == [str(account.user_id)],
    ).count() == 1
    assert db.query(Notification).filter(
        Notification.event_type == "VILLAGE_UPDATED",
        Notification.user_id == account.user_id,
    ).count() == 1
    assert progress.progress_points == initial_points + earned_points
    assert profile.total_solved == 1
    assert wallet.coins == ledger.coin_delta
    assert wallet.rewarded_solves == 1
