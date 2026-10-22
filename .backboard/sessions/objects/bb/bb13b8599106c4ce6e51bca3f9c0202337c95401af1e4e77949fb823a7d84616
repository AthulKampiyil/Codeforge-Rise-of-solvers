# Niranjan — Sync & Village

**Branch:** `feat/niranjan-sync-village` · **Base:** `ashar` · **Window:** ~2 weeks
**You own:** M2 Coding-Platform Sync, M3 Personal Code Village

Your lane builds the screen the whole product is actually about — the village
dashboard — and it contains the single highest-leverage line of code in the repo:
`defense_rating` is hard-coded to `0.0`, which is why Hari's matchmaking currently
returns an empty list. Fix that early and you unblock another person.

> Full context: `docs/WORK_SPLIT_50.md`. Project reality check: `NEXT_STEPS.md`.

---

## 0. Before you start

Do not branch until the **seed commit** is on `ashar` and the **Wave 1 contract
PRs** have merged (you need Ashar's `GameBalanceConfig` for the defense weights, and
Athul's `useRealtimeEvent` hook for live updates). Then:

```bash
git fetch origin && git checkout ashar && git pull
git checkout -b feat/niranjan-sync-village
git push -u origin feat/niranjan-sync-village
```

---

## 1. Do this first — it unblocks Hari

`backend/app/modules/m3_village/service.py:69` reads:

```python
"defense_rating": 0.0,  # TODO (Phase 5): SADD 7.3.1 formula
```

Every player in the system has a defense rating of zero, so Hari's matchmaking band
(`find_attack_targets()`) has nothing to band around and returns `[]`. Implement
the SADD §7.3.1 formula using the three keys Ashar's config service exposes:

```
defense_rating = village.defense_base
               + village.defense_level_weight  × Σ(topic levels)
               + village.defense_solved_weight × total_solved
```

Seeded defaults are `100`, `10`, and `0.25` — already in `002_seed.py`, don't
hard-code them.

**Land this as its own small PR into `ashar`**, not buried in your lane branch two
weeks from now. It's one function, and Hari is stuck on it.

---

## 2. Backend

### M3 Village — 50% → 90%

- **Defense rating** — §1 above.
- **Materialize `village_profiles`.** Right now `get_user_village()` recomputes
  everything per request and runs a `Topic` query inside a loop over progress
  records (`service.py:52`) — an N+1 that matchmaking would then run across every
  candidate. Store `defense_rating`, `total_solved` and `average_level` on a
  `village_profiles` row, updated on sync and on attack resolution, and index the
  rating so Hari can range-query it.
  → **Your migration: `004_village_profile`** (see §6 for the exact revision id).
- **Render state.** Add the per-topic payload `VillageScene` needs: `structure_key`,
  `level`, `progress_points`, and progress-to-next-level so the bars can fill.

### M2 Sync — 70% → 80%

`m2_platform_sync/sync_scheduler.py:119` still levels with the
`floor(sqrt(solved_count))` placeholder. Replace it with the progress-point
formula from `plan.md` Phase 5, using each topic's seeded `base_threshold`
(`002_seed.py` gives Arrays/Strings/Math/Greedy `10`, Graphs/Trees/Data Structures
`12`, DP `14` — harder topics level slower).

Emit `VILLAGE_UPDATED` through M8 when a level changes. The event and its payload
shape already exist in `m8_notifications/schemas.py` (`VillageUpdatedPayload`) —
you publish, you don't design it.

---

## 3. Frontend

### `features/village/` — the Fig 3.1 left sidebar

This is your primary wireframe reference: the left column of
**SRS Figure 3.1**, page 8 of `plan/Group7_CodeForge_SRS (1)-1.pdf`.

- **Player card** — avatar chip, handle, `Level 34 · Strategist`.
- **Stat row** — `SOLVED` / `ATTACKS` / `STARS` in mono. SOLVED comes from
  `GET /village/me`; STARS is trophies from `GET /league/me`; ATTACKS is Hari's
  data — render `—` until their PR lands.
- **Topic Influence bars** — the heart of it. Per-topic name, coloured fill bar,
  and a `+18%` style delta. The six topics in the mockup (Graph, DP, Trees,
  Greedy, Math, Strings) are **already seeded verbatim** in `002_seed.py`, so
  these bind straight to `GET /village/me` → `topics[]`.
- **Weekly Attacks** pips (`3 OF 5 REMAINING`) — no backend concept. Either derive
  from Hari's cooldown endpoint or cut it; don't invent a weekly quota table.

**One caution:** the mockup's `XP TO LVL 35 · 7,240 / 10k` has no backend concept
either — there is no account-wide XP or level, only per-topic levels. Render it
from summed progress points across topics, or drop the bar. Do not invent an XP
table.

### `game/VillageScene.js` — Phaser

Currently a two-line comment. Build: one structure sprite per topic on an
isometric grid, sprite variant chosen from `structure_key` + level band
(`0`, `1–2`, `3–5`, `6–9`, `10+`). The seeded `structure_key` values are `hut`,
`library`, `observatory`, `mill`, `tower`, `grove`, `fortress`, `vault`.

Click a structure → topic detail panel. Re-render **in place** on
`VILLAGE_UPDATED` via Athul's `useRealtimeEvent` hook — REQ-3.4 explicitly requires
no page reload.

Use generated coloured-geometry placeholder sprites committed to
`src/game/assets/village/` so nothing in your lane waits on artwork.

`game/config.js` ships in the seed commit with both scenes registered — **don't
edit it**, Athul's WarMapScene shares it.

### `features/sync-status/`

- Status pill in the top banner with last-sync timestamp.
- Refresh button, disabled with a live countdown inside the 5-minute window
  (REQ-2.2) — `ONDEMAND_SYNC_COOLDOWN_SECONDS` drives it.
- Render `degraded: codeforces` **distinctly** from a per-account failure. The
  circuit breaker being open is a platform problem, not the user's problem, and
  REQ-2.4 wants that distinction visible.

---

## 4. Tests

- `backend/tests/test_village_levelling.py` — the progress-point formula and band
  boundaries (TC-VILL-01, TC-VILL-03).
- `backend/tests/test_m3_village.py` — defense rating against known inputs;
  empty-village case returns zeros without crashing.

---

## 5. Your files

**Edit freely:**

```
backend/app/modules/m2_platform_sync/**
backend/app/modules/m3_village/**
backend/alembic/versions/004_village_profile.py
backend/tests/test_village_levelling.py
backend/tests/test_m3_village.py
frontend/src/features/village/**
frontend/src/features/sync-status/**
frontend/src/game/VillageScene.js
frontend/src/game/assets/village/**
```

**Do not touch:** `frontend/src/game/config.js` (shared with Athul),
`frontend/src/routes/index.jsx`, `frontend/src/App.jsx`,
`frontend/src/shared/ui/**`, `frontend/tailwind.config.js`,
`frontend/package.json`, `backend/app/main.py`, `backend/app/db/base.py`,
any other lane's `m*/` folder.

**New npm dependencies:** none without asking.

---

## 6. Your migration — exact, non-negotiable

```python
# backend/alembic/versions/004_village_profile.py
revision = "004_village_profile"
down_revision = "003_zone_polygons"   # Athul's migration — NOT "002_seed"
```

Two people both writing `down_revision = "002_seed"` creates two alembic heads.
Git merges that silently and `alembic upgrade head` then fails at runtime for
everyone. The chain is pre-assigned: `003` (Athul) → `004` (you) → `005` (Hari).

This means **Athul's PR merges before yours.** Before you open your PR:
`git merge origin/ashar`, then confirm `alembic upgrade head` and
`alembic downgrade -1` both run clean.

---

## 7. Dependencies

**You need:**
- Ashar's `GameBalanceConfig` (Wave 1) for the three `village.defense_*` weights.
- Athul's `useRealtimeEvent` hook (Wave 1) for `VILLAGE_UPDATED`.
- Athul's `003_zone_polygons` merged before your migration chains onto it.

**Blocked on you:**
- **Hari's entire matchmaking lane** needs `defense_rating`. See §1 — ship it early
  and standalone.
- Athul's guild roster needs village `level` per member, read through your
  `service.py` (SADD §4.1 forbids them importing your repository or models).

---

## 8. Workflow & done

Weekly: `git fetch origin && git merge origin/ashar` (merge, don't rebase).

**You merge third**, after Ashar and Athul.

**PR checklist:**

- [ ] `npm run build` exits 0
- [ ] `alembic upgrade head` then `alembic downgrade -1` both clean
- [ ] `pytest backend/tests/test_village_levelling.py backend/tests/test_m3_village.py` green
- [ ] I edited no file outside §5
- [ ] I added no npm dependency
- [ ] Screenshot of my sidebar next to SRS Fig 3.1

**Lane is done when:** a solver with a verified Codeforces handle hits Refresh and
watches their village populate — topic bars at real levels, a non-zero defense
rating, structures rendered on the Phaser canvas at the right level band — and a
second Refresh inside 5 minutes is rate-limited with a visible countdown.
