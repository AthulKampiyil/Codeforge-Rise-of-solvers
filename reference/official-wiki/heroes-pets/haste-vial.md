# Haste Vial

- **Source:** https://clashofclans.fandom.com/wiki/Haste_Vial
- **Wiki revision:** 621283 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Royal Champion
- **Client record:** `character_items.csv` → `Haste Vial`

> Champion Common active item (Blacksmith 8): 7 → 10 s of +60% → +100% attack speed and a big movement boost; passive DPS and attack speed.

## Mechanics

- Common equipment for the Royal Champion; ability type **Active**; unlock/obtain: Blacksmith level 8.
- Levels 1–18. Blacksmith level required by equipment level: 1–18 → 8.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Ability Duration 7 s → 10 s; Speed Increase 18 → 38.3; Attack Speed Increase 60% → 100%; Damage per Second Increase 20 → 88; Attack Speed Increase 5% → 16%.
- Ability: for 7 s (levels 1–2) … 10 s (18), +0.5 s per tier, she moves +18 → +38.3 wiki speed faster and attacks 60% faster (levels 1–5), 80% (6–14) or 100% (15–18).
- The ability's attack speed multiplies the passive one: at max passive (116%) the ability gives 232% attack rate. Wiki intervals: 1.14 s passive / 0.71 s boosted at level 1; 1.03 s / 0.517 s at level 18 (about 19 spears over the full duration).
- Passive: +20 → +88 DPS and +5% → +16% attack speed.
- History: before April 2024 her damage per hit dropped during the ability because passive DPS was computed on the boosted interval; the fix came with a lower passive attack speed.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Ability Duration | Ability Attributes / Speed Increase | Ability Attributes / Attack Speed Increase | Hero Boosts / Damage per Second Increase | Hero Boosts / Attack Speed Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 7.0s | 18.0 | +60% | 20 | +5% | N/A | N/A | 8 |
| 2 | 7.0s | 18.0 | +60% | 24 | +6% | 120 | - | 8 |
| 3 | 7.5s | 22.3 | +60% | 28 | +6% | 240 | 20 | 8 |
| 4 | 7.5s | 22.3 | +60% | 32 | +7% | 400 | - | 8 |
| 5 | 7.5s | 22.3 | +60% | 36 | +8% | 600 | - | 8 |
| 6 | 8.0s | 25.5 | +80% | 40 | +8% | 840 | 100 | 8 |
| 7 | 8.0s | 25.5 | +80% | 44 | +9% | 1,120 | - | 8 |
| 8 | 8.0s | 25.5 | +80% | 48 | +10% | 1,440 | - | 8 |
| 9 | 8.5s | 28.7 | +80% | 52 | +10% | 1,800 | 200 | 8 |
| 10 | 8.5s | 28.7 | +80% | 56 | +11% | 1,900 | - | 8 |
| 11 | 8.5s | 28.7 | +80% | 60 | +12% | 2,000 | - | 8 |
| 12 | 9.0s | 32.0 | +80% | 64 | +12% | 2,100 | 400 | 8 |
| 13 | 9.0s | 32.0 | +80% | 68 | +13% | 2,200 | - | 8 |
| 14 | 9.0s | 32.0 | +80% | 72 | +14% | 2,300 | - | 8 |
| 15 | 9.5s | 35.1 | +100% | 76 | +14% | 2,400 | 600 | 8 |
| 16 | 9.5s | 35.1 | +100% | 80 | +15% | 2,500 | - | 8 |
| 17 | 9.5s | 35.1 | +100% | 84 | +16% | 2,600 | - | 8 |
| 18 | 10.0s | 38.3 | +100% | 88 | +16% | 2,700 | 600 | 8 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Royal Champion |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Blacksmith level 8 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `attackSpeedIncreasePercent` = `character_items.AttackSpeedPercentage` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `abilityDurationSeconds` = `MainAbilities:special_abilities[RoyalChampionHaste].DeactivateAfterTime` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client milliseconds ÷ 1000)
- `speedIncrease` = `MainAbilities:special_abilities[RoyalChampionHaste].SpeedBoost` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client speed × 0.08, in-game display truncated to 0.1)
- `abilityAttackSpeedIncreasePercent`: not a percentage column: `RoyalChampionHaste.AttackSpeed` override; 1200 ÷ 750 = +60%, ÷ 666 = +80%, ÷ 600 = +100% — all 18 levels match

**Client columns and interpretation notes**

- `special_abilities[RoyalChampionHaste]`: `AttackSpeed` override 750/750/666/666/666/600/600 ms (base 1200), `SpeedBoost` 225 → 480, `DeactivateAfterTime` 7000 → 10000, `DisableRetargeting=TRUE` (she keeps her current target — not on the wiki).
- The wiki intervals are reproduced by override ÷ (1 + `AttackSpeedPercentage`/100): 750 ÷ 1.05 = 0.714 s, 600 ÷ 1.16 = 0.517 s.
- Speed boosts: client internal units × 0.08 = wiki value, with the in-game display truncated to one decimal.

**Mismatches / ambiguities**

- None found in the compared fields.
