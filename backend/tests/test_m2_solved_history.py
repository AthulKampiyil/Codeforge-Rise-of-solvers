import uuid
from datetime import datetime, timezone

from app.modules.m1_auth.models import JudgeAccount, JudgeType, User
from app.modules.m2_platform_sync.models import SolvedProblem
from app.modules.m10_economy.models import EconomyLedger


def _user(db, name):
    user = User(
        id=uuid.uuid4(), username=name, email=f"{name}@example.com", password_hash="h",
        is_active=True, is_suspended=False,
    )
    db.add(user)
    db.flush()
    return user


def _account(db, user, *, verified=True):
    account = JudgeAccount(
        id=uuid.uuid4(), user_id=user.id, judge_type=JudgeType.codeforces,
        handle=f"cf_{uuid.uuid4().hex[:8]}", verified_flag=verified,
    )
    db.add(account)
    db.flush()
    return account


def _solve(db, account, problem_id, solved_at, tags=None):
    solve = SolvedProblem(
        id=uuid.uuid4(), judge_account_id=account.id, problem_ext_id=problem_id,
        topic_tags=["dp", "math"] if tags is None else tags, rating=1200, solved_at=solved_at,
    )
    db.add(solve)
    db.flush()
    return solve


def test_solved_history_is_bounded_stable_and_reports_owner_credit(client, make_user, db):
    user, headers, _ = make_user()
    account = _account(db, db.query(User).filter_by(id=uuid.UUID(user["id"])).one())
    other = _user(db, f"history_{uuid.uuid4().hex[:8]}")
    other_account = _account(db, other)
    timestamp = datetime(2026, 1, 1, tzinfo=timezone.utc)
    first = _solve(db, account, "100-A", timestamp)
    second = _solve(db, account, "100-B", timestamp)
    credited_solve = max((first, second), key=lambda solve: (solve.solved_at, solve.id))
    _solve(db, other_account, "999-A", timestamp)
    db.add(EconomyLedger(
        id=uuid.uuid4(), user_id=uuid.UUID(user["id"]), solved_problem_id=credited_solve.id,
        solve_ordinal=1, coin_delta=10, gem_delta=0, gold_delta=200, elixir_delta=200,
    ))
    db.flush()

    response = client.get("/platform_sync/problems?offset=0&limit=1", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["total"] == 2
    assert body["offset"] == 0 and body["limit"] == 1
    assert body["items"] == [{
        "problem_id": max((first, second), key=lambda solve: (solve.solved_at, solve.id)).problem_ext_id,
        "tags": ["dp", "math"],
        "rating": 1200,
        "solved_at": timestamp.isoformat().replace("+00:00", "Z"),
        "credited": True,
    }]

    next_page = client.get("/platform_sync/problems?offset=1&limit=1", headers=headers)
    assert next_page.status_code == 200
    assert next_page.json()["items"][0]["credited"] is False
    assert next_page.json()["items"][0]["problem_id"] != "999-A"


def test_solved_history_requires_verified_codeforces_account(client, make_user, db):
    _, headers, _ = make_user()
    response = client.get("/platform_sync/problems", headers=headers)
    assert response.status_code == 404


def test_solved_history_rejects_unbounded_page_size(client, make_user):
    _, headers, _ = make_user()
    response = client.get("/platform_sync/problems?limit=101", headers=headers)
    assert response.status_code == 422


def test_solved_history_filters_to_one_topic(client, make_user, db):
    """A village topic covers a family of judge tags, so a topic page holds only its own problems."""
    user, headers, _ = make_user()
    account = _account(db, db.query(User).filter_by(id=uuid.UUID(user["id"])).one())
    timestamp = datetime(2026, 1, 1, tzinfo=timezone.utc)
    _solve(db, account, "200-A", timestamp, tags=["dp", "math"])
    _solve(db, account, "200-B", timestamp, tags=["greedy"])
    _solve(db, account, "200-C", timestamp, tags=["math"])
    _solve(db, account, "200-D", timestamp, tags=["*special"])
    db.flush()

    dynamic = client.get("/platform_sync/problems?topic=dynamic-programming", headers=headers)
    assert dynamic.status_code == 200, dynamic.text
    assert dynamic.json()["total"] == 1
    assert [item["problem_id"] for item in dynamic.json()["items"]] == ["200-A"]

    # A judge tag resolves to the seeded topic that owns it.
    alias = client.get("/platform_sync/problems?topic=dp", headers=headers)
    assert [item["problem_id"] for item in alias.json()["items"]] == ["200-A"]

    # A problem tagged for two topics appears under each of them, and nowhere else.
    math = client.get("/platform_sync/problems?topic=math", headers=headers)
    assert sorted(item["problem_id"] for item in math.json()["items"]) == ["200-A", "200-C"]
    unrelated = client.get("/platform_sync/problems?topic=arrays", headers=headers)
    assert unrelated.json() == {"items": [], "offset": 0, "limit": 50, "total": 0}


def test_solved_history_rejects_an_unknown_topic(client, make_user, db):
    user, headers, _ = make_user()
    _account(db, db.query(User).filter_by(id=uuid.UUID(user["id"])).one())
    response = client.get("/platform_sync/problems?topic=not-a-seeded-topic", headers=headers)
    assert response.status_code == 400
