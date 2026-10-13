# Hog Rider Puppet

- **Source:** https://clashofclans.fandom.com/wiki/Hog_Rider_Puppet
- **Wiki revision:** 621803 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Royal Champion
- **Client record:** `character_items.csv` → `Hog Rider Puppet`

> Champion Common active item (Blacksmith 7): summons 8 → 10 Hog Riders of fixed level 5 → 12 and 1 s invisibility; passive HP and recovery.

## Mechanics

- Common equipment for the Royal Champion; ability type **Active**; unlock/obtain: Blacksmith level 7.
- Levels 1–18. Blacksmith level required by equipment level: 1–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Summoned Hog Riders 8 → 10; Hog Rider Level 5 → 12; Hitpoint Increase 60 → 570; HP Recovery Increase 180 → 1,000.
- Ability: summons Hog Riders — 8 at levels 1–5, 9 at 6–14, 10 at 15–18 — whose level comes from the item (5, 6, 7, 8, 9, 10, 12 by tier), not Laboratory research; she turns invisible for 1 s while they take the attention.
- Recovery on activation +180 → +1,000 HP; passive +60 → +570 HP.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Summoned Hog Riders | Ability Attributes / Hog Rider Level | Hero Boosts / Hitpoint Increase | Hero Boosts / HP Recovery Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 8 | 5 | 60 | 180 | N/A | N/A | 7 |
| 2 | 8 | 5 | 90 | 220 | 120 | - | 7 |
| 3 | 8 | 6 | 120 | 270 | 240 | 20 | 7 |
| 4 | 8 | 6 | 150 | 320 | 400 | - | 7 |
| 5 | 8 | 6 | 180 | 370 | 600 | - | 7 |
| 6 | 9 | 7 | 210 | 420 | 840 | 100 | 7 |
| 7 | 9 | 7 | 240 | 470 | 1,120 | - | 7 |
| 8 | 9 | 7 | 270 | 520 | 1,440 | - | 7 |
| 9 | 9 | 8 | 300 | 560 | 1,800 | 200 | 7 |
| 10 | 9 | 8 | 330 | 610 | 1,900 | - | 7 |
| 11 | 9 | 8 | 360 | 660 | 2,000 | - | 7 |
| 12 | 9 | 9 | 390 | 700 | 2,100 | 400 | 7 |
| 13 | 9 | 9 | 420 | 750 | 2,200 | - | 7 |
| 14 | 9 | 9 | 450 | 800 | 2,300 | - | 7 |
| 15 | 10 | 10 | 480 | 850 | 2,400 | 600 | 7 |
| 16 | 10 | 10 | 510 | 900 | 2,500 | - | 7 |
| 17 | 10 | 10 | 540 | 950 | 2,600 | - | 7 |
| 18 | 10 | 12 | 570 | 1,000 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Royal Champion |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Blacksmith level 7 |
| Invisibility | 1s |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `hpRecoveryIncrease` = `character_items.HealOnActivation` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `summonedHogRiders` = `MainAbilities:special_abilities[RCEquipSpawnHogs].TroopCount` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `hogRiderLevel` = `MainAbilities:special_abilities[RCEquipSpawnHogs].TroopLevel` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `Invisibility (1s)`: `RCEquipSpawnHogs.DeactivateAfterTime` 1000 with `IsInvisible=TRUE`

**Client columns and interpretation notes**

- `special_abilities[RCEquipSpawnHogs]`: `SpawnedTroop=Hog Rider`, `TroopCount` 8/8/9/9/9/10/10, `TroopLevel` 5/6/7/8/9/10/12, `SpawnnedTroopsPerHit` 3, `SpawnDelayBetweenHitsMS` 250, `IsInvisible=TRUE`, `DeactivateAfterTime` 1000.

**Mismatches / ambiguities**

- None found in the compared fields.
