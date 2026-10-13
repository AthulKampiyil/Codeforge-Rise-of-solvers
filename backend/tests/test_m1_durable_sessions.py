"""Focused regression coverage for PostgreSQL-backed M1 session state."""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from threading import Barrier
from uuid import uuid4

import pytest
from sqlalchemy.orm import sessionmaker

from app.core.errors import InvalidCredentials
from app.core.security import create_refresh_token, decode_token
from app.modules.m1_auth.models import AuthSession, User
from app.modules.m1_auth.service import AuthService


class _NoRedisCache:
    async def setex(self, *args, **kwargs):
        return True

    async def eval(self, *args, **kwargs):
        return 1


def _create_committed_session(engine):
    """Create rows visible to independent DB connections and return cleanup IDs."""
    user_id = uuid4()
    sid = uuid4()
    token, refresh_jti = create_refresh_token(str(user_id), sid=str(sid))
    claims = decode_token(token)
    with sessionmaker(bind=engine)() as db:
        db.add(User(
            id=user_id,
            username=f"durable_{user_id.hex}",
            email=f"{user_id.hex}@example.test",
            password_hash="not-used",
        ))
        db.flush()
        db.add(AuthSession(
            sid=sid,
            user_id=user_id,
            refresh_jti=refresh_jti,
            expires_at=datetime.fromtimestamp(claims["exp"], tz=timezone.utc),
        ))
        db.commit()
    return token, str(user_id), str(sid)


def _delete_committed_session(engine, user_id: str, sid: str) -> None:
    with sessionmaker(bind=engine)() as db:
        db.query(AuthSession).filter(AuthSession.sid == sid).delete()
        db.query(User).filter(User.id == user_id).delete()
        db.commit()


@pytest.mark.asyncio
async def test_logout_remains_revoked_after_redis_flush(client, make_user, redis_client):
    _, headers, _ = make_user()
    assert client.post("/auth/logout", headers=headers).status_code == 200

    await redis_client.flushdb()
    assert client.get("/auth/me", headers=headers).status_code == 401


@pytest.mark.asyncio
async def test_refresh_consumption_survives_redis_flush(client, make_user, redis_client):
    _, _, tokens = make_user()
    rotated = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert rotated.status_code == 200, rotated.text

    await redis_client.flushdb()
    replay = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert replay.status_code == 401
    successor = client.post("/auth/refresh", json={"refresh_token": rotated.json()["refresh_token"]})
    assert successor.status_code == 200, successor.text


def test_parallel_refresh_on_independent_sessions_has_one_winner(engine):
    token, user_id, sid = _create_committed_session(engine)
    barrier = Barrier(2)

    def refresh_competing():
        with sessionmaker(bind=engine)() as db:
            barrier.wait(timeout=5)
            return asyncio.run(AuthService(db).refresh(_NoRedisCache(), token))

    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            futures = [pool.submit(refresh_competing) for _ in range(2)]
            results = []
            for future in futures:
                try:
                    results.append(future.result(timeout=15))
                except Exception as exc:
                    results.append(exc)
        winners = [result for result in results if isinstance(result, tuple)]
        rejected = [result for result in results if isinstance(result, InvalidCredentials)]
        assert len(winners) == 1
        assert len(rejected) == 1
        assert decode_token(winners[0][0])["sid"] == sid
    finally:
        _delete_committed_session(engine, user_id, sid)


def test_refresh_and_logout_race_leaves_database_session_revoked(engine):
    token, user_id, sid = _create_committed_session(engine)
    barrier = Barrier(2)

    def refresh_competing():
        with sessionmaker(bind=engine)() as db:
            barrier.wait(timeout=5)
            return asyncio.run(AuthService(db).refresh(_NoRedisCache(), token))

    def logout_competing():
        with sessionmaker(bind=engine)() as db:
            barrier.wait(timeout=5)
            return asyncio.run(AuthService(db).logout(_NoRedisCache(), sid, user_id=user_id))

    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            refresh_future = pool.submit(refresh_competing)
            logout_future = pool.submit(logout_competing)
            try:
                refresh_result = refresh_future.result(timeout=15)
            except InvalidCredentials as exc:
                refresh_result = exc
            logout_future.result(timeout=15)

        with sessionmaker(bind=engine)() as db:
            session = db.get(AuthSession, sid)
            assert session is not None and session.revoked_at is not None
        if isinstance(refresh_result, tuple):
            with sessionmaker(bind=engine)() as db:
                with pytest.raises(InvalidCredentials):
                    asyncio.run(AuthService(db).refresh(_NoRedisCache(), refresh_result[1]))
    finally:
        _delete_committed_session(engine, user_id, sid)


@pytest.mark.asyncio
async def test_expired_database_session_rejects_access_and_refresh(engine):
    from fastapi import HTTPException
    from app.core.dependencies import _require_session
    from app.core.security import create_access_token

    token, user_id, sid = _create_committed_session(engine)
    access_token, _ = create_access_token(user_id, sid=sid)
    access_claims = decode_token(access_token)
    try:
        with sessionmaker(bind=engine)() as db:
            session = db.get(AuthSession, sid)
            session.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
            db.commit()
            with pytest.raises(HTTPException) as exc:
                await _require_session(_NoRedisCache(), access_claims, db)
            assert exc.value.status_code == 401
            with pytest.raises(InvalidCredentials):
                await AuthService(db).refresh(_NoRedisCache(), token)
    finally:
        _delete_committed_session(engine, user_id, sid)
