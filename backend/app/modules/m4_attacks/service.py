"""Async Village Attacks (REQ-4.x) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from app.modules.m4_attacks.models import Attack, AttackStatus, AttackCooldown
from app.modules.m4_attacks.repository import AttackRepository, AttackCooldownRepository
from app.modules.m1_auth.models import User
from app.modules.m3_village.service import VillageService
from app.modules.m7_league_trophy.service import LeagueService


TIER_ADJUSTMENT = {
    "bronze": 0.08,
    "silver": 0.05,
    "gold": 0.02,
    "platinum": 0.00,
    "diamond": -0.02,
    "legend": -0.08
}


class ProblemSetCurator:
    """Curates weak-topic problem sets for async village attacks (REQ-4.2, SADD 7.2)."""

    @staticmethod
    def generate_curated_problems(target_user_id: str, db: Session) -> List[Dict[str, Any]]:
        village_service = VillageService(db)
        village_state = village_service.get_user_village(target_user_id)
        topics = village_state.get("topics", [])
        
        # Sort topics by level ascending to find weakest topics
        weak_topics = sorted(topics, key=lambda t: (t.get("level", 1), t.get("progress_points", 0)))
        top_weak = weak_topics[:3] if weak_topics else [{"topic_name": "algorithms", "level": 1}]

        curated = []
        for idx, t in enumerate(top_weak):
            curated.append({
                "problem_id": f"P-{t.get('topic_name', 'general')}-{idx+1}",
                "topic": t.get("topic_name", "algorithms"),
                "target_level": t.get("level", 1),
                "title": f"Weakness Challenge: {t.get('topic_name', 'General').title()} Level {t.get('level', 1)}",
                "difficulty": "Easy" if t.get("level", 1) <= 2 else "Medium"
            })
        return curated


class AttackService:
    """
    Business logic for village attacks (REQ-4.1–4.4).
    """

    def __init__(self, db: Session):
        self.db = db
        self.attack_repo = AttackRepository(db)
        self.cooldown_repo = AttackCooldownRepository(db)
        self.village_service = VillageService(db)
        self.league_service = LeagueService(db)

    def find_attack_targets(self, user_id: str, limit: int = 10) -> List[dict]:
        """
        Find potential attack targets via strength-based matchmaking (REQ-4.1, SADD 7.3.1.1).
        """
        attacker_village = self.village_service.get_user_village(user_id)
        r_attacker = attacker_village.get("defense_rating", 100)

        trophy_info = self.league_service.get_user_trophy(user_id) or {}
        tier = trophy_info.get("tier", "bronze")
        
        base_tolerance = 0.12
        tier_adj = TIER_ADJUSTMENT.get(tier, 0.0)
        tolerance_pct = base_tolerance + tier_adj

        # Exclude self and recently attacked users (24h)
        all_users = self.db.query(User).filter(User.id != user_id).all()
        
        candidates = []
        for u in all_users:
            u_id_str = str(u.id)
            target_village = self.village_service.get_user_village(u_id_str)
            r_target = target_village.get("defense_rating", 100)
            
            diff_pct = abs(r_target - r_attacker) / max(r_attacker, 1)
            if diff_pct <= tolerance_pct:
                candidates.append({
                    "user_id": u_id_str,
                    "username": u.username,
                    "defense_rating": r_target,
                    "rating_delta": abs(r_target - r_attacker),
                    "weakest_topics": [t["topic_name"] for t in sorted(target_village.get("topics", []), key=lambda x: x.get("level", 1))[:2]]
                })

        # Auto-widen band if candidates < 3
        while len(candidates) < 3 and tolerance_pct < 0.30:
            tolerance_pct += 0.05
            for u in all_users:
                u_id_str = str(u.id)
                if any(c["user_id"] == u_id_str for c in candidates):
                    continue
                target_village = self.village_service.get_user_village(u_id_str)
                r_target = target_village.get("defense_rating", 100)
                diff_pct = abs(r_target - r_attacker) / max(r_attacker, 1)
                if diff_pct <= tolerance_pct:
                    candidates.append({
                        "user_id": u_id_str,
                        "username": u.username,
                        "defense_rating": r_target,
                        "rating_delta": abs(r_target - r_attacker),
                        "weakest_topics": [t["topic_name"] for t in sorted(target_village.get("topics", []), key=lambda x: x.get("level", 1))[:2]]
                    })

        candidates.sort(key=lambda c: c["rating_delta"])
        return candidates[:limit]

    def start_attack(self, attacker_user_id: str, defender_user_id: str, challenge_topic: Optional[str] = None) -> Optional[Attack]:
        """Initiate an attack, checking cooldown (REQ-4.1, REQ-4.4)."""
        if not self.can_attack(attacker_user_id):
            raise ValueError("User is still on cooldown")

        curated = ProblemSetCurator.generate_curated_problems(defender_user_id, self.db)
        top_topic = challenge_topic or (curated[0]["topic"] if curated else "algorithms")

        attack = self.attack_repo.create_attack(
            attacker_user_id=attacker_user_id,
            defender_user_id=defender_user_id,
            challenge_topic=top_topic
        )
        self.cooldown_repo.update_last_attack(attacker_user_id)
        return attack

    def can_attack(self, user_id: str) -> bool:
        cooldown = self.cooldown_repo.get_cooldown(user_id)
        if not cooldown or not cooldown.last_attack_at:
            return True

        elapsed = datetime.utcnow() - cooldown.last_attack_at
        remaining = timedelta(minutes=cooldown.cooldown_minutes) - elapsed
        return remaining.total_seconds() <= 0

    def get_cooldown_status(self, user_id: str) -> dict:
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
        """Resolve an attack and adjust Elo-style trophies (REQ-4.1, SADD 7.3.1.3)."""
        status = AttackStatus.success if success else AttackStatus.failed
        attack = self.attack_repo.update_attack_status(attack_id, status, score)

        if attack:
            trophy_delta = 25 if success else -15
            self.league_service.add_points(str(attack.attacker_user_id), trophy_delta)

        return attack
