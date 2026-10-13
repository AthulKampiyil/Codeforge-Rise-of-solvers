# Electro Fangs

- **Source:** https://clashofclans.fandom.com/wiki/Electro_Fangs
- **Wiki revision:** 624750 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Dragon Duke
- **Client record:** `character_items.csv` → `ElectroAttack`

> Duke Common passive item (Blacksmith 10): his attacks chain lightning to 1 → 4 extra nearby targets (330 → 400 damage, −20% per jump); passive HP.

## Mechanics

- Common equipment for the Dragon Duke; ability type **Passive**; unlock/obtain: Blacksmith level 10.
- Levels 1–18. Blacksmith level required by equipment level: 1 → none (starting level); 2–18 → 10.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Damage per Hit 330 → 400; Number of Targets 1 → 4; Hitpoint Increase 400 → 2,400.
- Passive ability: each Duke attack releases chain lightning from his target to nearby targets within 3 tiles: 1 extra target (levels 1–2), 2 (3–8), 3 (9–14), 4 (15–18). The first chained target takes the full ability damage (330 → 400), each further jump 20% less; his original target takes no extra damage, and nothing happens without a nearby second target.
- The chain damage is direct ability damage: not boosted by Rage, not changed by difficulty modifiers, and identical whether or not Royal Rampage is active.
- Passive: +400 → +2,400 HP.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Damage per Hit | Ability Attributes / Number of Targets | Hero Boosts / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|
| 1 | 330 | 1 | 400 | N/A | N/A | N/A |
| 2 | 330 | 1 | 650 | 120 | - | 10 |
| 3 | 340 | 2 | 850 | 240 | 20 | 10 |
| 4 | 340 | 2 | 1,000 | 400 | - | 10 |
| 5 | 340 | 2 | 1,150 | 600 | - | 10 |
| 6 | 350 | 2 | 1,300 | 840 | 100 | 10 |
| 7 | 350 | 2 | 1,450 | 1,120 | - | 10 |
| 8 | 350 | 2 | 1,600 | 1,440 | - | 10 |
| 9 | 360 | 3 | 1,750 | 1,800 | 200 | 10 |
| 10 | 360 | 3 | 1,900 | 1,900 | - | 10 |
| 11 | 360 | 3 | 2,000 | 2,000 | - | 10 |
| 12 | 370 | 3 | 2,100 | 2,100 | 400 | 10 |
| 13 | 370 | 3 | 2,200 | 2,200 | - | 10 |
| 14 | 370 | 3 | 2,275 | 2,300 | - | 10 |
| 15 | 380 | 4 | 2,325 | 2,400 | 600 | 10 |
| 16 | 380 | 4 | 2,375 | 2,500 | - | 10 |
| 17 | 380 | 4 | 2,400 | 2,600 | - | 10 |
| 18 | 400 | 4 | 2,400 | 2,700 | 600 | 10 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Dragon Duke |
| Ability Type | Passive |
| Rarity | Common |
| Unlock Requirement | Blacksmith level 10 |
| Chain Damage Decay | -20% |
| Chain Distance | 3 tiles |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `damagePerHit` = `MainAbilities:special_abilities[DD Electro Attack].Damage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `numberOfTargets`: = `ChainAttackDepth` − 1 (depth counts the original target) — all 18 levels match
- `Chain Damage Decay (−20%) / Chain Distance (3 tiles)`: `ChainAttackDamageReductionPercent` 20, `ChainAttackDistance` 300

**Client columns and interpretation notes**

- Client record name `ElectroAttack`.
- `special_abilities[DD Electro Attack]`: `Damage` 330/340/350/360/370/380/400, `ChainAttackDepth` 2/3/3/4/4/5/5, `ChainAttackDistance` 300, `ChainAttackDamageReductionPercent` 20, `ChainAttackDelay` 128 ms, `ChainAttackKeepOriginalDamageForInitialHit=TRUE`, `ChainAttackAllowMultipleChains=TRUE`.

**Mismatches / ambiguities**

- None found in the compared fields.
