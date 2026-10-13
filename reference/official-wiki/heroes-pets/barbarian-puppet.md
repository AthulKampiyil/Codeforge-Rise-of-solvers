# Barbarian Puppet

- **Source:** https://clashofclans.fandom.com/wiki/Barbarian_Puppet
- **Wiki revision:** 623371 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Barbarian King
- **Client record:** `character_items.csv` → `Barbarian Puppet`

> King's starting active item: summons raged Barbarians (8 → 44) at the player's Barbarian level; passive HP and recovery.

## Mechanics

- Common equipment for the Barbarian King; ability type **Active**; unlock/obtain: Available by default.
- Levels 1–18. Blacksmith level required by equipment level: 1 → none (starting level); 2–9 → 1; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Summoned Barbarians 8 → 44; Barbarian Damage Increase 100% → 220%; Barbarian Speed Increase 9.5 → 28.7; Hitpoint Increase 309 → 3,366; HP Recovery Increase 110 → 1,386.
- Ability: summons Barbarians around the King — 8 (levels 1–2), 16 (3–5), 20 (6–8), 30 (9–11), 36 (12–14), 40 (15–17), 44 (18). They appear in waves of at most five, 0.5 s apart.
- Summoned Barbarians use the level researched in the Laboratory and each is enraged for 20 s: +100% damage and +9.5 wiki speed at level 1, rising in the same tiers to +220% and +28.7 at level 18.
- Summons do not use army housing; the King's own ability recovery gains +110 → +1,386 HP from this item.
- Passive: +309 → +3,366 maximum hitpoints.
- At TH4 and TH5 (limited King) the passive hitpoints/recovery are scaled to 50%/75% (154.5 HP and 55 recovery at TH4; 231.75 and 82.5 at TH5, shown truncated in game); ability attributes are unscaled.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Summoned Barbarians | Ability Attributes / Barbarian Damage Increase | Ability Attributes / Barbarian Speed Increase | Hero Boosts / Hitpoint Increase | Hero Boosts / HP Recovery Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 8 | +100% | 9.5 | 309 | 110 | N/A | N/A | N/A |
| 2 | 8 | +100% | 9.5 | 385 | 165 | 120 | - | 1 |
| 3 | 16 | +120% | 12.7 | 467 | 220 | 240 | 20 | 1 |
| 4 | 16 | +120% | 12.7 | 564 | 275 | 400 | - | 1 |
| 5 | 16 | +120% | 12.7 | 649 | 330 | 600 | - | 1 |
| 6 | 20 | +140% | 16.0 | 734 | 385 | 840 | 100 | 1 |
| 7 | 20 | +140% | 16.0 | 836 | 440 | 1,120 | - | 1 |
| 8 | 20 | +140% | 16.0 | 940 | 495 | 1,440 | - | 1 |
| 9 | 30 | +160% | 19.1 | 1,045 | 572 | 1,800 | 200 | 1 |
| 10 | 30 | +160% | 19.1 | 1,155 | 660 | 1,900 | - | 3 |
| 11 | 30 | +160% | 19.1 | 1,265 | 748 | 2,000 | - | 3 |
| 12 | 36 | +180% | 22.3 | 1,445 | 847 | 2,100 | 400 | 3 |
| 13 | 36 | +180% | 22.3 | 1,755 | 946 | 2,200 | - | 5 |
| 14 | 36 | +180% | 22.3 | 2,087 | 1,034 | 2,300 | - | 5 |
| 15 | 40 | +200% | 25.5 | 2,444 | 1,166 | 2,400 | 600 | 5 |
| 16 | 40 | +200% | 25.5 | 2,703 | 1,243 | 2,500 | - | 7 |
| 17 | 40 | +200% | 25.5 | 3,093 | 1,320 | 2,600 | - | 7 |
| 18 | 44 | +220% | 28.7 | 3,366 | 1,386 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Barbarian King |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Available by default |
| Barbarian Rage Duration | 20 seconds |

### Other wiki tables on the page

| Town Hall Level | Ability Attributes / Summoned Barbarians | Ability Attributes / Barbarian Damage Increase | Ability Attributes / Barbarian Speed Increase | Hero Boosts / Hitpoint Increase* | Hero Boosts / HP Recovery Increase* |
|---|---|---|---|---|---|
| 4 | 8 | +100% | 9.5 | 154.5 | 55 |
| 5 | 8 | +100% | 9.5 | 231.75 | 82.5 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `hpRecoveryIncrease` = `character_items.HealOnActivation` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `summonedBarbarians` = `MainAbilities:special_abilities[BarbarianKingSpawnBarbarians].TroopCount` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `barbarianDamageIncreasePercent` = `MainAbilities:special_abilities[BarbarianKingSpawnBarbarians] → GivenAbility:special_abilities[BoostBarbarian].BoostDamagePercentage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `barbarianSpeedIncrease` = `MainAbilities:special_abilities[BarbarianKingSpawnBarbarians] → GivenAbility:special_abilities[BoostBarbarian].SpeedBoost` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client speed × 0.08, in-game display truncated to 0.1)
- `Barbarian Rage Duration (20 seconds)`: `special_abilities[BoostBarbarian].DeactivateAfterTime` 20000 ms
- `Town Hall 4/5 table`: hitpoints/recovery = level-1 `HitPoints` 309 and `HealOnActivation` 110 × `ScaleByTHPercent` 50/75

**Client columns and interpretation notes**

- `special_abilities[BarbarianKingSpawnBarbarians]`: `TroopCount`, `SpawnedTroop=Barbarian`, `CopySpawnnedTroopLevelFromAvatar=TRUE` (Laboratory level), `SpawnnedTroopsPerHit` 5, `SpawnDelayBetweenHitsMS` 500, `DeactivateAfterTime` 15000 (spawning window), `GiveAbilityToSpawnedTroop=TRUE` → `GivenAbility=BoostBarbarian` at `GivenAbilityLevel` = tier.
- `special_abilities[BoostBarbarian]`: `BoostDamagePercentage` 100 → 220, `SpeedBoost` 120 → 360 (internal = +1.2 → +3.6 tiles/s), `DeactivateAfterTime` 20000 (the wiki's 20-second rage).
- Speed boosts: the client stores internal units (tiles/s × 100); the wiki shows internal × 0.08 with the in-game display truncating to one decimal (120 → 9.5, 160 → 12.7, 200 → 16.0), so 0.1 differences are display artefacts, not data mismatches.

**Mismatches / ambiguities**

- None found in the compared fields.
