"""Regression tests for transactional outbox retries and session recovery."""
import uuid

import pytest

from app.modules.m8_notifications.models import NotificationOutbox
from app.modules.m8_notifications.schemas import EventType
from app.modules.m8_notifications.service import NotificationService


class AcceptingAsyncRedis:
    async def publish(self, *args, **kwargs):
        return 1


class AcceptingSyncRedis:
    def publish(self, *args, **kwargs):
        return 1


def _enqueue_test_event(service, attempt):
    return service.enqueue(EventType.ATTACK_INCOMING, {"attempt": attempt, "test_id": str(uuid.uuid4())})


@pytest.mark.asyncio
async def test_async_pending_query_failure_rolls_back_and_session_can_retry(db, monkeypatch):
    service = NotificationService(db)
    event = _enqueue_test_event(service, "query")
    db.commit()

    real_query = db.query
    fail_query = True

    def query_with_one_failure(*entities, **kwargs):
        nonlocal fail_query
        if fail_query and entities == (NotificationOutbox,):
            fail_query = False
            raise RuntimeError("outbox query failed")
        return real_query(*entities, **kwargs)

    monkeypatch.setattr(db, "query", query_with_one_failure)
    with pytest.raises(RuntimeError, match="outbox query failed"):
        await service.publish_pending(AcceptingAsyncRedis())

    assert await service.publish_pending(AcceptingAsyncRedis()) >= 1
    assert db.query(NotificationOutbox).filter_by(id=event.id).one().delivered_at is not None


@pytest.mark.asyncio
async def test_async_pending_commit_failure_is_retryable(db, monkeypatch):
    service = NotificationService(db)
    event = _enqueue_test_event(service, "commit")
    db.commit()

    real_commit = db.commit
    fail_commit = True

    def commit_with_one_failure():
        nonlocal fail_commit
        if fail_commit:
            fail_commit = False
            raise RuntimeError("outbox commit failed")
        return real_commit()

    monkeypatch.setattr(db, "commit", commit_with_one_failure)
    with pytest.raises(RuntimeError, match="outbox commit failed"):
        await service.publish_pending(AcceptingAsyncRedis())

    assert db.query(NotificationOutbox).filter_by(id=event.id).one().delivered_at is None
    assert await service.publish_pending(AcceptingAsyncRedis()) >= 1
    assert db.query(NotificationOutbox).filter_by(id=event.id).one().delivered_at is not None


def test_sync_pending_query_failure_rolls_back_and_session_can_retry(db, monkeypatch):
    import app.core.redis as redis_module

    monkeypatch.setattr(redis_module, "get_sync_redis", lambda: AcceptingSyncRedis())
    service = NotificationService(db)
    event = _enqueue_test_event(service, "query")
    db.commit()
    real_query = db.query
    fail_query = True

    def query_with_one_failure(*entities, **kwargs):
        nonlocal fail_query
        if fail_query and entities == (NotificationOutbox,):
            fail_query = False
            raise RuntimeError("outbox query failed")
        return real_query(*entities, **kwargs)

    monkeypatch.setattr(db, "query", query_with_one_failure)
    with pytest.raises(RuntimeError, match="outbox query failed"):
        service.publish_pending_sync()

    assert service.publish_pending_sync() >= 1
    assert db.query(NotificationOutbox).filter_by(id=event.id).one().delivered_at is not None


def test_sync_pending_commit_failure_is_retryable(db, monkeypatch):
    import app.core.redis as redis_module

    monkeypatch.setattr(redis_module, "get_sync_redis", lambda: AcceptingSyncRedis())
    service = NotificationService(db)
    event = _enqueue_test_event(service, "commit")
    db.commit()
    real_commit = db.commit
    fail_commit = True

    def commit_with_one_failure():
        nonlocal fail_commit
        if fail_commit:
            fail_commit = False
            raise RuntimeError("outbox commit failed")
        return real_commit()

    monkeypatch.setattr(db, "commit", commit_with_one_failure)
    with pytest.raises(RuntimeError, match="outbox commit failed"):
        service.publish_pending_sync()

    assert db.query(NotificationOutbox).filter_by(id=event.id).one().delivered_at is None
    assert service.publish_pending_sync() >= 1
    assert db.query(NotificationOutbox).filter_by(id=event.id).one().delivered_at is not None
