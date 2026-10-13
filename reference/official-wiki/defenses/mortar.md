# Mortar

- Source: [Mortar](https://clashofclans.fandom.com/wiki/Mortar) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `625094`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Mortar` (18 levels)

## Mechanics

- Unlocked at Town Hall 3. Count (wiki): TH3 1, TH6 2, TH7 3, TH8 4. Footprint 3x3.
- Range 4-11 tiles: a **4-tile blind spot** (min range) that it cannot fire into. One shell every 5 s; ground only; splash radius 1.5 tiles on impact. Damage per hit = DPS x 5 (level 18: 72 DPS / 360 per shell); the per-hit value is the meaningful stat.
- Shells are slow (over a second of flight at max range) and land where the target was, so fast troops can dodge.
- Impact knocks back small troops (which can make them re-target).
- Gear Up (Burst mode): from level 8 (TH10) once the Builder Base Multi Mortar is level 8 (BH8); costs 6,000,000 Gold and 14 days. Fires 3 shells per burst (0.5 s apart, 4.0 s listed between bursts, same 4-11 range and 1.5-tile splash). Overall DPS is higher than normal mode (level 18: 88 shown) while each shell deals much less than a normal shell. It is the only gear-up that keeps its range and changes per-shot damage.
- **Ambiguity - burst damage per shell**: the statistics table lists 41.6 (level 8) ... 148.09 (level 18), which implies a ~5 s burst cycle, but the page's own February 23, 2026 History entry quotes the in-game displayed values (level 9: 46, level 15: 98, level 17: 120), which fit a ~4.5 s cycle (client AltDPS x 4.5 / 3: 46.5, 99, 121.5, with tick flooring). Treat ~133 per shell at level 18 as the likely live value and verify in game.
- Supercharge (TH18, max level 18 per current page): charge 1 +3 DPS (75 DPS / 375 per shell; burst 91 DPS / 153.08 per shell), charge 2 +75 HP (2,625). Charges are removed whenever a new level is added.

### Recent balance notes (from the page's History table)

- February 23, 2026: level 18 added (supercharges moved off level 17); displayed geared-up DPS/per-hit values updated.
- November 17, 2025 (TH18 update): level 17 and charge costs/times reduced.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH3: 1, TH6: 2, TH7: 3, TH8: 4

Size: 3x3

**Statistics - Normal Mode**

| Level | Damage per Second | Damage per Hit | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 20 | 400 | 5,000 | 30m | 42 | 3 |
| 2 | 5 | 25 | 450 | 25,000 | 1h | 60 | 4 |
| 3 | 6 | 30 | 500 | 90,000 | 2h | 84 | 5 |
| 4 | 7 | 35 | 550 | 180,000 | 3h | 103 | 6 |
| 5 | 9 | 45 | 600 | 300,000 | 6h | 146 | 7 |
| 6 | 11 | 55 | 650 | 500,000 | 8h | 169 | 8 |
| 7 | 15 | 75 | 700 | 900,000 | 12h | 207 | 9 |
| 8 | 20 | 100 | 800 | 1,200,000 | 18h | 254 | 10 |
| 9 | 25 | 125 | 950 | 1,600,000 | 20h | 268 | 11 |
| 10 | 30 | 150 | 1,100 | 1,800,000 | 1d | 293 | 11 |
| 11 | 35 | 175 | 1,300 | 2,300,000 | 1d 6h | 328 | 12 |
| 12 | 38 | 190 | 1,500 | 2,400,000 | 1d 12h | 360 | 12 |
| 13 | 42 | 210 | 1,700 | 2,800,000 | 2d | 415 | 13 |
| 14 | 48 | 240 | 1,950 | 4,300,000 | 2d 12h | 464 | 14 |
| 15 | 54 | 270 | 2,150 | 5,000,000 | 3d | 509 | 15 |
| 16 | 60 | 300 | 2,300 | 7,000,000 | 4d | 587 | 16 |
| 17 | 66 | 330 | 2,450 | 13,000,000 | 5d | 657 | 17 |
| 18 | 72 | 360 | 2,550 | 21,000,000 | 12d 12h | 1,039 | 18 |

**Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 4-11 | 5s | Splash (1.5 tiles) | Ground |

**Statistics - Burst Mode**

| Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | N/A | N/A | 400 | 5,000 | 30m | 42 | 3 |
| 2 | N/A | N/A | 450 | 25,000 | 1h | 60 | 4 |
| 3 | N/A | N/A | 500 | 90,000 | 2h | 84 | 5 |
| 4 | N/A | N/A | 550 | 180,000 | 3h | 103 | 6 |
| 5 | N/A | N/A | 600 | 300,000 | 6h | 146 | 7 |
| 6 | N/A | N/A | 650 | 500,000 | 8h | 169 | 8 |
| 7 | N/A | N/A | 700 | 900,000 | 12h | 207 | 9 |
| 8 | 25 | 41.6 | 800 | 1,200,000 | 18h | 254 | 10 |
| 9 | 30 | 51.58 | 950 | 1,600,000 | 20h | 268 | 11 |
| 10 | 37 | 63.23 | 1,100 | 1,800,000 | 1d | 293 | 11 |
| 11 | 42 | 71.55 | 1,300 | 2,300,000 | 1d 6h | 328 | 12 |
| 12 | 46 | 78.20 | 1,500 | 2,400,000 | 1d 12h | 360 | 12 |
| 13 | 51 | 86.52 | 1,700 | 2,800,000 | 2d | 415 | 13 |
| 14 | 58 | 98.17 | 1,950 | 4,300,000 | 2d 12h | 464 | 14 |
| 15 | 65 | 109.82 | 2,150 | 5,000,000 | 3d | 509 | 15 |
| 16 | 73 | 123.13 | 2,300 | 7,000,000 | 4d | 587 | 16 |
| 17 | 80 | 134.78 | 2,450 | 13,000,000 | 5d | 657 | 17 |
| 18 | 88 | 148.09 | 2,550 | 21,000,000 | 12d 12h | 1,039 | 18 |

**Statistics**

| Range | Attack Speed | Time Between Bursts | Shots Per Burst | Damage Type | Unit Type Targeted |
|---|---|---|---|---|---|
| 4-11 | 0.5s | 4.0s | 3 shots | Splash (1.5 tiles) | Ground |

**Supercharges - normal**

| Charge Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 75 | 375 | 2,550 | 9,000,000 | 4d | 509 | 18 |
| 2 | 75 | 375 | 2,625 | 7,000,000 | 6d | 720 | 18 |

**Supercharges - Burst**

| Charge Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 91 | 153.08 | 2,550 | 9,000,000 | 4d | 509 | 17 |
| 2 | 91 | 153.08 | 2,625 | 7,000,000 | 6d | 720 | 17 |

**Gear Up**

| Gear Up Cost | Gear Up Time | Home Village Mortar Level Required | Multi Mortar Level Required |
|---|---|---|---|
| 6,000,000 | 14d | 8 | 8 |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics / Normal Mode | hitpoints | 18 | 0 |
| Statistics / Normal Mode | cost | 18 | 0 |
| Statistics / Normal Mode | buildSeconds | 18 | 0 |
| Statistics / Normal Mode | townHall | 18 | 0 |
| Statistics / Normal Mode | xp | 18 | 0 |
| Statistics / Normal Mode | dps | 18 | 0 |
| Statistics / Normal Mode | damagePerHit | 18 | 0 |
| Statistics / Burst Mode | hitpoints | 18 | 0 |
| Statistics / Burst Mode | cost | 18 | 0 |
| Statistics / Burst Mode | buildSeconds | 18 | 0 |
| Statistics / Burst Mode | townHall | 18 | 0 |
| Statistics / Burst Mode | xp | 18 | 0 |
| Statistics / Burst Mode | dps | 1 | 10 |
| Statistics / Burst Mode | damagePerHit | 0 | 11 |
| Supercharges / normal | cost | 2 | 0 |
| Supercharges / normal | buildSeconds | 2 | 0 |
| Supercharges / normal | townHall | 2 | 0 |
| Supercharges / normal | hitpoints | 2 | 0 |
| Supercharges / normal | dps | 2 | 0 |
| Supercharges / Burst | cost | 2 | 0 |
| Supercharges / Burst | buildSeconds | 2 | 0 |
| Supercharges / Burst | townHall | 0 | 2 |
| Supercharges / Burst | hitpoints | 2 | 0 |
| Supercharges / Burst | dps | 0 | 2 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Mortar`): 16/16 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| damagePerHit | 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 | 8: 41.6; 9: 51.58; 10: 63.23; 11: 71.55; 12: 78.2; 13: 86.52; 14: 98.17; 15: 109.82 ... | 8: 37.5; 9: 46.5; 10: 57; 11: 64.5; 12: 70.5; 13: 78; 14: 88.5; 15: 99 ... | wiki table implies AltDPS x 4.992 s / 3 (5 s cycle); the wiki's own Feb 23, 2026 History quotes in-game per-shell displays (L9 46, L15 98, L17 120) that instead match the client cycle AltAttackSpeed 3.5 s + 2 x AltBurstDelay 0.5 s = 4.5 s (AltDPS x 1.5, floored after 16 ms tick rounding). The table is probably stale; client timing looks right |
| dps | 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 | 9: 30; 10: 37; 11: 42; 12: 46; 13: 51; 14: 58; 15: 65; 16: 73 ... | 9: 31; 10: 38; 11: 43; 12: 47; 13: 52; 14: 59; 15: 66; 16: 74 ... | display rounding: wiki shows floor of 3 x truncated per-hit / cycle; client AltDPS is 1 higher |
| townHall | C1, C2 | C1: 17; C2: 17 | C1: 18; C2: 18 | wiki typo (17) in the burst supercharge table; normal table and client say TH18 |
| dps | C1, C2 | C1: 91; C2: 91 | C1: 92; C2: 92 | burst charge DPS 91 = display of AltDPS 89 + 3 (client bonus applies to both modes) |

**Game table check** (`reference/full-client/progression.json` -> `mortar` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `AttackRange` 1100 / `MinAttackRange` 400 = 4-11 tiles; `AttackSpeed` 5000; `DamageRadius` 150 = 1.5 tiles; `Pushback` 100 with `PushbackHousingLimit` 3 (only troops up to 3 housing space are pushed; value in 1/100 tile).
- Normal per-shell damage = `DPS` x 5 matches all 18 levels.
- Burst: `AltDPS`, `AltAttackSpeed` 3500, `AltCoolDownOverride` 3000, `AltBurstCount` 3, `AltBurstDelay` 500, `AltAttackRange` 1100. The Cannon-style cycle (AltAttackSpeed + (count-1) x delay = 4.5 s) reproduces the in-game per-shell values quoted in the page History (46/98/120) but not the page's statistics table (5 s cycle). This is the main parity risk for geared-up Mortar timing; `AltCoolDownOverride` (unique to the Mortar) may matter for the wind-up.
- Supercharge: `MiniLevels` = `Mortar Mini Levels`; mini-level values are cumulative bonuses on top of the max level (charge 1 DPS +3, charge 2 Hitpoints +75 while DPS +3 is inherited). `RequiredTownHallLevel` 18, costs 9M / 7M Gold, 4d / 6d.
- Gear Up: `GearUpBuilding` BB Multi Mortar, `GearUpLevelRequirement` 7 (-> level 8), `GearUpCost` 6,000,000, `GearUpTime` 20160 min (14 d) on the level 8 row.
- progression.json has no burst-mode or knockback fields for the Mortar.
