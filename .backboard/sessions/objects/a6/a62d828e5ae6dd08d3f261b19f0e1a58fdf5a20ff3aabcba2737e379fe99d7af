# CodeForge — Work Split to 50% Completion

**Written 2026-09-14** · base branch `ashar` @ `17416f7` · supersedes the Sprint 1–7
schedule in `CodeForge_Work_Split_and_Schedule.docx` for the next ~2.5 weeks only.

Four people, four forks off `ashar`, four PRs merged back. The lanes below are
designed so that **no two people ever edit the same file**. Read §3 (the seed
commit) and §6 (the conflict matrix) before anyone branches — those two sections
are what make the parallel work merge cleanly instead of becoming a four-way
conflict on `App.jsx`.

Lane identity is carried over from the old split — Ashar still owns Auth/Admin, Niranjan
Sync/Village, Hari Attacks/League, Athul Guild/Realtime. Same people, same modules,
retargeted at the UI.

---

## 1. What "50%" means, and where we are

Percentages are only useful if they're auditable, so here is the rubric. Weights
reflect what the course actually grades, not lines of code.

| Area | Weight | Today | At 50% | What changes |
|---|---:|---:|---:|---|
| Backend modules M1–M9 | 35 | 19.0 | 26.0 | M3/M4/M5/M7/M9 finished; M6 deferred |
| Frontend foundation + screens | 30 | 0.0 | 12.0 | 4 of 9 screens real, on real data |
| Realtime consumption + worker | 8 | 2.0 | 3.5 | UI consumes events; worker still deferred |
| Tests + CI | 12 | 1.4 | 5.0 | CI green; 6 more test files |
| Deployment | 8 | 0.0 | 0.0 | **Deliberately deferred past 50%** |
| Docs + traceability | 7 | 3.5 | 4.0 | Contracts refreshed to shipped API |
| **Total** | **100** | **~26** | **~50.5** | |

Today's backend figure is per-module: M1 100%, M2 70%, M3 50%, M4 35%, M5 75%,
M6 5%, M7 55%, M8 95%, M9 5%. The M3/M4 numbers are lower than
`PROJECT_STATUS.md` claims them to be — see `NEXT_STEPS.md` §1 for why
(`defense_rating` is hard-coded `0.0`, `find_attack_targets()` returns `[]`).

### Explicitly cut from the 50% target

Saying what we are *not* building is what keeps this achievable:

- **M6 War Room** — it's a read view over M5's data; it costs little once M5 is
  done, so it's cheap to add later and expensive to add now.
- **Fig 3.4 World Events** — no requirement ID, no module, no table. Invented by
  the mockup. Drop from v1.
- **Deployment** — worth 8 points but it's a Sprint-6 concern and it blocks nobody.
- **LeetCode / CodeChef adapters** — the Codeforces-only decision in `plan.md`
  stands.
- **Background worker** — attack resolution runs on-demand for now, not scheduled.

---

## 2. The lanes at a glance

| | Ashar — Auth & Platform | Niranjan — Sync & Village | Hari — Attacks & League | Athul — Guild & Realtime |
|---|---|---|---|---|
| **Branch** | `feat/ashar-auth-admin` | `feat/niranjan-sync-village` | `feat/hari-attacks-league` | `feat/athul-guild-realtime` |
| **Backend** | M1 hardening, M9 config service | M2 levelling, M3 village | M4 attacks, M7 league | M5 guild + territory, M8 wiring |
| **Frontend** | Login, Register, auth guards | Village dashboard + `VillageScene` | Attack screens, Standings | Guild roster, War Map + `WarMapScene` |
| **Wireframe** | (new screens) | Fig 3.1 left sidebar | Fig 3.3 | Fig 3.1 map, Fig 3.2 |
| **Migration** | none | `004_village_profile` | `005_trophy_ledger` | `003_zone_polygons` |
| **Merges** | 1st | 3rd | 4th | 2nd |

---

## 3. Wave 0 — the seed commit (blocking; nobody forks before this lands)

**Owner: Ashar, committed straight onto the `ashar` branch. Target: 1 day.**

This is the single most important decision in this document. `frontend/src/` is
six one-line comment files today — there is no `index.html`, no `App.jsx`, no
`shared/ui/`. If four people fork now, **all four will create those same files**
and every one of them becomes a four-way conflict. So they get created exactly
once, by one person, before anyone branches.

The seed commit ships a complete, running, *empty* app:

```
frontend/index.html                    # the missing Vite entry
frontend/package-lock.json             # COMMIT THIS — see §6
frontend/src/main.jsx                  # createRoot + QueryClientProvider + RouterProvider
frontend/src/App.jsx                   # full top nav: WAR MAP / GUILD / SEASON / EVENTS
frontend/src/index.css                 # tailwind directives + CODEVILLE tokens
frontend/src/routes/index.jsx          # ALL routes declared, pointing at placeholders
frontend/src/pages/_Placeholder.jsx    # "coming soon" panel, one per unbuilt route
frontend/src/shared/ui/                # Panel StatTile ProgressBar DataTable Badge
                                       # Tabs Modal Toast EmptyState Skeleton
frontend/src/shared/api/client.js      # working fetch wrapper (Ashar hardens later)
frontend/src/shared/api/queryClient.js # TanStack Query defaults
frontend/src/game/config.js            # Phaser config, both scenes registered
```

Two details that do the real conflict-prevention work:

1. **`routes/index.jsx` declares every route up front**, including ones nobody
   has built, each pointing at a placeholder component. A lane then *replaces its
   own placeholder file* and never touches the router. Four lanes, zero router
   conflicts.
2. **`shared/ui/` is complete on day 0 and frozen.** Nobody adds to it in a lane
   branch. If you need a primitive that isn't there, build it inside your own
   `features/<lane>/components/` and we promote it to `shared/ui/` after the merge.

Also in the seed commit: `npm install` once and **commit `package-lock.json`**.
It doesn't exist yet, and four lanes each generating their own lockfile is a
guaranteed unmergeable conflict.

**Done when:** `npm run build` exits 0. That also turns the CI `frontend` job
green for the first time — it has been failing on every PR, because Vite can't
resolve an entry without `index.html`.

---

## 4. Wave 1 — three contract PRs (48 hours, merged immediately)

Three pieces of code get used by every other lane. If each lane stubs its own
version, we get four incompatible copies. So they land first as tiny PRs,
reviewed same-day, and everyone rebases onto them before real lane work starts.

| # | PR | Owner | Why it's first |
|---|---|---|---|
| 1 | `GameBalanceConfig` service — `get(key)` reading `game_balance_config`, cached | Ashar | Niranjan needs `village.defense_*`, Hari needs `attack.cooldown_minutes` + `trophy.k_factor` + `league.thresholds`, Athul needs `territory.hysteresis_margin`. All 28 keys are already seeded in `002_seed.py` — this is just the read path. |
| 2 | `shared/websocket/client.js` + `useRealtimeEvent(type, handler)` hook | Athul | Niranjan and Hari both need live updates. One socket for the app; handlers invalidate TanStack Query keys. The envelope is already defined in `m8_notifications/schemas.py`. |
| 3 | `shared/api/client.js` hardening — 401 → refresh → retry once | Ashar | Every authenticated fetch in every lane goes through it. |

After these three merge: **everyone runs `git merge origin/ashar` into their lane
branch**, then diverges for real.

---

## 5. Wave 2 — the four lanes (~2 weeks, fully parallel)

### Ashar — Auth & Platform

*Backend*
- **M9 Admin/Config (5% → 60%).** The config service from Wave 1, plus
  `GET /admin/config` and `PUT /admin/config/{key}` with an `admin_audit_log` row
  per change, role-gated to admin. This is UC-12 and it's the module that makes
  every other lane's tunables live.
- **M1 (100% → hardened).** Verify the logout denylist actually invalidates,
  fix any `datetime.utcnow()` left, RBAC dependency for the admin routes above.

*Frontend*
- `features/auth/` — Login and Register on the dark CODEVILLE theme. Non-revealing
  error copy ("invalid credentials", never "no such user").
- `shared/auth/AuthContext.jsx` — token storage, current user, `<RequireAuth>`
  route guard wired into the placeholders the seed commit declared.
- `/onboarding` — the Codeforces link → copy token → verify → first sync flow.
  SRS 5.4 wants ≤5 steps under 5 minutes.

*Infra*
- `.github/workflows/ci.yml`: add `postgres:16` + `redis:7` service containers,
  run `alembic upgrade head`, **drop `|| true`** from `pytest`. The backend job
  currently cannot fail, and the existing tests need real Postgres and Redis, so
  they are not actually passing anywhere right now.
- Document the Docker daemon permission fix in the README (`usermod -aG docker`) —
  it currently blocks `docker compose up` on at least one machine.

*Tests:* `test_m1_auth.py` (extend), `test_m9_admin.py` (new).

---

### Niranjan — Sync & Village

*Backend*
- **M3 (50% → 90%).** Replace the hard-coded `defense_rating = 0.0` at
  `m3_village/service.py:69` with the SADD §7.3.1 formula, reading
  `village.defense_base` / `defense_level_weight` / `defense_solved_weight` from
  Ashar's config service. **This one line unblocks Hari's entire matchmaking lane.**
- **M3.** Materialize `village_profiles` so matchmaking can index on defense
  rating instead of recomputing per request. Migration `004_village_profile`.
- **M2 (70% → 80%).** Replace the `floor(sqrt(solved))` placeholder at
  `sync_scheduler.py:119` with the progress-point formula from `plan.md` Phase 5.

*Frontend*
- `features/village/` — the Fig 3.1 left sidebar: player card (`AXIOM_DEV · Level 34`),
  the SOLVED / ATTACKS / STARS stat row, and the **Topic Influence** bars. The
  topic names in the mockup (Graph, DP, Trees, Greedy, Math, Strings) are already
  seeded verbatim in `002_seed.py`, so these bind straight to `GET /village/me`.
- `game/VillageScene.js` — Phaser, one structure sprite per topic on an isometric
  grid, variant chosen from `structure_key` + level band (0, 1–2, 3–5, 6–9, 10+).
  Use generated coloured-geometry placeholder sprites in `src/game/assets/` so
  nothing waits on artwork.
- `features/sync-status/` — status pill in the banner; Refresh button disabled
  with a live countdown inside the 5-minute window (REQ-2.2); `degraded: codeforces`
  rendered distinctly from a per-account failure.
- Re-render in place on `VILLAGE_UPDATED` via Athul's hook — REQ-3.4 says no reload.

*Vocabulary note:* the mockup's "XP TO LVL 35 · 7,240/10k" has no backend concept.
Either render it from total progress points across topics, or drop the bar. Don't
invent an XP table.

*Tests:* `test_village_levelling.py`, `test_m3_village.py`.

---

### Hari — Attacks & League

*Backend*
- **M4 (35% → 75%).** `find_attack_targets()` returns `[]` today — implement the
  SADD §7.3.1.1 tolerance band over `defense_rating` (needs Niranjan's work, see §7),
  with the widening steps and `min_candidates` already seeded in config. Then the
  curated problem set from the target's weak topics (REQ-4.2), the attack window,
  and real resolution — `resolve_attack()` currently flips a status and moves no
  trophies.
- **M7 (55% → 85%).** `TrophyLedger` as the only write path into `league_profiles`,
  the Elo calculation from SADD §7.3.1.3 (`trophy.k_factor`, `trophy.elo_divisor`
  are seeded), tier promote/demote on every ledger write, and
  **`GET /league/leaderboard`** — `LeaderboardEntryOut` already exists in
  `m7_league_trophy/schemas.py` with no route behind it.
- Migration `005_trophy_ledger`.

*Frontend*
- `features/attacks/` — `/attack` candidate list with target strength, and
  `/attack/:id` with the curated set, **"Open on Codeforces"** links, live solved
  x/3, window countdown, and the cooldown timer.
- `features/league/` — Fig 3.3 Standings: the three-card podium, the ranked table
  (RNK / GUILD / INFLUENCE / TERRITORIES / STARS / WINS / LOSSES / STREAK), own row
  highlighted gold, global/guild toggle.

*Scope call on Fig 3.3 — read this before starting Standings.* The mockup shows
**guild-level, season-scoped** standings. There is no season entity anywhere in the
schema (grep for "season" in `app/` and `alembic/` returns nothing), and league is
per-solver. Do **not** build a Season module. Instead:
- "Season III · Week 7" → a fixed window stored as `season.start_date` /
  `season.length_weeks` in `game_balance_config` (Ashar's table), rendered as a chip.
- INFLUENCE → `SUM(zone_contributions.aggregated_score)` per guild (Athul's data).
- TERRITORIES → count of zones owned. STARS → sum of member trophies.
- WINS / LOSSES / STREAK → aggregate over `attacks` by guild membership.
- Hall of Fame → cut, or hard-code past seasons as static copy.

*Tests:* `test_trophy_calculator.py` (include the SADD worked example),
`test_matchmaking.py`, `test_attack_flow.py`.

---

### Athul — Guild, Territory & Realtime

*Backend*
- **M5 (75% → 90%).** Widen `GuildMembershipOut` — it currently carries only
  `guild_id`, `user_id`, `role`, `joined_at`, but Fig 3.2's roster needs
  `username`, `level`, `solved_count`, `attack_count`. Per the SADD §4.1 coupling
  rule these come from `m3_village`'s and `m4_attacks`' **`service.py`**, never by
  importing their repositories or models. Drop the online/STATUS column — there is
  no presence tracking and it isn't worth building now.
- **M5.** Expose `map_polygon` in `TerritoryZoneOut` (the column exists on the
  model, it's just absent from the schema), and seed the eight polygons in
  migration `003_zone_polygons` as normalised `[[x,y], …]` traced off Fig 3.1. The
  zone names are already seeded verbatim — `Northmere Capital`, `Frozen Archives`,
  `Iron Peaks`, `Thornvale`, `The Nexus`, `Rivergate`, `Sunken Library`, `Codewall`.
- **M5.** Zone scoring from `zone_contributions.aggregated_score` × `topic_affinity`,
  and ownership resolution with the seeded `territory.hysteresis_margin` so a zone
  only flips on a real lead. Publish `TERRITORY_ZONE_CHANGED` on an actual flip only.
- **M8 (95%).** Already done — the work here is the Wave 1 consumption hook.

*Frontend*
- `game/WarMapScene.js` — Fig 3.1. Draw each zone polygon, tint by owning guild,
  hover tooltip with the guild name, click → zone detail panel, live re-tint on
  `TERRITORY_ZONE_CHANGED`. **Accessibility (SADD §8.1): never colour alone** —
  keep the legend and the hover label, since three guild colours on a dark map is
  exactly the case that fails for colour-blind users.
- `features/guild-territory/` — `/guild` roster table per Fig 3.2 (`#`, MEMBER,
  LVL, SOLVED, ATTACKS, ROLE, STATUS) with the ROSTER / TECH / DIPLOMACY tabs,
  `/guild/browse`, and the join-request inbox for Leader/Officer.
- The Fig 3.1 "SUPPLY LINES" panel has no backing concept anywhere in the SRS,
  SADD, or schema. It's decorative — cut it or render it as static copy.

*Tests:* `test_territory_scoring.py` (include the hysteresis case),
`test_guild_flow.py`.

---

## 6. File ownership & the conflict matrix

**The rule: if a file isn't in your lane's list, you don't edit it.** If you think
you need to, post in the group chat first — that's a 2-minute conversation that
saves an hour of conflict resolution.

### Exclusively owned — edit freely, nobody else will touch these

| Lane | Paths |
|---|---|
| Ashar | `backend/app/modules/m1_auth/**`, `backend/app/modules/m9_admin_config/**`, `frontend/src/features/auth/**`, `frontend/src/shared/auth/**`, `frontend/src/shared/api/client.js`, `.github/workflows/ci.yml`, `docker-compose.yml` |
| Niranjan | `backend/app/modules/m2_platform_sync/**`, `backend/app/modules/m3_village/**`, `frontend/src/features/village/**`, `frontend/src/features/sync-status/**`, `frontend/src/game/VillageScene.js`, `frontend/src/game/assets/village/**` |
| Hari | `backend/app/modules/m4_attacks/**`, `backend/app/modules/m7_league_trophy/**`, `frontend/src/features/attacks/**`, `frontend/src/features/league/**` |
| Athul | `backend/app/modules/m5_guild_territory/**`, `backend/app/modules/m8_notifications/**`, `frontend/src/features/guild-territory/**`, `frontend/src/game/WarMapScene.js`, `frontend/src/shared/websocket/**` |

Each lane also owns its own test files under `backend/tests/`. Name them
`test_m<n>_*.py` so they can't collide.

### Shared files — the actual danger, and the mitigation for each

| File | Why it conflicts | Mitigation |
|---|---|---|
| `frontend/src/routes/index.jsx` | Every lane adds routes | Seed commit declares **all** routes → placeholders. Lanes replace their own placeholder file, never the router. |
| `frontend/src/App.jsx` | Every lane adds nav items | Seed commit ships the complete nav. **Frozen after Wave 0.** |
| `frontend/src/shared/ui/**` | Everyone wants `Panel`, `DataTable` | Seed commit ships all ten primitives. **Frozen.** Need something new? Build it in your own `features/*/components/` and we promote it post-merge. |
| `frontend/package.json` + lockfile | New deps → unmergeable lockfile conflicts | Seed commit installs everything all four lanes need and commits the lockfile. **No new deps without asking**; if genuinely needed it's a separate one-line PR merged immediately. |
| `backend/alembic/versions/` | **The worst one.** Two people both writing `down_revision = '002_seed'` creates two alembic heads — git merges it silently and `alembic upgrade head` then fails at runtime. | Revision IDs are **pre-assigned into a linear chain**: `003_zone_polygons` (Athul, `down_revision='002_seed'`) → `004_village_profile` (Niranjan, `down_revision='003_zone_polygons'`) → `005_trophy_ledger` (Hari, `down_revision='004_village_profile'`). Merge in that order. Ashar writes no migration. |
| `backend/app/db/base.py` | New models must be imported here for autogenerate | Seed commit pre-imports every model module, including ones not yet written, so no lane edits it. |
| `backend/app/main.py` | Router mounting | **No edits needed** — all nine routers are already mounted. Don't touch it. |
| `.env.example` | New config keys | Append-only, at the bottom, under a comment with your lane name. Conflicts here are trivial to resolve. |
| `frontend/tailwind.config.js` | Theme tokens | Finalized in the seed commit. Frozen. |

---

## 7. Cross-lane dependencies

Only two matter, and both are one-way:

1. **Niranjan's `defense_rating` → Hari's matchmaking.** Hari cannot band targets around a
   rating that is `0.0` for everyone. *Handling:* Niranjan lands the formula as an early
   standalone PR — it's one function — rather than holding it inside the lane
   branch for two weeks. Hari codes against `0.0` until then and picks it up on the
   next merge from `ashar`.
2. **Athul's zone data → Hari's Standings.** The INFLUENCE and TERRITORIES columns
   aggregate Athul's `zone_contributions`. *Handling:* Hari builds Standings against
   the leaderboard endpoint first (own lane, no dependency) and adds the two
   guild-aggregate columns after Athul's PR merges.

Everything else in §5 is independent. That's the point of the lane boundaries.

---

## 8. Git workflow

Branch off `ashar` **after the seed commit lands**, PR back into `ashar`, then one
final PR `ashar` → `main`. (Literal GitHub forks work identically — the file
ownership rules in §6 are what matter, not the branch topology.)

```bash
# once, after the seed commit is pushed
git fetch origin
git checkout ashar && git pull
git checkout -b feat/niranjan-sync-village        # your lane name from §2
git push -u origin feat/niranjan-sync-village
```

**Weekly, every lane, without exception:**

```bash
git fetch origin
git merge origin/ashar        # merge, don't rebase — your branch is already pushed
```

Rebasing a branch your teammates may have pulled causes more pain than the tidy
history is worth. Merge.

**Merge order at the end** — dictated by the migration chain in §6:

```
1. Ashar  feat/ashar-auth-admin        (no migration; unblocks nothing, safe to go first)
2. Athul  feat/athul-guild-realtime    (003_zone_polygons)
3. Niranjan  feat/niranjan-sync-village      (004_village_profile)
4. Hari  feat/hari-attacks-league    (005_trophy_ledger)
```

After each merge the next person runs `git merge origin/ashar` and confirms
`alembic upgrade head` still runs clean before opening theirs.

**PR checklist** (paste into the description):

- [ ] `npm run build` exits 0
- [ ] `alembic upgrade head` then `alembic downgrade -1` both clean
- [ ] `pytest` green for my lane's test files
- [ ] I edited no file outside my lane's list in §6
- [ ] I added no npm dependency
- [ ] Screenshot of my screen against the wireframe figure it implements

---

## 9. Timeline

| Days | What | Who |
|---|---|---|
| Day 0–1 | Wave 0 seed commit; `npm run build` green | You |
| Day 2–3 | Wave 1: three contract PRs merged; everyone branches | Ashar, Athul |
| Day 4–14 | Wave 2: lanes run in parallel | All four |
| Day 15–16 | Merge in the §8 order; fix integration fallout | All four |
| Day 17 | Demo pass: register → link → sync → village → attack → guild → map | All four |

**We are at 50% when** all four PRs are merged, `docker compose up` serves a login
page that leads to a village dashboard with real topic bars, a war map with tinted
polygons, a guild roster with real members, and a standings table — and CI is
green on `pytest` without `|| true`.
