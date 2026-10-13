# Rocket Spear

- **Source:** https://clashofclans.fandom.com/wiki/Rocket_Spear
- **Wiki revision:** 621041 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Royal Champion
- **Client record:** `character_items.csv` → `Rocket Spear`

> Champion Epic active item: her next 7 → 10 throws become 10-tile rocket spears at the closest defense with +350 → +980 damage and small splash; passive DPS and HP.

## Mechanics

- Epic equipment for the Royal Champion; ability type **Active**; unlock/obtain: Buy in Super Wall Breaker Spotlight event for 3,100 Super Medal; Buy in Snake Festival event for 3,100 Snake Medal; Buy in Equipment Blast event for 3,100 Relic Medal; Buy in Wise Warriors event for 3,100 Grumpy Medal; or purchasable from the Trader for 1,500 Gem.
- Levels 1–27. Blacksmith level required by equipment level: 1–12 → 1; 13–15 → 3; 16–18 → 5; 19–21 → 7; 22–24 → 8; 25–27 → 9.
- Total ore from level 1 to max (sum of wiki costs): 56,060 Shiny Ore, 3,720 Glowy Ore, 480 Starry Ore.
- Per-level stats (level 1 → max): Damage per Shot Increase 350 → 980; Number of Attacks 7 → 10; Damage per Second Increase 35 → 168; Hitpoint Increase 50 → 700.
- Ability: the following 7 attacks (levels 1–8), 8 (9–17), 9 (18–26) or 10 (27) are rocket-propelled spears thrown from 10 tiles at the closest defense; each adds +350 → +980 damage and splashes in a small radius (wiki 0.8 tiles).
- Passive: +35 → +168 DPS and +50 → +700 HP.
- Obtain: 3,100 event medals (Super Wall Breaker Spotlight, Snake Festival, Equipment Blast, Wise Warriors) or 1,500 gems at the Trader.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Damage per Shot Increase | Ability Attributes / Number of Attacks | Hero Boosts / Damage per Second Increase | Hero Boosts / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Upgrade Cost / Starry Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 350 | 7 | 35 | 50 | N/A | N/A | N/A | 1 |
| 2 | 350 | 7 | 40 | 75 | 120 | - | - | 1 |
| 3 | 420 | 7 | 45 | 100 | 240 | 20 | - | 1 |
| 4 | 420 | 7 | 50 | 125 | 400 | - | - | 1 |
| 5 | 420 | 7 | 55 | 150 | 600 | - | - | 1 |
| 6 | 490 | 7 | 60 | 175 | 840 | 100 | - | 1 |
| 7 | 490 | 7 | 66 | 200 | 1,120 | - | - | 1 |
| 8 | 490 | 7 | 72 | 225 | 1,440 | - | - | 1 |
| 9 | 560 | 8 | 78 | 250 | 1,800 | 200 | 10 | 1 |
| 10 | 560 | 8 | 85 | 275 | 1,900 | - | - | 1 |
| 11 | 560 | 8 | 92 | 300 | 2,000 | - | - | 1 |
| 12 | 630 | 8 | 99 | 325 | 2,100 | 400 | 20 | 1 |
| 13 | 630 | 8 | 105 | 350 | 2,200 | - | - | 3 |
| 14 | 630 | 8 | 111 | 375 | 2,300 | - | - | 3 |
| 15 | 700 | 8 | 117 | 400 | 2,400 | 600 | 30 | 3 |
| 16 | 700 | 8 | 122 | 425 | 2,500 | - | - | 5 |
| 17 | 700 | 8 | 127 | 450 | 2,600 | - | - | 5 |
| 18 | 770 | 9 | 132 | 475 | 2,700 | 600 | 50 | 5 |
| 19 | 770 | 9 | 136 | 500 | 2,800 | - | - | 7 |
| 20 | 770 | 9 | 140 | 525 | 2,900 | - | - | 7 |
| 21 | 840 | 9 | 144 | 550 | 3,000 | 600 | 100 | 7 |
| 22 | 840 | 9 | 148 | 575 | 3,100 | - | - | 8 |
| 23 | 840 | 9 | 152 | 600 | 3,200 | - | - | 8 |
| 24 | 910 | 9 | 156 | 625 | 3,300 | 600 | 120 | 8 |
| 25 | 910 | 9 | 160 | 650 | 3,400 | - | - | 9 |
| 26 | 910 | 9 | 164 | 675 | 3,500 | - | - | 9 |
| 27 | 980 | 10 | 168 | 700 | 3,600 | 600 | 150 | 9 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Royal Champion |
| Ability Type | Active |
| Rarity | Epic |
| Unlock Requirement | Buy in Super Wall Breaker Spotlight event for 3,100 Super Medal; Buy in Snake Festival event for 3,100 Snake Medal; Buy in Equipment Blast event for 3,100 Relic Medal; Buy in Wise Warriors event for 3,100 Grumpy Medal; or purchasable from the Trader for 1,500 Gem |
| Attack Range | 10 tiles |
| Area Damage Radius | 0.8 tiles |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `damagePerShotIncrease` = `MainAbilities:special_abilities[RocketSpears].ExtraDamageFlat` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `numberOfAttacks` = `MainAbilities:special_abilities[RocketSpears].DeactivateAfterNumberOfHits` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `Attack Range (10 tiles)`: `RocketSpears.AttackRange` 1005 (10.05 tiles)

**Client columns and interpretation notes**

- `special_abilities[RocketSpears]`: `AttackRange` 1005, `DamageRadius` 90, `ExtraDamageFlat` 350 → 980, `DeactivateAfterNumberOfHits` 7,7,7,8,8,8,9,9,9,10, `Projectile=RocketSpearProjectile` (ballistic, speed 1200).

**Mismatches / ambiguities**

- `Area Damage Radius`: wiki **0.8 tiles** vs client **DamageRadius 90 (0.9 tiles)** —
