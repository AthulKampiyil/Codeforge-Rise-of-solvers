# Ricochet Cannon

- Source: [Ricochet Cannon](https://clashofclans.fandom.com/wiki/Ricochet_Cannon) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624465`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Ricochet Cannon` (4 levels)

## Mechanics

- Unlocked at Town Hall 16 by **merging two non-geared level 21 Cannons**; permanent. Count (wiki): TH16 2, TH17 3. Required merges gate the next Town Hall. Footprint 3x3.
- Range 9 tiles, one shot every 0.8 s, **ground only**. Level 4: 412 DPS / 329.6 per shot.
- Ricochet: after hitting its target the ball bounces once to another unit within **3.5 tiles** of the first (that unit may be outside the cannon's own range, giving up to ~12.5 tiles of reach). The ricochet deals **70%** of the shot (chain decay -30%, e.g. 230.72 at level 4). With no second valid unit the ball does not re-hit the original target.
- Supercharge (TH18 at level 4): charge 1 +8 DPS (420 / 336, ricochet 235.2), charge 2 +150 HP (6,250).

### Recent balance notes (from the page's History table)

- January 28, 2026: ricochet search range 4.5 -> 3.5 tiles and new -30% ricochet damage decay.
- November 17, 2025: level 4 added; supercharges moved.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH16: 2, TH17: 3

Size: 3x3

**Statistics**

| Level | Damage per Second | Damage per Shot (Primary Target) | Secondary Chain Damage | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 360 | 288 | 201.6 | 5,400 | 12,000,000 | 7d | 777 | 16 |
| 2 | 390 | 312 | 218.4 | 5,700 | 13,000,000 | 8d | 831 | 16 |
| 3 | 405 | 324 | 226.8 | 6,000 | 17,500,000 | 9d | 881 | 17 |
| 4 | 412 | 329.6 | 230.72 | 6,100 | 26,500,000 | 13d 12h | 1,080 | 18 |

**Supercharges**

| Charge Level | Damage per Second | Damage per Shot (Primary Target) | Secondary Chain Damage | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 420 | 336 | 235.2 | 6,100 | 12,000,000 | 6d | 720 | 18 |
| 2 | 420 | 336 | 235.2 | 6,250 | 10,000,000 | 7d | 777 | 18 |

**Supercharges**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 9 | 0.8s | Ricochet Shot | Ground |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 4 | 0 |
| Statistics | cost | 4 | 0 |
| Statistics | buildSeconds | 4 | 0 |
| Statistics | townHall | 4 | 0 |
| Statistics | xp | 4 | 0 |
| Statistics | dps | 4 | 0 |
| Statistics | damagePerHitPrimary | 4 | 0 |
| Statistics | secondaryChainDamage | 4 | 0 |
| Supercharges | cost | 2 | 0 |
| Supercharges | buildSeconds | 2 | 0 |
| Supercharges | townHall | 2 | 0 |
| Supercharges | hitpoints | 2 | 0 |
| Supercharges | dps | 2 | 0 |
| Supercharges | damagePerHitPrimary | 2 | 0 |
| Supercharges | secondaryChainDamage | 2 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Ricochet Cannon`): 3/3 TH levels match.

No mismatches found in the compared fields.

**Game table check** (`reference/full-client/progression.json` -> `ricochetcannon` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `DPS` 360..412, `AttackSpeed` 800, `AttackRange` 900, ground only; primary damage = `DPS` x 0.8.
- Ricochet: building `ProjectileBounces` 1; projectile `MergedCannonProjectile lvlN` has `MaxBounceDistance` 350 (3.5 tiles) and `BounceDamageReductionPercent` 30 - both already reflect the January 2026 nerf. Secondary damage matches the wiki at all levels.
- `MergeRequirement` = `Cannon:21:0;Cannon:21:0`.
- Supercharge `Ricochet Cannon Mini Levels`: DPS +8, HP +150; 12M / 10M, 6d / 7d - matches.
- progression.json has dps/range/rate but no bounce count, bounce range or decay.
