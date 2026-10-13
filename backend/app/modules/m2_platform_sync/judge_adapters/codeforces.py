"""Codeforces adapter — the only judge integration in this build.

Isolated per SADD 4.3: judge-integration method is flagged as a
likely-to-change TBD (SRS Appendix C, TBD-1). Changes here must not
require touching sync_scheduler.py or topic_tagger.py.

NOTE: Sprint 2 decision (plan.md) — CodeForge integrates Codeforces
only. LeetCode/CodeChef have no official public API and scraping them
violates their Terms of Service, so those adapters were removed rather
than built against a mocked ScrapingPipeline. The JudgeAdapter ABC
(base.py) is kept so a future judge is a new file here, not a redesign
(SRS 5.4 Extensibility) — see docs/security-notes.md and plan.md for
the full reasoning.

Full resilience hardening (CircuitBreaker, tenacity retry/backoff,
PostgreSQL Dead-Letter Queue) lands in plan.md Phase 4. This version
adds the `get_user_info` call needed for REQ-1.4 ownership verification
and preserves Sprint 1's `get_submissions` behavior with real typing.
"""
from datetime import datetime, timezone
from dataclasses import dataclass
from typing import Optional
import asyncio

import httpx

from app.core.config import settings
from app.modules.m2_platform_sync.judge_adapters.base import (
    JudgeAdapter,
    NormalizedSolve,
    NormalizedUserInfo,
)
from app.modules.m2_platform_sync.rate_gate import (
    CODEFORCES_REQUEST_DEADLINE_SECONDS,
    wait_for_codeforces_slot,
)


@dataclass(frozen=True)
class RawSubmission:
    """The identity and verdict for one raw Codeforces submission."""

    submission_id: int
    verdict: Optional[str]


@dataclass
class CodeforcesSubmissionPage:
    """One API page; an under-full page is not an end-of-history marker."""

    raw_count: int
    submissions: list[RawSubmission]
    accepted_solves: list[NormalizedSolve]


class CodeforcesAdapter(JudgeAdapter):
    """Fetch profile and submission data from the Codeforces public API."""

    BASE_URL = settings.CODEFORCES_API_BASE

    async def _get_json(self, url: str, params: dict) -> dict:
        """Perform one bounded HTTP dispatch while holding its Redis lease."""
        lease = await wait_for_codeforces_slot()
        if lease is None:
            # Retains compatibility with test environments that replace the
            # gate with a no-op; production always receives a lease.
            async with httpx.AsyncClient() as client:
                async with asyncio.timeout(CODEFORCES_REQUEST_DEADLINE_SECONDS):
                    response = await client.get(
                        url, params=params, timeout=CODEFORCES_REQUEST_DEADLINE_SECONDS
                    )
                    response.raise_for_status()
                    return response.json()

        async with lease:
            await lease.assert_owned()
            async with asyncio.timeout(CODEFORCES_REQUEST_DEADLINE_SECONDS):
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        url, params=params, timeout=CODEFORCES_REQUEST_DEADLINE_SECONDS
                    )
                    response.raise_for_status()
                    return response.json()

    async def fetch_submission_page(
        self, handle: str, from_index: int, count: int = 100
    ) -> CodeforcesSubmissionPage:
        """Fetch and validate a 1-based descending-ID slice of user.status.

        ``raw_count`` counts every submission, including non-accepted verdicts.
        Callers must keep paging until an empty page; a short page alone does
        not prove the history is complete.
        """
        if from_index < 1 or count < 1:
            raise ValueError("from_index and count must be positive")
        try:
            data = await self._get_json(
                f"{self.BASE_URL}/user.status",
                {"handle": handle, "from": from_index, "count": count},
            )
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Codeforces user.status request failed: {exc}") from exc

        if not isinstance(data, dict) or data.get("status") != "OK":
            comment = data.get("comment", "unknown error") if isinstance(data, dict) else "invalid response"
            raise RuntimeError(f"Codeforces user.status failed: {comment}")
        rows = data.get("result")
        if not isinstance(rows, list):
            raise RuntimeError("Codeforces user.status returned invalid submissions JSON")

        raw: list[RawSubmission] = []
        solves: list[NormalizedSolve] = []
        previous_id: Optional[int] = None
        for row in rows:
            if not isinstance(row, dict):
                raise RuntimeError("Codeforces user.status returned malformed submission")
            submission_id = row.get("id")
            verdict = row.get("verdict")
            if isinstance(submission_id, bool) or not isinstance(submission_id, int) or submission_id < 1:
                raise RuntimeError("Codeforces user.status returned invalid submission ID")
            if verdict is not None and not isinstance(verdict, str):
                raise RuntimeError("Codeforces user.status returned invalid verdict")
            if previous_id is not None and submission_id >= previous_id:
                raise RuntimeError("Codeforces user.status submissions are not in descending ID order")
            previous_id = submission_id
            raw.append(RawSubmission(submission_id, verdict))
            if verdict != "OK":
                continue
            problem = row.get("problem")
            if not isinstance(problem, dict):
                raise RuntimeError("Codeforces user.status returned invalid problem")
            contest_id, index = problem.get("contestId"), problem.get("index")
            if (isinstance(contest_id, bool) or not isinstance(contest_id, int) or contest_id < 1
                    or not isinstance(index, str) or not index.strip()):
                raise RuntimeError("Codeforces user.status returned invalid problem ID")
            timestamp = row.get("creationTimeSeconds")
            if isinstance(timestamp, bool) or not isinstance(timestamp, int):
                raise RuntimeError("Codeforces user.status returned invalid creation time")
            tags = problem.get("tags", [])
            if not isinstance(tags, list) or any(not isinstance(tag, str) for tag in tags):
                raise RuntimeError("Codeforces user.status returned invalid problem tags")
            rating = problem.get("rating")
            if rating is not None and (isinstance(rating, bool) or not isinstance(rating, int)):
                raise RuntimeError("Codeforces user.status returned invalid problem rating")
            solves.append(NormalizedSolve(
                problem_ext_id=f"{contest_id}-{index}",
                topic_tags=tags,
                rating=rating,
                solved_at=datetime.fromtimestamp(timestamp, tz=timezone.utc),
                submission_id=submission_id,
            ))
        return CodeforcesSubmissionPage(len(rows), raw, solves)

    async def get_user_info(self, handle: str) -> Optional[NormalizedUserInfo]:
        """
        Fetch public profile info for a Codeforces handle (REQ-1.4).

        Used by M1's verification flow: the user is asked to set this
        value as their Codeforces profile "First Name", and we check
        `firstName` here against the expected token.
        """
        try:
            data = await self._get_json(f"{self.BASE_URL}/user.info", {"handles": handle})
        except httpx.HTTPError:
            return None

        if data.get("status") != "OK" or not data.get("result"):
            return None

        user = data["result"][0]
        return NormalizedUserInfo(
            handle=user.get("handle", handle),
            display_name=user.get("firstName"),
            rating=user.get("rating"),
        )

    async def get_submissions(self, handle: str, since: Optional[datetime] = None) -> list[NormalizedSolve]:
        """
        Fetch accepted submissions for a Codeforces handle (REQ-2.1–2.2).

        Filters to OK verdicts only and preserves every accepted submission
        event. Problem-level deduplication belongs to the durable solve fact,
        not this event stream (a later resubmission can count for an attack).
        """
        try:
            data = await self._get_json(f"{self.BASE_URL}/user.status", {"handle": handle})
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Codeforces user.status request failed: {exc}") from exc

        if data.get("status") != "OK":
            raise RuntimeError(f"Codeforces user.status failed: {data.get('comment', 'unknown error')}")

        submissions = data.get("result")
        if not isinstance(submissions, list):
            raise RuntimeError("Codeforces user.status returned invalid submissions JSON")
        accepted = sorted(
            (s for s in submissions if s.get("verdict") == "OK"),
            key=lambda sub: (
                sub["creationTimeSeconds"],
                sub.get("id") is None,
                sub.get("id") if sub.get("id") is not None else 0,
            ),
        )

        normalized: list[NormalizedSolve] = []
        for sub in accepted:
            problem = sub.get("problem", {})
            problem_ext_id = f"{problem.get('contestId')}-{problem.get('index')}"
            solved_at = datetime.fromtimestamp(sub["creationTimeSeconds"], tz=timezone.utc)

            if since and solved_at <= since:
                continue

            normalized.append(NormalizedSolve(
                problem_ext_id=problem_ext_id,
                topic_tags=problem.get("tags", []),
                rating=problem.get("rating"),
                solved_at=solved_at,
            ))

        return normalized
