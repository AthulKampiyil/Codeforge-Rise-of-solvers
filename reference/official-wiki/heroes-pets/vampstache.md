# Vampstache

- **Source:** https://clashofclans.fandom.com/wiki/Vampstache
- **Wiki revision:** 621314 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Barbarian King
- **Client record:** `character_items.csv` → `Vampstache`

> King Common passive item (Blacksmith 3): heals a flat amount on every hit (60 → 300); passive DPS and attack speed.

## Mechanics

- Common equipment for the Barbarian King; ability type **Passive**; unlock/obtain: Blacksmith level 3.
- Levels 1–18. Blacksmith level required by equipment level: 1–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Heal per Hit 60 → 300; Damage per Second Increase 10 → 120; Attack Speed Increase 5% → 22%.
- Passive ability: every attack the King lands heals him 60 HP (levels 1–2), 90 (3–5), 120 (6–8), 160 (9–11), 200 (12–14), 250 (15–17), 300 (18). It does not heal him while a Phoenix is reviving him.
- Passive boosts: +10 → +120 DPS and +5% → +22% attack speed (attack interval 1.2 s ÷ 1.05 ≈ 1.14 s at level 1, ÷ 1.22 ≈ 0.98 s at level 18).
- Attack-speed percentages from different items add up (max Vampstache + max Snake Bracelet: 1.2 ÷ 1.32 ≈ 0.909 s), and the wiki's quoted DPS for that combination implies damage per hit stays at (base + item DPS) × 1.2 s, so effective DPS scales with attack speed.
- Passive item: the King's ability then only restores his recovery amount (unless the other item is active).

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Heal per Hit | Hero Boosts / Damage per Second Increase | Hero Boosts / Attack Speed Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|
| 1 | 60 | 10 | +5% | N/A | N/A | 3 |
| 2 | 60 | 15 | +6% | 120 | - | 3 |
| 3 | 90 | 20 | +7% | 240 | 20 | 3 |
| 4 | 90 | 25 | +8% | 400 | - | 3 |
| 5 | 90 | 30 | +9% | 600 | - | 3 |
| 6 | 120 | 40 | +10% | 840 | 100 | 3 |
| 7 | 120 | 45 | +11% | 1,120 | - | 3 |
| 8 | 120 | 50 | +12% | 1,440 | - | 3 |
| 9 | 160 | 60 | +13% | 1,800 | 200 | 3 |
| 10 | 160 | 65 | +14% | 1,900 | - | 3 |
| 11 | 160 | 70 | +15% | 2,000 | - | 3 |
| 12 | 200 | 80 | +16% | 2,100 | 400 | 3 |
| 13 | 200 | 85 | +17% | 2,200 | - | 5 |
| 14 | 200 | 90 | +18% | 2,300 | - | 5 |
| 15 | 250 | 100 | +19% | 2,400 | 600 | 5 |
| 16 | 250 | 105 | +20% | 2,500 | - | 7 |
| 17 | 250 | 110 | +21% | 2,600 | - | 7 |
| 18 | 300 | 120 | +22% | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Barbarian King |
| Ability Type | Passive |
| Rarity | Common |
| Unlock Requirement | Blacksmith level 3 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `attackSpeedIncreasePercent` = `character_items.AttackSpeedPercentage` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `healPerHit` = `MainAbilities:special_abilities[BarbarianKingVampstache].SelfDamagePerHit` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (negated client value)

**Client columns and interpretation notes**

- `special_abilities[BarbarianKingVampstache].SelfDamagePerHit` −60 → −300 (negative self-damage = heal per hit), `MaxActivations` 1 (always-on passive, no `ActiveAfterPlayerInput`).
- `character_items.AttackSpeedPercentage` 5 → 22.

**Mismatches / ambiguities**

- `attackSpeedStacking`: wiki **percentages add: interval = 1.2 / (1 + Σ%)** vs client **AttackSpeedPercentage per item; combination rule not encoded** — engine rule; also compare Haste Vial (multiplicative) and Stick Horse (AttackSpeed override)
