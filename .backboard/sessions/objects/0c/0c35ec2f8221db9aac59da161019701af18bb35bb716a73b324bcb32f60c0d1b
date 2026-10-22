"""Tests for M1 Authentication & Account Linking (REQ-1.x), against
plan.md Phase 2's rewrite: real Codeforces verification, session
denylist on logout, refresh-token rotation and type enforcement.
"""
from unittest.mock import AsyncMock, patch

import pytest

from app.modules.m2_platform_sync.judge_adapters.base import NormalizedUserInfo


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

        # And the exact denylisted token is rejected before it would
        # otherwise have naturally expired.
        assert client.get("/auth/me", headers=headers).status_code == 401


class TestJudgeAccountLinking:
    """REQ-1.3–1.5: link/verify/unlink a Codeforces account."""

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

    def test_unlink_judge_account(self, client, make_user):
        _, headers, _ = make_user()
        client.post(
            "/auth/judge-accounts", json={"judge_type": "codeforces", "handle": "someone"}, headers=headers
        )
        response = client.delete("/auth/judge-accounts/codeforces", headers=headers)
        assert response.status_code == 200
        assert client.get("/auth/judge-accounts", headers=headers).json() == []
