# Air Sweeper

- Source: [Air Sweeper](https://clashofclans.fandom.com/wiki/Air_Sweeper) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624486`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Air Sweeper` (7 levels)

## Mechanics

- Unlocked at Town Hall 6. Count (wiki): TH6 1, TH9 2. Footprint 2x2.
- Targets air units only and deals **no damage**; each blast pushes air troops away, delaying them. Upgrades increase push distance (1.6 tiles at level 1 up to 4.0 tiles at level 7) and hitpoints.
- Range 1-15 tiles (1-tile blind spot directly around it); one blast every 5 s.
- Placement direction: can be rotated to 8 facings 45 degrees apart; in battle it can turn up to 45 degrees either way from its facing.
- Blast geometry (page trivia): a sector roughly 60 degrees wide, up to 5 tiles across and 14 long; the animation lasts about 3.5 s and a hit troop cannot attack for up to ~1.2 s while pushed. Troops are pushed perpendicular to the blast front, so groups can fan out and re-target separately.
- Does not interact with ground troops except as a target.

### Recent balance notes (from the page's History table)

- No 2025-2026 balance changes on the page; last change December 9, 2021 (cost reductions).

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH6: 1, TH9: 2

Size: 2x2

**Statistics**

| Level | Push Strength | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|
| 1 | 1.6 tiles | 750 | 200,000 | 4h | 120 | 6 |
| 2 | 2.0 tiles | 800 | 300,000 | 6h | 146 | 6 |
| 3 | 2.4 tiles | 850 | 450,000 | 8h | 169 | 7 |
| 4 | 2.8 tiles | 900 | 800,000 | 12h | 207 | 8 |
| 5 | 3.2 tiles | 950 | 1,200,000 | 1d | 293 | 9 |
| 6 | 3.6 tiles | 1,000 | 1,900,000 | 2d | 415 | 10 |
| 7 | 4.0 tiles | 1,050 | 3,400,000 | 3d | 509 | 11 |

**Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 1-15 | 5s | None (Knockback Only) | Air |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 7 | 0 |
| Statistics | cost | 7 | 0 |
| Statistics | buildSeconds | 7 | 0 |
| Statistics | townHall | 7 | 0 |
| Statistics | xp | 7 | 0 |
| Statistics | pushStrength | 7 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Air Sweeper`): 13/13 TH levels match.

No mismatches found in the compared fields.

**Game table check** (`reference/full-client/progression.json` -> `airsweeper` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `AttackRange` 1500 / `MinAttackRange` 100 = 1-15 tiles; `AttackSpeed` 5000 with `CoolDownOverride` 4800 and `PrepareSpeed` 600; `AirTargets` TRUE only.
- `ShockwavePushStrength` 160..400 per level = push strength 1.6..4.0 tiles (1/100 tile units) - matches the wiki at all 7 levels (checked per level below).
- `AimRotateStep` 45 = the 8 placement directions; `TargetingConeAngle` 105 is the targeting cone (wiki describes +/-45 degree swivel); `ShockwaveArcLength` 700 and `ShockwaveExpandRadius` 250 describe the blast shape (the wiki's 60-degree/5-tile/14-tile figures are observations, not client values).
- progression.json keeps range/minRange/rate but has no push strength.
