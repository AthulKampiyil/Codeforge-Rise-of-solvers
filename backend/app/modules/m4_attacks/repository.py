"""Async Village Attacks (REQ-4.x) — data access layer.

Implements matchmaking queries (SADD §7.3.1.1), attack lifecycle persistence,
problem set management, and atomic cooldown updates (SADD §7.2.1).
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.modules.m1_auth.models import User
from app.modules.m3_village.models import VillageProfile
from app.modules.m4_attacks.models import Attack, AttackProblemSet, AttackStatus


class AttackRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, attack_id: str) -> Optional[Attack]:
        return self.db.query(Attack).filter(Attack.id == attack_id).first()

    def get_active_attack_for_user(self, user_id: str) -> Optional[Attack]:
        """Check if user currently has an in-flight attack."""
        return (
            self.db.query(Attack)
            .filter(
                Attack.attacker_user_id == user_id,
                Attack.status.in_([AttackStatus.created, AttackStatus.in_progress]),
            )
            .order_by(Attack.started_at.desc())
            .first()
        )

    def get_attacks_by_attacker(self, user_id: str, limit: int = 20) -> List[Attack]:
        return (
            self.db.query(Attack)
            .filter(Attack.attacker_user_id == user_id)
            .order_by(Attack.started_at.desc())
            .limit(limit)
            .all()
        )

    def get_attacks_by_target(self, user_id: str, limit: int = 20) -> List[Attack]:
        return (
            self.db.query(Attack)
            .filter(Attack.target_user_id == user_id)
            .order_by(Attack.started_at.desc())
            .limit(limit)
            .all()
        )

    def create_attack(
        self,
        attacker_user_id: str,
        target_user_id: str,
        window_hours: int = 24,
    ) -> Attack:
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=window_hours)
        attack = Attack(
            attacker_user_id=attacker_user_id,
            target_user_id=target_user_id,
            status=AttackStatus.in_progress,
            started_at=now,
            window_expires_at=expires_at,
        )
        self.db.add(attack)
        self.db.commit()
        self.db.refresh(attack)
        return attack

    def update_status(
        self,
        attack_id: str,
        status: AttackStatus,
        score: int = 0,
        solved_fraction: Optional[float] = None,
    ) -> Optional[Attack]:
        attack = self.get_by_id(attack_id)
        if attack:
            attack.status = status
            attack.score = score
            if solved_fraction is not None:
                attack.solved_fraction = solved_fraction
            if status in (AttackStatus.resolved, AttackStatus.completed, AttackStatus.abandoned):
                attack.resolved_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(attack)
        return attack

    def get_recent_attack_targets(
        self, attacker_user_id: str, window_hours: int = 24
    ) -> Set[str]:
        """
        SADD §7.3.1.1: Exclude targets attacked by this attacker in last recent_attack_window_h.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(hours=window_hours)
        rows = (
            self.db.query(Attack.target_user_id)
            .filter(
                Attack.attacker_user_id == attacker_user_id,
                Attack.started_at >= cutoff,
            )
            .all()
        )
        return {str(r[0]) for r in rows}

    def get_targets_in_defense_grace(self, grace_minutes: int = 15) -> Set[str]:
        """
        SADD §7.3.1.1: Exclude targets attacked by anyone in last defense_grace_minutes.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=grace_minutes)
        rows = (
            self.db.query(Attack.target_user_id)
            .filter(Attack.started_at >= cutoff)
            .all()
        )
        return {str(r[0]) for r in rows}

    def find_matchmaking_candidates(
        self,
        attacker_user_id: str,
        min_rating: float,
        max_rating: float,
        excluded_user_ids: Set[str],
        attacker_rating: float = 0.0,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        SADD §7.3.1.1 indexed range scan over VillageProfile.defense_rating.
        Falls back smoothly to users table with 0.0 defense rating when village_profiles is empty.
        """
        excluded = set(excluded_user_ids)
        excluded.add(str(attacker_user_id))

        # Query users joined with village_profiles
        defense_col = func.coalesce(VillageProfile.defense_rating, 0.0)
        query = (
            self.db.query(
                User.id.label("user_id"),
                User.username.label("username"),
                defense_col.label("defense_rating"),
                func.coalesce(VillageProfile.average_level, 0.0).label("average_level"),
            )
            .outerjoin(VillageProfile, User.id == VillageProfile.user_id)
            .filter(
                User.is_active == True,  # noqa: E712
                User.is_suspended == False,  # noqa: E712
                User.id.notin_(list(excluded)) if excluded else True,
                defense_col >= min_rating,
                defense_col <= max_rating,
            )
            .order_by(
                func.abs(defense_col - attacker_rating).asc(),
                User.username.asc(),
            )
            .limit(limit)
        )

        results = []
        for r in query.all():
            results.append(
                {
                    "id": str(r.user_id),
                    "username": r.username,
                    "defense_rating": float(r.defense_rating),
                    "level": int(r.average_level),
                }
            )
        return results


class AttackProblemSetRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_attack(self, attack_id: str) -> List[AttackProblemSet]:
        return (
            self.db.query(AttackProblemSet)
            .filter(AttackProblemSet.attack_id == attack_id)
            .order_by(AttackProblemSet.rating.asc())
            .all()
        )

    def create(
        self,
        attack_id: str,
        problem_ext_id: str,
        problem_name: Optional[str] = None,
        problem_url: Optional[str] = None,
        topic_id: Optional[Any] = None,
        rating: Optional[int] = None,
    ) -> AttackProblemSet:
        problem = AttackProblemSet(
            attack_id=attack_id,
            problem_ext_id=problem_ext_id,
            problem_name=problem_name,
            problem_url=problem_url,
            topic_id=topic_id,
            rating=rating,
            solved_flag=False,
        )
        self.db.add(problem)
        self.db.commit()
        self.db.refresh(problem)
        return problem

    def mark_solved(self, problem_id: str) -> Optional[AttackProblemSet]:
        problem = self.db.query(AttackProblemSet).filter(AttackProblemSet.id == problem_id).first()
        if problem and not problem.solved_flag:
            problem.solved_flag = True
            problem.solved_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(problem)
        return problem


class CooldownRepository:
    """Thin repository over users.attack_cooldown_expires_at (SADD §7.2.1)."""

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
