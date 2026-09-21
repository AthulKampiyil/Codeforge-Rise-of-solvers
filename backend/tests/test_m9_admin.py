"""Tests for M9 Admin & Game-Balance Configuration (UC-11/UC-12)."""
import uuid

from app.modules.m1_auth.models import User


def _promote_to_admin(db, user_id: str) -> None:
    user = db.query(User).filter(User.id == user_id).first()
    user.is_admin = True
    db.commit()


class TestListConfig:
    def test_non_admin_gets_403(self, client, make_user):
        _, headers, _ = make_user()
        response = client.get("/admin/config", headers=headers)
        assert response.status_code == 403

    def test_unauthenticated_gets_401(self, client):
        response = client.get("/admin/config")
        assert response.status_code == 401

    def test_admin_lists_seeded_keys(self, client, make_user, db):
        user, headers, _ = make_user()
        _promote_to_admin(db, user["id"])

        response = client.get("/admin/config", headers=headers)
        assert response.status_code == 200, response.text
        keys = {entry["key"] for entry in response.json()}
        assert "attack.cooldown_minutes" in keys
        assert "village.defense_base" in keys


class TestUpdateConfig:
    def test_non_admin_cannot_write(self, client, make_user):
        _, headers, _ = make_user()
        response = client.put(
            "/admin/config/attack.cooldown_minutes", json={"value": 90}, headers=headers
        )
        assert response.status_code == 403

    def test_admin_updates_value_and_writes_audit_row(self, client, make_user, db):
        user, headers, _ = make_user()
        _promote_to_admin(db, user["id"])

        response = client.put(
            "/admin/config/attack.cooldown_minutes", json={"value": 90}, headers=headers
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["value"] == 90
        assert data["updated_by"] == user["id"]

        get_resp = client.get("/admin/config", headers=headers)
        entry = next(e for e in get_resp.json() if e["key"] == "attack.cooldown_minutes")
        assert entry["value"] == 90

        from app.modules.m9_admin_config.models import AdminAuditLog

        audit_rows = (
            db.query(AdminAuditLog)
            .filter(AdminAuditLog.target_id == "attack.cooldown_minutes")
            .all()
        )
        assert len(audit_rows) == 1
        assert audit_rows[0].action == "set_config"
        assert audit_rows[0].details["new_value"] == 90

    def test_update_unknown_key_404(self, client, make_user, db):
        user, headers, _ = make_user()
        _promote_to_admin(db, user["id"])

        response = client.put("/admin/config/not.a.real.key", json={"value": 1}, headers=headers)
        assert response.status_code == 404
        assert response.json()["code"] == "config_key_not_found"

    def test_update_wrong_type_rejected(self, client, make_user, db):
        user, headers, _ = make_user()
        _promote_to_admin(db, user["id"])

        # attack.cooldown_minutes is an "int" key — a dict value must be rejected.
        response = client.put(
            "/admin/config/attack.cooldown_minutes", json={"value": {"a": 1}}, headers=headers
        )
        assert response.status_code == 400
        assert response.json()["code"] == "config_type_mismatch"

    def test_write_busts_cache_so_reads_see_the_new_value(self, client, make_user, db):
        user, headers, _ = make_user()
        _promote_to_admin(db, user["id"])

        from app.modules.m9_admin_config.service import GameBalanceConfig

        # Warm the cache with the current value the way another module's
        # service.py would via GameBalanceConfig(db).get(key), then write
        # a new value and prove the next get() doesn't return the stale
        # cached one.
        cfg = GameBalanceConfig(db)
        before = cfg.get("attack.cooldown_minutes")

        response = client.put(
            "/admin/config/attack.cooldown_minutes",
            json={"value": before + 5},
            headers=headers,
        )
        assert response.status_code == 200, response.text

        after = GameBalanceConfig(db).get("attack.cooldown_minutes")
        assert after == before + 5

        # restore original value so this test doesn't leak state into others
        client.put(
            "/admin/config/attack.cooldown_minutes", json={"value": before}, headers=headers
        )


class TestUserModeration:
    """UC-11: admin user search, suspend, unsuspend."""

    def test_non_admin_cannot_list_users(self, client, make_user):
        _, headers, _ = make_user()
        assert client.get("/admin/users", headers=headers).status_code == 403

    def test_admin_lists_and_searches_users(self, client, make_user, db):
        admin, headers, _ = make_user(username="admin1")
        _promote_to_admin(db, admin["id"])
        make_user(username="findme")

        response = client.get("/admin/users?search=findme", headers=headers)
        assert response.status_code == 200, response.text
        usernames = {u["username"] for u in response.json()}
        assert usernames == {"findme"}

    def test_admin_suspends_and_unsuspends_a_user(self, client, make_user, db):
        admin, headers, _ = make_user(username="admin2")
        _promote_to_admin(db, admin["id"])
        target, target_headers, _ = make_user(username="target1")

        suspend_resp = client.post(
            f"/admin/users/{target['id']}/suspend",
            json={"reason": "spamming attacks"},
            headers=headers,
        )
        assert suspend_resp.status_code == 200, suspend_resp.text
        assert suspend_resp.json()["is_suspended"] is True

        # A suspended user's existing token is rejected on the next
        # request to any get_current_active_user-gated endpoint —
        # /auth/me itself stays reachable (get_current_user) so a
        # suspended user can still see their own status.
        me_resp = client.get("/auth/me", headers=target_headers)
        assert me_resp.status_code == 200
        assert me_resp.json()["is_suspended"] is True

        judges_resp = client.get("/auth/judge-accounts", headers=target_headers)
        assert judges_resp.status_code == 403
        assert judges_resp.json()["code"] == "account_suspended"

        unsuspend_resp = client.post(f"/admin/users/{target['id']}/unsuspend", headers=headers)
        assert unsuspend_resp.status_code == 200
        assert unsuspend_resp.json()["is_suspended"] is False

    def test_suspend_unknown_user_404(self, client, make_user, db):
        admin, headers, _ = make_user(username="admin3")
        _promote_to_admin(db, admin["id"])

        response = client.post(
            f"/admin/users/{uuid.uuid4()}/suspend",
            json={"reason": "n/a"},
            headers=headers,
        )
        assert response.status_code == 404
        assert response.json()["code"] == "user_not_found"

    def test_suspend_writes_audit_row_with_reason(self, client, make_user, db):
        admin, headers, _ = make_user(username="admin4")
        _promote_to_admin(db, admin["id"])
        target, _, _ = make_user(username="target2")

        client.post(
            f"/admin/users/{target['id']}/suspend",
            json={"reason": "abuse report #42"},
            headers=headers,
        )

        from app.modules.m9_admin_config.models import AdminAuditLog

        row = (
            db.query(AdminAuditLog)
            .filter(AdminAuditLog.action == "suspend_user", AdminAuditLog.target_id == target["id"])
            .first()
        )
        assert row is not None
        assert row.details["reason"] == "abuse report #42"


class TestAuditLog:
    def test_non_admin_cannot_browse_audit_log(self, client, make_user):
        _, headers, _ = make_user()
        assert client.get("/admin/audit-log", headers=headers).status_code == 403

    def test_admin_sees_newest_actions_first(self, client, make_user, db):
        admin, headers, _ = make_user(username="admin5")
        _promote_to_admin(db, admin["id"])

        client.put("/admin/config/attack.cooldown_minutes", json={"value": 45}, headers=headers)
        client.put("/admin/config/attack.cooldown_minutes", json={"value": 60}, headers=headers)

        response = client.get("/admin/audit-log", headers=headers)
        assert response.status_code == 200, response.text
        entries = response.json()
        assert len(entries) >= 2
        assert entries[0]["created_at"] >= entries[1]["created_at"]
