# Execution Order — Who Does What, When, and Who Merges Into What

One page, read top to bottom. Everything here is already spelled out in
`docs/WORK_SPLIT_50.md` and in each person's file under `docs/lanes/` — this
page just puts it in the order you actually run it in.

**Base/integration branch: `ashar`.** All four lane branches fork from `ashar`
and PR back into `ashar`. `ashar` → `main` is a separate, final PR after all
four are in.

---

## Step 1 — Ashar only (Day 1, blocking)

**Nobody else branches yet.**

Ashar commits the seed scaffold straight onto `ashar`:
`index.html`, `main.jsx`, `App.jsx`, `routes/index.jsx` (every route declared,
pointing at placeholders), `shared/ui/*` (Panel, StatTile, DataTable, etc.,
frozen after this), `game/config.js`, and `package-lock.json` committed.

**Gate:** `npm run build` exits 0. Push to `origin/ashar`.

Full spec: `docs/WORK_SPLIT_50.md` §3.

---

## Step 2 — Two contract PRs in parallel (Day 2–3, blocking)

Once Step 1 is pushed, these two branch off `ashar`, work independently of each
other, and **PR straight into `ashar`** — not held inside anyone's lane branch.

| Who | Branch | Delivers | PR target |
|---|---|---|---|
| **Ashar** | `feat/ashar-config-service` | `GameBalanceConfig` read service (M9) | → `ashar` |
| **Athul** | `feat/athul-ws-client` | `shared/websocket/client.js` + `useRealtimeEvent()` hook | → `ashar` |

Both reviewed and merged same-day. **Everyone else waits for both before
branching** — Niranjan, Hari, and Athul's own lane all read config through
Ashar's service; Niranjan and Hari both consume Athul's hook.

Full spec: `docs/WORK_SPLIT_50.md` §4.

---

## Step 3 — Everyone branches for their own lane (Day 3)

After Step 2 is merged, all four `git fetch && git merge origin/ashar` and
branch:

| Who | Branch | Lane brief |
|---|---|---|
| **Ashar** | `feat/ashar-auth-admin` | `docs/lanes/ashar-auth-platform.md` |
| **Athul** | `feat/athul-guild-realtime` | `docs/lanes/athul-guild-realtime.md` |
| **Niranjan** | `feat/niranjan-sync-village` | `docs/lanes/niranjan-sync-village.md` |
| **Hari** | `feat/hari-attacks-league` | `docs/lanes/hari-attacks-league.md` |

Each brief already lists the exact files each person may touch — that's what
makes the four branches mergeable later without conflict.

---

## Step 4 — One more standalone PR, early in the lane work (Day 4–6)

**Niranjan** ships `defense_rating` (the one-line fix at
`m3_village/service.py:69`, currently hard-coded `0.0`) as its own small PR
**out of his lane branch**, straight into `ashar`, as soon as it's ready —
don't wait two weeks to surface it.

**PR target:** `ashar`. **Why it jumps the queue:** Hari's entire matchmaking
logic bands targets around this number; at `0.0` for everyone, it has nothing
to band around. Hari builds against the placeholder in the meantime and picks
up the real value on his next `git merge origin/ashar`.

---

## Step 5 — Parallel lane work (Day 4–16, the main two weeks)

All four work their own lane, touching only the files listed in their brief.
**Weekly, every lane, no exceptions:**

```bash
git fetch origin
git merge origin/ashar     # merge, don't rebase — branches are already pushed
```

This is where "seamless" actually comes from: by this point the shared files
(`routes/index.jsx`, `App.jsx`, `shared/ui/`, `game/config.js`,
`tailwind.config.js`, `package.json`) are frozen, config and realtime are
already merged contracts, and each person's backend module + matching frontend
feature are in disjoint folders. Two soft data-dependencies remain and are
handled by rendering placeholders (`—`) until the source lands:

- Hari's Standings INFLUENCE/TERRITORIES columns wait on Athul's zone data.
- Athul's roster LVL/SOLVED/ATTACKS columns wait on Niranjan's and Hari's
  `service.py` exports.

Neither blocks anyone from finishing their own lane's core work.

---

## Step 6 — Final merge order (Day 17–18)

This order is **not a preference — it's forced by the alembic migration
chain**, since each migration's `down_revision` points at the one before it:

```
003_zone_polygons     (Athul)      down_revision = "002_seed"
004_village_profile   (Niranjan)   down_revision = "003_zone_polygons"
005_trophy_ledger     (Hari)       down_revision = "004_village_profile"
```

| Order | Who | Branch → target | Why this slot |
|---|---|---|---|
| **1st** | **Ashar** | `feat/ashar-auth-admin` → `ashar` | No migration — safe to open the queue |
| **2nd** | **Athul** | `feat/athul-guild-realtime` → `ashar` | Head of the migration chain; Niranjan and Hari both wait on this landing |
| **3rd** | **Niranjan** | `feat/niranjan-sync-village` → `ashar` | Chains onto Athul's `003`; Hari waits on this landing |
| **4th** | **Hari** | `feat/hari-attacks-league` → `ashar` | Chains onto Niranjan's `004`; nobody waits on Hari |

**Before opening each PR (2nd, 3rd, 4th):** `git merge origin/ashar` first,
then confirm `alembic upgrade head` and `alembic downgrade -1` both still run
clean against the newly-merged state. If you open out of order, your migration
won't have a valid parent yet and CI will fail.

**Final step:** once all four are in `ashar`, one PR `ashar` → `main`.

---

## Quick-reference table

| Step | Who | What | PR target | Blocks |
|---|---|---|---|---|
| 1 | Ashar | Seed commit | commits direct to `ashar` | everyone |
| 2a | Ashar | Config service | → `ashar` | everyone's config reads |
| 2b | Athul | WebSocket hook | → `ashar` | Niranjan, Hari's live updates |
| 3 | All four | Branch for own lane | — | — |
| 4 | Niranjan | `defense_rating` fix | → `ashar` | Hari's matchmaking |
| 5 | All four | Lane work, weekly merge from `ashar` | — | — |
| 6.1 | Ashar | Auth/Admin lane | → `ashar` | — |
| 6.2 | Athul | Guild/Realtime lane | → `ashar` | Niranjan's, Hari's migrations |
| 6.3 | Niranjan | Sync/Village lane | → `ashar` | Hari's migration |
| 6.4 | Hari | Attacks/League lane | → `ashar` | — |
| 7 | Ashar | `ashar` → `main` | → `main` | ship |
