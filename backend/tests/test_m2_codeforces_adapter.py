"""M2 Codeforces adapter tests — the judge boundary, with no network.

The adapter builds its own `httpx.AsyncClient` inline, so respx's mock
transport intercepts regardless of where the client is constructed. Every
test here asserts on the normalized contract (`base.py`), not on
Codeforces' raw JSON shape — that translation is exactly what SADD 4.3
isolates, so it needs pinning.
"""
from datetime import datetime, timedelta, timezone

import httpx
import pytest
import respx

from app.core.config import settings
from app.modules.m2_platform_sync.judge_adapters.base import (
    NormalizedSolve,
    NormalizedUserInfo,
)
from app.modules.m2_platform_sync.judge_adapters.codeforces import CodeforcesAdapter
from app.modules.m2_platform_sync.service import PlatformSyncService
from app.modules.m1_auth.models import JudgeType

USER_INFO_URL = f"{settings.CODEFORCES_API_BASE}/user.info"
USER_STATUS_URL = f"{settings.CODEFORCES_API_BASE}/user.status"


def _user_info_payload(**overrides):
    payload = {
        "status": "OK",
        "result": [{"handle": "tourist", "firstName": "CF-abc123", "rating": 3850}],
    }
    payload.update(overrides)
    return payload


def _submission(problem_id="1234", index="A", verdict="OK", tags=None, rating=1500, age_minutes=0):
    return {
        "verdict": verdict,
        "creationTimeSeconds": int(
            (datetime.now(timezone.utc) - timedelta(minutes=age_minutes)).timestamp()
        ),
        "problem": {
            "contestId": problem_id,
            "index": index,
            "tags": tags if tags is not None else ["dp", "greedy"],
            "rating": rating,
        },
    }


# ── get_user_info (REQ-1.4 verification handshake) ────────────────────


class TestGetUserInfo:
    @respx.mock
    async def test_user_info_and_status_share_the_completed_request_cooldown(self, monkeypatch):
        from app.modules.m2_platform_sync.judge_adapters import codeforces as adapter_module
        from app.modules.m2_platform_sync.rate_gate import CodeforcesRateBusy, wait_for_codeforces_slot

        class Redis:
            now = 10_000
            active = None
            cooldown_until = 0

            async def eval(self, script, _key_count, *args):
                if "local active_ttl" in script:
                    token, ttl = args[2:]
                    if self.active and self.active[1] > self.now:
                        return self.active[1] - self.now
                    if self.cooldown_until > self.now:
                        return self.cooldown_until - self.now
                    self.active = (token, self.now + int(ttl))
                    return 0
                if "local cooldown =" in script:
                    token, cooldown = args[2:]
                    if not self.active or self.active[0] != token:
                        return 0
                    self.active = None
                    self.cooldown_until = self.now + int(cooldown)
                    return 1
                if "return redis.call('GET'" in script:
                    token = args[1]
                    return int(bool(self.active and self.active[0] == token))
                raise AssertionError("Unexpected Redis script")

        redis = Redis()

        async def gate():
            return await wait_for_codeforces_slot(redis)

        monkeypatch.setattr(adapter_module, "wait_for_codeforces_slot", gate)
        respx.get(USER_INFO_URL).mock(return_value=httpx.Response(200, json=_user_info_payload()))
        status_route = respx.get(USER_STATUS_URL).mock(
            return_value=httpx.Response(200, json={"status": "OK", "result": []})
        )

        assert await CodeforcesAdapter().get_user_info("tourist") is not None
        with pytest.raises(CodeforcesRateBusy):
            await CodeforcesAdapter().get_submissions("tourist")
        assert not status_route.called

    @respx.mock
    async def test_returns_normalized_profile(self):
        respx.get(USER_INFO_URL).mock(return_value=httpx.Response(200, json=_user_info_payload()))

        info = await CodeforcesAdapter().get_user_info("tourist")

        assert info == NormalizedUserInfo(handle="tourist", display_name="CF-abc123", rating=3850)

    @respx.mock
    async def test_sends_handle_as_query_param(self):
        route = respx.get(USER_INFO_URL, params={"handles": "tourist"}).mock(
            return_value=httpx.Response(200, json=_user_info_payload())
        )

        await CodeforcesAdapter().get_user_info("tourist")

        assert route.called

    @respx.mock
    async def test_unrated_user_has_null_rating(self):
        payload = _user_info_payload(result=[{"handle": "newbie", "firstName": "CF-abc123"}])
        respx.get(USER_INFO_URL).mock(return_value=httpx.Response(200, json=payload))

        info = await CodeforcesAdapter().get_user_info("newbie")

        assert info.handle == "newbie"
        assert info.rating is None

    @respx.mock
    async def test_api_level_failure_returns_none(self):
        # Codeforces answers 200 with status != OK for a handle that does not exist.
        respx.get(USER_INFO_URL).mock(
            return_value=httpx.Response(200, json={"status": "FAILED", "comment": "handles: No user"})
        )

        assert await CodeforcesAdapter().get_user_info("ghost") is None

    @respx.mock
    async def test_empty_result_returns_none(self):
        respx.get(USER_INFO_URL).mock(return_value=httpx.Response(200, json=_user_info_payload(result=[])))

        assert await CodeforcesAdapter().get_user_info("ghost") is None

    @respx.mock
    async def test_http_error_returns_none(self):
        respx.get(USER_INFO_URL).mock(return_value=httpx.Response(503))

        assert await CodeforcesAdapter().get_user_info("tourist") is None

    @respx.mock
    async def test_transport_error_returns_none(self):
        respx.get(USER_INFO_URL).mock(side_effect=httpx.ConnectError("network down"))

        assert await CodeforcesAdapter().get_user_info("tourist") is None


# ── get_submissions (REQ-2.1–2.2) ──────────────────────────────────────


class TestGetSubmissions:
    @respx.mock
    async def test_normalizes_accepted_solves(self):
        payload = {"status": "OK", "result": [_submission(tags=["dp"], rating=1600)]}
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(200, json=payload))

        solves = await CodeforcesAdapter().get_submissions("tourist")

        assert len(solves) == 1
        solve = solves[0]
        assert isinstance(solve, NormalizedSolve)
        assert solve.problem_ext_id == "1234-A"
        assert solve.topic_tags == ["dp"]
        assert solve.rating == 1600
        assert solve.solved_at.tzinfo is not None

    @respx.mock
    async def test_filters_out_non_accepted_verdicts(self):
        payload = {
            "status": "OK",
            "result": [
                _submission(problem_id="1", verdict="WRONG_ANSWER"),
                _submission(problem_id="2", verdict="TIME_LIMIT_EXCEEDED"),
                _submission(problem_id="3", verdict="OK"),
            ],
        }
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(200, json=payload))

        solves = await CodeforcesAdapter().get_submissions("tourist")

        assert [s.problem_ext_id for s in solves] == ["3-A"]

    @respx.mock
    async def test_preserves_all_accepted_submission_events_for_same_problem(self):
        payload = {
            "status": "OK",
            "result": [
                _submission(problem_id="1234", age_minutes=5, rating=1500),
                _submission(problem_id="1234", age_minutes=500, rating=1500),
            ],
        }
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(200, json=payload))

        solves = await CodeforcesAdapter().get_submissions("tourist")

        assert len(solves) == 2
        assert solves[0].solved_at < solves[1].solved_at
        assert solves[0].solved_at < datetime.now(timezone.utc) - timedelta(minutes=400)
        assert solves[1].solved_at > datetime.now(timezone.utc) - timedelta(minutes=10)
        assert [solve.problem_ext_id for solve in solves] == ["1234-A", "1234-A"]

    @respx.mock
    async def test_since_filters_out_older_solves(self):
        since = datetime.now(timezone.utc) - timedelta(hours=1)
        payload = {
            "status": "OK",
            "result": [
                _submission(problem_id="1", age_minutes=5),   # after the watermark
                _submission(problem_id="2", age_minutes=600),  # before it
            ],
        }
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(200, json=payload))

        solves = await CodeforcesAdapter().get_submissions("tourist", since=since)

        assert [s.problem_ext_id for s in solves] == ["1-A"]

    @respx.mock
    async def test_empty_history_returns_empty_list(self):
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(200, json={"status": "OK", "result": []}))

        assert await CodeforcesAdapter().get_submissions("tourist") == []

    @respx.mock
    async def test_api_level_failure_raises_instead_of_looking_like_empty_history(self):
        respx.get(USER_STATUS_URL).mock(
            return_value=httpx.Response(200, json={"status": "FAILED", "comment": "handle not found"})
        )

        with pytest.raises(RuntimeError, match="user.status failed"):
            await CodeforcesAdapter().get_submissions("ghost")

    @respx.mock
    async def test_http_error_raises_instead_of_looking_like_empty_history(self):
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(429))

        with pytest.raises(RuntimeError, match="request failed"):
            await CodeforcesAdapter().get_submissions("tourist")

    @respx.mock
    async def test_transport_error_raises_instead_of_looking_like_empty_history(self):
        respx.get(USER_STATUS_URL).mock(side_effect=httpx.ReadTimeout("timed out"))

        with pytest.raises(RuntimeError, match="request failed"):
            await CodeforcesAdapter().get_submissions("tourist")


class TestFetchSubmissionPage:
    @staticmethod
    def _row(submission_id, verdict="WRONG_ANSWER", problem=None):
        return {
            "id": submission_id,
            "verdict": verdict,
            "creationTimeSeconds": 1700000000,
            "problem": problem or {"contestId": 1234, "index": "A", "tags": ["dp"]},
        }

    @respx.mock
    async def test_sends_pagination_parameters_and_returns_ordered_raw_and_accepted(self):
        route = respx.get(USER_STATUS_URL, params={"handle": "tourist", "from": "101", "count": "50"}).mock(
            return_value=httpx.Response(200, json={"status": "OK", "result": [
                self._row(900, "WRONG_ANSWER"), self._row(899, "OK"),
            ]})
        )

        page = await CodeforcesAdapter().fetch_submission_page("tourist", 101, count=50)

        assert route.called
        assert page.raw_count == 2
        assert [(item.submission_id, item.verdict) for item in page.submissions] == [
            (900, "WRONG_ANSWER"), (899, "OK")
        ]
        assert len(page.accepted_solves) == 1
        assert page.accepted_solves[0].problem_ext_id == "1234-A"
        assert page.accepted_solves[0].submission_id == 899

    @respx.mock
    async def test_all_wrong_answers_still_count_as_raw_submissions(self):
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(200, json={
            "status": "OK", "result": [self._row(9), self._row(8, "TIME_LIMIT_EXCEEDED")]
        }))
        page = await CodeforcesAdapter().fetch_submission_page("tourist", 1)
        assert page.raw_count == 2
        assert page.accepted_solves == []

    @respx.mock
    async def test_short_nonempty_page_is_not_treated_as_completion(self):
        route = respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(200, json={
            "status": "OK", "result": [self._row(3)]
        }))
        page = await CodeforcesAdapter().fetch_submission_page("tourist", 1, count=100)
        assert page.raw_count == 1
        assert route.calls[0].request.url.params["count"] == "100"

    @respx.mock
    async def test_rejects_malformed_order_and_problem_ids(self):
        adapter = CodeforcesAdapter()
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(200, json={
            "status": "OK", "result": [self._row(3), self._row(4)]
        }))
        with pytest.raises(RuntimeError, match="descending ID"):
            await adapter.fetch_submission_page("tourist", 1)

        respx.reset()
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(200, json={
            "status": "OK", "result": [self._row(3, "OK", {"contestId": "bad", "index": "A"})]
        }))
        with pytest.raises(RuntimeError, match="problem ID"):
            await adapter.fetch_submission_page("tourist", 1)

    @respx.mock
    async def test_rate_limit_and_api_errors_raise_not_empty_page(self):
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(429))
        with pytest.raises(RuntimeError, match="request failed"):
            await CodeforcesAdapter().fetch_submission_page("tourist", 1)

    @respx.mock
    async def test_api_rate_limit_failure_raises_not_empty_page(self):
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(200, json={
            "status": "FAILED", "comment": "Call limit exceeded"
        }))
        with pytest.raises(RuntimeError, match="Call limit exceeded"):
            await CodeforcesAdapter().fetch_submission_page("tourist", 1)

# ── Adapter registry (SADD 5.4 — Codeforces-only build) ───────────────


class TestAdapterRegistry:
    def test_codeforces_adapter_is_registered(self):
        assert PlatformSyncService().has_adapter(JudgeType.codeforces) is True

    def test_dropped_judges_have_no_adapter(self):
        svc = PlatformSyncService()
        for judge_type in JudgeType:
            if judge_type is not JudgeType.codeforces:
                assert svc.has_adapter(judge_type) is False

    @pytest.mark.parametrize("judge_type", [JudgeType.leetcode, JudgeType.codechef])
    async def test_unsupported_judge_fetches_nothing(self, judge_type):
        # Guards the deliberate Codeforces-only decision (plan.md): a judge
        # without an adapter must fail closed, never return a partial profile.
        # A network call here would mean the registry is being bypassed.
        assert await PlatformSyncService().fetch_user_info(judge_type, "someone") is None
