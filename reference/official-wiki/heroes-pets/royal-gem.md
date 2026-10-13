# Royal Gem

- **Source:** https://clashofclans.fandom.com/wiki/Royal_Gem
- **Wiki revision:** 621038 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Royal Champion
- **Client record:** `character_items.csv` → `Royal Gem`

> Champion's starting active item: adds 1,200 → 2,400 recovery to her ability; passive DPS and HP.

## Mechanics

- Common equipment for the Royal Champion; ability type **Active**; unlock/obtain: Available by default.
- Levels 1–18. Blacksmith level required by equipment level: 1 → none (starting level); 2–9 → 1; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Health Recovery 1,200 → 2,400; Damage per Second Increase 35 → 120; Hitpoint Increase 60 → 570.
- Ability: activating the Champion's ability restores an extra 1,200 HP (levels 1–2) … 2,400 (18) on top of her innate recovery (1,450, 1,600, 1,800, 2,000, 2,200 at the intermediate tiers).
- Passive: +35 → +120 DPS and +60 → +570 HP.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Health Recovery | Hero Boosts / Damage per Second Increase | Hero Boosts / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|
| 1 | 1,200 | 35 | 60 | N/A | N/A | N/A |
| 2 | 1,200 | 40 | 90 | 120 | - | 1 |
| 3 | 1,450 | 45 | 120 | 240 | 20 | 1 |
| 4 | 1,450 | 50 | 150 | 400 | - | 1 |
| 5 | 1,450 | 55 | 180 | 600 | - | 1 |
| 6 | 1,600 | 60 | 210 | 840 | 100 | 1 |
| 7 | 1,600 | 65 | 240 | 1,120 | - | 1 |
| 8 | 1,600 | 70 | 270 | 1,440 | - | 1 |
| 9 | 1,800 | 75 | 300 | 1,800 | 200 | 1 |
| 10 | 1,800 | 80 | 330 | 1,900 | - | 3 |
| 11 | 1,800 | 85 | 360 | 2,000 | - | 3 |
| 12 | 2,000 | 90 | 390 | 2,100 | 400 | 3 |
| 13 | 2,000 | 95 | 420 | 2,200 | - | 5 |
| 14 | 2,000 | 100 | 450 | 2,300 | - | 5 |
| 15 | 2,200 | 105 | 480 | 2,400 | 600 | 5 |
| 16 | 2,200 | 110 | 510 | 2,500 | - | 7 |
| 17 | 2,200 | 115 | 540 | 2,600 | - | 7 |
| 18 | 2,400 | 120 | 570 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Royal Champion |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Available by default |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `healthRecovery` = `MainAbilities:special_abilities[RCProtectiveCloak].HealOnActivation` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)

**Client columns and interpretation notes**

- The recovery is stored on the ability, not the item: `special_abilities[RCProtectiveCloak].HealOnActivation` 1200 → 2400 (`ActiveAfterPlayerInput`, `MaxActivations` 1, `SimulatePlayerInputOnDeath`). The item row has no `HealOnActivation`.

**Mismatches / ambiguities**

- None found in the compared fields.
