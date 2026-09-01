"""Async Village Attacks (REQ-4.x) — data access layer.

Owns: all direct DB queries for this module's tables.
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.modules.m4_attacks.models import Attack, AttackStatus, AttackCooldown


class AttackRepository:
    """Data access layer for attack records."""

    def __init__(self, db: Session):
        self.db = db

    def get_attacks_by_attacker(self, user_id: str, limit: int = 20) -> List[Attack]:
        """Fetch recent attacks by a user."""
        return self.db.query(Attack).filter(
            Attack.attacker_user_id == user_id
        ).order_by(Attack.created_at.desc()).limit(limit).all()

    def get_attacks_by_defender(self, user_id: str, limit: int = 20) -> List[Attack]:
        """Fetch recent attacks against a user."""
        return self.db.query(Attack).filter(
            Attack.defender_user_id == user_id
        ).order_by(Attack.created_at.desc()).limit(limit).all()

    def create_attack(self, attacker_user_id: str, defender_user_id: str, challenge_topic: Optional[str] = None) -> Attack:
        """Create a new attack record."""
        attack = Attack(
            attacker_user_id=attacker_user_id,
            defender_user_id=defender_user_id,
            challenge_topic=challenge_topic
        )
        self.db.add(attack)
        self.db.commit()
        return attack

    def update_attack_status(self, attack_id: str, status: AttackStatus, score: int = 0):
        """Update attack status and score."""
        attack = self.db.query(Attack).filter(Attack.id == attack_id).first()
        if attack:
            attack.status = status
            attack.score = score
            if status in [AttackStatus.success, AttackStatus.failed]:
                attack.resolved_at = datetime.utcnow()
            self.db.commit()
        return attack


class AttackCooldownRepository:
    """Data access layer for attack cooldowns."""

    def __init__(self, db: Session):
        self.db = db

    def get_cooldown(self, user_id: str) -> Optional[AttackCooldown]:
        """Fetch cooldown record for a user."""
        return self.db.query(AttackCooldown).filter(
            AttackCooldown.user_id == user_id
        ).first()

    def create_cooldown(self, user_id: str, cooldown_minutes: int = 30) -> AttackCooldown:
        """Create a new cooldown record."""
        cooldown = AttackCooldown(user_id=user_id, cooldown_minutes=cooldown_minutes)
        self.db.add(cooldown)
        self.db.commit()
        return cooldown

    def update_last_attack(self, user_id: str):
        """Update last attack timestamp."""
        cooldown = self.get_cooldown(user_id)
        if cooldown:
            cooldown.last_attack_at = datetime.utcnow()
            self.db.commit()
        else:
            self.create_cooldown(user_id)

