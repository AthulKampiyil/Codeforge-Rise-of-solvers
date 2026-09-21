# Lane briefs — who does what to reach 50%

One file per person. Each is self-contained: read yours, ignore the other three.

| Person | Brief | Owns | Branch | Merges |
|---|---|---|---|---|
| **Ashar** | [`ashar-auth-platform.md`](ashar-auth-platform.md) | M1 Auth, M9 Admin/Config, CI, Docker — **plus the Wave 0 seed commit** | `feat/ashar-auth-admin` | 1st |
| **Athul** | [`athul-guild-realtime.md`](athul-guild-realtime.md) | M5 Guild & Territory, M8 Realtime, War Map | `feat/athul-guild-realtime` | 2nd |
| **Niranjan** | [`niranjan-sync-village.md`](niranjan-sync-village.md) | M2 Sync, M3 Village, Village dashboard | `feat/niranjan-sync-village` | 3rd |
| **Hari** | [`hari-attacks-league.md`](hari-attacks-league.md) | M4 Attacks, M7 League, Standings | `feat/hari-attacks-league` | 4th |

Assignments follow the dependency boundaries between modules, not a judgment
about who should do what — swap names freely, but **keep the lanes intact**. The
file-ownership boundaries in each brief are what let four branches merge without
conflicts, so moving a module between people means moving its whole lane.

## The order things have to happen in

1. **Ashar** lands the seed commit on `ashar`. Nobody branches before this.
2. **Ashar** and **Athul** each ship one small contract PR within 48 hours —
   the config service and the `useRealtimeEvent` hook. All four lanes depend on
   these, so they merge into `ashar` immediately rather than living in a branch.
3. **Niranjan** ships `defense_rating` as a standalone PR early — it's one
   function, and Hari's entire matchmaking lane is stuck at `0.0` until it lands.
4. Everyone works their lane for ~2 weeks, merging `origin/ashar` weekly.
5. Merge PRs in the order above. That order is dictated by the alembic chain:
   `003_zone_polygons` (Athul) → `004_village_profile` (Niranjan) →
   `005_trophy_ledger` (Hari). Ashar writes no migration, so he opens safely.

## Rules that apply to everyone

- **Only edit files listed in your brief's "Edit freely" section.** If you think
  you need something outside it, ask in the group chat first.
- **Frozen after the seed commit:** `routes/index.jsx`, `App.jsx`,
  `shared/ui/**`, `game/config.js`, `tailwind.config.js`, `package.json`.
- **No new npm dependencies** without asking — four lockfiles is an unmergeable mess.
- **Use your pre-assigned `down_revision`.** Two people both chaining off
  `002_seed` creates two alembic heads: git merges it silently, then
  `alembic upgrade head` fails at runtime for everybody.
- **Merge, don't rebase** (`git merge origin/ashar` weekly). Your branch is
  pushed and others may have pulled it.
- A module may only import another module's **`service.py`**, never its
  `repository.py` or `models.py` — SADD §4.1.

Full plan and the rationale behind all of this: [`../WORK_SPLIT_50.md`](../WORK_SPLIT_50.md).
Honest state of the repo: [`../../NEXT_STEPS.md`](../../NEXT_STEPS.md).
