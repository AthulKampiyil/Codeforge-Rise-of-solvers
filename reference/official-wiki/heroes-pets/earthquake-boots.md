# Earthquake Boots

- **Source:** https://clashofclans.fandom.com/wiki/Earthquake_Boots
- **Wiki revision:** 621771 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Barbarian King
- **Client record:** `character_items.csv` → `Earthquake Boots`

> King Common active item (Blacksmith 1): 8-tile earthquake that destroys Walls and damages buildings (10% → 40% max HP) and ground troops; passive DPS/HP.

## Mechanics

- Common equipment for the Barbarian King; ability type **Active**; unlock/obtain: Blacksmith level 1.
- Levels 1–18. Blacksmith level required by equipment level: 1–9 → 1; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Building Damage % 10% → 40%; Troop Damage % 5% → 20%; DPS Increase 13 → 102; Hitpoint Increase 209 → 2,500.
- Ability: an earthquake centred where the ability is used, radius 8 tiles (16-tile diameter); it instantly destroys Walls of any level and damages buildings and defending ground troops proportionally to their maximum hitpoints. Air units and air-only targets are unaffected.
- Total damage (wiki): buildings 10% (levels 1–2), 20% (3–5), 30% (6–8), 34% (9–11), 36% (12–14), 38% (15–17), 40% (18); troops listed as half of that (5% → 20%).
- Unlike Earthquake Spells, it also damages resource storages.
- It shares the Earthquake Spell diminishing rule in both directions: targets already hit by Earthquake Spells take reduced Boots damage and vice versa.
- Passive: +13 → +102 DPS and +209 → +2,500 HP; no recovery bonus.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Building Damage % | Troop Damage % | Hero Boosts / DPS Increase | Hero Boosts / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 10% | 5% | 13 | 209 | N/A | N/A | 1 |
| 2 | 10% | 5% | 15 | 244 | 120 | - | 1 |
| 3 | 20% | 10% | 17 | 278 | 240 | 20 | 1 |
| 4 | 20% | 10% | 19 | 313 | 400 | - | 1 |
| 5 | 20% | 10% | 21 | 348 | 600 | - | 1 |
| 6 | 30% | 15% | 23 | 383 | 840 | 100 | 1 |
| 7 | 30% | 15% | 26 | 418 | 1,120 | - | 1 |
| 8 | 30% | 15% | 28 | 452 | 1,440 | - | 1 |
| 9 | 34% | 17% | 32 | 522 | 1,800 | 200 | 1 |
| 10 | 34% | 17% | 40 | 677 | 1,900 | - | 3 |
| 11 | 34% | 17% | 48 | 831 | 2,000 | - | 3 |
| 12 | 36% | 18% | 55 | 986 | 2,100 | 400 | 3 |
| 13 | 36% | 18% | 63 | 1,200 | 2,200 | - | 5 |
| 14 | 36% | 18% | 71 | 1,500 | 2,300 | - | 5 |
| 15 | 38% | 19% | 79 | 1,800 | 2,400 | 600 | 5 |
| 16 | 38% | 19% | 86 | 2,100 | 2,500 | - | 7 |
| 17 | 38% | 19% | 94 | 2,300 | 2,600 | - | 7 |
| 18 | 40% | 20% | 102 | 2,500 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Barbarian King |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Blacksmith level 1 |
| Ability Radius | 8 tiles |
| Targets | Ground |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `dpsIncrease` = `character_items.DPS` (all levels)
- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `buildingDamagePercent`: = 5 pulses × `BuildingDamagePermil` ÷ 10 (10/20/30/34/36/38/40%) — all 18 levels match
- `Ability Radius (8 tiles)`: `spells[Earthquake Boots Spell].Radius` 800

**Client columns and interpretation notes**

- `special_abilities[BarbarianKingEarthquakeBoots]` casts `SelfSpell=Earthquake Boots Spell` at the tier level; `DeactivateAfterTime` 1 ms; `ExtraDamageTarget=Wall`, `ExtraDamagePercentageAgainstTarget` 400.
- `spells[Earthquake Boots Spell]`: `Radius` 800, `NumberOfHits` 5, `TimeBetweenHitsMS` 400, `ChargingTimeMS` 300, `HitTimeMS` 400, `DestroyWalls=TRUE`, per-pulse `BuildingDamagePermil` 20/40/60/68/72/76/80 and `TroopDamagePermil` 10/12/14/14/16/18/20; no `ImmunityStorages` flag (storages are hit).
- The spell-stacking reduction against Earthquake Spells is an engine rule not visible in these rows.

**Mismatches / ambiguities**

- `troopDamagePercent` (level 3): wiki **10%** vs client **6% (5 × 12‰)** — wiki appears to assume troop damage = half building damage; client TroopDamagePermil tiers 10/12/14/14/16/18/20
- `troopDamagePercent` (level 6): wiki **15%** vs client **7% (5 × 14‰)** — same pattern, levels 6–8
- `troopDamagePercent` (level 9): wiki **17%** vs client **7% (5 × 14‰)** — levels 9–11
- `troopDamagePercent` (level 12): wiki **18%** vs client **8% (5 × 16‰)** — levels 12–14
- `troopDamagePercent` (level 15): wiki **19%** vs client **9% (5 × 18‰)** — levels 15–17
- `troopDamagePercent` (level 18): wiki **20%** vs client **10% (5 × 20‰)** — level 18; only levels 1–2 (5%) agree
