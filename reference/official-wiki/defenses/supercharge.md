# Supercharge

- Source: [Supercharge](https://clashofclans.fandom.com/wiki/Supercharge) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `625336`; retrieved 2026-09-15
- Category: mechanic
- Client reference (18.400.21): `mini_levels.csv` -> `<Building> Mini Levels`

## Mechanics

- Supercharging lets a building at its current maximum level receive extra 'charges' instead of levels. It needs a free Builder (or B.O.B), costs resources and time (typically about half of the last level), and shows the boosted stats in cyan with a lightning-pip indicator and a blue electric aura around the building.
- Only available at the building's current max level (currently Town Hall 18). Eligible buildings at TH18: Mortar, Air Defense, Bomb Tower, Hidden Tesla, X-Bow, Inferno Tower, Scattershot, Builder's Hut, Monolith, Multi-Archer Tower, Ricochet Cannon, Multi-Gear Tower, Firespitter, Revenge Tower, Super Wizard Tower, Gold Mine, Elixir Collector, Dark Elixir Drill.
- Defenses get **2 charges**: charge 1 raises damage by about half a normal level, charge 2 raises hitpoints by about half a level (the Air Defense gets damage on both). Charge 1 costs more but is faster than charge 2. Resource collectors get **3 charges**: capacity, production rate, then hitpoints.
- Charges are wiped (without refund) when a new level or a merged version of that building is released; the process restarts at the new max level. A warning is shown on buildings whose next level is coming.
- Each completed charge awards 10 Sparky Stones (Fancy Shop currency), retroactively granted in the November 2025 update.
- The Mortar is the only building that can be both geared up and supercharged.
- Wiki-only display modes (Default / Supercharged / Discharged / Disabled / Depleting) are page templates, not game states - except that the game does show a depleting warning and a 'defenses lost their Supercharges' popup.

### Recent balance notes (from the page's History table)

- August 31, 2026: charges added back for Builder's Hut and Monolith (per their pages; not in client 18.400.21).
- June 16, 2026: charges added for X-Bow and Scattershot; removed from Monolith and Builder's Hut.
- April 27, 2026: charges added for Mortar, Hidden Tesla, Inferno Tower, Firespitter, Revenge Tower; removed from Scattershot and X-Bow.
- February 23, 2026: charges removed from Mortar, Hidden Tesla, Inferno Tower, Firespitter (new levels).

## Level table

Per-building charge comparison (wiki Supercharge page vs client `mini_levels.csv`; client effect columns are cumulative bonuses applied on top of the max level):

| Building | Charge | Wiki cost | Wiki time | Wiki TH | Client cost | Client time | Client TH | Resource | Client bonus (cumulative) | Linked | Match |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Mortar | 1 | 9,000,000 | 4d | 18 | 9,000,000 | 4d | 18 | Gold | DPS 3 | yes | yes |
| Mortar | 2 | 7,000,000 | 6d | 18 | 7,000,000 | 6d | 18 | Gold | DPS 3; Hitpoints 75 | yes | yes |
| Air Defense | 1 | 6,000,000 | 2d 18h | 18 | 6,000,000 | 2d 18h | 18 | Gold | DPS 20 | yes | yes |
| Air Defense | 2 | 3,000,000 | 4d 6h | 18 | 3,000,000 | 4d 6h | 18 | Gold | DPS 40 | yes | yes |
| Hidden Tesla | 1 | 12,000,000 | 4d 12h | 18 | 12,000,000 | 4d 12h | 18 | Gold | DPS 5 | yes | yes |
| Hidden Tesla | 2 | 8,000,000 | 6d 12h | 18 | 8,000,000 | 6d 12h | 18 | Gold | DPS 5; Hitpoints 50 | yes | yes |
| Bomb Tower | 1 | 6,000,000 | 2d 12h | 18 | 6,000,000 | 2d 12h | 18 | Gold | DPS 5 | yes | yes |
| Bomb Tower | 2 | 3,000,000 | 4d | 18 | 3,000,000 | 4d | 18 | Gold | DPS 5; Hitpoints 100 | yes | yes |
| X-Bow | 1 | 9,000,000 | 5d 12h | 18 | 14,000,000 | 5d 12h | 18 | Gold | DPS 10 | yes | NO |
| X-Bow | 2 | 7,000,000 | 7d 12h | 18 | 9,000,000 | 7d 12h | 18 | Gold | DPS 10; Hitpoints 100 | yes | NO |
| Inferno Tower | 1 | 13,000,000 | 5d | 18 | 13,000,000 | 5d | 18 | Gold | DPS 10; DPSLv2 20; DPSLv3 200 | yes | yes |
| Inferno Tower | 2 | 8,500,000 | 7d | 18 | 8,500,000 | 7d | 18 | Gold | DPS 10; DPSLv2 20; DPSLv3 200; Hitpoints 200 | yes | yes |
| Scattershot | 1 | 14,500,000 | 5d | 18 | 14,500,000 | 5d | 18 | Gold | DPS 3; ProjectileSpellDamageBoost 3 | yes | yes |
| Scattershot | 2 | 9,500,000 | 7d | 18 | 9,500,000 | 7d | 18 | Gold | DPS 3; Hitpoints 150; ProjectileSpellDamageBoost 3 | yes | yes |
| Builder's Hut | 1 | 10,000,000 | 4d | 18 | 10,000,000 | 4d | 17 | Gold | DPS 7 | no | NO |
| Builder's Hut | 2 | 8,000,000 | 6d | 18 | 5,000,000 | 6d | 17 | Gold | DPS 7; Hitpoints 50 | no | NO |
| Monolith | 1 | 220,000 | 5d | 18 | 150,000 | 5d | 17 | DarkElixir | DPS 10 | no | NO |
| Monolith | 2 | 200,000 | 7d | 18 | 130,000 | 7d | 17 | DarkElixir | DPS 10; Hitpoints 202 | no | NO |
| Multi-Archer Tower | 1 | 12,000,000 | 6d | 18 | 12,000,000 | 6d | 18 | Gold | DPS 5 | yes | yes |
| Multi-Archer Tower | 2 | 10,000,000 | 7d | 18 | 10,000,000 | 7d | 18 | Gold | DPS 5; Hitpoints 100 | yes | yes |
| Ricochet Cannon | 1 | 12,000,000 | 6d | 18 | 12,000,000 | 6d | 18 | Gold | DPS 8 | yes | yes |
| Ricochet Cannon | 2 | 10,000,000 | 7d | 18 | 10,000,000 | 7d | 18 | Gold | DPS 8; Hitpoints 150 | yes | yes |
| Multi-Gear Tower | 1 | 12,000,000 | 6d | 18 | 12,000,000 | 6d | 18 | Gold | DPS 10 | yes | yes |
| Multi-Gear Tower | 2 | 10,000,000 | 7d | 18 | 10,000,000 | 7d | 18 | Gold | DPS 10; Hitpoints 150 | yes | yes |
| Firespitter | 1 | 14,000,000 | 6d 12h | 18 | 14,000,000 | 6d 12h | 18 | Gold | DPS 18 | yes | yes |
| Firespitter | 2 | 12,000,000 | 7d 12h | 18 | 12,000,000 | 7d 12h | 18 | Gold | DPS 18; Hitpoints 250 | yes | yes |
| Revenge Tower | 1 | 220,000 | 7d | 18 | 220,000 | 7d | 18 | DarkElixir | SpecialAbilityLevelBuff 1;1;1;1 | yes | yes |
| Revenge Tower | 2 | 200,000 | 8d | 18 | 200,000 | 8d | 18 | DarkElixir | Hitpoints 100; SpecialAbilityLevelBuff 1;1;1;1 | yes | yes |
| Super Wizard Tower | 1 | 12,000,000 | 6d | 18 | 12,000,000 | 6d | 18 | Gold | DPS 7 | yes | yes |
| Super Wizard Tower | 2 | 14,000,000 | 7d | 18 | 14,000,000 | 7d | 18 | Gold | DPS 7; Hitpoints 150 | yes | yes |
| Gold Mine | 1 | 1,700,000 | 2d | 18 | 1,700,000 | 2d | 18 | Elixir | ResourceMax 16500; ResourcePer100Hours 29700 | yes | yes |
| Gold Mine | 2 | 1,500,000 | 3d | 18 | 1,500,000 | 3d | 18 | Elixir | ResourceMax 33000; ResourcePer100Hours 59400 | yes | yes |
| Gold Mine | 3 | 1,300,000 | 4d | 18 | 1,300,000 | 4d | 18 | Elixir | Hitpoints 50; ResourceMax 33000; ResourcePer100Hours 59400 | yes | yes |
| Elixir Collector | 1 | 1,700,000 | 2d | 18 | 1,700,000 | 2d | 18 | Gold | ResourceMax 16500; ResourcePer100Hours 29700 | yes | yes |
| Elixir Collector | 2 | 1,500,000 | 3d | 18 | 1,500,000 | 3d | 18 | Gold | ResourceMax 33000; ResourcePer100Hours 59400 | yes | yes |
| Elixir Collector | 3 | 1,300,000 | 4d | 18 | 1,300,000 | 4d | 18 | Gold | Hitpoints 50; ResourceMax 33000; ResourcePer100Hours 59400 | yes | yes |
| Dark Elixir Drill | 1 | 5,100,000 | 3d | 18 | 5,100,000 | 3d | 18 | Elixir | ResourceMax 207; ResourcePer100Hours 900 | yes | yes |
| Dark Elixir Drill | 2 | 4,500,000 | 4d | 18 | 4,500,000 | 4d | 18 | Elixir | ResourceMax 414; ResourcePer100Hours 1800 | yes | yes |
| Dark Elixir Drill | 3 | 3,900,000 | 5d | 18 | 3,900,000 | 5d | 18 | Elixir | Hitpoints 50; ResourceMax 414; ResourcePer100Hours 1800 | yes | yes |

**Defensive Buildings - Mortar - Normal Mode**

| Charge Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 75 | 375 | 2,550 | 9,000,000 | 4d | 509 | 18 |
| 2 | 75 | 375 | 2,625 | 7,000,000 | 6d | 720 | 18 |

**Defensive Buildings - Mortar - Burst Mode**

| Charge Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 91 | 153.08 | 2,550 | 9,000,000 | 4d | 509 | 17 |
| 2 | 91 | 153.08 | 2,625 | 7,000,000 | 6d | 720 | 17 |

**Defensive Buildings - Air Defense**

| Charge Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 720 | 720 | 2,000 | 6,000,000 | 2d 18h | 487 | 18 |
| 2 | 740 | 740 | 2,000 | 3,000,000 | 4d 6h | 605 | 18 |

**Defensive Buildings - Hidden Tesla**

| Charge Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 195 | 117 | 1,750 | 12,000,000 | 4d 12h | 623 | 18 |
| 2 | 195 | 117 | 1,800 | 8,000,000 | 6d 12h | 749 | 18 |

**Defensive Buildings - Bomb Tower**

| Charge Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 127 | 139.7 | 3,050 | 6,000,000 | 2d 12h | 464 | 18 |
| 2 | 127 | 139.7 | 3,150 | 3,000,000 | 4d | 587 | 18 |

**Defensive Buildings - X-Bow**

| Charge Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 255 | 32.64 | 5,000 | 9,000,000 | 5d 12h | 689 | 18 |
| 2 | 255 | 32.64 | 5,100 | 7,000,000 | 7d 12h | 804 | 18 |

**Defensive Buildings - Inferno Tower - Single-Target Mode**

| Charge | Damage per Second | Damage per Second | Damage per Second | Damage per Hit | Damage per Hit | Damage per Hit | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Charge | Initial | After 1.5s | After 5.25s | Initial | After 1.5s | After 5.25s | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
| 1 | 165 | 350 | 3,500 | 21.12 | 44.8 | 448 | 5,100 | 13,000,000 | 5d | 657 | 18 |
| 2 | 165 | 350 | 3,500 | 21.12 | 44.8 | 448 | 5,300 | 8,500,000 | 7d | 777 | 18 |

**Defensive Buildings - Inferno Tower - Multi-Target Mode**

| Charge Level | Damage per Second per Target | Damage per Hit | Number of Targets | HP | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 165 | 21.12 | 6 | 5,100 | 13,000,000 | 5d | 657 | 18 |
| 2 | 165 | 21.12 | 6 | 5,300 | 8,500,000 | 7d | 777 | 18 |

**Defensive Buildings - Scattershot**

| Charge | Damage per Second | Damage per Shot* | Splash Damage** | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 193 | 450-617.6 | 160-450 | 5,800 | 14,500,000 | 5d | 657 | 18 |
| 2 | 193 | 450-617.6 | 160-450 | 5,950 | 9,500,000 | 7d | 777 | 18 |

**Defensive Buildings - Builder's Hut**

| Charge Level | Damage per Second | Damage per Shot | Repair per Second | Repair per Hit | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 187 | 74.8 | 95 | 71.25 | 2,100 | 10,000,000 | 4d | 587 | 18 |
| 2 | 187 | 74.8 | 95 | 71.25 | 2,150 | 8,000,000 | 6d | 720 | 18 |

**Defensive Buildings - Builder's Hut**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 7 | 0.4s | Single Target | Ground & Air |

**Defensive Buildings - Monolith**

| Level | Base Damage per Second | Base Damage per Shot | Bonus Damage per Shot | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 235 | 352.5 | 15% | 5,959 | 220,000 | 5d | 657 | 18 |
| 2 | 235 | 352.5 | 15% | 6,161 | 200,000 | 7d | 777 | 18 |

**Defensive Buildings - Multi-Archer Tower**

| Charge Level | Damage per Second per Archer | Damage per Shot | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 126 | 76 | 5,500 | 12,000,000 | 6d | 720 | 18 |
| 2 | 126 | 76 | 5,600 | 10,000,000 | 7d | 777 | 18 |

**Defensive Buildings - Ricochet Cannon**

| Charge Level | Damage per Second | Damage per Shot (Primary Target) | Secondary Chain Damage | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 420 | 336 | 235.2 | 6,100 | 12,000,000 | 6d | 720 | 18 |
| 2 | 420 | 336 | 235.2 | 6,250 | 10,000,000 | 7d | 777 | 18 |

**Defensive Buildings - Multi-Gear Tower - Long-Range Mode**

| Level | Damage per Second | Damage per Hit | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 400 | 400 | 4,350 | 12,000,000 | 6d | 720 | 18 |
| 2 | 400 | 400 | 4,500 | 10,000,000 | 7d | 777 | 18 |

**Defensive Buildings - Multi-Gear Tower - Fast-Attack Mode**

| Level | Damage per Second* | Damage per Hit** | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 720 | 172.8 | 4,350 | 12,000,000 | 6d | 720 | 18 |
| 2 | 720 | 172.8 | 4,500 | 10,000,000 | 7d | 777 | 18 |

**Defensive Buildings - Firespitter**

| Charge Level | Damage per Second* | Damage per Hit** | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 473 | 53.08 | 5,300 | 14,000,000 | 6d 12h | 749 | 18 |
| 2 | 473 | 53.08 | 5,550 | 12,000,000 | 7d 12h | 804 | 18 |

**Defensive Buildings - Revenge Tower - Dormant**

| Charge | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|
| 1 | 6,200 | 220,000 | 7d | 777 | 18 |
| 2 | 6,300 | 200,000 | 8d | 831 | 18 |

**Defensive Buildings - Revenge Tower - Stage 1**

| Charge | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 425 | 510 | 6,200 | 220,000 | 7d | 777 | 18 |
| 2 | 425 | 510 | 6,300 | 200,000 | 8d | 831 | 18 |

**Defensive Buildings - Revenge Tower - Stage 2**

| Charge | Maximum Damage per Second | Damage per Shot (Primary) | Damage per Shot (Secondary) | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 433 | 260 | 156 | 6,200 | 220,000 | 7d | 777 | 18 |
| 2 | 433 | 260 | 156 | 6,300 | 200,000 | 8d | 831 | 18 |

**Defensive Buildings - Revenge Tower - Stage 3**

| Charge | Maximum Damage per Second | Damage per Shot (Primary) | Damage per Shot (Secondary) | Damage per Shot (Tertiary) | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 742 | 260 | 156 | 93.6 | 6,200 | 220,000 | 7d | 777 | 18 |
| 2 | 742 | 260 | 156 | 93.6 | 6,300 | 200,000 | 8d | 831 | 18 |

**Defensive Buildings - Super Wizard Tower**

| Charge Level | Damage per Second | Damage per Hit (Primary) | Damage per Hit (Secondary) | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 327 | 425.1 | 170.04 | 6,300 | 12,000,000 | 6d | 720 | 18 |
| 2 | 327 | 425.1 | 170.04 | 6,450 | 14,000,000 | 7d | 777 | 18 |

**Resource Buildings - Gold Mine**

| Charge Level | Capacity | Production Rate | Hitpoints | Boost Cost | Time to Fill | Build Cost | Build Time | Experience Gained | Catch-Up Point* | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 436,500 | 7,857/hr | 1,400 | 11 | 2d 7h 33m 20s | 1,700,000 | 2d | 415 | 50d 21h 49m 6s | 18 |
| 2 | 453,000 | 8,154/hr | 1,400 | 11 | 2d 7h 33m 20s | 1,500,000 | 3d | 509 | 79d 8h 43m 39s | 18 |
| 3 | 453,000 | 8,154/hr | 1,450 | 11 | 2d 7h 33m 20s | 1,300,000 | 4d | 587 | N/A | 18 |

**Resource Buildings - Elixir Collector**

| Charge Level | Capacity | Production Rate | Hitpoints | Boost Cost | Time to Fill | Build Cost | Build Time | Experience Gained | Catch-Up Point* | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 436,500 | 7,857/hr | 1,400 | 11 | 2d 7h 33m 20s | 1,700,000 | 2d | 415 | 50d 21h 49m 6s | 18 |
| 2 | 453,000 | 8,154/hr | 1,400 | 11 | 2d 7h 33m 20s | 1,500,000 | 3d | 509 | 79d 8h 43m 39s | 18 |
| 3 | 453,000 | 8,154/hr | 1,450 | 11 | 2d 7h 33m 20s | 1,300,000 | 4d | 587 | N/A | 18 |

**Resource Buildings - Dark Elixir Drill**

| Charge Level | Capacity | Production Rate | Hitpoints | Boost Cost | Time to Fill | Build Cost | Build Time | Experience Gained | Catch-Up Point* | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 4,807 | 209/hr | 1,600 | 55 | 23h | 5,100,000 | 3d | 509 | 66d 16h | 18 |
| 2 | 5,014 | 218/hr | 1,600 | 55 | 23h | 4,500,000 | 4d | 587 | 92d 21h 20m | 18 |
| 3 | 5,014 | 218/hr | 1,650 | 55 | 23h | 3,900,000 | 5d | 657 | N/A | 18 |

## Client comparison

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| cost | X-Bow C1, X-Bow C2 | X-Bow C1: 9000000; X-Bow C2: 7000000 | X-Bow C1: 14000000; X-Bow C2: 9000000 | wiki prices equal the Mortar's (9M/7M) - probable wiki copy error; client times/bonuses match |
| townHall | Builder's Hut C1, Builder's Hut C2, Monolith C1, Monolith C2 | Builder's Hut C1: 18; Builder's Hut C2: 18; Monolith C1: 18; Monolith C2: 18 | Builder's Hut C1: 17; Builder's Hut C2: 17; Monolith C1: 17; Monolith C2: 17 | client building row has no MiniLevels link (older unlinked mini row compared) |
| cost | Builder's Hut C2, Monolith C1, Monolith C2 | Builder's Hut C2: 8000000; Monolith C1: 220000; Monolith C2: 200000 | Builder's Hut C2: 5000000; Monolith C1: 150000; Monolith C2: 130000 | client building row has no MiniLevels link (older unlinked mini row compared) |
| MiniLevels link | Builder's Hut, Monolith | Builder's Hut: supercharges available; Monolith: supercharges available | Builder's Hut: Builders Hut rows have no MiniLevels; Monolith: Monolith rows have no MiniLevels | added on the live game after the client snapshot (Aug 31, 2026 for Builder's Hut and Monolith) |

**Interpretation of client columns**

- Building rows link charges through `MiniLevels` = `<Building> Mini Levels` (set on level 1 and inherited, but only meaningful at max level).
- mini_levels.csv columns: `TargetBuilding`, `RequiredTownHallLevel`, `BuildResource`, `BuildCost`, `BuildTimeD/H/M/S`, and effect columns that are **cumulative** (charge 2 inherits charge 1's DPS bonus): `DPS` (also added to AltDPS for gear-up modes), `DPSLv2`/`DPSLv3` (Inferno ramp), `Hitpoints`, `ResourceMax`/`ResourcePer100Hours` (collectors), `SpecialAbilityLevelBuff` (Revenge Tower stages), `ProjectileSpellDamageBoost` (Scattershot).
- Unlinked rows `Builders Hut Mini Levels` and `Monolith Mini Levels` (RequiredTownHallLevel 17, with `PriceDiscountPercentage`/`TimeDiscountPercentage`) are leftovers of the earlier TH17 supercharges; `Wizard Tower Mini Levels` has RequiredTownHallLevel 100 (disabled).
- globals `SUPERCHARGE_UPGRADE_REWARD` 10 = Sparky Stones per charge.
