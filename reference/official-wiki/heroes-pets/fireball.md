# Fireball

- **Source:** https://clashofclans.fandom.com/wiki/Fireball
- **Wiki revision:** 621036 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Grand Warden
- **Client record:** `character_items.csv` → `Fireball`

> Warden Epic active item: a fireball at the nearest defense (any range) dealing 1,500 → 4,100 splash damage in a 4 → 6 tile radius; passive DPS.

## Mechanics

- Epic equipment for the Grand Warden; ability type **Active**; unlock/obtain: Buy in Super Dragon Spotlight event for 3,100 Super Medal; Buy in Toyshop Throwdown event for 3,100 Toy Medal; Buy in Cosmic Rock event for 3,100 Rock Medal; Buy in Equipment Blast event for 3,100 Relic Medal; Buy in Wise Warriors event for 3,100 Grumpy Medal; or purchasable from the Trader for 1,500 Gem.
- Levels 1–27. Blacksmith level required by equipment level: 1–12 → 1; 13–15 → 3; 16–18 → 5; 19–21 → 7; 22–24 → 8; 25–27 → 9.
- Total ore from level 1 to max (sum of wiki costs): 56,060 Shiny Ore, 3,720 Glowy Ore, 480 Starry Ore.
- Per-level stats (level 1 → max): Damage Radius 4 tiles → 6 tiles; Projectile Damage 1,500 → 4,100; Damage per Second Increase 21 → 101.
- Ability: the Warden throws a fireball at the closest defense regardless of distance (if none, the closest ground or air target). It explodes for 1,500 damage at level 1 up to 4,100 at level 27, with radius 4 tiles (levels 1–8), 5 (9–23) or 6 (24–27), hitting ground and air units and buildings.
- With no valid target (everything invisible/overgrown) it rises and explodes where the Warden stood, still dealing splash damage.
- Passive: +21 → +101 DPS.
- Obtain: 3,100 event medals (Super Dragon Spotlight, Toyshop Throwdown, Cosmic Rock, Equipment Blast, Wise Warriors) or 1,500 gems at the Trader.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Damage Radius | Ability Attributes / Projectile Damage | Hero Boosts / Damage per Second Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Upgrade Cost / Starry Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 4 tiles | 1,500 | 21 | N/A | N/A | N/A | 1 |
| 2 | 4 tiles | 1,500 | 24 | 120 | - | - | 1 |
| 3 | 4 tiles | 1,700 | 27 | 240 | 20 | - | 1 |
| 4 | 4 tiles | 1,700 | 30 | 400 | - | - | 1 |
| 5 | 4 tiles | 1,800 | 33 | 600 | - | - | 1 |
| 6 | 4 tiles | 1,950 | 36 | 840 | 100 | - | 1 |
| 7 | 4 tiles | 1,950 | 40 | 1,120 | - | - | 1 |
| 8 | 4 tiles | 2,050 | 44 | 1,440 | - | - | 1 |
| 9 | 5 tiles | 2,200 | 47 | 1,800 | 200 | 10 | 1 |
| 10 | 5 tiles | 2,200 | 51 | 1,900 | - | - | 1 |
| 11 | 5 tiles | 2,350 | 56 | 2,000 | - | - | 1 |
| 12 | 5 tiles | 2,650 | 60 | 2,100 | 400 | 20 | 1 |
| 13 | 5 tiles | 2,650 | 63 | 2,200 | - | - | 3 |
| 14 | 5 tiles | 2,750 | 67 | 2,300 | - | - | 3 |
| 15 | 5 tiles | 3,100 | 71 | 2,400 | 600 | 30 | 3 |
| 16 | 5 tiles | 3,100 | 74 | 2,500 | - | - | 5 |
| 17 | 5 tiles | 3,250 | 77 | 2,600 | - | - | 5 |
| 18 | 5 tiles | 3,400 | 80 | 2,700 | 600 | 50 | 5 |
| 19 | 5 tiles | 3,400 | 82 | 2,800 | - | - | 7 |
| 20 | 5 tiles | 3,500 | 84 | 2,900 | - | - | 7 |
| 21 | 5 tiles | 3,650 | 87 | 3,000 | 600 | 100 | 7 |
| 22 | 5 tiles | 3,650 | 89 | 3,100 | - | - | 8 |
| 23 | 5 tiles | 3,750 | 92 | 3,200 | - | - | 8 |
| 24 | 6 tiles | 3,900 | 94 | 3,300 | 600 | 120 | 8 |
| 25 | 6 tiles | 3,900 | 96 | 3,400 | - | - | 9 |
| 26 | 6 tiles | 3,950 | 99 | 3,500 | - | - | 9 |
| 27 | 6 tiles | 4,100 | 101 | 3,600 | 600 | 150 | 9 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Grand Warden |
| Ability Type | Active |
| Rarity | Epic |
| Unlock Requirement | Buy in Super Dragon Spotlight event for 3,100 Super Medal; Buy in Toyshop Throwdown event for 3,100 Toy Medal; Buy in Cosmic Rock event for 3,100 Rock Medal; Buy in Equipment Blast event for 3,100 Relic Medal; Buy in Wise Warriors event for 3,100 Grumpy Medal; or purchasable from the Trader for 1,500 Gem |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `damageRadiusTiles` = `MainAbilities:special_abilities[GrandWardenFireball].DamageRadius` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client value ÷ 100 (1/100 tile or 1/100 unit))
- `projectileDamage` = `MainAbilities:special_abilities[GrandWardenFireball].Damage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)

**Client columns and interpretation notes**

- `special_abilities[GrandWardenFireball]` (27 rows): `Damage`, `DamageRadius` 400/500/600, `PreferedTargetBuildingClass=Defense`, `FightWithGroups=FALSE`, `DeactivateAfterNumberOfHits` 1, `DeactivateAfterTime` −1, `ProjectileOnActivation=vfx_chr_gw_Fireball_lvl1/2/3` (ballistic, `Speed` 1200, `HitsGroundAndAir=TRUE`).

**Mismatches / ambiguities**

- None found in the compared fields.
