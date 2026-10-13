# Invisibility Vial

- **Source:** https://clashofclans.fandom.com/wiki/Invisibility_Vial
- **Wiki revision:** 623169 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Archer Queen
- **Client record:** `character_items.csv` → `Invisibility Vial`

> Queen's starting active item: invisibility for 4.2 → 7.8 s with +340 → +1,740 damage per shot; passive HP.

## Mechanics

- Common equipment for the Archer Queen; ability type **Active**; unlock/obtain: Available by default.
- Levels 1–18. Blacksmith level required by equipment level: 1 → none (starting level); 2–9 → 1; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Ability Duration 4.2 s → 7.8 s; Damage per Shot Increase 340 → 1,740; Hero Hitpoint Increase 80 → 700.
- Ability: the Queen turns invisible (untargetable) for 4.2 s at levels 1–2, 4.8 s (3–5), 5.4 s (6–8), 6.0 s (9–11), 6.6 s (12–14), 7.2 s (15–17), 7.8 s (18); every shot during it gains flat extra damage that rises every level (+340 → +1,740). Her arrows turn orange while boosted.
- Passive: +80 → +700 HP; no recovery bonus.
- Magic Mirror clones do not inherit the invisibility or damage bonus.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Ability Duration | Ability Attributes / Damage per Shot Increase | Hero Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|
| 1 | 4.2s | 340 | 80 | N/A | N/A | N/A |
| 2 | 4.2s | 440 | 100 | 120 | - | 1 |
| 3 | 4.8s | 540 | 120 | 240 | 20 | 1 |
| 4 | 4.8s | 640 | 140 | 400 | - | 1 |
| 5 | 4.8s | 730 | 170 | 600 | - | 1 |
| 6 | 5.4s | 820 | 200 | 840 | 100 | 1 |
| 7 | 5.4s | 920 | 250 | 1,120 | - | 1 |
| 8 | 5.4s | 1,020 | 300 | 1,440 | - | 1 |
| 9 | 6.0s | 1,120 | 340 | 1,800 | 200 | 1 |
| 10 | 6.0s | 1,220 | 380 | 1,900 | - | 3 |
| 11 | 6.0s | 1,310 | 420 | 2,000 | - | 3 |
| 12 | 6.6s | 1,370 | 460 | 2,100 | 400 | 3 |
| 13 | 6.6s | 1,430 | 500 | 2,200 | - | 5 |
| 14 | 6.6s | 1,490 | 540 | 2,300 | - | 5 |
| 15 | 7.2s | 1,560 | 580 | 2,400 | 600 | 5 |
| 16 | 7.2s | 1,620 | 620 | 2,500 | - | 7 |
| 17 | 7.2s | 1,680 | 660 | 2,600 | - | 7 |
| 18 | 7.8s | 1,740 | 700 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Archer Queen |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Available by default |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `heroHitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `abilityDurationSeconds` = `MainAbilities:special_abilities[ArcherQueenInvisibility].DeactivateAfterTime` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client milliseconds ÷ 1000)
- `damagePerShotIncrease` = `MainAbilities:special_abilities[ArcherQueenInvisibility].ExtraDamageFlat` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)

**Client columns and interpretation notes**

- `special_abilities[ArcherQueenInvisibility]` has one row per item level: `IsInvisible=TRUE`, `ExtraDamageFlat` (per-shot bonus), `DeactivateAfterTime` 4200 → 7800.

**Mismatches / ambiguities**

- None found in the compared fields.
