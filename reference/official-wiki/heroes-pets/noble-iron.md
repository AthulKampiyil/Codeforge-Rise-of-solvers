# Noble Iron

- **Source:** https://clashofclans.fandom.com/wiki/Noble_Iron
- **Wiki revision:** 621029 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Minion Prince
- **Client record:** `character_items.csv` → `Noble Iron`

> Prince Common passive item (Blacksmith 5): his first 5 → 10 shots after deployment reach 10 → 12 tiles and deal +350 → +770 damage; passive attack speed and flat +500 HP.

## Mechanics

- Common equipment for the Minion Prince; ability type **Passive**; unlock/obtain: Blacksmith level 5.
- Levels 1–18. Blacksmith level required by equipment level: 1–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Damage per Shot Increase 350 → 770; Attack Range 10 → 12; Number of Attacks 5 → 10; Attack Speed Increase 6% → 18%; Hitpoint Increase 500 → 500.
- Passive ability at battle start: right after deployment his next attacks become long-range iron-fist shots — range 10 tiles (levels 1–2), 10.5 (3–5), 11 (6–11), 11.5 (12–17), 12 (18) — each dealing flat extra damage (+350 → +770). The boosted shot count is 5 at levels 1–2, 6 at 3–8, 7 at 9–11, 8 at 12–17 (wiki) and 10 at 18.
- Passive: +6% → +18% attack speed (interval 0.85 s ÷ 1.06 ≈ 0.802 s → ÷ 1.18 ≈ 0.720 s) and a flat +500 HP.
- It triggers automatically (no ability input), similar to Rocket Spear but at deployment.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Damage per Shot Increase | Ability Attributes / Attack Range | Ability Attributes / Number of Attacks | Hero Boosts / Attack Speed Increase | Hero Boosts / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 350 | 10 | 5 | +6% | 500 | N/A | N/A | 5 |
| 2 | 350 | 10 | 5 | +7% | 500 | 120 | - | 5 |
| 3 | 420 | 10.5 | 6 | +7% | 500 | 240 | 20 | 5 |
| 4 | 420 | 10.5 | 6 | +8% | 500 | 400 | - | 5 |
| 5 | 420 | 10.5 | 6 | +9% | 500 | 600 | - | 5 |
| 6 | 490 | 11 | 6 | +9% | 500 | 840 | 100 | 5 |
| 7 | 490 | 11 | 6 | +10% | 500 | 1,120 | - | 5 |
| 8 | 490 | 11 | 6 | +11% | 500 | 1,440 | - | 5 |
| 9 | 560 | 11 | 7 | +11% | 500 | 1,800 | 200 | 5 |
| 10 | 560 | 11 | 7 | +12% | 500 | 1,900 | - | 5 |
| 11 | 560 | 11 | 7 | +13% | 500 | 2,000 | - | 5 |
| 12 | 630 | 11.5 | 8 | +13% | 500 | 2,100 | 400 | 5 |
| 13 | 630 | 11.5 | 8 | +14% | 500 | 2,200 | - | 5 |
| 14 | 630 | 11.5 | 8 | +15% | 500 | 2,300 | - | 5 |
| 15 | 700 | 11.5 | 8 | +15% | 500 | 2,400 | 600 | 5 |
| 16 | 700 | 11.5 | 8 | +16% | 500 | 2,500 | - | 7 |
| 17 | 700 | 11.5 | 8 | +17% | 500 | 2,600 | - | 7 |
| 18 | 770 | 12 | 10 | +18% | 500 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Minion Prince |
| Ability Type | Passive |
| Rarity | Common |
| Unlock Requirement | Blacksmith level 5 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `attackSpeedIncreasePercent` = `character_items.AttackSpeedPercentage` (all levels)
- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `damagePerShotIncrease` = `MainAbilities:special_abilities[MPTurboStart].ExtraDamageFlat` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `attackRange` = `MainAbilities:special_abilities[MPTurboStart].AttackRange` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client value ÷ 100 (1/100 tile or 1/100 unit))
- `numberOfAttacks`: = `MPTurboStart.DeactivateAfterNumberOfHits` for levels 1–14 and 18 (see mismatch for 15–17)

**Client columns and interpretation notes**

- `special_abilities[MPTurboStart]`: `AttackRange` 1000/1050/1100/1100/1150/1150/1200, `ExtraDamageFlat` 350 → 770, `DeactivateAfterNumberOfHits` 5/6/6/7/8/9/10, `Projectile=TurboStartProjectile` (ballistic, speed 2000), `MaxActivations` 1, no `ActiveAfterPlayerInput`.

**Mismatches / ambiguities**

- `numberOfAttacks` (level 15): wiki **8** vs client **9** — levels 15–17: client DeactivateAfterNumberOfHits tier 6 = 9
