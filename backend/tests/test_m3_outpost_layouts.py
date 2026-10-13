import copy
import uuid

from app.modules.m3_village.models import TopicOutpostLayout, TopicOutpostLayoutOperation


def _default_layout(client, headers):
    response = client.get("/village/outposts/layout", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def _request(layout, *, key="layout-1", revision=None):
    return {
        "expected_revision": layout["revision"] if revision is None else revision,
        "rules_version": 1,
        "idempotency_key": key,
        "items": [
            {"topic_id": item["topic_id"], "x": item["x"], "y": item["y"], "facing": item["facing"]}
            for item in layout["items"]
        ],
    }


def test_default_layout_is_full_canonical_grid_and_persisted(client, make_user, db):
    user, headers, _ = make_user()
    layout = _default_layout(client, headers)
    expected = {
        "arrays": (18, 20), "strings": (23, 17), "math": (28, 18),
        "greedy": (15, 23), "graphs": (33, 25), "trees": (17, 30),
        "dynamic-programming": (24, 33), "data-structures": (31, 30),
    }
    assert layout["revision"] == 0
    assert layout["rules_version"] == 1
    assert layout["rules"] == {
        "coordinate_space": "village-grid", "min_x": 8, "min_y": 8,
        "max_x_exclusive": 40, "max_y_exclusive": 40,
        "footprint_width": 3, "footprint_height": 3,
        "allowed_facings": ["default", "mirrored"],
    }
    assert len(layout["items"]) == 8
    assert {item["topic_key"]: (item["x"], item["y"]) for item in layout["items"]} == expected
    assert {item["facing"] for item in layout["items"]} == {"default"}
    persisted = db.query(TopicOutpostLayout).filter_by(user_id=uuid.UUID(user["id"])).one()
    assert persisted.revision == 0 and len(persisted.items) == 8


def test_layout_put_replays_same_request_and_advances_revision_once(client, make_user, db):
    user, headers, _ = make_user()
    layout = _default_layout(client, headers)
    request = _request(layout)
    request["items"][0]["x"] = 8
    request["items"][0]["y"] = 8

    first = client.put("/village/outposts/layout", json=request, headers=headers)
    replay = client.put("/village/outposts/layout", json=request, headers=headers)

    assert first.status_code == 200, first.text
    assert replay.status_code == 200, replay.text
    assert first.json()["replayed"] is False
    assert replay.json()["replayed"] is True
    assert first.json()["operation_id"] == replay.json()["operation_id"]
    assert first.json()["applied_revision"] == 1
    assert replay.json()["layout"]["revision"] == 1
    assert db.query(TopicOutpostLayoutOperation).filter_by(user_id=uuid.UUID(user["id"])).count() == 1


def test_layout_put_rejects_overlapping_or_out_of_bounds_footprints(client, make_user):
    _, headers, _ = make_user()
    layout = _default_layout(client, headers)

    overlap = _request(layout, key="overlap")
    overlap["items"][1]["x"] = overlap["items"][0]["x"]
    overlap["items"][1]["y"] = overlap["items"][0]["y"]
    assert client.put("/village/outposts/layout", json=overlap, headers=headers).status_code == 422

    bounds = _request(layout, key="bounds")
    bounds["items"][0]["x"] = 38
    bounds["items"][0]["y"] = 8
    assert client.put("/village/outposts/layout", json=bounds, headers=headers).status_code == 422


def test_layout_put_rejects_duplicate_missing_and_boolean_coordinates(client, make_user):
    _, headers, _ = make_user()
    layout = _default_layout(client, headers)

    duplicate = _request(layout, key="duplicate")
    duplicate["items"][1]["topic_id"] = duplicate["items"][0]["topic_id"]
    assert client.put("/village/outposts/layout", json=duplicate, headers=headers).status_code == 422

    missing = _request(layout, key="missing")
    missing["items"].pop()
    assert client.put("/village/outposts/layout", json=missing, headers=headers).status_code == 422

    boolean = _request(layout, key="boolean")
    boolean["items"][0]["x"] = True
    assert client.put("/village/outposts/layout", json=boolean, headers=headers).status_code == 422


def test_layout_put_rejects_stale_revision_and_key_reuse_conflict(client, make_user):
    _, headers, _ = make_user()
    layout = _default_layout(client, headers)
    request = _request(layout, key="key-a")
    request["items"][0]["x"] = 8
    request["items"][0]["y"] = 8
    assert client.put("/village/outposts/layout", json=request, headers=headers).status_code == 200

    stale = _request(layout, key="key-b", revision=0)
    assert client.put("/village/outposts/layout", json=stale, headers=headers).status_code == 409

    conflict = copy.deepcopy(request)
    conflict["items"][0]["x"] = 9
    assert client.put("/village/outposts/layout", json=conflict, headers=headers).status_code == 409


def test_two_users_have_independent_layouts_and_layout_requires_auth(client, make_user, db):
    user_a, headers_a, _ = make_user()
    user_b, headers_b, _ = make_user()
    original_b = _default_layout(client, headers_b)
    layout_a = _default_layout(client, headers_a)
    update = _request(layout_a, key="user-a-layout")
    update["items"][0]["x"] = 8
    update["items"][0]["y"] = 8
    assert client.put("/village/outposts/layout", json=update, headers=headers_a).status_code == 200

    after_b = _default_layout(client, headers_b)
    assert after_b == original_b
    assert db.query(TopicOutpostLayout).count() == 2
    assert client.get("/village/outposts/layout").status_code == 401
