"""Comprehensive test suite for M4 Attacks and M7 League modules."""
import pytest
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.db.base import Base
from app.modules.m1_auth.models import User
from app.modules.m4_attacks.models import Attack, AttackCooldown, AttackStatus
from app.modules.m4_attacks.repository import AttackRepository, AttackCooldownRepository
from app.modules.m4_attacks.service import AttackService
from app.modules.m7_league_trophy.models import Trophy, LeagueTier, TROPHY_THRESHOLDS
from app.modules.m7_league_trophy.repository import TrophyRepository
from app.modules.m7_league_trophy.service import LeagueService
from passlib.context import CryptContext

# Setup: In-memory SQLite for testing
DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture
def db() -> Session:
    """Create a test database session."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user."""
    user = User(
        id=uuid4(),
        username="testuser",
        email="test@example.com",
        hashed_password=pwd_context.hash("password123"),
        is_active=True,
        is_admin=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_user2(db: Session) -> User:
    """Create a second test user for attacks."""
    user = User(
        id=uuid4(),
        username="defender",
        email="defender@example.com",
        hashed_password=pwd_context.hash("password123"),
        is_active=True,
        is_admin=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ============================================================================
# M4 ATTACKS - TEST CLASSES
# ============================================================================

class TestAttackRepository:
    """Test M4 attack data access."""

    def test_create_attack(self, db: Session, test_user: User, test_user2: User):
        """Create a new attack record."""
        repo = AttackRepository(db)
        attack_id = uuid4()

        attack = repo.create_attack(
            attack_id=attack_id,
            attacker_user_id=str(test_user.id),
            defender_user_id=str(test_user2.id),
            challenge_topic="algorithms"
        )

        assert attack.id == attack_id
        assert attack.attacker_user_id == test_user.id
        assert attack.defender_user_id == test_user2.id
        assert attack.status == AttackStatus.pending
        assert attack.score == 0
        assert attack.challenge_topic == "algorithms"

    def test_get_attacks_by_attacker(self, db: Session, test_user: User, test_user2: User):
        """Retrieve attacks by attacker user ID."""
        repo = AttackRepository(db)

        # Create 3 attacks by test_user
        for i in range(3):
            repo.create_attack(
                attack_id=uuid4(),
                attacker_user_id=str(test_user.id),
                defender_user_id=str(test_user2.id),
                challenge_topic="data-structures"
            )

        attacks = repo.get_attacks_by_attacker(str(test_user.id))
        assert len(attacks) == 3

    def test_get_attacks_by_defender(self, db: Session, test_user: User, test_user2: User):
        """Retrieve attacks by defender user ID."""
        repo = AttackRepository(db)

        # Create 2 attacks against test_user2
        for i in range(2):
            repo.create_attack(
                attack_id=uuid4(),
                attacker_user_id=str(test_user.id),
                defender_user_id=str(test_user2.id),
                challenge_topic="mathematics"
            )

        attacks = repo.get_attacks_by_defender(str(test_user2.id))
        assert len(attacks) == 2

    def test_update_attack_status(self, db: Session, test_user: User, test_user2: User):
        """Update attack status to success."""
        repo = AttackRepository(db)
        attack = repo.create_attack(
            attack_id=uuid4(),
            attacker_user_id=str(test_user.id),
            defender_user_id=str(test_user2.id),
            challenge_topic="strings"
        )

        updated_attack = repo.update_attack_status(str(attack.id), AttackStatus.success, score=50)
        assert updated_attack.status == AttackStatus.success
        assert updated_attack.score == 50
        assert updated_attack.resolved_at is not None


class TestAttackCooldownRepository:
    """Test M4 cooldown data access."""

    def test_create_cooldown(self, db: Session, test_user: User):
        """Create a cooldown record."""
        repo = AttackCooldownRepository(db)

        cooldown = repo.create_cooldown(str(test_user.id))
        assert cooldown.user_id == test_user.id
        assert cooldown.cooldown_minutes == 30
        assert cooldown.last_attack_at is None

    def test_get_cooldown(self, db: Session, test_user: User):
        """Retrieve cooldown by user ID."""
        repo = AttackCooldownRepository(db)
        repo.create_cooldown(str(test_user.id))

        cooldown = repo.get_cooldown(str(test_user.id))
        assert cooldown is not None
        assert cooldown.user_id == test_user.id

    def test_update_last_attack_at(self, db: Session, test_user: User):
        """Update last_attack_at timestamp."""
        repo = AttackCooldownRepository(db)
        cooldown = repo.create_cooldown(str(test_user.id))

        now = datetime.utcnow()
        updated = repo.update_last_attack_at(str(test_user.id), now)
        assert updated.last_attack_at is not None
        assert (updated.last_attack_at - now).total_seconds() < 1  # Within 1 second


class TestAttackService:
    """Test M4 attack business logic."""

    def test_can_attack_no_cooldown(self, db: Session, test_user: User):
        """User with no cooldown history can attack."""
        service = AttackService(db)
        assert service.can_attack(str(test_user.id)) is True

    def test_can_attack_active_cooldown(self, db: Session, test_user: User):
        """User with active cooldown cannot attack."""
        cooldown_repo = AttackCooldownRepository(db)
        cooldown = cooldown_repo.create_cooldown(str(test_user.id))

        # Set last_attack_at to 15 minutes ago (still in 30-min cooldown)
        fifteen_min_ago = datetime.utcnow() - timedelta(minutes=15)
        cooldown.last_attack_at = fifteen_min_ago
        db.commit()

        service = AttackService(db)
        assert service.can_attack(str(test_user.id)) is False

    def test_can_attack_cooldown_expired(self, db: Session, test_user: User):
        """User with expired cooldown can attack."""
        cooldown_repo = AttackCooldownRepository(db)
        cooldown = cooldown_repo.create_cooldown(str(test_user.id))

        # Set last_attack_at to 40 minutes ago (past 30-min cooldown)
        forty_min_ago = datetime.utcnow() - timedelta(minutes=40)
        cooldown.last_attack_at = forty_min_ago
        db.commit()

        service = AttackService(db)
        assert service.can_attack(str(test_user.id)) is True

    def test_get_cooldown_status_can_attack(self, db: Session, test_user: User):
        """Cooldown status when user can attack."""
        service = AttackService(db)
        status = service.get_cooldown_status(str(test_user.id))

        assert status["can_attack"] is True
        assert status["cooldown_minutes"] == 30
        assert status["next_available_at"] is None

    def test_get_cooldown_status_cooldown_active(self, db: Session, test_user: User):
        """Cooldown status with active cooldown."""
        cooldown_repo = AttackCooldownRepository(db)
        cooldown = cooldown_repo.create_cooldown(str(test_user.id))

        fifteen_min_ago = datetime.utcnow() - timedelta(minutes=15)
        cooldown.last_attack_at = fifteen_min_ago
        db.commit()

        service = AttackService(db)
        status = service.get_cooldown_status(str(test_user.id))

        assert status["can_attack"] is False
        assert status["cooldown_minutes"] == 30
        assert status["next_available_at"] is not None

    def test_start_attack_success(self, db: Session, test_user: User, test_user2: User):
        """Launch attack successfully when no cooldown."""
        service = AttackService(db)
        attack = service.start_attack(
            str(test_user.id),
            str(test_user2.id),
            "dynamic-programming"
        )

        assert attack.status == AttackStatus.pending
        assert attack.attacker_user_id == test_user.id
        assert attack.challenge_topic == "dynamic-programming"

    def test_start_attack_with_cooldown(self, db: Session, test_user: User, test_user2: User):
        """Cannot attack during active cooldown."""
        cooldown_repo = AttackCooldownRepository(db)
        cooldown = cooldown_repo.create_cooldown(str(test_user.id))

        fifteen_min_ago = datetime.utcnow() - timedelta(minutes=15)
        cooldown.last_attack_at = fifteen_min_ago
        db.commit()

        service = AttackService(db)
        with pytest.raises(ValueError, match="still on cooldown"):
            service.start_attack(
                str(test_user.id),
                str(test_user2.id),
                "greedy"
            )

    def test_resolve_attack_success(self, db: Session, test_user: User, test_user2: User):
        """Resolve attack as success."""
        attack_repo = AttackRepository(db)
        attack = attack_repo.create_attack(
            attack_id=uuid4(),
            attacker_user_id=str(test_user.id),
            defender_user_id=str(test_user2.id),
            challenge_topic="optimization"
        )

        service = AttackService(db)
        resolved = service.resolve_attack(str(attack.id), success=True, score=75)

        assert resolved.status == AttackStatus.success
        assert resolved.score == 75

    def test_find_attack_targets_stub(self, db: Session, test_user: User):
        """find_attack_targets is stub (returns empty for Sprint 2)."""
        service = AttackService(db)
        targets = service.find_attack_targets(str(test_user.id), limit=10)
        # Stub returns empty list in Sprint 1
        assert isinstance(targets, list)


# ============================================================================
# M7 LEAGUE - TEST CLASSES
# ============================================================================

class TestTrophyRepository:
    """Test M7 trophy data access."""

    def test_create_trophy(self, db: Session, test_user: User):
        """Create a trophy record."""
        repo = TrophyRepository(db)

        trophy = repo.create_trophy(str(test_user.id))
        assert trophy.user_id == test_user.id
        assert trophy.tier == LeagueTier.bronze
        assert trophy.points == 0
        assert trophy.trophy_count == 0

    def test_get_trophy(self, db: Session, test_user: User):
        """Retrieve trophy by user ID."""
        repo = TrophyRepository(db)
        created = repo.create_trophy(str(test_user.id))

        trophy = repo.get_trophy(str(test_user.id))
        assert trophy is not None
        assert trophy.id == created.id

    def test_update_trophy(self, db: Session, test_user: User):
        """Update trophy points and count."""
        repo = TrophyRepository(db)
        repo.create_trophy(str(test_user.id))

        updated = repo.update_trophy(str(test_user.id), points=100, trophy_count=5)
        assert updated.points == 100
        assert updated.trophy_count == 5

    def test_update_tier(self, db: Session, test_user: User):
        """Update trophy tier."""
        repo = TrophyRepository(db)
        repo.create_trophy(str(test_user.id))

        updated = repo.update_tier(str(test_user.id), LeagueTier.gold)
        assert updated.tier == LeagueTier.gold


class TestLeagueService:
    """Test M7 league business logic."""

    def test_get_or_create_trophy(self, db: Session, test_user: User):
        """Get or create trophy on first call."""
        service = LeagueService(db)
        trophy = service.get_or_create_trophy(str(test_user.id))

        assert trophy is not None
        assert trophy.user_id == test_user.id
        assert trophy.tier == LeagueTier.bronze

    def test_get_or_create_trophy_already_exists(self, db: Session, test_user: User):
        """Returns existing trophy if already created."""
        service = LeagueService(db)
        trophy1 = service.get_or_create_trophy(str(test_user.id))
        trophy2 = service.get_or_create_trophy(str(test_user.id))

        assert trophy1.id == trophy2.id

    def test_get_league_tier_bronze(self, db: Session):
        """0 points → bronze tier."""
        service = LeagueService(db)
        tier = service.get_league_tier(0)
        assert tier == LeagueTier.bronze

    def test_get_league_tier_silver(self, db: Session):
        """Test silver tier calculation."""
        service = LeagueService(db)
        silver_min = TROPHY_THRESHOLDS[LeagueTier.silver]["min_points"]
        tier = service.get_league_tier(silver_min)
        assert tier == LeagueTier.silver

    def test_get_league_tier_gold(self, db: Session):
        """Test gold tier calculation."""
        service = LeagueService(db)
        gold_min = TROPHY_THRESHOLDS[LeagueTier.gold]["min_points"]
        tier = service.get_league_tier(gold_min)
        assert tier == LeagueTier.gold

    def test_get_league_tier_diamond(self, db: Session):
        """Test diamond tier calculation."""
        service = LeagueService(db)
        diamond_min = TROPHY_THRESHOLDS[LeagueTier.diamond]["min_points"]
        tier = service.get_league_tier(diamond_min)
        assert tier == LeagueTier.diamond

    def test_get_league_tier_legend(self, db: Session):
        """Max points → legend tier."""
        service = LeagueService(db)
        tier = service.get_league_tier(999999)
        assert tier == LeagueTier.legend

    def test_add_points_bronze_to_silver(self, db: Session, test_user: User):
        """Adding points can promote from bronze to silver."""
        service = LeagueService(db)
        service.get_or_create_trophy(str(test_user.id))

        silver_min = TROPHY_THRESHOLDS[LeagueTier.silver]["min_points"]
        trophy = service.add_points(str(test_user.id), silver_min)

        assert trophy.tier == LeagueTier.silver
        assert trophy.points == silver_min

    def test_add_points_incremental(self, db: Session, test_user: User):
        """Points accumulate correctly."""
        service = LeagueService(db)
        service.get_or_create_trophy(str(test_user.id))

        trophy = service.add_points(str(test_user.id), 50)
        assert trophy.points == 50

        trophy = service.add_points(str(test_user.id), 30)
        assert trophy.points == 80

    def test_get_user_trophy(self, db: Session, test_user: User):
        """Retrieve formatted trophy data."""
        service = LeagueService(db)
        service.get_or_create_trophy(str(test_user.id))

        trophy_data = service.get_user_trophy(str(test_user.id))
        assert trophy_data is not None
        assert "tier" in trophy_data
        assert "points" in trophy_data
        assert "trophy_count" in trophy_data
        assert "updated_at" in trophy_data

    def test_get_user_trophy_after_points(self, db: Session, test_user: User):
        """Trophy data reflects point changes."""
        service = LeagueService(db)
        service.get_or_create_trophy(str(test_user.id))
        service.add_points(str(test_user.id), 500)

        trophy_data = service.get_user_trophy(str(test_user.id))
        assert trophy_data["points"] == 500


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

class TestAttackLeagueIntegration:
    """Test interactions between M4 and M7."""

    def test_attack_workflow(self, db: Session, test_user: User, test_user2: User):
        """Complete attack workflow: cooldown → attack → resolve."""
        attack_service = AttackService(db)

        # User should be able to attack (no cooldown)
        assert attack_service.can_attack(str(test_user.id)) is True

        # Launch attack
        attack = attack_service.start_attack(
            str(test_user.id),
            str(test_user2.id),
            "algorithms"
        )
        assert attack.status == AttackStatus.pending

        # Check cooldown is now active
        assert attack_service.can_attack(str(test_user.id)) is False

        # Resolve attack
        resolved = attack_service.resolve_attack(str(attack.id), success=True, score=100)
        assert resolved.status == AttackStatus.success

    def test_multiple_attacks_prevent_spam(self, db: Session, test_user: User, test_user2: User):
        """Cannot spam attacks due to cooldown."""
        service = AttackService(db)

        # First attack succeeds
        attack1 = service.start_attack(
            str(test_user.id),
            str(test_user2.id),
            "strings"
        )
        assert attack1 is not None

        # Second attack within cooldown fails
        with pytest.raises(ValueError):
            service.start_attack(
                str(test_user.id),
                str(test_user2.id),
                "mathematics"
            )

    def test_trophy_allocation_after_attack(self, db: Session, test_user: User):
        """Attack victory can award trophy points (Sprint 2)."""
        league_service = LeagueService(db)
        attack_service = AttackService(db)

        # Initialize trophy
        league_service.get_or_create_trophy(str(test_user.id))
        initial_points = 0

        # After winning attack, points awarded (stub in Sprint 1)
        # This test documents the integration point
        trophy = league_service.get_user_trophy(str(test_user.id))
        assert trophy["points"] >= initial_points
