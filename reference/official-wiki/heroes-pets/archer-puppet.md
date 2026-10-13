# Archer Puppet

- **Source:** https://clashofclans.fandom.com/wiki/Archer_Puppet
- **Wiki revision:** 621670 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Archer Queen
- **Client record:** `character_items.csv` → `Archer Puppet`

> Queen's starting active item: summons 5 → 35 invisible Archers at the player's Archer level; passive DPS and recovery.

## Mechanics

- Common equipment for the Archer Queen; ability type **Active**; unlock/obtain: Available by default.
- Levels 1–18. Blacksmith level required by equipment level: 1 → none (starting level); 2–9 → 1; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Summoned Archers 5 → 35; Archer Invisibility Duration 3.5 s → 6.5 s; Damage per Second Increase 28 → 159; HP Recovery Increase 176 → 484.
- Ability: summons Archers of the researched Laboratory level (at least level 1): 5 (levels 1–2), 10, 15, 20, 25, 30, 35 (18), in groups of up to five one second apart.
- The summoned Archers are invisible for 3.5 s (levels 1–2) up to 6.5 s (18), +0.5 s per tier; the Queen herself does not become invisible from this item.
- Recovery on activation +176 → +484 HP; passive +28 → +159 DPS.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Summoned Archers | Ability Attributes / Archer Invisibility Duration | Hero Boosts / Damage per Second Increase | Hero Boosts / HP Recovery Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 3.5s | 28 | 176 | N/A | N/A | N/A |
| 2 | 5 | 3.5s | 37 | 193 | 120 | - | 1 |
| 3 | 10 | 4.0s | 46 | 209 | 240 | 20 | 1 |
| 4 | 10 | 4.0s | 54 | 226 | 400 | - | 1 |
| 5 | 10 | 4.0s | 61 | 242 | 600 | - | 1 |
| 6 | 15 | 4.5s | 68 | 259 | 840 | 100 | 1 |
| 7 | 15 | 4.5s | 78 | 275 | 1,120 | - | 1 |
| 8 | 15 | 4.5s | 88 | 292 | 1,440 | - | 1 |
| 9 | 20 | 5.0s | 99 | 308 | 1,800 | 200 | 1 |
| 10 | 20 | 5.0s | 110 | 323 | 1,900 | - | 3 |
| 11 | 20 | 5.0s | 120 | 341 | 2,000 | - | 3 |
| 12 | 25 | 5.5s | 127 | 358 | 2,100 | 400 | 3 |
| 13 | 25 | 5.5s | 134 | 374 | 2,200 | - | 5 |
| 14 | 25 | 5.5s | 140 | 396 | 2,300 | - | 5 |
| 15 | 30 | 6.0s | 145 | 418 | 2,400 | 600 | 5 |
| 16 | 30 | 6.0s | 150 | 440 | 2,500 | - | 7 |
| 17 | 30 | 6.0s | 154 | 462 | 2,600 | - | 7 |
| 18 | 35 | 6.5s | 159 | 484 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Archer Queen |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Available by default |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `hpRecoveryIncrease` = `character_items.HealOnActivation` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `summonedArchers` = `MainAbilities:special_abilities[ArcherQueenSpawnArchers].TroopCount` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `archerInvisibilityDurationSeconds` = `MainAbilities:special_abilities[ArcherQueenSpawnArchers] → GivenAbility:special_abilities[ArcherPuppetInvisibility].DeactivateAfterTime` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client milliseconds ÷ 1000)

**Client columns and interpretation notes**

- `special_abilities[ArcherQueenSpawnArchers]`: `TroopCount`, `SpawnedTroop=Archer`, `CopySpawnnedTroopLevelFromAvatar=TRUE`, `SpawnnedTroopsPerHit` 5, `SpawnDelayBetweenHitsMS` 1000, `DeactivateAfterTime` 15000, `GivenAbility=ArcherPuppetInvisibility` (`IsInvisible=TRUE`, `DeactivateAfterTime` 3500 → 6500).

**Mismatches / ambiguities**

- None found in the compared fields.
