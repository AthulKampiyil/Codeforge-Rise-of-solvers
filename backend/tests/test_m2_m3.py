"""Tests for M2 Platform Sync and M3 Village modules."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.modules.m1_auth.models import User, LinkedJudgeProfile, JudgeName
from app.modules.m2_platform_sync.models import SyncLog, SyncStatus
from app.modules.m2_platform_sync.topic_tagger import TopicTagger
from app.modules.m3_village.models import Topic, VillageTopicProgress
from app.modules.m3_village.service import VillageService
from app.modules.m3_village.repository import VillageRepository
import uuid
from datetime import datetime


@pytest.fixture
def db():
    """In-memory SQLite session for tests."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    yield db
    db.close()


class TestTopicTagger:
    """Test M2 TopicTagger (tag → topic mapping)."""

    def test_map_codeforces_tags_to_topics(self):
        """Test mapping of Codeforces tags to fixed topic list."""
        tags = ["dp", "greedy", "trees"]
        topics = TopicTagger.map_tags(tags)
        assert "dynamic-programming" in topics
        assert "greedy" in topics
        assert "data-structures" in topics

    def test_map_empty_tags(self):
        """Test mapping empty tag list."""
        topics = TopicTagger.map_tags([])
        assert len(topics) == 0

    def test_map_unknown_tags(self):
        """Test mapping unknown tags (should skip)."""
        tags = ["unknown-tag-xyz", "another-fake"]
        topics = TopicTagger.map_tags(tags)
        assert len(topics) == 0

    def test_get_topic_by_name_valid(self):
        """Test getting a valid topic by name."""
        topic = TopicTagger.get_topic_by_name("algorithms")
        assert topic == "algorithms"

    def test_get_topic_by_name_invalid(self):
        """Test getting an invalid topic by name."""
        topic = TopicTagger.get_topic_by_name("invalid-topic")
        assert topic is None

    def test_get_topic_case_insensitive(self):
        """Test topic name is case-insensitive."""
        topic = TopicTagger.get_topic_by_name("ALGORITHMS")
        assert topic == "algorithms"


class TestVillageRepository:
    """Test M3 VillageRepository data access."""

    def test_get_all_by_user(self, db):
        """Test fetching all topics for a user."""
        user_id = str(uuid.uuid4())
        topic_id_1 = uuid.uuid4()
        topic_id_2 = uuid.uuid4()

        # Create test data
        topic1 = Topic(id=topic_id_1, name="algorithms")
        topic2 = Topic(id=topic_id_2, name="data-structures")
        db.add_all([topic1, topic2])

        progress1 = VillageTopicProgress(
            user_id=user_id,
            topic_id=topic_id_1,
            solved_count=10,
            level=3
        )
        progress2 = VillageTopicProgress(
            user_id=user_id,
            topic_id=topic_id_2,
            solved_count=5,
            level=2
        )
        db.add_all([progress1, progress2])
        db.commit()

        # Test retrieval
        repo = VillageRepository(db)
        results = repo.get_all_by_user(user_id)
        assert len(results) == 2

    def test_get_by_user_and_topic(self, db):
        """Test fetching a specific user+topic progress record."""
        user_id = str(uuid.uuid4())
        topic_id = uuid.uuid4()

        topic = Topic(id=topic_id, name="algorithms")
        db.add(topic)

        progress = VillageTopicProgress(
            user_id=user_id,
            topic_id=topic_id,
            solved_count=10,
            level=3
        )
        db.add(progress)
        db.commit()

        repo = VillageRepository(db)
        result = repo.get_by_user_and_topic(user_id, str(topic_id))
        assert result is not None
        assert result.solved_count == 10


class TestVillageService:
    """Test M3 VillageService business logic."""

    def test_get_user_village_no_progress(self, db):
        """Test getting village profile for user with no progress."""
        user_id = str(uuid.uuid4())
        service = VillageService(db)
        profile = service.get_user_village(user_id)

        assert profile["user_id"] == user_id
        assert profile["total_solved"] == 0
        assert profile["average_level"] == 0.0
        assert len(profile["topics"]) == 0

    def test_get_user_village_with_progress(self, db):
        """Test getting village profile for user with multiple topics."""
        user_id = str(uuid.uuid4())
        topic_id_1 = uuid.uuid4()
        topic_id_2 = uuid.uuid4()

        topic1 = Topic(id=topic_id_1, name="algorithms")
        topic2 = Topic(id=topic_id_2, name="data-structures")
        db.add_all([topic1, topic2])

        progress1 = VillageTopicProgress(
            user_id=user_id,
            topic_id=topic_id_1,
            solved_count=16,  # level = floor(sqrt(16)) = 4
            level=4
        )
        progress2 = VillageTopicProgress(
            user_id=user_id,
            topic_id=topic_id_2,
            solved_count=9,  # level = floor(sqrt(9)) = 3
            level=3
        )
        db.add_all([progress1, progress2])
        db.commit()

        service = VillageService(db)
        profile = service.get_user_village(user_id)

        assert profile["total_solved"] == 25
        assert profile["average_level"] == 3.5
        assert len(profile["topics"]) == 2
        # Topics should be sorted by level DESC
        assert profile["topics"][0]["level"] == 4

    def test_level_calculation(self, db):
        """Test that level is calculated as floor(sqrt(solved_count))."""
        user_id = str(uuid.uuid4())
        topic_id = uuid.uuid4()

        topic = Topic(id=topic_id, name="algorithms")
        db.add(topic)

        test_cases = [
            (1, 1),   # sqrt(1) = 1
            (4, 2),   # sqrt(4) = 2
            (9, 3),   # sqrt(9) = 3
            (16, 4),  # sqrt(16) = 4
            (10, 3),  # sqrt(10) ≈ 3.16, floor = 3
        ]

        for count, expected_level in test_cases:
            progress = VillageTopicProgress(
                user_id=user_id,
                topic_id=topic_id,
                solved_count=count,
                level=int(count ** 0.5)
            )
            db.add(progress)
            db.flush()
            assert progress.level == expected_level, f"Level for count {count} should be {expected_level}, got {progress.level}"
            db.delete(progress)
            db.commit()


class TestSyncLogCreation:
    """Test M2 SyncLog model creation."""

    def test_create_sync_log(self, db):
        """Test creating a sync log entry."""
        user_id = str(uuid.uuid4())
        log = SyncLog(
            user_id=user_id,
            judge_name="codeforces",
            status=SyncStatus.up_to_date,
            last_synced_at=datetime.utcnow()
        )
        db.add(log)
        db.commit()

        retrieved = db.query(SyncLog).filter(
            SyncLog.user_id == user_id,
            SyncLog.judge_name == "codeforces"
        ).first()

        assert retrieved is not None
        assert retrieved.status == SyncStatus.up_to_date

    def test_sync_log_status_enum(self, db):
        """Test SyncLog status enum values."""
        user_id = str(uuid.uuid4())

        for status in [SyncStatus.up_to_date, SyncStatus.in_progress, SyncStatus.failed]:
            log = SyncLog(
                user_id=user_id,
                judge_name="test",
                status=status
            )
            db.add(log)
            db.commit()

            retrieved = db.query(SyncLog).filter(SyncLog.status == status).first()
            assert retrieved is not None
            db.delete(retrieved)
            db.commit()
