# Multi-Gear Tower

- Source: [Multi-Gear Tower](https://clashofclans.fandom.com/wiki/Multi-Gear_Tower) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624494`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Multi Gear Tower` (3 levels)

## Mechanics

- Unlocked at Town Hall 17 by merging the **geared-up level 21 Cannon and the geared-up level 21 Archer Tower** (non-geared ones cannot be used); permanent. One per base. The merge is required before TH18, so Builder Base progress (gear-ups) is indirectly required. Footprint 3x3.
- Targets ground and air in both modes; the owner sets the mode.
- **Long Range mode** (Archer-Tower-like): range 12 tiles, one heavy arrow every 1 s (level 3: 390 per hit = 390 DPS).
- **Fast Attack mode** (Multi-Cannon-like): range 8 tiles, bursts of 4 cannonballs (0.192 s apart, ~0.383 s between bursts; frame counts give ~0.958 s per full cycle). Retargets faster than a geared-up Cannon when a target dies. Level 3 shows 710 DPS and 170.4 per ball (displayed truncated).
- Supercharge (TH18 at level 3): charge 1 +10 DPS (Long Range 400; Fast Attack 720 / 172.8), charge 2 +150 HP (4,500).

### Recent balance notes (from the page's History table)

- February 23, 2026: Fast Attack displayed DPS corrected (level 3 588 -> 710) and per-hit display 169 -> 170.
- January 28, 2026: Long Range damage +50 at all levels; Fast Attack damage per hit -20.
- November 17, 2025: level 3 added; levels 1-2 cheaper/faster; supercharges moved to level 3.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH17: 1

Size: 3x3

**Statistics - Long Range Mode**

| Level | Damage per Second | Damage per Hit | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 350 | 350 | 4,000 | 17,000,000 | 8d | 831 | 17 |
| 2 | 370 | 370 | 4,200 | 18,000,000 | 9d | 881 | 17 |
| 3 | 390 | 390 | 4,350 | 28,000,000 | 14d | 1,099 | 18 |

**Statistics - Fast Attack Mode**

| Level | Damage per Second* | Damage per Hit** | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 650 | 156 | 4,000 | 17,000,000 | 8d | 831 | 17 |
| 2 | 690 | 165.6 | 4,200 | 18,000,000 | 9d | 881 | 17 |
| 3 | 710 | 170.4 | 4,350 | 28,000,000 | 14d | 1,099 | 18 |

**Supercharges - Long Range**

| Level | Damage per Second | Damage per Hit | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 400 | 400 | 4,350 | 12,000,000 | 6d | 720 | 18 |
| 2 | 400 | 400 | 4,500 | 10,000,000 | 7d | 777 | 18 |

**Supercharges**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 12 | 1s | Single Target | Ground & Air |

**Supercharges - Fast Attack**

| Level | Damage per Second* | Damage per Hit** | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 720 | 172.8 | 4,350 | 12,000,000 | 6d | 720 | 18 |
| 2 | 720 | 172.8 | 4,500 | 10,000,000 | 7d | 777 | 18 |

**Supercharges**

| Range | Attack Speed | Time Between Bursts | Shots Per Burst | Damage Type | Unit Type Targeted |
|---|---|---|---|---|---|
| 8 | 0.192s | 0.383s | 4 shots | Single Target | Ground & Air |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics / Long Range Mode | hitpoints | 3 | 0 |
| Statistics / Long Range Mode | cost | 3 | 0 |
| Statistics / Long Range Mode | buildSeconds | 3 | 0 |
| Statistics / Long Range Mode | townHall | 3 | 0 |
| Statistics / Long Range Mode | xp | 3 | 0 |
| Statistics / Long Range Mode | dps | 3 | 0 |
| Statistics / Long Range Mode | damagePerHit | 3 | 0 |
| Statistics / Fast Attack Mode | hitpoints | 3 | 0 |
| Statistics / Fast Attack Mode | cost | 3 | 0 |
| Statistics / Fast Attack Mode | buildSeconds | 3 | 0 |
| Statistics / Fast Attack Mode | townHall | 3 | 0 |
| Statistics / Fast Attack Mode | xp | 3 | 0 |
| Statistics / Fast Attack Mode | dps | 3 | 0 |
| Statistics / Fast Attack Mode | damagePerHit | 3 | 3 |
| Supercharges / Long Range | cost | 2 | 0 |
| Supercharges / Long Range | buildSeconds | 2 | 0 |
| Supercharges / Long Range | townHall | 2 | 0 |
| Supercharges / Long Range | hitpoints | 2 | 0 |
| Supercharges / Long Range | dps | 2 | 0 |
| Supercharges / Fast Attack | cost | 2 | 0 |
| Supercharges / Fast Attack | buildSeconds | 2 | 0 |
| Supercharges / Fast Attack | townHall | 2 | 0 |
| Supercharges / Fast Attack | hitpoints | 2 | 0 |
| Supercharges / Fast Attack | dps | 2 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Multi Gear Tower`): 2/2 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| damagePerHit | 1, 2, 3 | 1: 156; 2: 165.6; 3: 170.4 | 1: 150.475; 2: 159.735; 3: 164.365 | wiki/in-game per-ball damage implies a 0.96 s burst cycle (0.384 + 3 x 0.192); client AltAttackSpeed 350 + 3 x AltBurstDelay 192 = 0.926 s gives 3.5% less per ball |

**Game table check** (`reference/full-client/progression.json` -> `multigeartower` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- Long Range: `DPS` 350/370/390, `AttackSpeed` 1000, `AttackRange` 1200 - match (per hit = DPS).
- Fast Attack: `AltAttackMode` TRUE, `AltDPS` 650/690/710 (= the wiki's displayed DPS after Feb 2026), `AltAttackSpeed` 350, `AltBurstCount` 4, `AltBurstDelay` 192, `AltAttackRange` 800, air+ground.
- The Cannon-style per-ball formula (AltDPS x (AltAttackSpeed + 3 x AltBurstDelay)/4) gives 150.5 / 159.7 / 164.4, but the game displays 156 / 165 / 170 and the wiki frame-counts a 0.958 s cycle; the extra ~34 ms per cycle (e.g. rounding the 350 ms gap up to a whole burst delay step, 384 ms) is not explicit in the row. Treat per-ball damage = AltDPS x 0.96/4 for parity.
- `MergeRequirement` = `Archer Tower:21:1;Cannon:21:1` (flag 1 = geared up). `StatBars`/`AltModeStatBars` define the info-screen rows per mode.
- Supercharge `Multi Gear Tower Mini Levels`: DPS +10 (applies to both modes: 400 and 720), HP +150; 12M / 10M; 6d / 7d - matches.
- progression.json only has the Long Range values (dps 390, rate 1.0, range 12); Fast Attack is missing.
