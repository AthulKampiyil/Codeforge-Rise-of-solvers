# X-Bow

- Source: [X-Bow/Home Village](https://clashofclans.fandom.com/wiki/X-Bow/Home_Village) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624469`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `X-Bow` (13 levels)

## Mechanics

- Unlocked at Town Hall 9. Count (wiki): TH9 2, TH10 3, TH11 4. Footprint 3x3.
- Fires one bolt every 0.128 s (about 7.8 per second), single target. Damage per bolt = DPS x 0.128 (level 13: 245 DPS / 31.36).
- Two player-selected modes: **Ground** mode - ground units only, range 14 tiles; **Air & Ground** mode - both layers, range 11.5 tiles. Same damage in both modes.
- Ammunition: holds 1,500 bolts (3 min 12 s of continuous fire). Reloading is free and automatic on login; if it runs dry it stops firing but still has to be destroyed and still attracts defense-targeting troops. In Clan War bases it always appears loaded.
- Supercharge (TH18 at level 13, re-added June 16, 2026): charge 1 +10 DPS (255 / 32.64 per bolt), charge 2 +100 HP (5,100).

### Recent balance notes (from the page's History table)

- June 16, 2026: 2 Supercharge levels added for level 13.
- April 27, 2026: level 13 added (previous supercharges on level 12 removed); build times of levels 4-7 and 12 reduced.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH9: 2, TH10: 3, TH11: 4

**Statistics**

| Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 60 | 7.68 | 1,500 | 1,000,000 | 12h | 207 | 9 |
| 2 | 70 | 8.96 | 1,900 | 1,200,000 | 1d | 293 | 9 |
| 3 | 80 | 10.24 | 2,300 | 2,400,000 | 2d | 415 | 9 |
| 4 | 85 | 10.88 | 2,700 | 2,500,000 | 2d 12h | 464 | 10 |
| 5 | 95 | 12.16 | 3,100 | 3,900,000 | 3d | 509 | 11 |
| 6 | 110 | 14.08 | 3,400 | 5,000,000 | 3d 12h | 549 | 12 |
| 7 | 130 | 16.64 | 3,700 | 6,000,000 | 4d | 587 | 13 |
| 8 | 155 | 19.84 | 4,000 | 7,000,000 | 4d 12h | 623 | 13 |
| 9 | 185 | 23.68 | 4,200 | 9,000,000 | 5d | 657 | 14 |
| 10 | 205 | 26.24 | 4,400 | 9,500,000 | 5d 12h | 689 | 15 |
| 11 | 225 | 28.8 | 4,600 | 10,000,000 | 6d | 720 | 16 |
| 12 | 235 | 30.08 | 4,800 | 16,000,000 | 8d | 831 | 17 |
| 13 | 245 | 31.36 | 5,000 | 26,000,000 | 13d 12h | 1,080 | 18 |

**Supercharges**

| Charge Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 255 | 32.64 | 5,000 | 9,000,000 | 5d 12h | 689 | 18 |
| 2 | 255 | 32.64 | 5,100 | 7,000,000 | 7d 12h | 804 | 18 |

**Supercharges - Ground Mode Statistics**

| Range | Attack Speed | Damage Type | Number of Rounds |
|---|---|---|---|
| 14 | 0.128s | Single Target | 1,500 |

**Supercharges - Ground & Air Mode Statistics**

| Range | Attack Speed | Damage Type | Number of Rounds |
|---|---|---|---|
| 11.5 | 0.128s | Single Target | 1,500 |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 13 | 0 |
| Statistics | cost | 13 | 0 |
| Statistics | buildSeconds | 13 | 0 |
| Statistics | townHall | 13 | 0 |
| Statistics | xp | 13 | 0 |
| Statistics | dps | 13 | 0 |
| Statistics | damagePerHit | 13 | 0 |
| Supercharges | cost | 0 | 2 |
| Supercharges | buildSeconds | 2 | 0 |
| Supercharges | townHall | 2 | 0 |
| Supercharges | hitpoints | 2 | 0 |
| Supercharges | dps | 2 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `X-Bow`): 10/10 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| cost | C1, C2 | C1: 9000000; C2: 7000000 | C1: 14000000; C2: 9000000 | supercharge cost differs: wiki 9M / 7M vs client X-Bow Mini Levels 14M / 9M (times, HP and DPS match). The wiki figures are identical to the Mortar's charge prices, so a copy error on the wiki is likely |

**Game table check** (`reference/full-client/progression.json` -> `xbow` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `AttackRange` 1400 (ground mode) and `AltAttackMode` TRUE with `AltAttackRange` 1150, `AltAirTargets`/`AltGroundTargets` TRUE (air & ground mode). `AttackSpeed` 128 ms; per bolt = `DPS` x 0.128 matches all 13 levels.
- `AmmoCount` 1500 matches the wiki's rounds. `AmmoResource` Elixir with `AmmoCost` 16,000-42,000 per level are legacy reload prices - the wiki states reloading is now free.
- `RandomHitPosition` TRUE: bolts land at a random point on the target (visual).
- Supercharge `X-Bow Mini Levels`: charge 1 DPS +10, charge 2 Hitpoints +100; RequiredTownHallLevel 18; times 5d12h / 7d12h match; costs do not.
- progression.json only exposes the ground-mode range (14) and targets 'ground'; the air & ground mode is not represented.
