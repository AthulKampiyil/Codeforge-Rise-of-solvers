"""JudgeAdapter abstraction (SADD 7.1, 5.4 Extensibility).

SyncService and M1's verification flow depend only on this interface,
never on a judge-specific shape. A new judge is added by implementing
this ABC — no change to sync_scheduler.py, topic_tagger.py, or M1.

Full hardening (CircuitBreaker, retry/backoff, Dead-Letter Queue) lands
in plan.md Phase 4; this module currently defines the shape plus the
minimal Codeforces implementation needed for account verification
(Phase 2) and basic sync (existing Sprint 1 behavior, preserved).
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class NormalizedUserInfo:
    handle: str
    display_name: Optional[str]  # used for the profile-field verification handshake
    rating: Optional[int]


@dataclass
class NormalizedSolve:
    problem_ext_id: str
    topic_tags: list[str]
    rating: Optional[int]
    solved_at: datetime


class JudgeAdapter(ABC):
    """Common interface every judge integration must implement."""

    @abstractmethod
    async def get_user_info(self, handle: str) -> Optional[NormalizedUserInfo]:
        """Fetch public profile info for ownership verification (REQ-1.4)."""

    @abstractmethod
    async def get_submissions(self, handle: str, since: Optional[datetime] = None) -> list[NormalizedSolve]:
        """Fetch accepted submissions since a given time (REQ-2.1, REQ-2.2)."""
