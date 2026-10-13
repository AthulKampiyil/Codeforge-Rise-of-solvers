# Henchmen Puppet

- **Source:** https://clashofclans.fandom.com/wiki/Henchmen_Puppet
- **Wiki revision:** 621392 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Minion Prince
- **Client record:** `character_items.csv` → `Henchmen Puppet`
- **Also used:** [Henchmen Puppet/Henchmen](https://clashofclans.fandom.com/wiki/Henchmen_Puppet/Henchmen) (revision 616956)

> Prince's starting active item: summons two flying Henchmen (level 1 → 7) and 1 s invisibility; passive DPS, flat +500 HP and recovery.

## Mechanics

- Common equipment for the Minion Prince; ability type **Active**; unlock/obtain: Available by default.
- Levels 1–18. Blacksmith level required by equipment level: 1–9 → 1; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Henchmen Level 1 → 7; Damage per Second Increase 33 → 188; HP Increase 500 → 500; HP Recovery Increase 176 → 538.
- Ability: summons two Henchmen in front of the Prince and turns him invisible for 1 s so they draw fire. Henchmen level follows the item tier (1 at levels 1–2 … 7 at 18), not Laboratory research.
- Henchmen: 10 housing space (for Recall/Giga Bomb interactions), wiki speed 32, attack every 1.1 s at 1 tile against ground and air (any target); HP 1,600 → 2,500, DPS 102 → 150.
- Recovery on activation +176 → +538 HP; passive +33 → +188 DPS and a flat +500 HP at every level.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Henchmen Level | Hero Boosts / Damage per Second Increase | Hero Boosts / HP Increase | Hero Boosts / HP Recovery Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 33 | 500 | 176 | N/A | N/A | 1 |
| 2 | 1 | 38 | 500 | 193 | 120 | - | 1 |
| 3 | 2 | 46 | 500 | 209 | 240 | 20 | 1 |
| 4 | 2 | 51 | 500 | 226 | 400 | - | 1 |
| 5 | 2 | 56 | 500 | 242 | 600 | - | 1 |
| 6 | 3 | 64 | 500 | 259 | 840 | 100 | 1 |
| 7 | 3 | 71 | 500 | 275 | 1,120 | - | 1 |
| 8 | 3 | 78 | 500 | 292 | 1,440 | - | 1 |
| 9 | 4 | 92 | 500 | 308 | 1,800 | 200 | 1 |
| 10 | 4 | 103 | 500 | 325 | 1,900 | - | 3 |
| 11 | 4 | 114 | 500 | 341 | 2,000 | - | 3 |
| 12 | 5 | 131 | 500 | 358 | 2,100 | 400 | 3 |
| 13 | 5 | 140 | 500 | 388 | 2,200 | - | 5 |
| 14 | 5 | 149 | 500 | 418 | 2,300 | - | 5 |
| 15 | 6 | 162 | 500 | 448 | 2,400 | 600 | 5 |
| 16 | 6 | 169 | 500 | 478 | 2,500 | - | 7 |
| 17 | 6 | 176 | 500 | 508 | 2,600 | - | 7 |
| 18 | 7 | 188 | 500 | 538 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Minion Prince |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Available by default |
| Summoned Henchmen | 2 |
| Invisibility | 1s |


### Summoned unit: [Henchmen Puppet/Henchmen](https://clashofclans.fandom.com/wiki/Henchmen_Puppet/Henchmen) (revision 616956; client `characters.csv` → `MP Equipment Henchman`)

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Range |
|---|---|---|---|---|---|
| Any | Ranged (Ground & Air) | 10 | 32 | 1.1s | 1 tile |

| Level | Damage per Second | Damage per Hit | Hitpoints |
|---|---|---|---|
| 1 | 102 | 112.2 | 1,600 |
| 2 | 110 | 121 | 1,700 |
| 3 | 118 | 129.8 | 1,750 |
| 4 | 126 | 138.6 | 1,800 |
| 5 | 134 | 147.4 | 1,950 |
| 6 | 142 | 156.2 | 2,100 |
| 7 | 150 | 165 | 2,500 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `hpIncrease` = `character_items.HitPoints` (all levels)
- `hpRecoveryIncrease` = `character_items.HealOnActivation` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `henchmenLevel` = `MainAbilities:special_abilities[MinionSummonAbility].TroopLevel` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `Summoned Henchmen (2) / Invisibility (1s)`: `MinionSummonAbility.TroopCount` 2; `DeactivateAfterTime` 1000 with `IsInvisible=TRUE`

- Summoned unit Henchmen Puppet/Henchmen: `hitpoints` vs `characters[MP Equipment Henchman].Hitpoints`: all levels match
- Summoned unit Henchmen Puppet/Henchmen: `damagePerSecond` vs `characters[MP Equipment Henchman].DPS`: all levels match

**Client columns and interpretation notes**

- `special_abilities[MinionSummonAbility]`: `SpawnedTroop=MP Equipment Henchman`, `TroopCount` 2, `SpawnnedTroopsPerHit` 2, `SpawnPattern=SemiCircleInFront`, `TroopLevel` 1 → 7, `IsInvisible=TRUE`, `DeactivateAfterTime` 1000.
- `characters[MP Equipment Henchman]`: `IsFlying=TRUE` (the subpage does not say they fly), `Speed` 400, `AttackRange` 100, `AttackSpeed` 1100, `FriendlyGroupWeight` 800.

**Mismatches / ambiguities**

- None found in the compared fields.
