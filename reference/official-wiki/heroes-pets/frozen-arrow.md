# Frozen Arrow

- **Source:** https://clashofclans.fandom.com/wiki/Frozen_Arrow
- **Wiki revision:** 621294 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Archer Queen
- **Client record:** `character_items.csv` → `Frozen Arrow`

> Queen Epic passive item: every hit slows the target 25% → 65% for 0.75 → 3 s; passive DPS.

## Mechanics

- Epic equipment for the Archer Queen; ability type **Passive**; unlock/obtain: Buy in Dragon Festival event for 3,100 Dragon Medal; Buy in Toyshop Throwdown event for 3,100 Toy Medal; Buy in Cosmic Rock event for 3,100 Rock Medal; But in Equipment Blast event for 3,100 Relic Medal; Purchasable from the Trader for 1,500 Gem; or purchasable from the League Shop for 750 Medal.
- Levels 1–27. Blacksmith level required by equipment level: 1–12 → 1; 13–15 → 3; 16–18 → 5; 19–21 → 7; 22–24 → 8; 25–27 → 9.
- Total ore from level 1 to max (sum of wiki costs): 56,060 Shiny Ore, 3,720 Glowy Ore, 480 Starry Ore.
- Per-level stats (level 1 → max): Slow Down 25% → 65%; Slow Down Duration 0.75 s → 3 s; Damage per Second Increase 35 → 168.
- Passive ability: each Queen attack applies a slow to the target (defenses, defending heroes and troops): 25% for 0.75 s at level 1, growing every level to 65% for 3 s at level 27.
- The frost wears off quickly once she stops targeting that unit. Slowed units that die also play their death animation slowly (effects still happen on time).
- Passive: +35 → +168 DPS.
- Obtain: 3,100 event medals (Dragon Festival, Toyshop Throwdown, Cosmic Rock, Equipment Blast), Trader for 1,500 gems, or League Shop for 750 medals.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Slow Down | Ability Attributes / Slow Down Duration | Hero Boosts / Damage per Second Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Upgrade Cost / Starry Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 25% | 0.75s | 35 | N/A | N/A | N/A | 1 |
| 2 | 25% | 1.00s | 40 | 120 | - | - | 1 |
| 3 | 30% | 1.00s | 45 | 240 | 20 | - | 1 |
| 4 | 30% | 1.00s | 50 | 400 | - | - | 1 |
| 5 | 30% | 1.25s | 55 | 600 | - | - | 1 |
| 6 | 35% | 1.25s | 60 | 840 | 100 | - | 1 |
| 7 | 35% | 1.25s | 66 | 1,120 | - | - | 1 |
| 8 | 35% | 1.50s | 72 | 1,440 | - | - | 1 |
| 9 | 37% | 1.50s | 78 | 1,800 | 200 | 10 | 1 |
| 10 | 37% | 1.50s | 85 | 1,900 | - | - | 1 |
| 11 | 37% | 1.75s | 92 | 2,000 | - | - | 1 |
| 12 | 40% | 1.75s | 99 | 2,100 | 400 | 20 | 1 |
| 13 | 40% | 1.75s | 105 | 2,200 | - | - | 3 |
| 14 | 40% | 2.00s | 111 | 2,300 | - | - | 3 |
| 15 | 45% | 2.00s | 117 | 2,400 | 600 | 30 | 3 |
| 16 | 45% | 2.00s | 122 | 2,500 | - | - | 5 |
| 17 | 45% | 2.25s | 127 | 2,600 | - | - | 5 |
| 18 | 50% | 2.25s | 132 | 2,700 | 600 | 50 | 5 |
| 19 | 50% | 2.25s | 136 | 2,800 | - | - | 7 |
| 20 | 50% | 2.50s | 140 | 2,900 | - | - | 7 |
| 21 | 55% | 2.50s | 144 | 3,000 | 600 | 100 | 7 |
| 22 | 55% | 2.50s | 148 | 3,100 | - | - | 8 |
| 23 | 55% | 2.75s | 152 | 3,200 | - | - | 8 |
| 24 | 60% | 2.75s | 156 | 3,300 | 600 | 120 | 8 |
| 25 | 60% | 2.75s | 160 | 3,400 | - | - | 9 |
| 26 | 60% | 3.00s | 164 | 3,500 | - | - | 9 |
| 27 | 65% | 3.00s | 168 | 3,600 | 600 | 150 | 9 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Archer Queen |
| Ability Type | Passive |
| Rarity | Epic |
| Unlock Requirement | Buy in Dragon Festival event for 3,100 Dragon Medal; Buy in Toyshop Throwdown event for 3,100 Toy Medal; Buy in Cosmic Rock event for 3,100 Rock Medal; But in Equipment Blast event for 3,100 Relic Medal; Purchasable from the Trader for 1,500 Gem; or purchasable from the League Shop for 750 Medal |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `slowDownPercent` = `MainAbilities:special_abilities[ArcherQueenAttackFreeze].FrostOnHitPercent` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `slowDownDurationSeconds` = `MainAbilities:special_abilities[ArcherQueenAttackFreeze].FrostOnHitTime` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client milliseconds ÷ 1000)

**Client columns and interpretation notes**

- `special_abilities[ArcherQueenAttackFreeze]` (one row per item level): `FrostOnHitPercent`, `FrostOnHitTime` (ms), `Projectile=QueenFrostyProjectile` (speed 1650).
- The client uses the generic frost-on-hit mechanism (the same columns as Frosty); whether it slows attack rate as well as movement is not stated on the wiki.

**Mismatches / ambiguities**

- `slowScope`: wiki **'slow down' targets** vs client **FrostOnHitPercent/FrostOnHitTime (frost effect)** — whether defenses' attack rate is reduced too must be verified
