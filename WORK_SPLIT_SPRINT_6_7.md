# CodeForge — Sprint 6/7 Closeout Work Split

**Group 7, IIIT Kottayam · Written 2026-09-26 · Niranjan**

Supersedes the Sprint 5–7 rows of `CodeForge_Work_Split_and_Schedule.md` (Aug 13). The original plan's module split and dependency chain stand; this doc covers what's left.

---

## 1. Where we actually are (verified on `integration/all-lanes`, 2026-09-26)

| Check | Result |
|---|---|
| Backend modules real | **8/9** — only M6 War Room is missing; it's greenfield (its `models.py`, `repository.py`, `schemas.py` are all empty), not a stub |
| Backend tests | 62 across M1/M3/M4/M5/M7/M8/M9 — **M2 has zero, M6 has zero** |
| Frontend | 11 routes, `npm run build` exits 0, 1 screen hardcoded (WarRoom), 11 frontend tests — **zero** |
| Worker | `backend/worker/main.py` is a 10-line docstring — no scheduled jobs |
| CI | `.github/workflows/ci.yml` now has real Postgres/Redis services and no `|| true` — but it has **never run**, because `main` has never received a PR |
| `main` vs `integration/all-lanes` | **35 commits behind**, 2 stale PRs (both merged Sep 1) |
| Docs | `PROJECT_STATUS.md` / `NEXT_STEPS.md` dated Sep 8/14 and claim M4/M6/M9 are stubs and the frontend doesn't exist — false |
| Sync points (§2 of Aug plan) | All four passed (Aug 20 / 27, Sep 3, Sep 10) |

**Four `NEXT_STEPS.md` blockers are all closed:** defense_rating (M3), progress-point formula (M2), `npm run build`, `|| true` removed from CI.

---

## 2. What changed since the Aug 13 plan

1. M2 levels with the progress-point formula now (`m2_platform_sync/sync_scheduler.py:159`), not `floor(sqrt(solved_count))`.
2. `defense_rating` implemented (`m3_village/formulas.py:35`), `village_profiles` materialized (`004_village_profile`), `003_zone_polygons` seeds polygons with `map_polygon`.
3. M4 matchmaking bands work; M7 has `/leaderboard` + `/ledger`; M9 is real (users/config/audit-log).
4. Frontend is fully scaffolded: auth, village dashboard + Phaser scene, league, attacks, admin, sync-status — all wired to real API except WarRoom.
5. **Codeforces-only** — recorded as deliberate in `plan.md:37-38`; LeetCode/CodeChef adapters dropped and documented in the SADD.
6. The four `NEXT_STEPS.md` blockers closed.

### The merge order disappeared

The old `EXECUTION_ORDER.md` had a forced serial merge chain (`003`→`004`→`005`) purely because of Alembic `down_revision`. **No remaining task needs a migration** — M6 is read-only over M3+M5, the worker adds no tables, tests add none, deploy adds none, docs add none. All four branches merge in parallel, in any order. This is the one structural improvement over the Aug plan and it's worth calling out explicitly, because the old merge order existed only to dodge that constraint.

---

## 3. Serial spine

| Day | Gate | Owner |
|---|---|---|
| Day 1 (first 3h) | PR `integration/all-lanes`→`main`; CI green; fix red tests | **Ashar** |
| Day 4 | Real host up; all four confirm the user story on the public URL (register→link CF→sync→village→attack→429→WS) | **Ashar + all four** |

Day 1 blocks deploys but not lane work — Athul, Hari, Niranjan start immediately on their lanes.

---

## 4. The split

### Day-by-day

| | **Ashar** — Infra & Delivery | **Athul** — War Room | **Hari** — Attacks & League | **Niranjan** — Sync & Village |
|---|---|---|---|---|
| Day 1 | Open PR, get CI green | M6 backend | M4/M7 test depth | **M2 tests (zero exist)** |
| Day 2 | Worker loop + `npm test` in CI | M6 tests | M4/M7 "due" worker queries | Frontend vitest suite (zero exist) |
| Day 3 | Provision Oracle, `infra/` | Wire `WarRoom.jsx` to API | Attacks/League mock→real | Wire `VillageSidebar` + sync-status |
| Day 4 | Deploy + secrets + TLS | Verify WS over real net | Verify cooldown 429 on real host | Verify CF sync populates village |
| Day 5–6 | Compile Test Report, README, SRS/SADD | User Manual §Guild & Realtime | User Manual §Attacks & League | User Manual §Sync & Village |

### Per person

**Ashar — Infra & Delivery** *(critical path; everything gates on him)*

- PR to `main`; fix whatever red CI finds; add `npm test` to CI
- `backend/worker/main.py` — orchestration loop on `WORKER_TICK_SECONDS`. Every target function already exists: M2 `SyncScheduler.sync_all_accounts()`, M4 `resolve_attack()`, M5 `recalculate_guild_zone_scores()` + `resolve_zone_ownership()`. Ashar owns the loop; each module owner contributes one small "what's due" query behind their own `service.py` — do not rewrite those. M7 trophy recalc is event-driven via `record_trophy_event()`; make it a thin reconciliation pass, not a reimplementation.
- `infra/` — Oracle Cloud Always Free ARM A1 (4 OCPU / 24 GB, 200 GB disk, 10 TB egress, never expires). Provision VM, open 80/443 in **both** the VCN security list and `ufw` (the single most common reason a fresh Oracle instance serves nothing). Prod compose override, Caddy (auto-TLS), real secrets.
- Compiles the Test Report (others send him their TC list). Owns `PROJECT_STATUS.md` — it currently lies about M4/M6/M9/frontend.
- **Files:** `.github/`, `docker-compose*.yml`, `backend/worker/`, `infra/`, `docs/TEST_REPORT.md`, `README.md`, `PROJECT_STATUS.md`
- **Done when:** `curl https://<host>/health` returns, register→link→sync→village→attack→429→WS all green, and `pytest` + `npm run build` + `npm test` green on CI.

**Athul — M6 War Room** *(the last unimplemented module)*

- Backend: `schemas.py` / `service.py` / `router.py` / `test_m6_war_room.py`. `GET /war_room/{guild_id}`, role-gated Leader/Officer. Reads M3 + M5 **through their `service.py`** (SADD §4.1). No model, no migration.
- Frontend: keep `WarRoom.jsx`'s layout, replace its 191 hardcoded lines with props; new `warRoomApi.js` + `useWarRoom.js`; `useRealtimeEvent("TERRITORY_ZONE_CHANGED")`.
- M5 "due zones" query for the worker; owns WS verification on the real host.
- Deletes his own 3 dead files (`RosterTable.jsx`, `JoinRequests.jsx`, `GuildBrowse.jsx` — all 0 bytes).
- **Files:** `m6_war_room/`, `m5_guild_territory/`, `m8_notifications/`, `features/war-room/`, `shared/websocket/`
- **Done when:** `GET /war_room/<guild_id>` returns contested zones with real scores over the public URL, WS re-tints on `TERRITORY_ZONE_CHANGED`.

**Hari — Attacks & League**

- Deepen M4/M7 tests (11 + 6 today); add M4/M7 "what's due" worker queries.
- M4/M7 frontend: 8 components still hardcoded literals (`TargetCard`, `ProblemCard`, `OutcomePreview`, `CooldownBanner`, `HallOfFame`, `PodiumCard`, `SeasonHeader`, `Standings`, `TierProgressCard`) — bind to real data.
- Deletes `Standings.jsx` (145-line orphan, superseded by `StandingsTable.jsx`).
- **Files:** `m4_attacks/`, `m7_league_trophy/`, `features/attacks/`, `features/league/`
- **Done when:** attack resolves with trophy movement visible over the public URL; leaderboard returns real data.

**Niranjan — Sync & Village**

- **M2 tests — the single biggest test gap in the repo.** Adapter with `respx`, topic tagger, sync scheduler, DLQ path.
- **Frontend vitest — also zero.** Harness the 401→refresh→retry path in `shared/api/client.js`, `AuthContext`, one hook. One harness, four lanes' components get tested consistently — don't let each lane ship its own half-configured setup.
- Bind `VillageSidebar` + `sync-status` remaining literals; M2/M3 "due syncs" query.
- **Files:** `m2_platform_sync/`, `m3_village/`, `features/village/`, `features/sync-status/`, `shared/api/`, `shared/auth/`
- **Done when:** `pytest tests/test_m2_*.py` green, vitest green, `GET /village/me` returns non-zero defense rating over the public URL.

---

## 5. File ownership map (collision-free)

```
Ashar    → .github/ · docker-compose*.yml · backend/worker/ · infra/ · docs/ · *.md
Athul    → m5_* · m6_* · m8_* · features/war-room/ · shared/websocket/
Hari     → m4_* · m7_* · features/attacks/ · features/league/
Niranjan → m2_* · m3_* · features/village/ · features/sync-status/ · shared/api/ · shared/auth/
```

Two carve-outs:
- **`PROJECT_STATUS.md` / `Test Report`** — Ashar writes both; everyone sends him 3 lines for their lane.
- **`shared/ui/`** — frozen, nobody touches it.

---

## 6. Calendar vs the Aug plan

| | Our dates | Official deadline |
|---|---|---|
| Sprint 5 (testing) | Sep 15–21 — **partially done** (62 BE tests; FE + M2 + M6 missing) | Sep 29 |
| Sprint 6 (deploy) | Sep 22–28 — **0% started** | Oct 6 |
| Sprint 7 (docs) | Sep 29–Oct 5 — **not started** | Oct 13 |
| Buffer | Oct 6–20 | Oct 13–20 |

Deploy slips ~2 days past our own Sprint 6 into Sprint 7; docs get compressed. Oct 13–20 buffer absorbs it. Flag if Day 3 deploy fails — don't pretend it's on track.

---

## 7. Drop order if we run late

Explicit kill-list, no meetings needed:

1. Frontend mock→real bindings — keep the shared layer (`api/client.js`, `auth/AuthContext.jsx`, `websocket/client.js`)
2. M2 adapter depth tests — keep the tagger/scheduler tests
3. SRS/SADD finalisation — keep the User Manual and Test Report
4. Deck polish — keep the talk track

Never cut: CI green, M6, deploy, Test Report, User Manual.

---

## 8. Dead code inventory

| File | State | Owner |
|---|---|---|
| `frontend/src/features/guild-territory/components/RosterTable.jsx` | 0 bytes | Athul |
| `frontend/src/features/guild-territory/components/JoinRequests.jsx` | 0 bytes | Athul |
| `frontend/src/features/guild-territory/components/GuildBrowse.jsx` | 0 bytes | Athul |
| `frontend/src/features/league/components/Standings.jsx` | 145 lines, superseded by `StandingsTable.jsx` | Hari |
| `PROJECT_STATUS.md §2.2/§2.6` | claims M4/M6/M9 stubs, frontend nonexistent — all false | Ashar |
| `NEXT_STEPS.md §2` | stale gap table (4 blockers closed) | Ashar |