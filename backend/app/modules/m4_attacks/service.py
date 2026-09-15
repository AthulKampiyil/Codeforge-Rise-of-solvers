"""Async Village Attacks (REQ-4.x) — business logic.

Owns: matchmaking tolerance bands (SADD §7.3.1.1), problem set curation (REQ-4.2),
cooldown enforcement (SADD §7.2.1), and Elo-based attack resolution (SADD §7.3.1.3).
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).
"""
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy.orm import Session

from app.core.errors import CooldownActive, InvalidAttackTarget, NotFoundError
from app.core.logging import get_logger
from app.modules.m1_auth.models import User
from app.modules.m3_village.service import VillageService
from app.modules.m4_attacks.models import Attack, AttackProblemSet, AttackStatus
from app.modules.m4_attacks.problem_curator import ProblemSetCurator
from app.modules.m4_attacks.repository import (
    AttackProblemSetRepository,
    AttackRepository,
    CooldownRepository,
)
from app.modules.m7_league_trophy.models import TrophyEventType
from app.modules.m7_league_trophy.service import LeagueService
from app.modules.m7_league_trophy.trophy_calculator import calculate_trophy_delta
from app.modules.m8_notifications.schemas import EventType

logger = get_logger(__name__)

# Default game-balance values seeded in 002_seed.py
DEFAULT_MATCHMAKING_BASE_TOLERANCE = 0.12
DEFAULT_TIER_ADJUSTMENTS = {
    "bronze": 0.08,
    "silver": 0.05,
    "gold": 0.02,
    "platinum": 0.0,
    "diamond": -0.02,
    "legend": -0.08,
}
DEFAULT_MIN_CANDIDATES = 3
DEFAULT_WIDEN_STEP = 0.05
DEFAULT_MAX_TOLERANCE = 0.30
DEFAULT_RECENT_ATTACK_WINDOW_H = 24
DEFAULT_DEFENSE_GRACE_MINUTES = 15
DEFAULT_COOLDOWN_MINUTES = 60
DEFAULT_WINDOW_HOURS = 24
DEFAULT_PROBLEM_SET_SIZE = 3
DEFAULT_DEFENSE_THRESHOLD = 0.34
DEFAULT_ABANDON_PENALTY = 5
DEFAULT_ELO_DIVISOR = 400.0


class AttackService:
    """Business logic for village attacks (REQ-4.1–4.4)."""

    def __init__(self, db: Session):
        self.db = db
        self.attack_repo = AttackRepository(db)
        self.cooldown_repo = CooldownRepository(db)
        self.problem_repo = AttackProblemSetRepository(db)
        self.village_svc = VillageService(db)
        self.league_svc = LeagueService(db)
        self.curator = ProblemSetCurator(db)

    def get_config(self, key: str, default: Any) -> Any:
        """Query game_balance_config table (M9, UC-12)."""
        try:
            row = self.db.execute(
                sa.text("SELECT value FROM game_balance_config WHERE key = :key"),
                {"key": key},
            ).fetchone()
            if row and row[0] is not None:
                return row[0]
        except Exception:
            pass
        return default

    def get_cooldown_status(self, user_id: str) -> dict:
        """
        Check cooldown against the PostgreSQL source of truth (SADD §7.2.1).
        Optionally reads from Redis cache if available.
        """
        cooldown_minutes = int(self.get_config("attack.cooldown_minutes", DEFAULT_COOLDOWN_MINUTES))
        expires_at = self.cooldown_repo.get_cooldown_expiry(user_id)
        now = datetime.now(timezone.utc)

        if not expires_at or expires_at <= now:
            return {
                "can_attack": True,
                "cooldown_minutes": cooldown_minutes,
                "next_available_at": None,
                "remaining_seconds": 0,
            }

        remaining_seconds = max(0, int((expires_at - now).total_seconds()))
        return {
            "can_attack": False,
            "cooldown_minutes": cooldown_minutes,
            "next_available_at": expires_at,
            "remaining_seconds": remaining_seconds,
        }

    def find_attack_targets(self, user_id: str, limit: int = 10) -> List[dict]:
        """
        SADD §7.3.1.1 matchmaking tolerance band over defense_rating.

        1. Computes attacker rating and tier
        2. Adjusts base tolerance by tier
        3. Excludes self, 24h recent attack targets, 15m defense grace targets, suspended users
        4. Widens band by widen_step (0.05) until min_candidates (3) met or max_tolerance (0.30) hit
        """
        attacker_village = self.village_svc.get_user_village(user_id)
        attacker_rating = float(attacker_village.get("defense_rating", 0.0))

        attacker_profile = self.league_svc.get_or_create_profile(user_id)
        attacker_tier = attacker_profile.league_tier.value

        base_tol = float(self.get_config("matchmaking.base_tolerance", DEFAULT_MATCHMAKING_BASE_TOLERANCE))
        tier_map = self.get_config("matchmaking.tier_adjustment", DEFAULT_TIER_ADJUSTMENTS)
        tier_adj = float(tier_map.get(attacker_tier, 0.0))
        tolerance = base_tol + tier_adj

        min_candidates = int(self.get_config("matchmaking.min_candidates", DEFAULT_MIN_CANDIDATES))
        widen_step = float(self.get_config("matchmaking.widen_step", DEFAULT_WIDEN_STEP))
        max_tolerance = float(self.get_config("matchmaking.max_tolerance", DEFAULT_MAX_TOLERANCE))
        recent_window_h = int(self.get_config("matchmaking.recent_attack_window_h", DEFAULT_RECENT_ATTACK_WINDOW_H))
        grace_minutes = int(self.get_config("attack.defense_grace_minutes", DEFAULT_DEFENSE_GRACE_MINUTES))

        # Exclusions
        recent_attacked = self.attack_repo.get_recent_attack_targets(user_id, window_hours=recent_window_h)
        in_grace = self.attack_repo.get_targets_in_defense_grace(grace_minutes=grace_minutes)
        excluded_ids: Set[str] = {str(user_id)} | recent_attacked | in_grace

        # Iteratively widen band if candidates < min_candidates
        candidates: List[dict] = []
        current_tol = tolerance

        while True:
            min_rating = max(0.0, attacker_rating * (1.0 - current_tol)) if attacker_rating > 0 else 0.0
            max_rating = attacker_rating * (1.0 + current_tol) if attacker_rating > 0 else 999999.0

            candidates = self.attack_repo.find_matchmaking_candidates(
                attacker_user_id=user_id,
                min_rating=min_rating,
                max_rating=max_rating,
                excluded_user_ids=excluded_ids,
                attacker_rating=attacker_rating,
                limit=limit,
            )

            if len(candidates) >= min_candidates or current_tol >= max_tolerance:
                break

            current_tol = min(max_tolerance, current_tol + widen_step)

        # Annotate with relative strength indicator
        for cand in candidates:
            c_rating = cand["defense_rating"]
            diff = c_rating - attacker_rating
            if diff > 50:
                cand["relative_strength"] = "stronger"
            elif diff < -50:
                cand["relative_strength"] = "weaker"
            else:
                cand["relative_strength"] = "even"

        return candidates

    def start_attack(self, attacker_user_id: str, target_user_id: str) -> Attack:
        """
        Launch an attack (REQ-4.1, REQ-4.4).
        - Prevents self-attack
        - Validates cooldown (raises CooldownActive -> 429)
        - Excludes recent attack targets (24h) and defense grace (15m)
        - Sets durable cooldown
        - Curates problem set for target's weakest topics
        - Publishes ATTACK_INCOMING to target
        """
        if attacker_user_id == target_user_id:
            raise InvalidAttackTarget("Cannot attack yourself")

        target = self.db.query(User).filter(User.id == target_user_id).first()
        if not target or not target.is_active or target.is_suspended:
            raise InvalidAttackTarget("Target is invalid or suspended")

        cooldown_status = self.get_cooldown_status(attacker_user_id)
        if not cooldown_status["can_attack"]:
            raise CooldownActive(
                "Attack cooldown active.",
                next_available_at=cooldown_status["next_available_at"].isoformat(),
            )

        # Validate recent target window
        recent_window_h = int(self.get_config("matchmaking.recent_attack_window_h", DEFAULT_RECENT_ATTACK_WINDOW_H))
        recent_attacked = self.attack_repo.get_recent_attack_targets(attacker_user_id, window_hours=recent_window_h)
        if target_user_id in recent_attacked:
            raise InvalidAttackTarget("Target was attacked within the last 24 hours.")

        # Validate defense grace window
        grace_minutes = int(self.get_config("attack.defense_grace_minutes", DEFAULT_DEFENSE_GRACE_MINUTES))
        in_grace = self.attack_repo.get_targets_in_defense_grace(grace_minutes=grace_minutes)
        if target_user_id in in_grace:
            raise InvalidAttackTarget("Target village is in defense grace period.")

        # Durable write-through cooldown update
        cooldown_minutes = int(self.get_config("attack.cooldown_minutes", DEFAULT_COOLDOWN_MINUTES))
        now = datetime.now(timezone.utc)
        cooldown_expires = now + timedelta(minutes=cooldown_minutes)
        self.cooldown_repo.set_cooldown_expiry(attacker_user_id, cooldown_expires)

        # Cache in Redis if available
        try:
            from app.core.redis import get_sync_redis

            redis_client = get_sync_redis()
            redis_client.setex(f"cooldown:{attacker_user_id}", cooldown_minutes * 60, cooldown_expires.isoformat())
        except Exception:
            pass

        # Create attack record
        window_hours = int(self.get_config("attack.window_hours", DEFAULT_WINDOW_HOURS))
        attack = self.attack_repo.create_attack(
            attacker_user_id=attacker_user_id,
            target_user_id=target_user_id,
            window_hours=window_hours,
        )

        # Curate problem set from target's weakest topics
        problem_set_size = int(self.get_config("attack.problem_set_size", DEFAULT_PROBLEM_SET_SIZE))
        problems = self.curator.curate_problem_set(target_user_id, set_size=problem_set_size)
        for prob in problems:
            self.problem_repo.create(
                attack_id=str(attack.id),
                problem_ext_id=prob["problem_ext_id"],
                problem_name=prob["problem_name"],
                problem_url=prob["problem_url"],
                topic_id=prob.get("topic_id"),
                rating=prob.get("rating"),
            )

        # Publish ATTACK_INCOMING event to target
        self._publish_attack_incoming(attack, len(problems))

        return attack

    def _publish_attack_incoming(self, attack: Attack, problem_count: int) -> None:
        """Publish ATTACK_INCOMING realtime event to defender (REQ-4.5, SADD App B.1)."""
        attacker = self.db.query(User).filter(User.id == attack.attacker_user_id).first()
        attacker_username = attacker.username if attacker else "Unknown"
        attacker_village = self.village_svc.get_user_village(str(attack.attacker_user_id))
        attacker_defense = float(attacker_village.get("defense_rating", 0.0))

        payload = {
            "attack_id": str(attack.id),
            "attacker_user_id": str(attack.attacker_user_id),
            "attacker_username": attacker_username,
            "attacker_defense_rating": attacker_defense,
            "target_user_id": str(attack.target_user_id),
            "curated_problem_count": problem_count,
            "attack_window_expires_at": attack.window_expires_at.isoformat() if attack.window_expires_at else None,
        }

        try:
            from app.core.redis import get_async_redis
            from app.modules.m8_notifications.service import NotificationService

            notif_service = NotificationService(self.db)
            redis_client = get_async_redis()
            loop = asyncio.get_running_loop()
            loop.create_task(
                notif_service.publish(
                    redis_client,
                    EventType.ATTACK_INCOMING,
                    payload,
                    user_ids=[attack.target_user_id],
                )
            )
        except Exception:
            pass

    def resolve_attack(
        self,
        attack_id: str,
        is_abandoned: bool = False,
        success_override: Optional[bool] = None,
    ) -> Attack:
        """
        SADD §7.3.1.3 Elo-based attack resolution.

        - Computes solved_fraction from AttackProblemSet
        - Evaluates Case 1 / Case 2 / Case 3
        - Updates TrophyLedger for both attacker and target (only write path)
        - Updates Attack status, score, solved_fraction, resolved_at
        - Publishes ATTACK_RESOLVED
        """
        attack = self.attack_repo.get_by_id(attack_id)
        if not attack:
            raise NotFoundError("Attack not found")

        if attack.status == AttackStatus.resolved:
            return attack

        problems = self.problem_repo.get_by_attack(attack_id)
        total_count = len(problems)
        solved_count = sum(1 for p in problems if p.solved_flag)

        if total_count > 0:
            solved_fraction = round(solved_count / total_count, 3)
        else:
            solved_fraction = 1.0 if success_override else 0.0

        if success_override is not None and not is_abandoned:
            solved_fraction = 1.0 if success_override else 0.0

        # Retrieve participant ratings
        attacker_village = self.village_svc.get_user_village(str(attack.attacker_user_id))
        target_village = self.village_svc.get_user_village(str(attack.target_user_id))
        r_attacker = float(attacker_village.get("defense_rating", 0.0))
        r_target = float(target_village.get("defense_rating", 0.0))

        # Retrieve K-factor from attacker's league tier
        attacker_profile = self.league_svc.get_or_create_profile(str(attack.attacker_user_id))
        k_factor = self.league_svc.get_k_factor(attacker_profile.league_tier)

        defense_threshold = float(self.get_config("trophy.defense_threshold", DEFAULT_DEFENSE_THRESHOLD))
        abandon_penalty = int(self.get_config("trophy.abandon_penalty", DEFAULT_ABANDON_PENALTY))
        elo_divisor = float(self.get_config("trophy.elo_divisor", DEFAULT_ELO_DIVISOR))

        # Elo delta calculation (SADD §7.3.1.3)
        delta_attacker, delta_target = calculate_trophy_delta(
            r_attacker=r_attacker,
            r_target=r_target,
            solved_fraction=solved_fraction,
            k_factor=k_factor,
            defense_threshold=defense_threshold,
            abandon_penalty=abandon_penalty,
            is_abandoned=is_abandoned,
            elo_divisor=elo_divisor,
        )

        # Mutate trophy counts strictly through TrophyLedger (SADD §7.2 / App. D)
        if is_abandoned:
            self.league_svc.record_trophy_event(
                user_id=str(attack.attacker_user_id),
                event_type=TrophyEventType.attack_abandoned,
                delta=delta_attacker,
                source_ref_id=attack.id,
            )
        elif solved_fraction < defense_threshold:
            # Case 2: Successful defense
            self.league_svc.record_trophy_event(
                user_id=str(attack.attacker_user_id),
                event_type=TrophyEventType.attack_loss,
                delta=delta_attacker,
                source_ref_id=attack.id,
            )
            self.league_svc.record_trophy_event(
                user_id=str(attack.target_user_id),
                event_type=TrophyEventType.successful_defense,
                delta=delta_target,
                source_ref_id=attack.id,
            )
        else:
            # Case 1: Scored attack victory
            self.league_svc.record_trophy_event(
                user_id=str(attack.attacker_user_id),
                event_type=TrophyEventType.attack_win,
                delta=delta_attacker,
                source_ref_id=attack.id,
            )
            self.league_svc.record_trophy_event(
                user_id=str(attack.target_user_id),
                event_type=TrophyEventType.failed_defense,
                delta=delta_target,
                source_ref_id=attack.id,
            )

        # Update attack status
        status = AttackStatus.abandoned if is_abandoned else AttackStatus.resolved
        score = round(solved_fraction * 100)
        self.attack_repo.update_status(
            attack_id=attack_id,
            status=status,
            score=score,
            solved_fraction=solved_fraction,
        )

        # Publish ATTACK_RESOLVED event
        self._publish_attack_resolved(attack, solved_fraction, delta_attacker, delta_target)

        self.db.refresh(attack)
        return attack

    def _publish_attack_resolved(
        self,
        attack: Attack,
        solved_fraction: float,
        delta_attacker: int,
        delta_target: int,
    ) -> None:
        """Publish ATTACK_RESOLVED event (REQ-4.5)."""
        payload = {
            "attack_id": str(attack.id),
            "attacker_user_id": str(attack.attacker_user_id),
            "target_user_id": str(attack.target_user_id),
            "solved_fraction": solved_fraction,
            "attacker_trophy_delta": delta_attacker,
            "target_trophy_delta": delta_target,
        }
        try:
            from app.core.redis import get_async_redis
            from app.modules.m8_notifications.service import NotificationService

            notif_service = NotificationService(self.db)
            redis_client = get_async_redis()
            loop = asyncio.get_running_loop()
            loop.create_task(
                notif_service.publish(
                    redis_client,
                    EventType.ATTACK_RESOLVED,
                    payload,
                    user_ids=[attack.attacker_user_id, attack.target_user_id],
                )
            )
        except Exception:
            pass

    def get_attack_detail(self, attack_id: str) -> dict:
        """
        Get full attack detail for /attack/:id.
        Resolves attack on-demand if window has elapsed.
        """
        attack = self.attack_repo.get_by_id(attack_id)
        if not attack:
            raise NotFoundError("Attack not found")

        # On-demand resolution check if window elapsed
        now = datetime.now(timezone.utc)
        if (
            attack.status == AttackStatus.in_progress
            and attack.window_expires_at
            and now >= attack.window_expires_at
        ):
            attack = self.resolve_attack(attack_id, is_abandoned=False)

        problems = self.problem_repo.get_by_attack(attack_id)
        attacker = self.db.query(User).filter(User.id == attack.attacker_user_id).first()
        target = self.db.query(User).filter(User.id == attack.target_user_id).first()

        remaining_seconds = 0
        if attack.window_expires_at and attack.status == AttackStatus.in_progress:
            remaining_seconds = max(0, int((attack.window_expires_at - now).total_seconds()))

        # Outcome projection preview
        attacker_village = self.village_svc.get_user_village(str(attack.attacker_user_id))
        target_village = self.village_svc.get_user_village(str(attack.target_user_id))
        r_att = float(attacker_village.get("defense_rating", 0.0))
        r_tgt = float(target_village.get("defense_rating", 0.0))

        attacker_profile = self.league_svc.get_or_create_profile(str(attack.attacker_user_id))
        k = self.league_svc.get_k_factor(attacker_profile.league_tier)

        total_cnt = len(problems)
        solved_cnt = sum(1 for p in problems if p.solved_flag)
        curr_fraction = (solved_cnt / total_cnt) if total_cnt > 0 else 0.0

        proj_att_delta, proj_tgt_delta = calculate_trophy_delta(
            r_att, r_tgt, curr_fraction, k_factor=k
        )

        return {
            "id": str(attack.id),
            "attacker_user_id": str(attack.attacker_user_id),
            "target_user_id": str(attack.target_user_id),
            "status": attack.status.value,
            "score": attack.score,
            "solved_fraction": attack.solved_fraction if attack.solved_fraction is not None else curr_fraction,
            "started_at": attack.started_at,
            "window_expires_at": attack.window_expires_at,
            "resolved_at": attack.resolved_at,
            "problems": [
                {
                    "id": str(p.id),
                    "problem_ext_id": p.problem_ext_id,
                    "problem_name": p.problem_name,
                    "problem_url": p.problem_url,
                    "topic_id": str(p.topic_id) if p.topic_id else None,
                    "rating": p.rating,
                    "solved_flag": p.solved_flag,
                    "solved_at": p.solved_at,
                }
                for p in problems
            ],
            "attacker_username": attacker.username if attacker else "Attacker",
            "target_username": target.username if target else "Defender",
            "attacker_defense_rating": r_att,
            "target_defense_rating": r_tgt,
            "attacker_trophy_delta": proj_att_delta,
            "target_trophy_delta": proj_tgt_delta,
            "remaining_seconds": remaining_seconds,
        }
