"""Async Village Attacks (REQ-4.x) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).
"""
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.m4_attacks.models import Attack, AttackStatus, AttackCooldown
from app.modules.m4_attacks.repository import AttackRepository, AttackCooldownRepository
from app.modules.m1_auth.models import User


class AttackService:
    """
    Business logic for village attacks (REQ-4.1–4.4).

    Responsibilities:
    - Matchmaking (find attack targets)
    - Attack resolution (simulated challenge)
    - Cooldown management (prevent spam)
    """

    def __init__(self, db: Session):
        self.db = db
        self.attack_repo = AttackRepository(db)
        self.cooldown_repo = AttackCooldownRepository(db)

    def find_attack_targets(self, user_id: str, limit: int = 10) -> List[dict]:
        """
        Find potential attack targets via matchmaking (REQ-4.2).

        TODO (Sprint 2): Implement real strength-based matchmaking.
        For Sprint 1: Return random users with non-zero solved_count.

        Returns:
            List of target users with stats
        """
        # TODO: Implement real matchmaking algorithm
        # For now, return empty list (stub for Sprint 2)
        return []

    def start_attack(self, attacker_user_id: str, defender_user_id: str, challenge_topic: Optional[str] = None) -> Optional[Attack]:
        """
        Initiate an attack, checking cooldown (REQ-4.1, REQ-4.4).

        Steps:
        1. Check if attacker is on cooldown
        2. If not on cooldown, create Attack record
        3. Update attacker's last_attack_at
        4. Return attack or error

        Returns:
            Attack object or None if cooldown active
        """
        if not self.can_attack(attacker_user_id):
            return None

        attack = self.attack_repo.create_attack(attacker_user_id, defender_user_id, challenge_topic)
        self.cooldown_repo.update_last_attack(attacker_user_id)
        return attack

    def can_attack(self, user_id: str) -> bool:
        """
        Check if user is still on cooldown (REQ-4.4).

        Returns:
            True if user can attack, False if on cooldown
        """
        cooldown = self.cooldown_repo.get_cooldown(user_id)
        if not cooldown or not cooldown.last_attack_at:
            return True

        elapsed = datetime.utcnow() - cooldown.last_attack_at
        remaining = timedelta(minutes=cooldown.cooldown_minutes) - elapsed
        return remaining.total_seconds() <= 0

    def get_cooldown_status(self, user_id: str) -> dict:
        """
        Get user's current cooldown status (REQ-4.4).

        Returns:
        {
            "can_attack": bool,
            "cooldown_minutes": int,
            "next_available_at": ISO datetime or null
        }
        """
        cooldown = self.cooldown_repo.get_cooldown(user_id)
        if not cooldown or not cooldown.last_attack_at:
            return {
                "can_attack": True,
                "cooldown_minutes": cooldown.cooldown_minutes if cooldown else 30,
                "next_available_at": None,
            }

        elapsed = datetime.utcnow() - cooldown.last_attack_at
        remaining = timedelta(minutes=cooldown.cooldown_minutes) - elapsed

        if remaining.total_seconds() <= 0:
            return {
                "can_attack": True,
                "cooldown_minutes": cooldown.cooldown_minutes,
                "next_available_at": None,
            }
        else:
            next_available = cooldown.last_attack_at + timedelta(minutes=cooldown.cooldown_minutes)
            return {
                "can_attack": False,
                "cooldown_minutes": cooldown.cooldown_minutes,
                "next_available_at": next_available.isoformat(),
            }

    def resolve_attack(self, attack_id: str, success: bool, score: int = 0) -> Optional[Attack]:
        """
        Resolve an attack (success or failure) (REQ-4.1).

        TODO (Sprint 2): Implement real challenge resolution.
        For Sprint 1: Just mark as success/failed with placeholder score.

        Returns:
            Updated Attack object
        """
        status = AttackStatus.success if success else AttackStatus.failed
        return self.attack_repo.update_attack_status(attack_id, status, score)

