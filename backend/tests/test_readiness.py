from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

import app.main as main


def _ready_test_client(monkeypatch, redis_client):
    connection = MagicMock()
    context = MagicMock()
    context.__enter__.return_value = connection
    monkeypatch.setattr(main.engine, "connect", lambda: context)
    monkeypatch.setattr(main, "get_async_redis", lambda: redis_client)
    return TestClient(main.app)


def test_readiness_checks_database_and_redis(monkeypatch):
    redis_client = MagicMock()
    redis_client.ping = AsyncMock(return_value=True)
    redis_client.aclose = AsyncMock()

    response = _ready_test_client(monkeypatch, redis_client).get("/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready"}
    redis_client.ping.assert_awaited_once()
    redis_client.aclose.assert_awaited_once()


def test_readiness_hides_dependency_failure(monkeypatch):
    redis_client = MagicMock()
    redis_client.ping = AsyncMock(side_effect=ConnectionError("private endpoint detail"))
    redis_client.aclose = AsyncMock()

    response = _ready_test_client(monkeypatch, redis_client).get("/ready")

    assert response.status_code == 503
    assert response.json() == {"detail": "Service not ready"}
    assert "private endpoint detail" not in response.text
    redis_client.aclose.assert_awaited_once()
