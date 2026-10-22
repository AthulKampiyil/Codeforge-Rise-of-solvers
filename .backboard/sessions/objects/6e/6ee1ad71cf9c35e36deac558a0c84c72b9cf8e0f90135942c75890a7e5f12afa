# Athul — Guild, Territory & Realtime

**Branch:** `feat/athul-guild-realtime` · **Base:** `ashar` · **Window:** ~2 weeks
**You own:** M5 Guild & Territory Control, M8 Notification & Realtime Gateway

You build the screen that sells the project — the Fig 3.1 War Map — and you own
the realtime pipe every other lane publishes through. M8 is already the most
complete module in the repo (Redis pub/sub, the SADD envelope, a working
WebSocket endpoint), so your realtime work is the *consumption* side, not the
gateway.

> Full context: `docs/WORK_SPLIT_50.md`. Project reality check: `NEXT_STEPS.md`.

---

## 0. Before you start

Do not branch until the **seed commit** is on `ashar` (it creates `index.html`,
`App.jsx`, `routes/index.jsx`, `shared/ui/`, `game/config.js` and the lockfile).
Then:

```bash
git fetch origin && git checkout ashar && git pull
git checkout -b feat/athul-guild-realtime
git push -u origin feat/athul-guild-realtime
```

---

## 1. Wave 1 — your contract PR, first 48 hours

**`frontend/src/shared/websocket/client.js` + a `useRealtimeEvent(type, handler)`
hook.** Niranjan and Hari are both blocked on this, so it ships as a small standalone PR
into `ashar`, not inside your lane branch.

`shared/websocket/client.js` is a three-line comment today. Build:

- **One socket for the whole app**, opened once after auth, `?token=` on the
  query string (the endpoint at `m8_notifications/router.py:60` already expects that).
- Reconnect with exponential backoff.
- Subscribe/unsubscribe by event type.
- `useRealtimeEvent(type, handler)` — handlers **invalidate the matching TanStack
  Query keys** so the UI stays consistent with REST rather than maintaining a
  second source of truth.

The six event types are already defined in `m8_notifications/schemas.py`:
`ATTACK_INCOMING`, `ATTACK_RESOLVED`, `TERRITORY_ZONE_CHANGED`, `VILLAGE_UPDATED`,
`LEAGUE_TIER_CHANGED`, `SYNC_STATUS_CHANGED`. You're consuming a finished
contract — don't redesign the envelope.

---

## 2. Backend — M5 Guild & Territory, 75% → 90%

### Widen the roster payload

`GuildMembershipOut` in `m5_guild_territory/schemas.py` carries only `guild_id`,
`user_id`, `role`, `joined_at`. Fig 3.2's roster needs `username`, `level`,
`solved_count`, `attack_count`.

**SADD §4.1 is the constraint here:** a module may only import another module's
**`service.py`** — never its `repository.py` or `models.py`. So `level` and
`solved_count` come through `m3_village`'s service (Niranjan) and `attack_count`
through `m4_attacks`' service (Hari). There is an architecture test planned that
fails the build on a violation, so do it the right way the first time.

**Drop the online/STATUS column.** There is no presence tracking anywhere and
building it isn't worth it now — render the role badge instead.

### Expose the map geometry

`TerritoryZone.map_polygon` **already exists on the model**
(`m5_guild_territory/models.py:92`) but is absent from `TerritoryZoneOut` and is
`NULL` for every row. Two jobs:

1. Add `map_polygon` to the output schema.
2. Seed the eight polygons as normalised `[[x,y], …]` coordinate lists traced off
   Fig 3.1.
   → **Your migration: `003_zone_polygons`** (see §6).

The zone names are **already seeded verbatim** from the mockup in `002_seed.py`:
`Northmere Capital`, `Frozen Archives`, `Iron Peaks`, `Thornvale`, `The Nexus`,
`Rivergate`, `Sunken Library`, `Codewall`. Match your polygons to those names.

### Territory scoring & ownership

- Score each zone from `zone_contributions.aggregated_score` weighted by the
  zone's `topic_affinity` (already seeded, weights sum to 1.0).
- Resolve ownership with **hysteresis** — `territory.hysteresis_margin` (seeded
  `0.05`) means a zone only flips on a real lead, not on noise. Apply the activity
  decay too (`territory.decay_per_day` `0.02`, floor `0.50`).
- Publish `TERRITORY_ZONE_CHANGED` **only on an actual flip**, never on every
  recalculation. Payload shape is already defined as `TerritoryZoneChangedPayload`.
- Expose per-guild scores in the zone response so the map can tint and the sidebar
  can show Influence.

All config values through Ashar's `GameBalanceConfig` — don't hard-code them.

---

## 3. Frontend — `game/WarMapScene.js`, Fig 3.1

Your primary reference: **SRS Figure 3.1**, page 8 of
`plan/Group7_CodeForge_SRS (1)-1.pdf`. Currently a two-line comment.

- Draw each zone's `map_polygon`, tinted by the owning guild's colour.
- Hover → tooltip with the zone name and owning guild.
- Click → zone detail panel (contributions per guild, topic affinity, current lead).
- Live re-tint on `TERRITORY_ZONE_CHANGED`.

**Accessibility — SADD §8.1, and this is a real requirement, not a nicety:**
**never colour alone.** Three guild colours on a dark map is exactly the case that
fails for colour-blind users. Keep the legend (bottom-left in the mockup) and the
hover label as the actual carriers of meaning.

`game/config.js` ships in the seed commit with both scenes registered —
**don't edit it**, Niranjan's VillageScene shares it. Put placeholder art in
`src/game/assets/warmap/`.

The mockup's **"SUPPLY LINES"** panel has no backing concept anywhere in the SRS,
the SADD, or the schema. It's decorative — cut it, or render it as static copy.
Don't build a supply-line model.

---

## 4. Frontend — `features/guild-territory/`, Fig 3.2

- **`/guild`** — the roster table per **SRS Figure 3.2**: `#`, MEMBER, LVL,
  SOLVED, ATTACKS, ROLE, STATUS, with own row highlighted gold and role badges
  colour-coded (Leader gold, Elite/Officer blue, Member muted). Tabs: ROSTER /
  TECH / DIPLOMACY — build ROSTER, stub the other two as empty states.
- **`/guild/browse`** — guild list with create and request-to-join.
- **Join-request inbox** — Leader/Officer only; approve/reject. The whole
  workflow already exists server-side (`POST /guilds/{id}/join-requests`,
  `/approve`, `/reject`) — this is UI over finished endpoints.
- **Guild header** — name, `Founded Season I · 24 Members · Rank #3`, and the
  `7,380 TOTAL INFLUENCE` chip from your aggregated zone scores.

---

## 5. Tests

- `test_territory_scoring.py` — affinity weighting, and **the hysteresis case**:
  a challenger leading by less than the margin must *not* flip the zone
  (TC-GLD-03, TC-GLD-04).
- `test_guild_flow.py` — create → request → approve → roster reflects it; kick and
  leave; non-officer approving gets 403 (TC-GLD-01..05).

---

## 6. Your files & your migration

**Edit freely:**

```
backend/app/modules/m5_guild_territory/**
backend/app/modules/m8_notifications/**
backend/alembic/versions/003_zone_polygons.py
backend/tests/test_territory_scoring.py
backend/tests/test_guild_flow.py
frontend/src/features/guild-territory/**
frontend/src/game/WarMapScene.js
frontend/src/game/assets/warmap/**
frontend/src/shared/websocket/**
```

**Do not touch:** `frontend/src/game/config.js` (shared with Niranjan),
`frontend/src/routes/index.jsx`, `frontend/src/App.jsx`,
`frontend/src/shared/ui/**`, `frontend/tailwind.config.js`,
`frontend/package.json`, `backend/app/main.py`, `backend/app/db/base.py`,
any other lane's `m*/` folder.

**Migration — exact, non-negotiable:**

```python
# backend/alembic/versions/003_zone_polygons.py
revision = "003_zone_polygons"
down_revision = "002_seed"    # you are FIRST in the chain
```

You're the head of the chain: `003` (you) → `004` (Niranjan) → `005` (Hari). Two people
both writing `down_revision = "002_seed"` creates two alembic heads, which git
merges silently and `alembic upgrade head` then fails at runtime for everyone.
Yours is the one legitimately pointing at `002_seed` — **Niranjan and Hari chain onto
you**, so your PR merges second overall (after Ashar) and they wait on it.

**New npm dependencies:** Phaser is already in `package.json`. Nothing else
without asking.

---

## 7. Dependencies

**You need:**
- Ashar's `GameBalanceConfig` (Wave 1) for the three `territory.*` keys.
- Niranjan's `m3_village` service for roster `level` / `solved_count`.
- Hari's `m4_attacks` service for roster `attack_count`.
  → For both: render `—` in those columns until their PRs land. Don't reach into
  their repositories to get the data sooner.

**Blocked on you — three people, so move fast on both:**
- **Niranjan and Hari** need your `useRealtimeEvent` hook (Wave 1).
- **Niranjan and Hari** both chain their migrations onto your `003`.
- **Hari's Standings** needs your INFLUENCE and TERRITORIES aggregates.

---

## 8. Workflow & done

Weekly: `git fetch origin && git merge origin/ashar` (merge, don't rebase).

**You merge second**, right after Ashar — Niranjan and Hari are waiting on your migration.

**PR checklist:**

- [ ] `npm run build` exits 0
- [ ] `alembic upgrade head` then `alembic downgrade -1` both clean
- [ ] `pytest backend/tests/test_territory_scoring.py backend/tests/test_guild_flow.py` green
- [ ] Map is legible with colour removed (legend + hover labels carry the meaning)
- [ ] I edited no file outside §6
- [ ] I added no npm dependency
- [ ] Screenshots of the War Map and roster next to SRS Figs 3.1 and 3.2

**Lane is done when:** the War Map renders all eight zones as tinted polygons with
a working legend, clicking one opens its detail, a guild's membership change
recalculates zone scores and re-tints **every connected browser** without a
reload, and `/guild` shows a real roster with real levels and solve counts.
