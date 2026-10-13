# Blacksmith

- **Source:** https://clashofclans.fandom.com/wiki/Blacksmith
- **Wiki revision:** 624544 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** building
- **Client record:** `buildings.csv` → `Blacksmith`

> 3x3 building (TH8+) that stores ore and instantly upgrades hero equipment; its level caps equipment levels (Common 9→18, Epic 12→27) and unlocks Common equipment.

## Mechanics

- Construction: level 1 at TH8 (600,000 Elixir, 12 h) up to level 10 at TH17 (18,000,000 Elixir, 10 d). One per village, 3x3.
- Common equipment unlocked by level: 1 Earthquake Boots, 2 Giant Arrow, 3 Vampstache & Metal Pants, 4 Rage Gem, 5 Healer Puppet & Noble Iron, 6 Healing Tome, 7 Hog Rider Puppet, 8 Haste Vial, 9 Stun Blaster, 10 Electro Fangs. Each hero's two starting items need no Blacksmith.
- Maximum equipment level: Common 9 (levels 1–2), 12 (3–4), 15 (5–6), 18 (7+); Epic 12 (1–2), 15 (3–4), 18 (5–6), 21 (7), 24 (8), 27 (9–10).
- Ore capacity (Shiny/Glowy/Starry): 10,000/1,000/200 at level 1, +5,000/+500/+100 per level to 50,000/5,000/1,000 at level 9; level 10 adds no capacity.
- Equipment rules: every hero equips two items on attack; none on defense.
  - Items are Active (effect fires when the hero ability is used) or Passive (always on); a hero with two passive items still has an ability that only restores health.
  - Rarities: Common (default or Blacksmith unlocks, max 18) and Epic (event medals, later the Trader; max 27).
  - Upgrades cost ore only and complete instantly (no builder, no timer).
- The Blacksmith is immune to spell damage (wiki trivia).

## Level table

| Level | Equipment Unlocked | Hitpoints | Ore Capacity / Shiny Ore | Ore Capacity / Glowy Ore | Ore Capacity / Starry Ore | Maximum Equipment Level / Common | Maximum Equipment Level / Epic | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Earthquake Boots | 700 | 10,000 | 1,000 | 200 | 9 | 12 | 600,000 | 12h | 207 | 8 |
| 2 | Giant Arrow | 800 | 15,000 | 1,500 | 300 | 9 | 12 | 1,200,000 | 1d | 293 | 9 |
| 3 | Vampstache; Metal Pants | 900 | 20,000 | 2,000 | 400 | 12 | 15 | 2,300,000 | 2d | 415 | 10 |
| 4 | Rage Gem | 1,000 | 25,000 | 2,500 | 500 | 12 | 15 | 3,000,000 | 3d | 509 | 11 |
| 5 | Healer Puppet; Noble Iron | 1,100 | 30,000 | 3,000 | 600 | 15 | 18 | 5,000,000 | 4d | 587 | 12 |
| 6 | Healing Tome | 1,200 | 35,000 | 3,500 | 700 | 15 | 18 | 6,200,000 | 4d 12h | 623 | 13 |
| 7 | Hog Rider Puppet | 1,300 | 40,000 | 4,000 | 800 | 18 | 21 | 9,200,000 | 5d | 657 | 14 |
| 8 | Haste Vial | 1,400 | 45,000 | 4,500 | 900 | 18 | 24 | 10,000,000 | 6d | 720 | 15 |
| 9 | Stun Blaster | 1,500 | 50,000 | 5,000 | 1,000 | 18 | 27 | 11,000,000 | 7d | 777 | 16 |
| 10 | Electro Fangs | 1,600 | 50,000 | 5,000 | 1,000 | 18 | 27 | 18,000,000 | 10d | 929 | 17 |

## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpoints` = `buildings[Blacksmith]` `Hitpoints` (10 levels)
- `oreCapacityShinyOre` = `buildings[Blacksmith]` `MaxStoredCommonOre` (10 levels)
- `oreCapacityGlowyOre` = `buildings[Blacksmith]` `MaxStoredRareOre` (10 levels)
- `oreCapacityStarryOre` = `buildings[Blacksmith]` `MaxStoredEpicOre` (10 levels)
- `buildCost` = `buildings[Blacksmith]` `BuildCost` (+`BuildResource`) (10 levels)
- `buildTimeSeconds` = `buildings[Blacksmith]` `BuildTimeD/H/M/S` (10 levels)
- `experienceGained` = `buildings[Blacksmith]` floor(√(build seconds)) — derived, no XP column (10 levels)
- `townHallLevelRequired` = `buildings[Blacksmith]` `TownHallLevel` (10 levels)
- `maximumEquipmentLevelCommon/Epic` = highest `character_items.csv` level whose `RequiredBlacksmithLevel` ≤ Blacksmith level (Common 9/9/12/12/15/15/18/18/18/18, Epic 12/12/15/15/18/18/21/24/27/27)
- `equipmentUnlocked` = level-1 `RequiredBlacksmithLevel` of each named item

**Client columns and interpretation notes**

- `buildings.csv` → `Blacksmith`: `Blacksmith=TRUE`, `MaxStoredCommonOre/RareOre/EpicOre` per level (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry).
- Equipment gates: `character_items.csv` `RequiredBlacksmithLevel` on each item level row; the starting items also carry 1 but the hero page states they are available without a Blacksmith.
- Missing-ore gem prices: `globals` COMMON_ORE_DIAMOND_COST_1/10/100 (1/10/100 gems), RARE_ORE_DIAMOND_COST 5, EPIC_ORE_DIAMOND_COST 35 per ore.

**Mismatches / ambiguities**

- None found in the compared fields.
