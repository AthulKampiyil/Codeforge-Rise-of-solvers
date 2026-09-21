"""Shared pytest fixtures.

Tests run against real PostgreSQL + Redis (not SQLite): the schema
uses JSONB, ARRAY, and native enum types that SQLite cannot represent,
and several of Sprint 1's models already used postgresql.UUID directly,
which could never construct on SQLite in the first place.

Requires: a reachable Postgres (TEST_DATABASE_URL, default derived from
the dev docker-compose settings with a `_test` suffix) and Redis
(TEST_REDIS_URL). Run `alembic upgrade head` against the test database
before running pytest, or let the session-scoped fixture below do it.
"""
import os
import uuid

import pytest
import pytest_asyncio
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql://codeforge:codeforge@localhost:5432/codeforge_test",
)
TEST_REDIS_URL = os.environ.get("TEST_REDIS_URL", "redis://localhost:6379/15")


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(TEST_DATABASE_URL)
    yield eng
    eng.dispose()


@pytest.fixture(scope="session", autouse=True)
def _apply_migrations(engine):
    """Run alembic upgrade head once per test session against the test DB."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    alembic_cfg = Config(os.path.join(backend_dir, "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    alembic_cfg.set_main_option("script_location", os.path.join(backend_dir, "alembic"))
    command.upgrade(alembic_cfg, "head")
    yield
    # Leave the schema in place between runs; migrations are idempotent
    # to re-run via `alembic downgrade base` if a developer wants a clean slate.


@pytest.fixture
def db(engine):
    """
    Function-scoped session wrapped in a transaction that's rolled back
    after each test, so tests are isolated without dropping/recreating
    the schema every time (fast) and never leak data between tests.
    """
    connection = engine.connect()
    transaction = connection.begin()
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestingSessionLocal()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest_asyncio.fixture
async def redis_client():
    """Redis client on a dedicated DB index, flushed before/after each test."""
    import redis.asyncio as aioredis

    client = aioredis.from_url(TEST_REDIS_URL, decode_responses=True)
    await client.flushdb()
    yield client
    await client.flushdb()
    await client.aclose()


@pytest.fixture
def client(db, redis_client):
    """TestClient with get_db and get_redis overridden to the test fixtures."""
    import redis.asyncio as aioredis

    from app.core.redis import get_redis
    from app.db.session import get_db
    from app.main import app

    async def override_get_redis():
        # A fresh connection per call, not the `redis_client` fixture's
        # instance: TestClient runs each request on its own anyio portal
        # event loop, distinct from the loop pytest-asyncio opened
        # `redis_client`'s connections on. Reusing that instance here
        # raises "Future attached to a different loop" the moment a
        # handler awaits it. Both clients still point at the same real
        # Redis server/db, so state set by one is visible to the other.
        conn = aioredis.from_url(TEST_REDIS_URL, decode_responses=True)
        try:
            yield conn
        finally:
            await conn.aclose()

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_redis] = override_get_redis
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def make_user(client):
    """
    Registers + logs in a user, returning (user_dict, auth_headers).
    Usage: user, headers = make_user("alice", "alice@example.com")
    """

    def _make(username: str = None, email: str = None, password: str = "supersecret123"):
        username = username or f"user_{uuid.uuid4().hex[:8]}"
        email = email or f"{username}@example.com"

        resp = client.post(
            "/auth/register",
            json={"username": username, "email": email, "password": password},
        )
        assert resp.status_code == 201, resp.text
        user = resp.json()

        resp = client.post("/auth/login", json={"email": email, "password": password})
        assert resp.status_code == 200, resp.text
        tokens = resp.json()

        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        return user, headers, tokens

    return _make

