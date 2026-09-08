"""Async Village Attacks (REQ-4.x) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).

NOTE: Real matchmaking (SADD 7.3.1.1), problem curation (REQ-4.2), and
Elo-based resolution (SADD 7.3.1.3) land in plan.md Phase 7. This file
currently implements only the cooldown gate against the corrected
schema (users.attack_cooldown_expires_at, SADD 7.2.1) so the endpoint
shape is stable for the frontend to build against.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.errors import CooldownActive, InvalidAttackTarget
from app.modules.m4_attacks.models import Attack, AttackStatus
from app.modules.m4_attacks.repository import AttackRepository, CooldownRepository

DEFAULT_COOLDOWN_MINUTES = 60  # TODO (Phase 10): read from game_balance_config


class AttackService:
    """Business logic for village attacks (REQ-4.1–4.4)."""

    def __init__(self, db: Session):
        self.db = db
        self.attack_repo = AttackRepository(db)
        self.cooldown_repo = CooldownRepository(db)

    def find_attack_targets(self, user_id: str, limit: int = 10) -> List[dict]:
        """TODO (Phase 7): SADD 7.3.1.1 matchmaking band over VillageProfile.defense_rating."""
        return []

    def get_cooldown_status(self, user_id: str) -> dict:
        """Check cooldown against the PostgreSQL source of truth (SADD 7.2.1)."""
        expires_at = self.cooldown_repo.get_cooldown_expiry(user_id)
        now = datetime.now(timezone.utc)

        if not expires_at or expires_at <= now:
            return {"can_attack": True, "next_available_at": None}

        return {"can_attack": False, "next_available_at": expires_at}

    def start_attack(self, attacker_user_id: str, target_user_id: str) -> Attack:
        """
        Launch an attack (REQ-4.1, REQ-4.4).

        TODO (Phase 7): validate target via matchmaking, curate a real
        problem set, and use the write-through Redis cache. For now
        this performs the write-through cooldown update directly
        against Postgres (correct, just not yet cached).
        """
        if attacker_user_id == target_user_id:
            raise InvalidAttackTarget("Cannot attack yourself")

        status = self.get_cooldown_status(attacker_user_id)
        if not status["can_attack"]:
            raise CooldownActive(
                "You are on cooldown.",
                next_available_at=status["next_available_at"].isoformat(),
            )

        cooldown_expires = datetime.now(timezone.utc) + timedelta(minutes=DEFAULT_COOLDOWN_MINUTES)
        self.cooldown_repo.set_cooldown_expiry(attacker_user_id, cooldown_expires)

        return self.attack_repo.create_attack(attacker_user_id, target_user_id)

    def resolve_attack(self, attack_id: str, success: bool, score: int = 0) -> Optional[Attack]:
        """TODO (Phase 7): SADD 7.3.1.3 Elo trophy calculation on resolution."""
        status = AttackStatus.resolved
        return self.attack_repo.update_status(attack_id, status, score)
