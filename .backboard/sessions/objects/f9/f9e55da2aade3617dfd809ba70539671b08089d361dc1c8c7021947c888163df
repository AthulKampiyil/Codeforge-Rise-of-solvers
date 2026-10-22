# Hari — Attacks & League

**Branch:** `feat/hari-attacks-league` · **Base:** `ashar` · **Window:** ~2 weeks
**You own:** M4 Async Village Attacks, M7 League & Trophy Progression

Your lane has the most actual construction in it. `PROJECT_STATUS.md` marks both
your modules ✅, but an attack today can be launched and then can **never be
played or resolved** — no targets, no problems, no trophies. You're building the
gameplay loop, not polishing it.

> Full context: `docs/WORK_SPLIT_50.md`. Project reality check: `NEXT_STEPS.md`.

---

## 0. Before you start

Do not branch until the **seed commit** is on `ashar` and the **Wave 1 contract
PRs** have merged (you need Ashar's `GameBalanceConfig` for cooldowns, K-factors and
tier thresholds). Then:

```bash
git fetch origin && git checkout ashar && git pull
git checkout -b feat/hari-attacks-league
git push -u origin feat/hari-attacks-league
```

**Sequencing note:** your matchmaking needs Niranjan's `defense_rating`, which is
hard-coded `0.0` today. Niranjan is shipping that as an early standalone PR. Until it
lands, build against the current `0.0` and pick it up on your next merge from
`ashar` — don't sit idle waiting, and don't implement it yourself in your lane.

---

## 1. Backend — M4 Attacks, 35% → 75%

Three real gaps, all in `backend/app/modules/m4_attacks/service.py`:

### Matchmaking (`service.py:34` — currently `return []`)

Implement the SADD §7.3.1.1 tolerance band over `defense_rating`. Every parameter
is already seeded in `002_seed.py` and readable through Ashar's config service:

| Key | Default | Meaning |
|---|---|---|
| `matchmaking.base_tolerance` | `0.12` | base ± band around the attacker's rating |
| `matchmaking.tier_adjustment` | per-tier dict | bronze `+0.08` … legend `−0.08` |
| `matchmaking.min_candidates` | `3` | widen below this |
| `matchmaking.widen_step` | `0.05` | widening increment |
| `matchmaking.max_tolerance` | `0.30` | hard cap |
| `matchmaking.recent_attack_window_h` | `24` | no re-attacking the same target |
| `attack.defense_grace_minutes` | `15` | a just-attacked village is excluded |

Exclude self, exclude recently-attacked targets, exclude villages inside their
grace window, then widen the band until `min_candidates` is met or the cap is hit.

### Curated problem set (REQ-4.2)

`attack.problem_set_size` (seeded `3`) problems drawn from the **target's weakest
topics**, so an attack probes real weakness. Source them through
`m2_platform_sync`'s **`service.py`** — SADD §4.1 forbids importing another
module's repository or models. Store the set on the attack so the detail screen
can render it with "Open on Codeforces" links.

### Resolution (`service.py:72` — currently flips a status, moves nothing)

The window is `attack.window_hours` (seeded `24`). On resolution, compute
`solved_fraction`, compare against `trophy.defense_threshold` (`0.34`) to decide
attack-success vs. successful-defense, apply `trophy.abandon_penalty` (`5`) for a
zero-submission abandon, and write **both** trophy deltas through Athul's… no —
through **your own** `TrophyLedger` (§2). Publish `ATTACK_RESOLVED`; the payload
shape already exists in `m8_notifications/schemas.py` as `AttackResolvedPayload`.

No background worker exists (`worker/main.py` is an empty docstring) and building
one is **out of scope for 50%**. Resolve on-demand: when the attack detail
endpoint is polled, or on the attacker's next sync.

---

## 2. Backend — M7 League, 55% → 85%

- **`TrophyLedger`** — make it the *only* write path into `league_profiles`. Every
  mutation gets a ledger row (attack id, delta, reason, resulting balance). This
  is what makes trophy movement auditable, and SADD Appendix D asks for it.
- **Elo calculation** (SADD §7.3.1.3) — `trophy.k_factor` is a per-tier dict
  (bronze/silver/gold `32`, platinum/diamond `24`, legend `16`) and
  `trophy.elo_divisor` is `400`. Reproduce the worked example in the SADD exactly;
  it's the first thing an evaluator will check.
- **Tier evaluation on every ledger write** — `league.thresholds` is seeded
  (`bronze 0, silver 400, gold 800, platinum 1300, diamond 1900, legend 2600`),
  new solvers start at `league.starting_trophies` (`300`). Publish
  `LEAGUE_TIER_CHANGED` on a crossing (payload shape already defined).
- **`GET /league/leaderboard`** — `LeaderboardEntryOut` already sits in
  `m7_league_trophy/schemas.py` with **no route behind it**. Add the route, with
  a `scope=global|guild` parameter.

→ **Your migration: `005_trophy_ledger`** (see §6 for the exact revision id).

---

## 3. Frontend — `features/attacks/`

- **`/attack`** — candidate target list from your matchmaking endpoint, each with
  a strength indicator relative to the viewer.
- **`/attack/:id`** — the curated problem set with **"Open on Codeforces"** links,
  live `solved 1/3` progress, the window countdown, and the outcome preview.
- **Cooldown timer** — `GET /attacks/cooldown` already works and is already backed
  by Postgres as the source of truth. Render the countdown; disable the launch
  button; show the 429 case as a timer, not an error toast.
- Update live on `ATTACK_INCOMING` and `ATTACK_RESOLVED` via Athul's
  `useRealtimeEvent` hook. NFR-1.4 wants the incoming notice inside 3 seconds.

---

## 4. Frontend — `features/league/`, Fig 3.3 · read the scope call first

Your wireframe reference is **SRS Figure 3.3**, page 9 of
`plan/Group7_CodeForge_SRS (1)-1.pdf`: a three-card podium over a ranked table
(RNK / GUILD / INFLUENCE / TERRITORIES / STARS / WINS / LOSSES / STREAK), own row
highlighted gold, plus a Hall of Fame block.

**The scope call — do not skip this.** The mockup shows **guild-level,
season-scoped** standings. There is no season entity anywhere in the schema (grep
for "season" in `app/` and `alembic/` returns zero hits), and league is per-solver,
not per-guild. **Do not build a Season module.** Instead:

| Mockup column | Where it actually comes from |
|---|---|
| "Season III · Week 7" chip | `season.start_date` + `season.length_weeks` as new keys in `game_balance_config` (ask Ashar to seed them) |
| INFLUENCE | `SUM(zone_contributions.aggregated_score)` per guild — **Athul's data** |
| TERRITORIES | count of `territory_zones` where `owning_guild_id` = guild — **Athul's data** |
| STARS | sum of member `league_profiles.trophy_count` — yours |
| WINS / LOSSES / STREAK | aggregate over `attacks` by guild membership — yours |
| Hall of Fame | cut for v1, or hard-code past seasons as static copy |

Build the table against your own leaderboard endpoint first (no dependency), then
add the two Athul-sourced columns after their PR merges. Render them as `—` until then.

---

## 5. Tests

- `test_trophy_calculator.py` — **include the SADD §7.3.1.3 worked example
  verbatim** (TC-LEA-01..05). Highest-value test in the repo.
- `test_matchmaking.py` — band widening, the exclusions, the cap (TC-ATK-01).
- `test_attack_flow.py` — launch → cooldown 429 → resolve → both ledger rows sum
  to the profile deltas (TC-ATK-02..05).

---

## 6. Your files & your migration

**Edit freely:**

```
backend/app/modules/m4_attacks/**
backend/app/modules/m7_league_trophy/**
backend/alembic/versions/005_trophy_ledger.py
backend/tests/test_trophy_calculator.py
backend/tests/test_matchmaking.py
backend/tests/test_attack_flow.py
frontend/src/features/attacks/**
frontend/src/features/league/**
```

**Do not touch:** `frontend/src/routes/index.jsx`, `frontend/src/App.jsx`,
`frontend/src/shared/ui/**`, `frontend/src/game/**`, `frontend/tailwind.config.js`,
`frontend/package.json`, `backend/app/main.py`, `backend/app/db/base.py`,
any other lane's `m*/` folder.

**Migration — exact, non-negotiable:**

```python
# backend/alembic/versions/005_trophy_ledger.py
revision = "005_trophy_ledger"
down_revision = "004_village_profile"   # Niranjan's migration — NOT "002_seed"
```

Two people both writing `down_revision = "002_seed"` creates two alembic heads;
git merges that silently and `alembic upgrade head` then fails at runtime for
everyone. Chain: `003` (Athul) → `004` (Niranjan) → `005` (you). **You merge last**, so
merge `origin/ashar` and re-verify `alembic upgrade head` before opening your PR.

**New npm dependencies:** none without asking.

---

## 7. Dependencies

**You need:**
- Ashar's `GameBalanceConfig` (Wave 1) — cooldown, matchmaking band, K-factors, thresholds.
- **Niranjan's `defense_rating`** — matchmaking is meaningless without it. Early PR; see §0.
- Athul's `useRealtimeEvent` hook (Wave 1) for live attack events.
- Athul's zone data for two Standings columns (render `—` until it lands).
- Niranjan's and Athul's migrations merged before yours chains on.

**Blocked on you:** Athul's guild roster wants an `attack_count` per member, read
through your `service.py`.

---

## 8. Workflow & done

Weekly: `git fetch origin && git merge origin/ashar` (merge, don't rebase).

**PR checklist:**

- [ ] `npm run build` exits 0
- [ ] `alembic upgrade head` then `alembic downgrade -1` both clean
- [ ] `pytest` green for my three test files, SADD worked example included
- [ ] I edited no file outside §6
- [ ] I added no npm dependency
- [ ] Screenshot of Standings next to SRS Fig 3.3

**Lane is done when:** solver A opens `/attack`, sees real candidates inside the
tolerance band, launches at B, B gets the notification, A's cooldown timer starts,
a second attack returns 429 with a countdown, the attack resolves, both trophy
counts move by the Elo amount, the ledger shows two rows that sum to the profile
deltas, and Standings renders a ranked table with A's row highlighted.
