"""Tests for M1 Authentication & Account Linking (REQ-1.x), against
plan.md Phase 2's rewrite: real Codeforces verification, session
denylist on logout, refresh-token rotation and type enforcement.
"""
import base64
import hashlib
import hmac
import json
import time
from datetime import timedelta
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_access_token,
    verify_refresh_token,
)
from app.modules.m2_platform_sync.judge_adapters.base import NormalizedUserInfo


def test_pyjwt_access_and_refresh_tokens_round_trip_with_expected_claims():
    user_id = uuid4()

    access_token, access_jti = create_access_token(user_id)
    refresh_token, refresh_jti = create_refresh_token(user_id)
    access_claims = verify_access_token(access_token)
    refresh_claims = verify_refresh_token(refresh_token)

    assert access_claims["sub"] == refresh_claims["sub"] == str(user_id)
    assert access_claims["jti"] == access_jti
    assert refresh_claims["jti"] == refresh_jti
    assert access_claims["type"] == "access"
    assert refresh_claims["type"] == "refresh"
    assert isinstance(access_claims["exp"], int)
    assert isinstance(refresh_claims["exp"], int)


def test_expired_pyjwt_token_maps_to_401():
    token, _ = create_access_token(uuid4(), expires_delta=timedelta(seconds=-1))

    with pytest.raises(HTTPException) as exc_info:
        decode_token(token)

    assert exc_info.value.status_code == 401


def test_invalid_pyjwt_signature_maps_to_401():
    import jwt

    token = jwt.encode(
        {"sub": str(uuid4()), "jti": "test-jti", "type": "access"},
        "not-the-configured-secret-key-0123456789",
        algorithm="HS256",
    )

    with pytest.raises(HTTPException) as exc_info:
        decode_token(token)

    assert exc_info.value.status_code == 401


def test_token_type_claims_are_enforced():
    access_token, _ = create_access_token(uuid4())
    refresh_token, _ = create_refresh_token(uuid4())

    with pytest.raises(HTTPException) as access_exc:
        verify_access_token(refresh_token)
    with pytest.raises(HTTPException) as refresh_exc:
        verify_refresh_token(access_token)

    assert access_exc.value.status_code == refresh_exc.value.status_code == 401


def test_pre_sid_legacy_token_is_rejected():
    """Tokens without sid are intentionally invalid after session revocation rollout."""

    def encode_segment(value):
        return base64.urlsafe_b64encode(value).rstrip(b"=")

    header = encode_segment(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = encode_segment(
        json.dumps(
            {"sub": "legacy-user", "jti": "legacy-jti", "type": "access", "exp": int(time.time()) + 60},
            separators=(",", ":"),
        ).encode()
    )
    signing_input = header + b"." + payload
    signature = encode_segment(
        hmac.new(settings.SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
    )
    token = (signing_input + b"." + signature).decode()

    with pytest.raises(HTTPException):
        verify_access_token(token)


class TestRegister:
    """POST /auth/register (REQ-1.1)."""

    def test_register_success(self, client):
        response = client.post(
            "/auth/register",
            json={"username": "newuser", "email": "test@example.com", "password": "securepassword123"},
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "test@example.com"
        assert "id" in data
        assert "password" not in data and "password_hash" not in data

    def test_register_duplicate_email(self, client, make_user):
        make_user(email="dupe@example.com")
        response = client.post(
            "/auth/register",
            json={"username": "someoneelse", "email": "dupe@example.com", "password": "securepassword123"},
        )
        assert response.status_code == 409
        assert response.json()["code"] == "email_already_registered"

    def test_register_duplicate_username(self, client, make_user):
        make_user(username="taken")
        response = client.post(
            "/auth/register",
            json={"username": "taken", "email": "other@example.com", "password": "securepassword123"},
        )
        assert response.status_code == 409
        assert response.json()["code"] == "username_already_taken"

    def test_register_short_password(self, client):
        response = client.post(
            "/auth/register",
            json={"username": "shortpw", "email": "shortpw@example.com", "password": "short"},
        )
        assert response.status_code == 422


class TestLogin:
    """POST /auth/login (REQ-1.2)."""

    def test_login_success(self, client, make_user):
        user, _, _ = make_user(password="correcthorse123")
        response = client.post(
            "/auth/login", json={"email": user["email"], "password": "correcthorse123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data and "refresh_token" in data
        from app.core.security import decode_token
        access = decode_token(data["access_token"])
        refresh = decode_token(data["refresh_token"])
        assert access["sid"] == refresh["sid"]
        assert access["jti"] != refresh["jti"]

    def test_login_wrong_password(self, client, make_user):
        user, _, _ = make_user()
        response = client.post("/auth/login", json={"email": user["email"], "password": "wrongpassword"})
        assert response.status_code == 401
        assert response.json()["code"] == "invalid_credentials"
        # generic message — no user enumeration (REQ-1.2)
        assert "wrong" not in response.json()["detail"].lower()

    def test_login_nonexistent_email(self, client):
        response = client.post(
            "/auth/login", json={"email": "nobody@example.com", "password": "whatever123"}
        )
        assert response.status_code == 401
        assert response.json()["code"] == "invalid_credentials"


class TestLogoutAndRefresh:
    """REQ-1.6: 7-day persistent session, explicit logout invalidates it."""

    def test_logout_invalidates_token(self, client, make_user):
        _, headers, _ = make_user()

        assert client.get("/auth/me", headers=headers).status_code == 200

        logout_resp = client.post("/auth/logout", headers=headers)
        assert logout_resp.status_code == 200

        # The exact token that was just logged out must now be rejected —
        # Sprint 1's logout was a no-op that never denylisted anything.
        after_logout = client.get("/auth/me", headers=headers)
        assert after_logout.status_code == 401

    def test_refresh_rotates_token_and_revokes_old_one(self, client, make_user):
        _, _, tokens = make_user()

        refresh_resp = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
        assert refresh_resp.status_code == 200
        new_tokens = refresh_resp.json()
        assert new_tokens["access_token"] != tokens["access_token"]
        assert new_tokens["refresh_token"] != tokens["refresh_token"]

        # Replaying the old refresh token must fail (rotation).
        replay_resp = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
        assert replay_resp.status_code == 401

    def test_logout_invalidates_rotated_refresh_and_access_descendants(self, client, make_user):
        _, headers, tokens = make_user()
        rotated = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]}).json()
        assert client.post("/auth/logout", headers=headers).status_code == 200
        assert client.get("/auth/me", headers={"Authorization": f"Bearer {rotated['access_token']}"}).status_code == 401
        assert client.post("/auth/refresh", json={"refresh_token": rotated["refresh_token"]}).status_code == 401

    def test_expired_access_plus_valid_refresh_can_logout_session(self, client, make_user):
        from datetime import timedelta
        from app.core.security import create_access_token, decode_token

        _, _, tokens = make_user()
        claims = decode_token(tokens["access_token"])
        expired_access, _ = create_access_token(claims["sub"], expires_delta=timedelta(seconds=-1), sid=claims["sid"])
        response = client.post(
            "/auth/logout",
            headers={"Authorization": f"Bearer {expired_access}"},
            json={"refresh_token": tokens["refresh_token"]},
        )
        assert response.status_code == 200, response.text
        assert client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]}).status_code == 401

    def test_refresh_credential_alone_can_logout_session(self, client, make_user):
        _, headers, tokens = make_user()
        response = client.post("/auth/logout", json={"refresh_token": tokens["refresh_token"]})
        assert response.status_code == 200, response.text
        assert client.get("/auth/me", headers=headers).status_code == 401

    def test_logout_rejects_access_and_refresh_from_different_sessions(self, client, make_user):
        _, access_headers, _ = make_user()
        _, _, other_tokens = make_user()

        response = client.post(
            "/auth/logout",
            headers=access_headers,
            json={"refresh_token": other_tokens["refresh_token"]},
        )
        assert response.status_code == 401
        assert client.get("/auth/me", headers=access_headers).status_code == 200

    def test_logout_is_idempotent_with_bodyless_access_request(self, client, make_user):
        _, headers, _ = make_user()
        assert client.post("/auth/logout", headers=headers).status_code == 200
        assert client.post("/auth/logout", headers=headers).status_code == 200

    async def test_logout_succeeds_durably_when_redis_cannot_record_cache(self, client, make_user, redis_client):
        from app.core.redis import get_redis

        _, _, tokens = make_user()

        class BrokenRedis:
            async def eval(self, *args, **kwargs):
                raise RuntimeError("redis unavailable")

        async def broken_redis():
            yield BrokenRedis()

        original_redis = client.app.dependency_overrides[get_redis]
        client.app.dependency_overrides[get_redis] = broken_redis
        try:
            response = client.post("/auth/logout", json={"refresh_token": tokens["refresh_token"]})
        finally:
            client.app.dependency_overrides[get_redis] = original_redis
        assert response.status_code == 200

        # Cache recovery or loss cannot undo the committed database revocation.
        await redis_client.flushdb()
        assert client.get("/auth/me", headers={
            "Authorization": f"Bearer {tokens['access_token']}"
        }).status_code == 401
        assert client.post("/auth/refresh", json={
            "refresh_token": tokens["refresh_token"]
        }).status_code == 401

    def test_independent_login_sessions_have_independent_sids(self, client, make_user):
        user, _, first = make_user()
        second = client.post("/auth/login", json={"email": user["email"], "password": "supersecret123"}).json()
        from app.core.security import decode_token
        assert decode_token(first["access_token"])["sid"] != decode_token(second["access_token"])["sid"]

    def test_refresh_token_cannot_be_used_as_access_token(self, client, make_user):
        """Sprint 1's verify_token() accepted either token type as a bearer credential."""
        _, _, tokens = make_user()
        headers = {"Authorization": f"Bearer {tokens['refresh_token']}"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 401

    async def test_logout_denylists_token_with_bounded_ttl(self, client, make_user, redis_client):
        """
        The denylist entry must expire alongside the token's own natural
        expiry (REQ-1.6), not sit in Redis forever — otherwise every
        logout leaks memory for the life of the deployment.
        """
        from app.core.security import decode_token

        _, headers, tokens = make_user()
        access_payload = decode_token(tokens["access_token"])

        assert client.post("/auth/logout", headers=headers).status_code == 200

        denylist_key = f"auth:denylist:{access_payload['jti']}"
        ttl = await redis_client.ttl(denylist_key)
        # Present, and bounded by the access token's ~7-day idle expiry
        # (REQ-1.6) rather than unset (-1, meaning "never expires").
        assert 0 < ttl <= 7 * 24 * 60 * 60
        session_ttl = await redis_client.ttl(f"auth:session-revoked:{access_payload['sid']}")
        assert session_ttl >= settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400 - 2

        # And the exact denylisted token is rejected before it would
        # otherwise have naturally expired.
        assert client.get("/auth/me", headers=headers).status_code == 401

    def test_suspended_user_can_see_me_but_not_active_routes(self, client, make_user, db):
        from app.modules.m1_auth.models import User

        user_data, headers, _ = make_user()
        user = db.get(User, user_data["id"])
        user.is_suspended = True
        db.commit()

        me = client.get("/auth/me", headers=headers)
        assert me.status_code == 200
        assert me.json()["is_suspended"] is True
        protected = client.get("/auth/judge-accounts", headers=headers)
        assert protected.status_code == 403
        assert protected.json()["code"] == "account_suspended"

    async def test_refresh_logout_race_leaves_whole_session_revoked(self, client, make_user, redis_client, db):
        from app.core.security import decode_token
        from app.modules.m1_auth.service import AuthService
        import asyncio

        _, _, tokens = make_user()
        claims = decode_token(tokens["access_token"])
        refresh_claims = decode_token(tokens["refresh_token"])
        service = AuthService(db)
        outcome = await asyncio.gather(
            service.refresh(redis_client, tokens["refresh_token"]),
            service.logout(
                redis_client,
                claims["sid"],
                access_jti=claims["jti"],
                access_exp=claims["exp"],
            ),
            return_exceptions=True,
        )
        assert await redis_client.exists(f"auth:session-revoked:{claims['sid']}")
        # If rotation linearized first, logout's sid marker still revokes its descendants.
        if isinstance(outcome[0], tuple):
            assert decode_token(outcome[0][0])["sid"] == refresh_claims["sid"]

    async def test_authentication_fails_closed_when_redis_is_unavailable(self):
        from app.core.dependencies import _require_session

        class BrokenRedis:
            async def exists(self, key):
                raise RuntimeError("redis offline")

        with pytest.raises(HTTPException) as exc:
            await _require_session(BrokenRedis(), {"jti": "j", "sid": "s"})
        assert exc.value.status_code == 503


class TestJudgeAccountLinking:
    """REQ-1.3–1.5: link/verify/unlink a Codeforces account."""

    @pytest.mark.parametrize("judge_type", ["leetcode", "codechef"])
    def test_non_codeforces_link_is_rejected_without_persisting_claim(
        self, judge_type, client, make_user, db,
    ):
        from app.modules.m1_auth.models import JudgeAccount, JudgeType

        user, headers, _ = make_user()
        response = client.post(
            "/auth/judge-accounts",
            json={"judge_type": judge_type, "handle": "unsupported_claim"},
            headers=headers,
        )

        assert response.status_code == 400
        assert response.json()["code"] == "validation_error"
        assert db.query(JudgeAccount).filter(
            JudgeAccount.user_id == user["id"],
            JudgeAccount.judge_type == JudgeType(judge_type),
        ).count() == 0

    def test_link_creates_unverified_account(self, client, make_user):
        _, headers, _ = make_user()
        response = client.post(
            "/auth/judge-accounts",
            json={"judge_type": "codeforces", "handle": "tourist"},
            headers=headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["judge_account"]["verified_flag"] is False
        assert data["verification_token"].startswith("codeforge-")

    def test_owner_can_retrieve_existing_pending_proof_after_relogin(self, client, make_user, db):
        from app.modules.m1_auth.models import JudgeAccount

        user, first_headers, _ = make_user()
        linked = client.post(
            "/auth/judge-accounts",
            json={"judge_type": "codeforces", "handle": f"proof_{user['id'][:8]}"},
            headers=first_headers,
        ).json()
        account_id = linked["judge_account"]["id"]
        original_token = linked["verification_token"]

        re_login = client.post(
            "/auth/login", json={"email": user["email"], "password": "supersecret123"},
        )
        headers = {"Authorization": f"Bearer {re_login.json()['access_token']}"}
        response = client.get(f"/auth/judge-accounts/{account_id}/pending-proof", headers=headers)

        assert re_login.status_code == 200
        assert response.status_code == 200, response.text
        assert response.json() == {"verification_token": original_token}
        assert response.headers["cache-control"] == "no-store"
        assert db.get(JudgeAccount, account_id).verification_token == original_token

    def test_pending_proof_is_owner_scoped_and_missing_ids_are_indistinguishable(
        self, client, make_user,
    ):
        _, owner_headers, _ = make_user()
        _, other_headers, _ = make_user()
        linked = client.post(
            "/auth/judge-accounts",
            json={"judge_type": "codeforces", "handle": f"proof_{uuid4().hex[:8]}"},
            headers=owner_headers,
        ).json()
        foreign_id = linked["judge_account"]["id"]
        missing_id = "00000000-0000-0000-0000-000000000000"

        foreign = client.get(f"/auth/judge-accounts/{foreign_id}/pending-proof", headers=other_headers)
        missing = client.get(f"/auth/judge-accounts/{missing_id}/pending-proof", headers=other_headers)

        assert foreign.status_code == missing.status_code == 404
        assert foreign.json() == missing.json()
        assert foreign.headers["cache-control"] == missing.headers["cache-control"] == "no-store"

    def test_verified_account_pending_proof_is_inaccessible(self, client, make_user, db):
        from app.modules.m1_auth.models import JudgeAccount

        user, headers, _ = make_user()
        linked = client.post(
            "/auth/judge-accounts",
            json={"judge_type": "codeforces", "handle": f"proof_{user['id'][:8]}"},
            headers=headers,
        ).json()
        account = db.get(JudgeAccount, linked["judge_account"]["id"])
        account.verified_flag = True
        db.commit()

        response = client.get(
            f"/auth/judge-accounts/{account.id}/pending-proof", headers=headers,
        )
        assert response.status_code == 404
        assert response.json() == {"detail": "Pending proof not found"}

    @patch(
        "app.modules.m2_platform_sync.judge_adapters.codeforces.CodeforcesAdapter.get_user_info",
        new_callable=AsyncMock,
    )
    def test_rate_gate_busy_is_retryable_and_preserves_verification_token(
        self, mock_get_user_info, client, make_user, db
    ):
        from app.modules.m2_platform_sync.rate_gate import CodeforcesRateBusy

        _, headers, _ = make_user()
        linked = client.post(
            "/auth/judge-accounts",
            json={"judge_type": "codeforces", "handle": "tourist"},
            headers=headers,
        ).json()
        mock_get_user_info.side_effect = CodeforcesRateBusy(1.5)

        response = client.post(
            f"/auth/judge-accounts/{linked['judge_account']['id']}/verify", headers=headers
        )

        assert response.status_code == 503
        assert response.headers["retry-after"] == "2"
        assert mock_get_user_info.await_count == 1
        from app.modules.m1_auth.models import JudgeAccount

        persisted = db.get(JudgeAccount, linked["judge_account"]["id"])
        assert persisted.verified_flag is False
        assert persisted.verification_token == linked["verification_token"]

    @patch(
        "app.modules.m2_platform_sync.judge_adapters.codeforces.CodeforcesAdapter.get_user_info",
        new_callable=AsyncMock,
    )
    def test_verify_succeeds_when_token_matches_profile(self, mock_get_user_info, client, make_user):
        _, headers, _ = make_user()
        link_resp = client.post(
            "/auth/judge-accounts",
            json={"judge_type": "codeforces", "handle": "tourist"},
            headers=headers,
        )
        account = link_resp.json()["judge_account"]
        token = link_resp.json()["verification_token"]

        mock_get_user_info.return_value = NormalizedUserInfo(
            handle="tourist", display_name=token, rating=3800
        )

        verify_resp = client.post(f"/auth/judge-accounts/{account['id']}/verify", headers=headers)
        assert verify_resp.status_code == 200, verify_resp.text
        assert verify_resp.json()["judge_account"]["verified_flag"] is True

    @patch(
        "app.modules.m2_platform_sync.judge_adapters.codeforces.CodeforcesAdapter.get_user_info",
        new_callable=AsyncMock,
    )
    def test_verified_case_alias_cannot_be_claimed_by_another_user(
        self, mock_get_user_info, client, make_user
    ):
        _, first_headers, _ = make_user()
        _, second_headers, _ = make_user()
        first_link = client.post(
            "/auth/judge-accounts",
            json={"judge_type": "codeforces", "handle": "tourist"},
            headers=first_headers,
        ).json()
        second_link = client.post(
            "/auth/judge-accounts",
            json={"judge_type": "codeforces", "handle": "TOURIST"},
            headers=second_headers,
        ).json()
        assert first_link["judge_account"]["verified_flag"] is False
        assert second_link["judge_account"]["verified_flag"] is False

        mock_get_user_info.return_value = NormalizedUserInfo(
            handle="Tourist", display_name=first_link["verification_token"], rating=3800
        )
        verified = client.post(
            f"/auth/judge-accounts/{first_link['judge_account']['id']}/verify",
            headers=first_headers,
        )
        assert verified.status_code == 200, verified.text
        assert verified.json()["judge_account"]["handle"] == "Tourist"

        mock_get_user_info.return_value = NormalizedUserInfo(
            handle="tourist", display_name=second_link["verification_token"], rating=3800
        )
        competing = client.post(
            f"/auth/judge-accounts/{second_link['judge_account']['id']}/verify",
            headers=second_headers,
        )
        assert competing.status_code == 409
        assert competing.json()["code"] == "already_linked"

    @patch(
        "app.modules.m2_platform_sync.judge_adapters.codeforces.CodeforcesAdapter.get_user_info",
        new_callable=AsyncMock,
    )
    def test_verify_fails_when_token_does_not_match(self, mock_get_user_info, client, make_user):
        """Sprint 1's verify_judge_profile() always approved regardless of proof — the exact bug this guards against."""
        _, headers, _ = make_user()
        link_resp = client.post(
            "/auth/judge-accounts",
            json={"judge_type": "codeforces", "handle": "tourist"},
            headers=headers,
        )
        account = link_resp.json()["judge_account"]

        mock_get_user_info.return_value = NormalizedUserInfo(
            handle="tourist", display_name="not-the-right-token", rating=3800
        )

        verify_resp = client.post(f"/auth/judge-accounts/{account['id']}/verify", headers=headers)
        assert verify_resp.status_code == 400
        assert verify_resp.json()["code"] == "verification_failed"

    @patch(
        "app.modules.m2_platform_sync.judge_adapters.codeforces.CodeforcesAdapter.get_user_info",
        new_callable=AsyncMock,
    )
    def test_other_user_cannot_verify_account_with_correct_token(self, mock_get_user_info, client, make_user):
        _, owner_headers, _ = make_user()
        _, other_headers, _ = make_user()
        link_resp = client.post(
            "/auth/judge-accounts",
            json={"judge_type": "codeforces", "handle": "tourist"},
            headers=owner_headers,
        )
        account = link_resp.json()["judge_account"]
        token = link_resp.json()["verification_token"]
        mock_get_user_info.return_value = NormalizedUserInfo(
            handle="tourist", display_name=token, rating=3800
        )

        verify_resp = client.post(
            f"/auth/judge-accounts/{account['id']}/verify", headers=other_headers
        )

        assert verify_resp.status_code == 404
        assert verify_resp.json()["code"] == "verification_token_not_found"
        mock_get_user_info.assert_not_awaited()

    def test_foreign_and_nonexistent_account_ids_are_indistinguishable(self, client, make_user):
        _, owner_headers, _ = make_user()
        _, other_headers, _ = make_user()
        link_resp = client.post(
            "/auth/judge-accounts",
            json={"judge_type": "codeforces", "handle": "tourist"},
            headers=owner_headers,
        )
        foreign_id = link_resp.json()["judge_account"]["id"]

        foreign_resp = client.post(
            f"/auth/judge-accounts/{foreign_id}/verify", headers=other_headers
        )
        missing_resp = client.post(
            "/auth/judge-accounts/00000000-0000-0000-0000-000000000000/verify",
            headers=other_headers,
        )

        assert foreign_resp.status_code == missing_resp.status_code == 404
        assert foreign_resp.json() == missing_resp.json()

    @patch(
        "app.modules.m2_platform_sync.judge_adapters.codeforces.CodeforcesAdapter.get_user_info",
        new_callable=AsyncMock,
    )
    def test_repeated_owner_verification_is_idempotent(self, mock_get_user_info, client, make_user):
        _, headers, _ = make_user()
        link_resp = client.post(
            "/auth/judge-accounts",
            json={"judge_type": "codeforces", "handle": "tourist"},
            headers=headers,
        )
        account = link_resp.json()["judge_account"]
        token = link_resp.json()["verification_token"]
        mock_get_user_info.return_value = NormalizedUserInfo(
            handle="tourist", display_name=token, rating=3800
        )

        first_resp = client.post(f"/auth/judge-accounts/{account['id']}/verify", headers=headers)
        repeated_resp = client.post(f"/auth/judge-accounts/{account['id']}/verify", headers=headers)

        assert first_resp.status_code == repeated_resp.status_code == 200
        assert repeated_resp.json()["judge_account"]["verified_flag"] is True
        mock_get_user_info.assert_awaited_once()

    def test_unlink_judge_account(self, client, make_user):
        _, headers, _ = make_user()
        client.post(
            "/auth/judge-accounts", json={"judge_type": "codeforces", "handle": "someone"}, headers=headers
        )
        response = client.delete("/auth/judge-accounts/codeforces", headers=headers)
        assert response.status_code == 200
        assert client.get("/auth/judge-accounts", headers=headers).json() == []
