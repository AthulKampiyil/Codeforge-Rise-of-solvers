# Inferno Tower

- Source: [Inferno Tower/Home Village](https://clashofclans.fandom.com/wiki/Inferno_Tower/Home_Village) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624731`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Inferno Tower` (12 levels)

## Mechanics

- Unlocked at Town Hall 10. Count (wiki): TH10 2, TH12 3. Footprint 2x2. Targets ground and air; no favorite target and no bonus damage against any troop.
- Damage is applied in ticks every 0.128 s. The owner chooses a mode:
  - **Single-Target mode** (range 9 tiles): one beam whose damage ramps while it stays on the same target - stage 1 immediately, stage 2 after 1.5 s, stage 3 (maximum) after 5.25 s on target. Level 12: 155 -> 330 -> 3,300 DPS (19.84 / 42.24 / 422.4 per tick). Switching targets resets the ramp, so swarms of weak units overwhelm it.
  - **Multi-Target mode** (range 10 tiles): simultaneous beams on up to 5 targets (levels 1-7) or 6 targets (levels 8-12), constant stage-1 DPS per target (level 12: 155 per target, no ramp).
- Ammunition: 1,000 rounds, consumed at a constant rate regardless of mode or ramp stage (2 min 8 s of firing). Free automatic reload on login; when empty it stops attacking. Always loaded in Clan War bases.
- Supercharge (TH18 at level 12): charge 1 adds damage (single 165 / 350 / 3,500; multi 165 per target), charge 2 adds 200 HP (5,300).
- The mode choice is visible to attackers in the Tactical Overview (since June 18, 2024) even if covered by the Clan Castle.

### Recent balance notes (from the page's History table)

- February 23, 2026: level 12 added; supercharges moved from level 11 to 12.
- November 17, 2025: level 11 and charges made cheaper/faster.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH10: 2, TH12: 3

Size: 2x2

**Statistics - Single-Target Mode**

| Level | Damage per Second | Damage per Second | Damage per Second | Damage per Hit | Damage per Hit | Damage per Hit | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Level | Initial | After 1.5s | After 5.25s | Initial | After 1.5s | After 5.25s | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
| 1 | 30 | 80 | 800 | 3.84 | 10.24 | 102.4 | 1,500 | 1,000,000 | 12h | 207 | 10 |
| 2 | 35 | 100 | 1,000 | 4.48 | 12.8 | 128 | 1,800 | 1,200,000 | 1d | 293 | 10 |
| 3 | 40 | 120 | 1,200 | 5.12 | 15.36 | 153.6 | 2,100 | 2,400,000 | 2d | 415 | 10 |
| 4 | 45 | 140 | 1,400 | 5.76 | 17.92 | 179.2 | 2,400 | 3,400,000 | 2d 12h | 464 | 11 |
| 5 | 50 | 150 | 1,500 | 6.4 | 19.2 | 192 | 2,700 | 4,200,000 | 3d | 509 | 11 |
| 6 | 55 | 160 | 1,600 | 7.04 | 20.48 | 204.8 | 3,000 | 6,000,000 | 4d | 587 | 12 |
| 7 | 65 | 180 | 1,800 | 8.32 | 23.04 | 230.4 | 3,300 | 8,000,000 | 5d | 657 | 13 |
| 8 | 80 | 210 | 2,100 | 10.24 | 26.88 | 268.8 | 3,700 | 9,500,000 | 6d | 720 | 14 |
| 9 | 100 | 230 | 2,300 | 12.8 | 29.44 | 294.4 | 4,000 | 10,000,000 | 6d 12h | 749 | 15 |
| 10 | 120 | 260 | 2,600 | 15.36 | 33.28 | 332.8 | 4,400 | 11,000,000 | 7d | 777 | 16 |
| 11 | 140 | 290 | 2,900 | 17.92 | 37.12 | 371.2 | 4,800 | 16,000,000 | 8d | 831 | 17 |
| 12 | 155 | 330 | 3,300 | 19.84 | 42.24 | 422.4 | 5,100 | 26,500,000 | 13d 12h | 1,080 | 18 |

**Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted | Number of Rounds |
|---|---|---|---|---|
| 9 | 0.128s | Single Target | Ground & Air | 1,000 |

**Statistics - Multi-Target Mode**

| Level | Damage per Second per Target | Damage per Hit | Number of Targets | HP | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 30 | 3.84 | 5 | 1,500 | 1,000,000 | 12h | 207 | 10 |
| 2 | 35 | 4.48 | 5 | 1,800 | 1,200,000 | 1d | 293 | 10 |
| 3 | 40 | 5.12 | 5 | 2,100 | 2,400,000 | 2d | 415 | 10 |
| 4 | 45 | 5.76 | 5 | 2,400 | 3,400,000 | 2d 12h | 464 | 11 |
| 5 | 50 | 6.4 | 5 | 2,700 | 4,200,000 | 3d | 509 | 11 |
| 6 | 55 | 7.04 | 5 | 3,000 | 6,000,000 | 4d | 587 | 12 |
| 7 | 65 | 8.32 | 5 | 3,300 | 8,000,000 | 5d | 657 | 13 |
| 8 | 80 | 10.24 | 6 | 3,700 | 9,500,000 | 6d | 720 | 14 |
| 9 | 100 | 12.8 | 6 | 4,000 | 10,000,000 | 6d 12h | 749 | 15 |
| 10 | 120 | 15.36 | 6 | 4,400 | 11,000,000 | 7d | 777 | 16 |
| 11 | 140 | 17.92 | 6 | 4,800 | 16,000,000 | 8d | 831 | 17 |
| 12 | 155 | 19.84 | 6 | 5,100 | 26,500,000 | 13d 12h | 1,080 | 18 |

**Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted | Number of Rounds |
|---|---|---|---|---|
| 10 | 0.128s | Multiple Targets | Ground & Air | 1,000 |

**Supercharges - single**

| Charge | Damage per Second | Damage per Second | Damage per Second | Damage per Hit | Damage per Hit | Damage per Hit | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Charge | Initial | After 1.5s | After 5.25s | Initial | After 1.5s | After 5.25s | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
| 1 | 165 | 350 | 3,500 | 21.12 | 44.8 | 448 | 5,100 | 13,000,000 | 5d | 657 | 18 |
| 2 | 165 | 350 | 3,500 | 21.12 | 44.8 | 448 | 5,300 | 8,500,000 | 7d | 777 | 18 |

**Supercharges - multi**

| Charge Level | Damage per Second per Target | Damage per Hit | Number of Targets | HP | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 165 | 21.12 | 6 | 5,100 | 13,000,000 | 5d | 657 | 18 |
| 2 | 165 | 21.12 | 6 | 5,300 | 8,500,000 | 7d | 777 | 18 |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics / Single-Target Mode | hitpoints | 12 | 0 |
| Statistics / Single-Target Mode | cost | 11 | 1 |
| Statistics / Single-Target Mode | buildSeconds | 12 | 0 |
| Statistics / Single-Target Mode | townHall | 12 | 0 |
| Statistics / Single-Target Mode | xp | 12 | 0 |
| Statistics / Single-Target Mode | dpsStage1 | 12 | 0 |
| Statistics / Single-Target Mode | dpsStage2 | 12 | 0 |
| Statistics / Single-Target Mode | dpsStage3 | 12 | 0 |
| Statistics / Single-Target Mode | damagePerHitStage1 | 12 | 0 |
| Statistics / Single-Target Mode | damagePerHitStage2 | 12 | 0 |
| Statistics / Single-Target Mode | damagePerHitStage3 | 12 | 0 |
| Statistics / Multi-Target Mode | hitpoints | 12 | 0 |
| Statistics / Multi-Target Mode | cost | 11 | 1 |
| Statistics / Multi-Target Mode | buildSeconds | 12 | 0 |
| Statistics / Multi-Target Mode | townHall | 12 | 0 |
| Statistics / Multi-Target Mode | xp | 12 | 0 |
| Statistics / Multi-Target Mode | damagePerHit | 12 | 0 |
| Statistics / Multi-Target Mode | dpsPerTarget | 12 | 0 |
| Statistics / Multi-Target Mode | numberOfTargets | 12 | 0 |
| Supercharges / single | cost | 2 | 0 |
| Supercharges / single | buildSeconds | 2 | 0 |
| Supercharges / single | townHall | 2 | 0 |
| Supercharges / single | hitpoints | 2 | 0 |
| Supercharges / single | dpsStage1 | 2 | 0 |
| Supercharges / single | dpsStage2 | 2 | 0 |
| Supercharges / single | dpsStage3 | 2 | 0 |
| Supercharges / multi | cost | 2 | 0 |
| Supercharges / multi | buildSeconds | 2 | 0 |
| Supercharges / multi | townHall | 2 | 0 |
| Supercharges / multi | hitpoints | 2 | 0 |
| Supercharges / multi | dpsPerTarget | 2 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Inferno Tower`): 9/9 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| cost | 5 | 4200000 | 4000000 | level 5 cost: wiki 4,200,000 vs client 4,000,000 (no History entry explains it) |

**Game table check** (`reference/full-client/progression.json` -> `inferno` vs wiki): 1 discrepancies.

| Field | Level | Wiki | progression.json | Note |
|---|---|---|---|---|
| cost | 5 | 4200000 | 4000000 |  |

**Interpretation of client columns**

- `AttackSpeed` 128 ms is the damage tick. Single-target ramp: `IncreasingDamage` TRUE, `DPS` (stage 1), `DPSLv2`, `DPSLv3`, `Lv2SwitchTime` 1500 and `Lv3SwitchTime` 5250 (ms on the same target) - all 12 levels match the wiki exactly.
- Multi-target mode: `AltAttackMode` TRUE, `AltMultiTargets` TRUE, `AltNumMultiTargets` 5 (L1-7) / 6 (L8-12), `AltAttackRange` 1000 (10 tiles); it uses the stage-1 `DPS` per target. `AlternatePickNewTargetDelay` 50 ms is the multi-mode retarget delay (not on the wiki).
- `AmmoCount` 1000 matches. `AmmoResource` DarkElixir with `AmmoCost` 500-1,600 are legacy reload prices (reload is free now).
- Supercharge `Inferno Tower Mini Levels`: charge 1 DPS +10 / DPSLv2 +20 / DPSLv3 +200, charge 2 Hitpoints +200 - reproduces 165/350/3,500 and 5,300; 13M / 8.5M Gold, 5d / 7d.
- progression.json keeps only stage-1 `dps` (155 at level 12) with range 9 and rate 0.128; ramp stages, multi-target count and the 10-tile multi range are not represented.
