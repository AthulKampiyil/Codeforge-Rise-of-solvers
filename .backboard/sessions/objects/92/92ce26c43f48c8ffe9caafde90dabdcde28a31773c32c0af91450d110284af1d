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
from typing import Optional

import httpx

from app.core.config import settings
from app.modules.m2_platform_sync.judge_adapters.base import (
    JudgeAdapter,
    NormalizedSolve,
    NormalizedUserInfo,
)


class CodeforcesAdapter(JudgeAdapter):
    """Fetch profile and submission data from the Codeforces public API."""

    BASE_URL = settings.CODEFORCES_API_BASE

    async def get_user_info(self, handle: str) -> Optional[NormalizedUserInfo]:
        """
        Fetch public profile info for a Codeforces handle (REQ-1.4).

        Used by M1's verification flow: the user is asked to set this
        value as their Codeforces profile "First Name", and we check
        `firstName` here against the expected token.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/user.info",
                    params={"handles": handle},
                    timeout=10,
                )
                response.raise_for_status()
                data = response.json()
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

        Filters to OK (accepted) verdicts only, dedupes by problem
        (keeping the earliest accepted submission), and — when `since`
        is given — stops considering submissions at or before it
        (Codeforces returns newest-first).
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/user.status",
                    params={"handle": handle},
                    timeout=10,
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError:
            return []

        if data.get("status") != "OK":
            return []

        submissions = data.get("result", [])
        accepted = [s for s in submissions if s.get("verdict") == "OK"]

        seen: dict[str, NormalizedSolve] = {}
        for sub in accepted:
            problem = sub.get("problem", {})
            problem_ext_id = f"{problem.get('contestId')}-{problem.get('index')}"
            solved_at = datetime.fromtimestamp(sub["creationTimeSeconds"], tz=timezone.utc)

            if since and solved_at <= since:
                continue

            # Keep the earliest accepted submission per problem.
            if problem_ext_id not in seen or solved_at < seen[problem_ext_id].solved_at:
                seen[problem_ext_id] = NormalizedSolve(
                    problem_ext_id=problem_ext_id,
                    topic_tags=problem.get("tags", []),
                    rating=problem.get("rating"),
                    solved_at=solved_at,
                )

        return list(seen.values())
