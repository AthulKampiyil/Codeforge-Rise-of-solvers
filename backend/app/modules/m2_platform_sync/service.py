"""Coding Platform Sync (REQ-2.x) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).

NOTE: The full SyncService (circuit breaker, DLQ, topic reconciliation)
is plan.md Phase 4. This file currently exposes the minimal surface
Phase 2 (M1 account verification) needs, so M1 can depend on M2's
service layer rather than reaching into judge_adapters directly.
"""
from typing import Optional

from app.modules.m2_platform_sync.judge_adapters.base import NormalizedUserInfo
from app.modules.m2_platform_sync.judge_adapters.codeforces import CodeforcesAdapter
from app.modules.m1_auth.models import JudgeType


class PlatformSyncService:
    """Public interface other modules call into (SADD 4.1)."""

    # Only Codeforces has a working adapter (plan.md decision).
    _ADAPTERS = {
        JudgeType.codeforces: CodeforcesAdapter(),
    }

    async def fetch_user_info(self, judge_type: JudgeType, handle: str) -> Optional[NormalizedUserInfo]:
        """
        Used by M1's ownership-verification flow (REQ-1.4). Returns None
        if the judge has no adapter yet or the handle doesn't exist.
        """
        adapter = self._ADAPTERS.get(judge_type)
        if adapter is None:
            return None
        return await adapter.get_user_info(handle)

    def has_adapter(self, judge_type: JudgeType) -> bool:
        return judge_type in self._ADAPTERS
