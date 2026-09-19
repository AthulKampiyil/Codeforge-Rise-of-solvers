# CodeForge — Next Steps (frontend / UI)

**Written 2026-09-14** against commit `17416f7` on branch `ashar`. Working tree clean.
Companion to `plan.md` (the full Sprint 2 plan) and `PROJECT_STATUS.md` (the
instructor-facing status). This file is the short version: what is actually true
today, what the wireframe needs that the backend cannot yet give it, and the
order to pick the work back up in.

---

## 1. Where the project actually stands

### Backend — real, with three modules marked ✅ that are thinner than they look

Nine routers are mounted in `app/main.py` and the app has genuine infrastructure
(Redis pub/sub realtime, Redlock, circuit-breaker config, structured logging,
one clean `001_baseline` migration + `002_seed` data migration). That part of
`PROJECT_STATUS.md` holds up.

These do **not** hold up, and they matter for UI work because they decide which
screens can show real data:

| Claim in `PROJECT_STATUS.md` | Reality in the code |
|---|---|
| M4 Attacks "✅ Implemented" | `find_attack_targets()` returns `[]` (`m4_attacks/service.py:34`). No curated problem set. `resolve_attack()` flips a status and moves no trophies (`:72`). **An attack can be launched and can never be played or resolved.** Only the cooldown is real. |
| M3 Village "✅ Implemented" | `defense_rating` is hard-coded `0.0` (`m3_village/service.py:69`). Since matchmaking bands off defense rating, this is also why M4 targeting is empty. |
| M2 Sync "✅ Implemented" | Levelling is still the `floor(sqrt(solved))` placeholder (`m2_platform_sync/sync_scheduler.py:119`), not the Phase 5 progress-point formula. |
| M7 League "✅ Implemented" | `LeaderboardEntryOut` exists in `schemas.py` but **no leaderboard route exists**. Only `GET /league/me`. |
| §2.6 "Uncommitted work in progress" | Stale — that work is committed in `17416f7`; the tree is clean. |

M6 war room and M9 admin are honest one-line stubs. `worker/main.py` is a
docstring with no code, so nothing runs on a schedule.

### Frontend — zero, and currently breaking CI

`frontend/src/` is six files, every one of them a one-line comment, plus 21
`.gitkeep` directories. There is **no `index.html`, no `App.jsx`, no CSS entry**,
and `node_modules` is not installed.

Consequence worth knowing: Vite cannot build without `index.html`, so the
`frontend` job in `.github/workflows/ci.yml` fails on every pull request today.
(The `backend` job cannot fail — it runs `pytest || true`.)

### Environment notes for this machine

- **Docker is installed but your user cannot reach the daemon** (`permission denied
  on /var/run/docker.sock`). Either add yourself to the `docker` group or prefix
  with `sudo`, otherwise `docker compose up` won't start the stack.
- Local Python is **3.14**; the backend targets **3.12**. Run the backend in
  Docker, or make a 3.12 venv — don't use the system interpreter.
- Local Node is **26**; `package.json` pins Vite 5, which officially supports
  Node 18/20/22. It will probably work but may warn; if it misbehaves, that's why.

---

## 2. The wireframe vs. the backend

Taking the wireframe to be **SRS Figures 3.1–3.4** — the "CODEVILLE / TERRITORY
WARS" mockups on pages 8–9 of `plan/Group7_CodeForge_SRS (1)-1.pdf`. The palette
in `frontend/tailwind.config.js` and the zone/topic names in `002_seed.py` were
already lifted from them, so the seed data and the art agree. Good starting point.

**Already aligned:** zone names (`Northmere Capital`, `Frozen Archives`,
`Iron Peaks`, `Thornvale`, `The Nexus`, `Rivergate`, `Sunken Library`, `Codewall`)
are seeded verbatim from Fig 3.1. Topics (`Graph`, `DP`, `Trees`, `Greedy`,
`Math`, `Strings`) match the sidebar. The Tailwind theme already carries the
palette (`bg #0d1117`, `panel #141a22`, `border #2a323d`, `gold #c9a227`).

**Where the wireframe is ahead of the backend:**

| Mockup element | Backing today | Gap |
|---|---|---|
| Fig 3.1 zone polygons | `territory_zones.map_polygon` column **exists** | Not seeded (all `NULL`), and **not exposed** — `TerritoryZoneOut` omits the field |
| Fig 3.1 "74K INFLUENCE", per-zone tint | `zone_contributions.aggregated_score` exists | No endpoint returns per-guild scores; ownership resolution (hysteresis) is unwritten |
| Fig 3.1 "SUPPLY LINES" panel | nothing | No such concept anywhere in SRS/SADD/schema. Decorative — cut it or fake it |
| Fig 3.1/3.2 "BATTLE LOG" | `attacks` table | No "recent attacks" endpoint |
| Fig 3.2 roster columns LVL / SOLVED / ATTACKS / STATUS | `GuildMembershipOut` has only `guild_id`, `user_id`, `role`, `joined_at` | No username, no village level, no solve count, no attack count, no online presence |
| Fig 3.3 "Season III · Week 7", Hall of Fame | nothing | **No season entity in the schema at all.** grep for "season" returns zero hits in `app/` and `alembic/` |
| Fig 3.3 guild standings (influence / territories / stars / W-L / streak) | per-**user** trophies only | League is per solver; guild-level standings don't exist |
| Fig 3.4 World Events | nothing | No module, no requirement ID, no table. This screen is invented by the mockup |
| Sidebar "XP TO LVL 35 · 7,240/10k", "STARS" | per-topic `level` + `progress_points`; trophies via `/league/me` | No account-wide XP or level. "Stars" ≈ trophies if you relabel |

**Decision you need to make before Step 4 below:** Season, guild standings and
World Events are three screens' worth of backend that no SRS requirement asks
for. Either scope them down (a static/seeded season, standings computed from
existing trophy + zone data, World Events cut) or accept they are new modules.
Recommendation: **relabel and reuse** — "Season" becomes a fixed window in
`game_balance_config`, standings aggregate `league_profiles` + `zone_contributions`
per guild, and World Events is dropped from v1. That keeps all four nav items
present without inventing two new modules.

---

## 3. Next steps, in order

### Step 0 — Make the frontend boot (half a day, zero backend work)

Nothing else can start until Vite runs. Create:

```
frontend/index.html                  # the missing Vite entry; #root + <script src="/src/main.jsx">
frontend/src/main.jsx                # replace the comment: createRoot + QueryClientProvider + RouterProvider
frontend/src/App.jsx                 # app shell
frontend/src/index.css               # @tailwind base/components/utilities + CSS custom properties
frontend/src/routes/index.jsx        # createBrowserRouter
```

Then `cd frontend && npm install && npm run dev`.

**Done when:** `npm run build` exits 0 — which also turns the CI frontend job
green for the first time.

### Step 1 — Build the shell from Fig 3.1, with mock data (1 day)

This is the highest-morale step: it makes the wireframe real on screen before any
API exists. Top bar (`CODEVILLE · TERRITORY WARS` + `WAR MAP / GUILD / SEASON /
EVENTS` + season chip + clock + user chip), the three-column layout, and the
shared primitives in `src/shared/ui/` (`Panel`, `StatTile`, `ProgressBar`,
`DataTable`, `Badge`, `Tabs`, `EmptyState`, `Skeleton`).

Hard-code the data. The mockups are dark-only — don't build a light theme.
Serif for headings, mono for every numeral and log line, as in the figures.

### Step 2 — Wire auth for real (1 day) — fully backed today

`POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh`,
`POST /auth/logout` are all implemented and tested. Build `shared/api/client.js`
(base URL, Bearer header, 401 → refresh → retry once) and
`shared/auth/AuthContext.jsx` with route guards. This is the only feature where
the backend will not fight you.

### Step 3 — Guild Roster, Fig 3.2 (1–2 days) — needs one small backend change

Frontend: `/guild` with the ROSTER / TECH / DIPLOMACY tabs, the `#`, MEMBER, LVL,
SOLVED, ATTACKS, ROLE, STATUS table, own row highlighted gold.

Backend change needed first, in `m5_guild_territory`: widen `GuildMembershipOut`
to include `username`, `level`, `solved_count`, `attack_count`. Per the SADD §4.1
coupling rule this must come from `m3_village`'s and `m4_attacks`' **`service.py`**,
not by importing their repositories or models. Drop the STATUS/online column or
stub it — there is no presence tracking and adding it is not worth it now.

### Step 4 — War Map, Fig 3.1 (2–3 days) — the big one

Backend first, all small:
1. Add `map_polygon` to `TerritoryZoneOut` (the column already exists).
2. Seed the eight polygons — a new `003_seed_polygons.py` data migration with
   normalised `[[x,y], …]` coordinates traced off Fig 3.1.
3. Add per-guild `aggregated_score` to the zone response so the map can tint and
   the sidebar can show Influence.

Then `src/game/config.js` + `WarMapScene.js`: draw each polygon, tint by owning
guild, hover tooltip with the guild name, click → zone detail panel. Per SADD §8.1
accessibility, **never colour alone** — keep the legend and the hover label.

Re-tint on the `TERRITORY_ZONE_CHANGED` event; the envelope is already defined in
`m8_notifications/schemas.py` and the gateway already publishes. Build
`shared/websocket/client.js` (one socket, backoff reconnect, subscribe by event
type, handlers invalidate the matching TanStack Query keys).

### Step 5 — Season / Standings / Events (scope call first)

Don't start until §2's decision is made. With the "relabel and reuse"
recommendation this is a `GET /league/leaderboard` route (the schema is already
written) plus a guild-aggregate query — roughly a day — instead of two new modules.

### Parallel track — unblock the Village dashboard

The Village screen is the heart of the product and it can only show zeros until
`defense_rating` and the progress-point levelling land (`plan.md` Phase 5). If
someone else on the team is free, that's the highest-value backend task to run
alongside Steps 0–4.

---

## 4. Things to fix while you're in there

- `.github/workflows/ci.yml`: drop `|| true` from the backend `pytest` once the
  first tests are green, and add `postgres:16` + `redis:7` service containers —
  the existing tests need real Postgres and Redis, so they cannot be passing in CI.
- `PROJECT_STATUS.md` §2.2 and §2.6: correct the four overstated ✅ rows and
  delete the stale "uncommitted work" section before this is shown to the instructor.
