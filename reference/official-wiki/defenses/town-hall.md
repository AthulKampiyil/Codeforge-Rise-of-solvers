# Town Hall

- Source: [Town Hall](https://clashofclans.fandom.com/wiki/Town_Hall) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624170`; retrieved 2026-09-15
- Category: building
- Client reference (18.400.21): `buildings.csv` -> `Town Hall` (18 levels)

## Mechanics

- Footprint 4x4; one per base. Destroying it grants the attacker a star (and a win) regardless of other destruction. It stores Gold/Elixir (and Dark Elixir from TH7) that can only be looted by destroying it; as a storage it is immune to Lightning but not Earthquake.
- Hitpoints: 400 (TH1) up to 10,800 (TH18). Upgrades require all buildings placed; from TH17 all merged defenses must be merged (Ricochet Cannons, Multi-Archer Towers, Multi-Gear Tower, Super Wizard Towers, and the Eagle Artillery into the TH17 weapon).
- Weapons by level: TH12 Giga Tesla; TH13-16 Giga Inferno (versions); TH17 Inferno Artillery (built by merging TH16 with a level 7 Eagle Artillery); TH18 has **no weapon** and is instead defended by a selected Guardian (Longshot, Smasher or Logger), so a TH18 Town Hall is no longer a defensive building.
- Giga weapons (TH12-16) activate only when the Town Hall takes damage (troop or spell) or when the base reaches 51% destruction - not when troops enter range. Until then the Town Hall is not a 'defense' for defense-targeting troops. While the weapon is being upgraded it neither fires nor explodes and is not treated as a defense.
- The Inferno Artillery (TH17) activates automatically at battle start; during its short arming animation it is not yet a defensive building.
- Upgrade boosts after a Town Hall upgrade (TH4+): Power, Resource (2x collectors) and Star Bonus (4x) boosts, plus Hero Boost from TH8; lasting 3 days (TH4-6), 4 days (TH7-9) or 5 days (TH10+), starting at next login and extending if another upgrade finishes.
- Loot available in the Town Hall (wiki table): e.g. TH11-13 2,000,000 Gold/Elixir and 20,000 Dark Elixir; TH18 5,000,000 / 50,000.

### Recent balance notes (from the page's History table)

- November 17, 2025 (TH18 update): TH18 added; the weapon is replaced by Guardians.
- October 6, 2025: Giga Tesla/Giga Inferno weapon levels removed (single fixed stats per TH).

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH1: 1

Size: 4x4

**Statistics**

| TH Level | Hitpoints | Build Cost | Build Time | Experience Gained | Maximum Number of Buildings Available* | Maximum Number of Traps Available |
|---|---|---|---|---|---|---|
| 1 | 400 | N/A | N/A | N/A | 13 | N/A |
| 2 | 800 | 1,000 | 10s | 3 | 17 | N/A |
| 3 | 1,600 | 4,000 | 30m | 42 | 25 | 2 |
| 4 | 2,000 | 25,000 | 3h | 103 | 29 | 4 |
| 5 | 2,400 | 150,000 | 6h | 146 | 36 | 8 |
| 6 | 2,800 | 500,000 | 12h | 207 | 42 | 11 |
| 7 | 3,300 | 1,000,000 | 18h | 254 | 54 | 15 |
| 8 | 3,900 | 2,000,000 | 1d | 293 | 64 | 23 |
| 9 | 4,600 | 2,500,000 | 2d | 415 | 77 | 26 |
| 10 | 5,500 | 3,500,000 | 3d | 509 | 84 | 30 |
| 11 | 6,800 | 4,000,000 | 5d | 657 | 89 | 31 |
| 12 | 7,500 | 6,000,000 | 6d | 720 | 92 | 36 |
| 13 | 8,200 | 9,000,000 | 7d | 777 | 94 | 39 |
| 14 | 8,900 | 12,000,000 | 7d 12h | 804 | 95 | 44 |
| 15 | 9,600 | 13,000,000 | 8d | 831 | 98 | 44 |
| 16 | 10,000 | 15,000,000 | 9d | 881 | 94 | 44 |
| 17 | 10,400 | 16,000,000 | 10d | 929 | 93 | 47 |
| 18 | 10,800 | 25,000,000 | 12d | 1,018 | 94 | 47 |

**Storage Capacity of the Town Hall**

| TH Level | Gold Available | Elixir Available | Dark Elixir Available |
|---|---|---|---|
| 1 | 1,000 | 1,000 | - |
| 2 | 2,500 | 2,500 | - |
| 3 | 10,000 | 10,000 | - |
| 4 | 50,000 | 50,000 | - |
| 5 | 100,000 | 100,000 | - |
| 6 | 300,000 | 300,000 | - |
| 7 | 500,000 | 500,000 | 2,500 |
| 8 | 750,000 | 750,000 | 5,000 |
| 9 | 1,000,000 | 1,000,000 | 10,000 |
| 10 | 1,500,000 | 1,500,000 | 20,000 |
| 11-13 | 2,000,000 | 2,000,000 | 20,000 |
| 14-15 | 3,000,000 | 3,000,000 | 30,000 |
| 16-17 | 4,000,000 | 4,000,000 | 40,000 |
| 18 | 5,000,000 | 5,000,000 | 50,000 |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 18 | 0 |
| Statistics | cost | 17 | 0 |
| Statistics | buildSeconds | 17 | 0 |
| Statistics | xp | 17 | 0 |
| Storage Capacity of the Town Hall | goldAvailable | 11 | 0 |
| Storage Capacity of the Town Hall | elixirAvailable | 11 | 0 |
| Storage Capacity of the Town Hall | darkElixirAvailable | 5 | 0 |

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| Weapon (inherited) | 18 | no weapon; Guardians defend | row has no Weapon value -> forward inheritance yields Townhall17; HousesGuardians TRUE | do not inherit Weapon/MergeRequirement/ActivateAfterSeconds into TH18; weapons.csv 'Townhall18' (a TH18Heal healing weapon, DPS -600, range 20) exists but is not referenced by the TH18 row |
| activation destruction % | 12-16 | 51% | globals HIDDEN_BUILDING_APPEAR_DESTRUCTION_PERCENTAGE 50 | probably 'more than 50%' in code; same rule reveals Hidden Teslas |

**Game table check** (`reference/full-client/progression.json` -> `townhall` vs wiki): 1 discrepancies.

| Field | Level | Wiki | progression.json | Note |
|---|---|---|---|---|
| weapon | 18 | no weapon (Guardians) | dps 40, rate 3.5, range 12, merge 'Eagle Artillery:7:0' | forward inheritance copies the TH17 Weapon/MergeRequirement onto TH18 (its row leaves them blank); the live TH18 has no weapon and no merge requirement |

**Interpretation of client columns**

- `Hitpoints`, `BuildCost`, build time match TH2-18. `TownHallLevel` on the Town Hall rows is the previous TH (TH n requires TH n-1).
- Loot: `MaxStoredGold`/`MaxStoredElixir`/`MaxStoredDarkElixir` equal the wiki's 'available resources' table; `PercentageStoredDarkElixir` 20.
- Weapons: `Weapon` = Townhall12 ... Townhall17 (weapons.csv). TH12-16 rows: `ActivateCombatOnDamageTaken` 1 and `CombatActivationDelay` 500 ms. TH17: `ActivateCombatOnDamageTaken` 0, `ActivateAfterSeconds` 1, `MergeRequirement` `Eagle Artillery:7:0`, `Animation` TownHall17.
- TH18: `HousesGuardians` TRUE, `DefenderZ` 190, no weapon keys (see the inheritance pitfall above). Guardians are in guardians.csv (see town-hall-guardians.md).
- `DestructionXP` = TH level; `ActivatedCombatAddBuildingClass` adds the Defense class when the weapon activates.
- The 51% activation threshold is the global `HIDDEN_BUILDING_APPEAR_DESTRUCTION_PERCENTAGE` 50 (shared with Hidden Teslas).
