import uuid

from app.modules.m1_auth.models import User
from app.modules.m3_village.models import (
    Topic, TopicOutpost, TopicOutpostUpgradeOperation, VillageTopicProgress,
)
from app.modules.m10_economy.models import Wallet


def _topic(db, name):
    existing = db.query(Topic).filter_by(name=name).one_or_none()
    if existing is not None:
        return existing
    topic = Topic(
        id=uuid.uuid4(), name=name, display_name=name.title(), structure_key="tower",
        base_threshold=10,
    )
    db.add(topic)
    db.flush()
    return topic


def _progress(db, user_id, topic, points=1):
    progress = VillageTopicProgress(
        id=uuid.uuid4(), user_id=user_id, topic_id=topic.id,
        progress_points=points, level=0,
    )
    db.add(progress)
    db.flush()
    return progress


def _wallet(db, user_id, *, gold=1000, elixir=1000):
    wallet = Wallet(
        user_id=user_id, coins=11, gems=3, gold=gold, elixir=elixir, rewarded_solves=25,
    )
    db.add(wallet)
    db.flush()
    return wallet


def _upgrade(client, headers, topic_id, *, key="upgrade-1", tier=0):
    return client.post(
        f"/village/outposts/{topic_id}/upgrade",
        json={"idempotency_key": key, "expected_tier": tier},
        headers=headers,
    )


def test_get_outposts_lists_only_progressed_topics_and_wallet(client, make_user, db):
    user, headers, _ = make_user()
    user_id = uuid.UUID(user["id"])
    progressed = _topic(db, "trees")
    no_progress = _topic(db, "graphs")
    _progress(db, user_id, progressed)
    _progress(db, user_id, no_progress, points=0)
    _wallet(db, user_id)

    response = client.get("/village/outposts", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["items"] == [{
        "topic_id": str(progressed.id), "tier": 0,
        "next_gold_cost": 100, "next_elixir_cost": 100,
    }]
    assert body["wallet"] == {
        "coins": 11, "gems": 3, "gold": 1000, "elixir": 1000,
        "rewarded_solves": 25, "builder_capacity": 3,
    }


def test_upgrade_deducts_server_price_and_same_key_replays(client, make_user, db):
    user, headers, _ = make_user()
    topic = _topic(db, "dp")
    _progress(db, uuid.UUID(user["id"]), topic)
    wallet = _wallet(db, uuid.UUID(user["id"]))

    first = _upgrade(client, headers, topic.id)
    replay = _upgrade(client, headers, topic.id)

    assert first.status_code == 200, first.text
    assert replay.status_code == 200, replay.text
    assert first.json() == replay.json()
    assert first.json()["upgraded_topic_id"] == str(topic.id)
    assert first.json()["items"][0]["tier"] == 1
    assert (wallet.gold, wallet.elixir) == (900, 900)
    assert db.query(TopicOutpostUpgradeOperation).filter_by(user_id=uuid.UUID(user["id"])).count() == 1


def test_upgrade_rejects_insufficient_funds_without_creating_purchase(client, make_user, db):
    user, headers, _ = make_user()
    topic = _topic(db, "math")
    user_id = uuid.UUID(user["id"])
    _progress(db, user_id, topic)
    wallet = _wallet(db, user_id, gold=99, elixir=1000)

    response = _upgrade(client, headers, topic.id)

    assert response.status_code == 409
    assert (wallet.gold, wallet.elixir) == (99, 1000)
    assert db.query(TopicOutpost).filter_by(user_id=user_id, topic_id=topic.id).count() == 0
    assert db.query(TopicOutpostUpgradeOperation).filter_by(user_id=user_id).count() == 0


def test_upgrade_rejects_idempotency_key_reuse_with_different_request(client, make_user, db):
    user, headers, _ = make_user()
    user_id = uuid.UUID(user["id"])
    topic_a = _topic(db, "strings")
    topic_b = _topic(db, "number-theory")
    _progress(db, user_id, topic_a)
    _progress(db, user_id, topic_b)
    _wallet(db, user_id)
    assert _upgrade(client, headers, topic_a.id, key="same-key").status_code == 200

    response = _upgrade(client, headers, topic_b.id, key="same-key")
    assert response.status_code == 409
    assert db.query(TopicOutpost).filter_by(user_id=user_id, topic_id=topic_b.id).count() == 0


def test_different_keys_cannot_purchase_same_expected_tier_twice(client, make_user, db):
    user, headers, _ = make_user()
    user_id = uuid.UUID(user["id"])
    topic = _topic(db, "greedy")
    _progress(db, user_id, topic)
    _wallet(db, user_id)
    assert _upgrade(client, headers, topic.id, key="first").status_code == 200

    response = _upgrade(client, headers, topic.id, key="second", tier=0)
    assert response.status_code == 409
    assert db.query(TopicOutpost).filter_by(user_id=user_id, topic_id=topic.id).one().tier == 1
    assert db.query(TopicOutpostUpgradeOperation).filter_by(user_id=user_id).count() == 1


def test_upgrade_cost_scales_to_tier_five_and_maximum_is_enforced(client, make_user, db):
    user, headers, _ = make_user()
    user_id = uuid.UUID(user["id"])
    topic = _topic(db, f"outpost-{uuid.uuid4().hex[:8]}")
    _progress(db, user_id, topic)
    wallet = _wallet(db, user_id, gold=2000, elixir=2000)

    for tier in range(5):
        result = _upgrade(client, headers, topic.id, key=f"tier-{tier}", tier=tier)
        assert result.status_code == 200, result.text
        assert result.json()["items"][0]["tier"] == tier + 1

    assert (wallet.gold, wallet.elixir) == (500, 500)
    maxed = client.get("/village/outposts", headers=headers).json()["items"][0]
    assert maxed["tier"] == 5
    assert maxed["next_gold_cost"] is None and maxed["next_elixir_cost"] is None
    rejected = _upgrade(client, headers, topic.id, key="tier-6", tier=5)
    assert rejected.status_code == 409
    assert (wallet.gold, wallet.elixir) == (500, 500)


def test_upgrade_requires_topic_progress_owned_by_request_user(client, make_user, db):
    user, headers, _ = make_user()
    foreign_user = User(
        id=uuid.uuid4(), username=f"foreign_{uuid.uuid4().hex[:8]}",
        email=f"{uuid.uuid4().hex}@example.com", password_hash="h",
        is_active=True, is_suspended=False,
    )
    db.add(foreign_user)
    db.flush()
    topic = _topic(db, "flows")
    _progress(db, foreign_user.id, topic)
    _wallet(db, uuid.UUID(user["id"]))

    response = _upgrade(client, headers, topic.id)
    assert response.status_code == 404
