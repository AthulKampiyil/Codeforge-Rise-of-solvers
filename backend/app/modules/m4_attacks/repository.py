"""Async Village Attacks (REQ-4.x) — data access layer.

NOTE: Full atomic write-through/read-through cooldown caching (SADD
7.2.1) and matchmaking queries (SADD 7.3.1.1) land in plan.md Phase 7.
"""
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.modules.m1_auth.models import User
from app.modules.m4_attacks.models import Attack, AttackProblemSet, AttackStatus


class AttackRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_attacks_by_attacker(self, user_id: str, limit: int = 20) -> List[Attack]:
        return self.db.query(Attack).filter(
            Attack.attacker_user_id == user_id
        ).order_by(Attack.started_at.desc()).limit(limit).all()

    def get_attacks_by_target(self, user_id: str, limit: int = 20) -> List[Attack]:
        return self.db.query(Attack).filter(
            Attack.target_user_id == user_id
        ).order_by(Attack.started_at.desc()).limit(limit).all()

    def get_by_id(self, attack_id: str) -> Optional[Attack]:
        return self.db.query(Attack).filter(Attack.id == attack_id).first()

    def create_attack(self, attacker_user_id: str, target_user_id: str) -> Attack:
        attack = Attack(
            attacker_user_id=attacker_user_id,
            target_user_id=target_user_id,
            status=AttackStatus.created,
        )
        self.db.add(attack)
        self.db.commit()
        self.db.refresh(attack)
        return attack

    def update_status(self, attack_id: str, status: AttackStatus, score: int = 0) -> Optional[Attack]:
        attack = self.get_by_id(attack_id)
        if attack:
            attack.status = status
            attack.score = score
            if status == AttackStatus.resolved:
                attack.resolved_at = datetime.now(timezone.utc)
            self.db.commit()
        return attack


class AttackProblemSetRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_attack(self, attack_id: str) -> List[AttackProblemSet]:
        return self.db.query(AttackProblemSet).filter(AttackProblemSet.attack_id == attack_id).all()

    def create(self, attack_id: str, problem_ext_id: str, **kwargs) -> AttackProblemSet:
        problem = AttackProblemSet(attack_id=attack_id, problem_ext_id=problem_ext_id, **kwargs)
        self.db.add(problem)
        self.db.commit()
        return problem


class CooldownRepository:
    """
    Thin repository over users.attack_cooldown_expires_at (SADD 7.2.1).

    NOTE: This exposes only the PostgreSQL source-of-truth read/write.
    The Redis read-through/write-through cache described in SADD 7.2.1
    is added in plan.md Phase 7 — until then every check hits Postgres
    directly, which is correct but not yet optimized for the NFR-1.3
    latency budget under load.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_cooldown_expiry(self, user_id: str) -> Optional[datetime]:
        user = self.db.query(User).filter(User.id == user_id).first()
        return user.attack_cooldown_expires_at if user else None

    def set_cooldown_expiry(self, user_id: str, expires_at: datetime) -> None:
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.attack_cooldown_expires_at = expires_at
            self.db.commit()
