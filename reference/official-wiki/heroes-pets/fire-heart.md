# Fire Heart

- **Source:** https://clashofclans.fandom.com/wiki/Fire_Heart
- **Wiki revision:** 624518 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Dragon Duke
- **Client record:** `character_items.csv` → `Fire Heart`

> Duke's starting passive item: a one-time 4-tile death explosion (1,000 → 3,000) and strong self-regeneration; passive DPS and HP.

## Mechanics

- Common equipment for the Dragon Duke; ability type **Passive**; unlock/obtain: Available by default.
- Levels 1–18. Blacksmith level required by equipment level: 1 → none (starting level); 2–9 → 1; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Damage on Defeat 1,000 → 3,000; Self Healing Per Second 50 → 150; Damage per Second Increase 10 → 23; Hitpoint Increase 900 → 5,600.
- Passive ability: the first time the Dragon Duke is knocked out he explodes, dealing 1,000 (levels 1–2) → 3,000 (18) damage within 4 tiles; later knock-outs after a revive do not explode again.
- Self-healing 50 → 150 HP per second (70/90/110/130/140 at intermediate tiers).
- Passive: +10 → +23 DPS and +900 → +5,600 HP. No recovery bonus.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Damage on Defeat | Hero Boosts / Self Healing Per Second | Hero Boosts / Damage per Second Increase | Hero Boosts / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 1,000 | 50 | 10 | 900 | N/A | N/A | N/A |
| 2 | 1,000 | 50 | 10 | 1,200 | 120 | - | 1 |
| 3 | 1,350 | 70 | 12 | 1,450 | 240 | 20 | 1 |
| 4 | 1,350 | 70 | 12 | 1,750 | 400 | - | 1 |
| 5 | 1,350 | 70 | 12 | 2,000 | 600 | - | 1 |
| 6 | 1,700 | 90 | 14 | 2,300 | 840 | 100 | 1 |
| 7 | 1,700 | 90 | 14 | 2,600 | 1,120 | - | 1 |
| 8 | 1,700 | 90 | 14 | 2,850 | 1,440 | - | 1 |
| 9 | 2,000 | 110 | 16 | 3,150 | 1,800 | 200 | 1 |
| 10 | 2,000 | 110 | 16 | 3,400 | 1,900 | - | 3 |
| 11 | 2,000 | 110 | 16 | 3,700 | 2,000 | - | 3 |
| 12 | 2,350 | 130 | 18 | 4,000 | 2,100 | 400 | 3 |
| 13 | 2,350 | 130 | 18 | 4,250 | 2,200 | - | 5 |
| 14 | 2,350 | 130 | 18 | 4,550 | 2,300 | - | 5 |
| 15 | 2,700 | 140 | 20 | 4,800 | 2,400 | 600 | 5 |
| 16 | 2,700 | 140 | 20 | 5,100 | 2,500 | - | 7 |
| 17 | 2,700 | 140 | 20 | 5,450 | 2,600 | - | 7 |
| 18 | 3,000 | 150 | 23 | 5,600 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Dragon Duke |
| Ability Type | Passive |
| Rarity | Common |
| Unlock Requirement | Available by default |
| Damage Radius | 4 tiles |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `damageOnDefeat` = `MainAbilities:special_abilities[DragonCrownExplodeOnDeath] → SelfSpell:spells[DragonCrownExplosion].Damage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `selfHealingPerSecond` = `ExtraAbilities:special_abilities[DragonCrownRegeneration].Regeneration` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `Damage Radius (4 tiles)`: `spells[DragonCrownExplosion].Radius` 400

**Client columns and interpretation notes**

- `special_abilities[DragonCrownExplodeOnDeath]`: `ActiveOnDeath=TRUE`, `MaxActivations` 1, `SelfSpell=DragonCrownExplosion` (`Radius` 400, `Damage` 1000 → 3000, `NumberOfHits` 1).
- `ExtraAbilities` `DragonCrownRegeneration`: `Regeneration` 50/70/90/110/130/140/150 every 1000 ms. The item row sets `HealOnActivation` 0.

**Mismatches / ambiguities**

- None found in the compared fields.
