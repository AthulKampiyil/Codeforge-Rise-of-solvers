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
    JudgeUnavailableError,
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
    async def test_keeps_earliest_accepted_submission_per_problem(self):
        # Codeforces returns newest-first; two accepted submissions for
        # 1234-A must collapse to the earlier one, not the later.
        payload = {
            "status": "OK",
            "result": [
                _submission(problem_id="1234", age_minutes=5, rating=1500),
                _submission(problem_id="1234", age_minutes=500, rating=1500),
            ],
        }
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(200, json=payload))

        solves = await CodeforcesAdapter().get_submissions("tourist")

        assert len(solves) == 1
        assert solves[0].solved_at < datetime.now(timezone.utc) - timedelta(minutes=400)

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
    async def test_api_level_failure_raises(self):
        # A judge-level FAILED response means the sync could not happen, which
        # is not the same as "nothing new". Returning [] here previously made
        # the scheduler report a healthy up_to_date sync that persisted nothing.
        respx.get(USER_STATUS_URL).mock(
            return_value=httpx.Response(200, json={"status": "FAILED", "comment": "handle not found"})
        )

        with pytest.raises(JudgeUnavailableError, match="handle not found"):
            await CodeforcesAdapter().get_submissions("ghost")

    @respx.mock
    async def test_http_error_raises(self):
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(429))

        with pytest.raises(JudgeUnavailableError):
            await CodeforcesAdapter().get_submissions("tourist")

    @respx.mock
    async def test_transport_error_raises(self):
        respx.get(USER_STATUS_URL).mock(side_effect=httpx.ReadTimeout("timed out"))

        with pytest.raises(JudgeUnavailableError):
            await CodeforcesAdapter().get_submissions("tourist")

    @respx.mock
    async def test_non_json_body_raises_parse_error(self):
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(200, text="<html>maintenance</html>"))

        with pytest.raises(JudgeUnavailableError, match="non-JSON"):
            await CodeforcesAdapter().get_submissions("tourist")


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
