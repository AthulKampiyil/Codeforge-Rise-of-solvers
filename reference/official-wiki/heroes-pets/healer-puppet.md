# Healer Puppet

- **Source:** https://clashofclans.fandom.com/wiki/Healer_Puppet
- **Wiki revision:** 621291 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Archer Queen
- **Client record:** `character_items.csv` → `Healer Puppet`

> Queen Common active item (Blacksmith 5): summons 1 → 3 Healers of fixed level 4 → 8; passive HP and self-healing.

## Mechanics

- Common equipment for the Archer Queen; ability type **Active**; unlock/obtain: Blacksmith level 5.
- Levels 1–18. Blacksmith level required by equipment level: 1–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Summoned Healers 1 → 3; Healer Level 4 → 8; Self Healing Per Second 6 → 35; Hitpoint Increase 132 → 968.
- Ability: summons Healers in a semicircle behind the Queen — 1 at levels 1–5, 2 at 6–14, 3 at 15–18. Their level is set by the item (4 at levels 1–2, 5 at 3–8, 6 at 9–11, 7 at 12–17, 8 at 18), not by Laboratory research.
- Passive: +132 → +968 HP and self-healing 6 → 35 HP per second. No recovery bonus.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Summoned Healers | Ability Attributes / Healer Level | Hero Boosts / Self Healing Per Second | Hero Boosts / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 4 | 6 | 132 | N/A | N/A | 5 |
| 2 | 1 | 4 | 8 | 154 | 120 | - | 5 |
| 3 | 1 | 5 | 10 | 177 | 240 | 20 | 5 |
| 4 | 1 | 5 | 12 | 199 | 400 | - | 5 |
| 5 | 1 | 5 | 14 | 221 | 600 | - | 5 |
| 6 | 2 | 5 | 16 | 243 | 840 | 100 | 5 |
| 7 | 2 | 5 | 18 | 265 | 1,120 | - | 5 |
| 8 | 2 | 5 | 20 | 287 | 1,440 | - | 5 |
| 9 | 2 | 6 | 22 | 331 | 1,800 | 200 | 5 |
| 10 | 2 | 6 | 24 | 402 | 1,900 | - | 5 |
| 11 | 2 | 6 | 26 | 473 | 2,000 | - | 5 |
| 12 | 2 | 7 | 28 | 543 | 2,100 | 400 | 5 |
| 13 | 2 | 7 | 30 | 614 | 2,200 | - | 5 |
| 14 | 2 | 7 | 31 | 685 | 2,300 | - | 5 |
| 15 | 3 | 7 | 32 | 756 | 2,400 | 600 | 5 |
| 16 | 3 | 7 | 33 | 826 | 2,500 | - | 7 |
| 17 | 3 | 7 | 34 | 897 | 2,600 | - | 7 |
| 18 | 3 | 8 | 35 | 968 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Archer Queen |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Blacksmith level 5 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `summonedHealers` = `MainAbilities:special_abilities[ArcherQueenSpawnHealers].TroopCount` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `healerLevel` = `MainAbilities:special_abilities[ArcherQueenSpawnHealers].TroopLevel` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `selfHealingPerSecond` = `ExtraAbilities:special_abilities[Regeneration].Regeneration` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)

**Client columns and interpretation notes**

- `special_abilities[ArcherQueenSpawnHealers]`: `SpawnedTroop=Healer`, `TroopCount`, `TroopLevel`, `SpawnPattern=SemiCircleBehind`, `SpawnnedTroopsPerHit` 3, `SpawnDelayBetweenHitsMS` 250, `DeactivateAfterTime` 6000.
- Self-healing uses the shared `special_abilities[Regeneration]` record (`Regeneration` HP every `RegenerationTimeBetweenHitsMS` 1000 ms) indexed by `ExtraAbilityLevels` = item level.

**Mismatches / ambiguities**

- None found in the compared fields.
