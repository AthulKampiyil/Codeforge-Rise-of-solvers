"""M6 War Room tests — REQ-6.1–6.3.

Covers:
- Role gate: Leader 200, Officer 200, plain Member 403, non-member 403.
- Contested detection: within the margin of the leader, owned-with-challenger,
  and comfortably-ahead is not contested.
- Alignment (REQ-6.2): top-2 member topics intersecting a zone's top-2
  affinity topics.
- Per-member contribution and guild-score share (REQ-6.3).

Scores are written straight to zone_contributions so the assertions pin
the contested/alignment rules rather than M5's aggregation.
"""
import uuid

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.errors import ForbiddenError
from app.modules.m1_auth.models import User
from app.modules.m3_village.models import Topic, VillageTopicProgress
from app.modules.m5_guild_territory.models import (
    Guild,
    GuildMembership,
    GuildRole,
    TerritoryZone,
    ZoneContribution,
)
from app.modules.m6_war_room.service import WarRoomService

LEADER_TOPICS = {"graphs": 12, "trees": 8}
RIVAL_TOPICS = {"strings": 15, "greedy": 11}

# Two zones we own:
#   - contested: our score is 92% of the rival's (inside the 20% margin)
#   - safe: our score is far ahead, so it must not be reported
# One zone the rival owns outright while we are nowhere near it.
CONTESTED = "Northmere Capital"
SAFE = "The Nexus"
RIVAL_OWNED = "Sunken Library"


def _make_user(db: Session, username: str) -> User:
    user = User(
        id=uuid.uuid4(),
        username=username,
        email=f"{username}@example.com",
        password_hash="h",
        is_active=True,
        is_suspended=False,
    )
    db.add(user)
    return user


def _make_guild(db: Session, name: str, owner: User) -> Guild:
    guild = Guild(id=uuid.uuid4(), name=name, description=f"{name} desc")
    db.add(guild)
    db.add(
        GuildMembership(guild_id=guild.id, user_id=owner.id, role=GuildRole.leader)
    )
    return guild


def _add_member(db: Session, guild: Guild, user: User, role: GuildRole) -> None:
    db.add(
        GuildMembership(guild_id=guild.id, user_id=user.id, role=role)
    )


def _set_topics(db: Session, user: User, levels: dict[str, int]) -> None:
    topics = {t.name: t for t in db.query(Topic).all()}
    for name, level in levels.items():
        db.add(
            VillageTopicProgress(
                id=uuid.uuid4(),
                user_id=user.id,
                topic_id=topics[name].id,
                progress_points=level * 100,
                level=level,
            )
        )
    db.flush()


def _set_score(db: Session, zone: TerritoryZone, guild: Guild, score: float) -> None:
    db.add(
        ZoneContribution(
            zone_id=zone.id, guild_id=guild.id, aggregated_score=score
        )
    )
    db.flush()


@pytest.fixture
def war_room(db: Session):
    """Two guilds, three members, and a fixed set of zone scores."""
    zones = {z.name: z for z in db.query(TerritoryZone).all()}

    leader = _make_user(db, "wr_leader")
    officer = _make_user(db, "wr_officer")
    member = _make_user(db, "wr_member")
    rival_leader = _make_user(db, "wr_rival")

    guild = _make_guild(db, "War Room Guild", leader)
    rival = _make_guild(db, "Rival Guild", rival_leader)
    _add_member(db, guild, officer, GuildRole.officer)
    _add_member(db, guild, member, GuildRole.member)
    db.flush()

    _set_topics(db, leader, LEADER_TOPICS)
    _set_topics(db, officer, LEADER_TOPICS)
    _set_topics(db, member, RIVAL_TOPICS)
    _set_topics(db, rival_leader, RIVAL_TOPICS)
    db.flush()

    # We are the leader on SAFE and on CONTESTED but only just.
    _set_score(db, zones[SAFE], guild, 1000.0)
    _set_score(db, zones[SAFE], rival, 200.0)

    _set_score(db, zones[CONTESTED], guild, 920.0)
    _set_score(db, zones[CONTESTED], rival, 1000.0)
    # Rival owns it, but we are close enough to contest.
    zones[RIVAL_OWNED].owning_guild_id = rival.id
    _set_score(db, zones[RIVAL_OWNED], rival, 1000.0)
    _set_score(db, zones[RIVAL_OWNED], guild, 850.0)

    # A zone the rival owns and we are miles away from: never contested.
    far_zone = next(
        z for z in zones.values() if z.name not in (SAFE, CONTESTED, RIVAL_OWNED)
    )
    far_zone.owning_guild_id = rival.id
    _set_score(db, far_zone, rival, 1000.0)
    _set_score(db, far_zone, guild, 10.0)

    db.commit()

    return {
        "db": db,
        "guild": guild,
        "rival": rival,
        "leader": leader,
        "officer": officer,
        "member": member,
        "rival_leader": rival_leader,
        "zones": zones,
    }


# ── REQ-6.1 / NFR-3.3: role gate ───────────────────────────────────────


def test_leader_sees_war_room(war_room):
    svc = WarRoomService(war_room["db"])
    result = svc.get_war_room(war_room["guild"].id, str(war_room["leader"].id))
    assert result.guild["name"] == "War Room Guild"


def test_officer_sees_war_room(war_room):
    svc = WarRoomService(war_room["db"])
    result = svc.get_war_room(war_room["guild"].id, str(war_room["officer"].id))
    assert {m.username for m in result.members} >= {"wr_leader", "wr_officer"}


def test_plain_member_is_forbidden(war_room):
    svc = WarRoomService(war_room["db"])
    with pytest.raises(ForbiddenError):
        svc.get_war_room(war_room["guild"].id, str(war_room["member"].id))


def test_non_member_is_forbidden(war_room):
    svc = WarRoomService(war_room["db"])
    with pytest.raises(ForbiddenError):
        svc.get_war_room(war_room["guild"].id, str(war_room["rival_leader"].id))


def test_suspended_member_excluded_from_roster(war_room):
    member = war_room["member"]
    member.is_suspended = True
    war_room["db"].commit()

    svc = WarRoomService(war_room["db"])
    result = svc.get_war_room(war_room["guild"].id, str(war_room["leader"].id))
    assert "wr_member" not in {m.username for m in result.members}


# ── REQ-6.1: contested detection ───────────────────────────────────────


def test_contested_zones_exclude_comfortably_held_zone(war_room):
    svc = WarRoomService(war_room["db"])
    result = svc.get_war_room(war_room["guild"].id, str(war_room["leader"].id))

    names = {z.zone_name for z in result.contested_zones}
    assert CONTESTED in names
    assert RIVAL_OWNED in names
    assert SAFE not in names


def test_contested_zone_reports_leader_and_gap(war_room):
    svc = WarRoomService(war_room["db"])
    result = svc.get_war_room(war_room["guild"].id, str(war_room["leader"].id))

    zone = next(z for z in result.contested_zones if z.zone_name == CONTESTED)
    assert zone.leading_guild == "Rival Guild"
    assert zone.leading_score == 1000.0
    assert zone.our_score == 920.0
    assert zone.gap_pct == 8.0


def test_contested_margin_is_admin_tunable(war_room):
    """Widening war_room.contested_margin must pull a safe zone in."""
    db = war_room["db"]
    db.execute(
        text("UPDATE game_balance_config SET value = '5.0' WHERE key = 'war_room.contested_margin'")
    )
    db.commit()

    svc = WarRoomService(db)
    result = svc.get_war_room(war_room["guild"].id, str(war_room["leader"].id))
    assert SAFE in {z.zone_name for z in result.contested_zones}


# ── REQ-6.2: alignment ─────────────────────────────────────────────────


def test_alignment_picks_members_whose_top_topics_match(war_room):
    svc = WarRoomService(war_room["db"])
    result = svc.get_war_room(war_room["guild"].id, str(war_room["leader"].id))

    by_name = {m.username: m for m in result.members}
    contested_id = str(war_room["zones"][CONTESTED].id)
    # Northmere Capital affinity is graphs/trees/data-structures, so the
    # graphs+trees members align and the strings+greedy member does not.
    assert contested_id in by_name["wr_leader"].aligns_with_contested
    assert contested_id in by_name["wr_officer"].aligns_with_contested
    assert contested_id not in by_name["wr_member"].aligns_with_contested


def test_alignment_only_lists_contested_zones(war_room):
    svc = WarRoomService(war_room["db"])
    result = svc.get_war_room(war_room["guild"].id, str(war_room["leader"].id))

    contested_ids = {z.zone_id for z in result.contested_zones}
    for m in result.members:
        assert set(m.aligns_with_contested) <= contested_ids


# ── REQ-6.3: per-member contributions ──────────────────────────────────


def test_member_zone_contributions_and_shares(war_room):
    svc = WarRoomService(war_room["db"])
    result = svc.get_war_room(war_room["guild"].id, str(war_room["leader"].id))

    leader = next(m for m in result.members if m.username == "wr_leader")
    contributions = {c.zone_id: c for c in leader.zone_contributions}
    contested_id = str(war_room["zones"][CONTESTED].id)

    # affinity graphs 0.5 + trees 0.3, and the member is level 12 / 8.
    assert contributions[contested_id].contribution == pytest.approx(0.5 * 12 + 0.3 * 8)
    assert 0 < contributions[contested_id].share_pct <= 100


def test_contributions_cover_every_zone_the_guild_scores_in(war_room):
    svc = WarRoomService(war_room["db"])
    result = svc.get_war_room(war_room["guild"].id, str(war_room["leader"].id))

    expected = {
        str(zc.zone_id)
        for zc in war_room["db"].query(ZoneContribution)
        .filter(ZoneContribution.guild_id == war_room["guild"].id)
        .all()
    }
    for m in result.members:
        assert {c.zone_id for c in m.zone_contributions} == expected


# ── Router contract ───────────────────────────────────────────────────
# The service-level tests above call WarRoomService directly, so the router
# itself (path shape, dependency wiring, status codes) is covered here.


def test_get_war_room_over_http(client, db, make_user):
    leader, auth_headers, _ = make_user("wr_http_leader")
    _, outsider_headers, _ = make_user("wr_http_outsider")

    from app.modules.m5_guild_territory.service import GuildService

    guild = GuildService(db).create_guild("War Room HTTP", leader["id"], "Testing")

    ok = client.get(f"/war_room/{guild.id}", headers=auth_headers)
    assert ok.status_code == 200, ok.text
    body = ok.json()
    assert body["guild_id"] == str(guild.id)
    assert "contested_zones" in body
    assert [m["username"] for m in body["members"]] == ["wr_http_leader"]
    assert body["members"][0]["role"] == GuildRole.leader.value

    denied = client.get(f"/war_room/{guild.id}", headers=outsider_headers)
    assert denied.status_code == 403
