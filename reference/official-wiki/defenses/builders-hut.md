# Builder's Hut

- Source: [Builder's Hut](https://clashofclans.fandom.com/wiki/Builder%27s_Hut) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `625149`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Builders Hut` (8 levels)

## Mechanics

- Up to 5 Builder's Huts (the first is pre-built, the second comes from the tutorial, the others cost 500 / 1,000 / 2,000 Gems). Footprint 2x2. Level 1 has 250 HP and no attack.
- Weaponizing: from Town Hall 14 a hut can be upgraded to level 2+ (Gold), adding a short-range turret: range 7 tiles, one shot every 0.4 s, single target, ground and air. DPS 80 at level 2 up to 180 at level 8 (per shot = DPS x 0.4).
- A weaponized hut counts as a defensive building for troop targeting (Giants etc.). Like the Town Hall weapons it must 'activate' at battle start, so a hut that is upgrading is not treated as a defense.
- Repairing Builder: during a defense the hut's Builder repairs damaged buildings around the hut (7-tile area): one repair every 0.75 s, 50 HP/s at level 2 up to 95 HP/s at level 8 (37.5-71.25 per hit), movement speed 20. He cannot repair Walls or destroyed buildings, cannot be attacked, and hides in a bunker once his hut is destroyed.
- Spell interactions with the Builder: defensive Rage (Spell Tower, Smasher, defending Super Valkyrie) raises repair and move speed; attacking Poison slows repair; Freeze stops it; Lightning/Totem stun him and force a re-target; Invisibility or Overgrowth on buildings stops him repairing them.
- Several Builders on one building stack with diminishing returns: 3rd and 4th builder add 90%, the 5th adds 70% (overall 96.7% / 95% / 90% efficiency).
- Huts are not required for Town Hall upgrades.
- Supercharge (TH18 at level 8, added August 31, 2026): charge 1 +7 DPS (187 / 74.8), charge 2 +50 HP (2,150); repair unchanged.

### Recent balance notes (from the page's History table)

- August 31, 2026: 2 Supercharge levels added (not in client 18.400.21).
- June 16, 2026: level 8 added (supercharges on level 7 removed).
- January 28, 2025: repairing Builder movement speed 28 -> 20.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH1: 5, TH14: 5*

Size: 2x2

**Statistics**

| Level | Damage per Second | Damage per Shot | Repair per Second | Repair per Hit | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|
| 1 | N/A | N/A | N/A | N/A | 250 | Varies** | None | 0 | 1 |
| 2 | 80 | 32 | 50 | 37.5 | 1,000 | 3,000,000 | 2d | 415 | 14 |
| 3 | 100 | 40 | 60 | 45 | 1,300 | 4,000,000 | 3d | 509 | 14 |
| 4 | 120 | 48 | 70 | 52.5 | 1,600 | 6,000,000 | 4d | 587 | 14 |
| 5 | 135 | 54 | 80 | 60 | 1,800 | 7,000,000 | 5d | 657 | 15 |
| 6 | 150 | 60 | 85 | 63.75 | 1,900 | 8,000,000 | 5d 12h | 689 | 16 |
| 7 | 165 | 66 | 90 | 67.5 | 2,000 | 15,500,000 | 7d | 777 | 17 |
| 8 | 180 | 72 | 95 | 71.25 | 2,100 | 24,000,000 | 13d | 1,059 | 18 |

**Supercharges**

| Charge Level | Damage per Second | Damage per Shot | Repair per Second | Repair per Hit | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 187 | 74.8 | 95 | 71.25 | 2,100 | 10,000,000 | 4d | 587 | 18 |
| 2 | 187 | 74.8 | 95 | 71.25 | 2,150 | 8,000,000 | 6d | 720 | 18 |

**Supercharges**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 7 | 0.4s | Single Target | Ground & Air |

**Builder Statistics**

| Range | Repair Speed | Movement Speed | Unit Type Targeted |
|---|---|---|---|
| 7 | 0.75s | 20 | Buildings |

**Builder Statistics**

| Builder's Hut | Build Cost |
|---|---|
| First | N/A |
| Second | Free |
| Third | 500 |
| Fourth | 1,000 |
| Fifth | 2,000 |

**Effectiveness of Multiple Builders**

| Total Number of Builders | Effectiveness of Additional Builder | Overall Efficiency |
|---|---|---|
| 1 | 100% | 100% |
| 2 | 100% | 100% |
| 3 | 90% | 96.7% |
| 4 | 90% | 95% |
| 5 | 70% | 90% |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 8 | 0 |
| Statistics | townHall | 8 | 0 |
| Statistics | xp | 8 | 0 |
| Statistics | cost | 7 | 0 |
| Statistics | buildSeconds | 7 | 0 |
| Statistics | dps | 7 | 0 |
| Statistics | damagePerHit | 7 | 0 |
| Statistics | repairPerSecond | 7 | 0 |
| Statistics | repairPerHit | 7 | 0 |
| Supercharges | cost | 1 | 1 |
| Supercharges | buildSeconds | 2 | 0 |
| Supercharges | townHall | 0 | 2 |
| Supercharges | hitpoints | 2 | 0 |
| Supercharges | dps | 2 | 0 |
| Supercharges | supercharge link | - | client Builders Hut max level has no MiniLevels link; values below compare against the unlinked row 'Builders Hut Mini Levels' |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Builders Hut`): 18/18 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| supercharge | all | available at max level | not linked from building row | Aug 31, 2026 charges are newer than the client snapshot |
| townHall | C1, C2 | C1: 18; C2: 18 | C1: 17; C2: 17 | unlinked client mini row says TH17 (older supercharge); live charges need TH18 |
| cost | C2 | 8000000 | 5000000 | unlinked client mini row charge 2 costs 5M (wiki 8M) and carries price/time discount percentages from the older TH17 supercharge |

**Game table check** (`reference/full-client/progression.json` -> `builder` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `BuildingClass` Worker with `ActivatedCombatAddBuildingClass` Defense: the hut becomes a defense only when combat activates. `WakeUpSpace` 1 and `WakeUpSpeed` 1600 on levels 2+ give the pop-up activation.
- Turret: `AttackRange` 700, `AttackSpeed` 400, `DPS` 80..180 (levels 2-8), air+ground - all match.
- Repair: `DefenceTroopCharacter` = `Defending Builder`, `DefenceTroopCount` 1, `DefenceTroopLevel` = hut level - 1. In characters.csv the Defending Builder has negative `DPS` (-50..-95 = repair per second), `AttackSpeed` 750 ms, `AttackRange` 50 and `Speed` 250 (= wiki speed 20 on the x12.5 troop speed scale). Repair per second and per hit match all levels.
- Level 1 `BuildResource` Diamonds with `BuildCost` 0: gem prices of huts 3-5 are not in this row.
- The multi-builder efficiency curve is not a column here (engine healing-stack rule).
- Supercharge: the client building rows have no `MiniLevels` link; `Builders Hut Mini Levels` exists but is the older TH17 version (with PriceDiscountPercentage/TimeDiscountPercentage).
