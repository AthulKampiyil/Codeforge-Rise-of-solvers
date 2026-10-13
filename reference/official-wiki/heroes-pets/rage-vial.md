# Rage Vial

- **Source:** https://clashofclans.fandom.com/wiki/Rage_Vial
- **Wiki revision:** 623370 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Barbarian King
- **Client record:** `character_items.csv` → `Rage Vial`

> King's starting active item: 10-second self-rage (+120% → +155% damage, large move-speed boost) with big recovery; passive DPS.

## Mechanics

- Common equipment for the Barbarian King; ability type **Active**; unlock/obtain: Available by default.
- Levels 1–18. Blacksmith level required by equipment level: 1 → none (starting level); 2–9 → 1; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Damage Increase 120% → 155%; Movement Speed Increase 18 → 38.3; Damage per Second Increase 17 → 128; HP Recovery Increase 150 → 1,890.
- Ability: the King is enraged for 10 s — damage +120% (levels 1–2), +130% (3–5), +135% (6–8), +140% (9–11), +145% (12–14), +150% (15–17), +155% (18); movement +18 → +38.3 wiki speed. Attack interval is not changed.
- Recovery on activation +150 → +1,890 HP (the largest recovery of the King's common items).
- Passive: +17 → +128 DPS.
- At TH4/TH5 passive values are scaled 50%/75% (8.5 DPS and 75 recovery at TH4; 12.75 and 112.5 at TH5); rage % and speed are unscaled.
- Its rage overrides a Grand Warden Rage Gem aura on the King (Rage Gem page).

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Damage Increase | Ability Attributes / Movement Speed Increase | Hero Boosts / Damage per Second Increase | Hero Boosts / HP Recovery Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|
| 1 | +120% | 18.0 | 17 | 150 | N/A | N/A | N/A |
| 2 | +120% | 18.0 | 22 | 225 | 120 | - | 1 |
| 3 | +130% | 22.3 | 27 | 300 | 240 | 20 | 1 |
| 4 | +130% | 22.3 | 32 | 375 | 400 | - | 1 |
| 5 | +130% | 22.3 | 37 | 450 | 600 | - | 1 |
| 6 | +135% | 25.5 | 42 | 525 | 840 | 100 | 1 |
| 7 | +135% | 25.5 | 48 | 600 | 1,120 | - | 1 |
| 8 | +135% | 25.5 | 54 | 675 | 1,440 | - | 1 |
| 9 | +140% | 28.7 | 60 | 780 | 1,800 | 200 | 1 |
| 10 | +140% | 28.7 | 66 | 900 | 1,900 | - | 3 |
| 11 | +140% | 28.7 | 72 | 1,020 | 2,000 | - | 3 |
| 12 | +145% | 32.0 | 79 | 1,155 | 2,100 | 400 | 3 |
| 13 | +145% | 32.0 | 86 | 1,290 | 2,200 | - | 5 |
| 14 | +145% | 32.0 | 94 | 1,410 | 2,300 | - | 5 |
| 15 | +150% | 35.1 | 104 | 1,590 | 2,400 | 600 | 5 |
| 16 | +150% | 35.1 | 112 | 1,695 | 2,500 | - | 7 |
| 17 | +150% | 35.1 | 120 | 1,800 | 2,600 | - | 7 |
| 18 | +155% | 38.3 | 128 | 1,890 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Barbarian King |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Available by default |
| Ability Duration | 10 seconds |

### Other wiki tables on the page

| Town Hall Level | Ability Attributes / Damage Increase | Ability Attributes / Movement Speed Increase | Hero Boosts / Damage per Second Increase* | Hero Boosts / HP Recovery Increase* |
|---|---|---|---|---|
| 4 | +120% | 18.0 | 8.5 | 75 |
| 5 | +120% | 18.0 | 12.75 | 112.5 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `hpRecoveryIncrease` = `character_items.HealOnActivation` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `damageIncreasePercent` = `MainAbilities:special_abilities[BarbarianKingRage].BoostDamagePercentage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `movementSpeedIncrease` = `MainAbilities:special_abilities[BarbarianKingRage].SpeedBoost` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client speed × 0.08, in-game display truncated to 0.1)
- `Ability Duration (10 seconds)`: `BarbarianKingRage.DeactivateAfterTime` 10000 ms
- `Town Hall 4/5 table`: DPS/recovery = level-1 `DPS` 17 and `HealOnActivation` 150 × 50/75%

**Client columns and interpretation notes**

- `special_abilities[BarbarianKingRage]`: `BoostDamagePercentage` 120 → 155, `SpeedBoost` 225 → 480 internal (+2.25 → +4.8 tiles/s), `DeactivateAfterTime` 10000, `ActiveAfterPlayerInput`, `MaxActivations` 1, `SimulatePlayerInputOnDeath`.
- Speed boosts: the client stores internal units (tiles/s × 100); the wiki shows internal × 0.08 with the in-game display truncating to one decimal (120 → 9.5, 160 → 12.7, 200 → 16.0), so 0.1 differences are display artefacts, not data mismatches.

**Mismatches / ambiguities**

- None found in the compared fields.
