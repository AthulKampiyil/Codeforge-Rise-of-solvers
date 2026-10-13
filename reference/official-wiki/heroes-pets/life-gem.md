# Life Gem

- **Source:** https://clashofclans.fandom.com/wiki/Life_Gem
- **Wiki revision:** 623272 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Grand Warden
- **Client record:** `character_items.csv` → `Life Gem`

> Warden's starting passive item: aura giving nearby allies +50% → +120% extra HP up to a 640 → 1,200 cap; passive DPS and HP.

## Mechanics

- Common equipment for the Grand Warden; ability type **Passive**; unlock/obtain: Available by default.
- Levels 1–18. Blacksmith level required by equipment level: 1 → none (starting level); 2–9 → 1; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): % HP Increase 50 → 120; Max HP Increase 640 → 1,200; Damage per Second Increase 11 → 75; Hitpoint Increase 170 → 500.
- Passive aura: friendly units inside the ring gain extra hitpoints equal to 50% of their maximum HP (levels 1–2) rising to 120% (18), capped at 640 → 1,200 extra HP, while they stay inside.
- Does not affect the Warden himself or Siege Machines; does not stack with the Apprentice Warden's life aura (the stronger applies).
- Passive: +11 → +75 DPS and +170 → +500 HP.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / % HP Increase | Ability Attributes / Max HP Increase | Hero Boosts / Damage per Second Increase | Hero Boosts / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 50% | 640 | 11 | 170 | N/A | N/A | N/A |
| 2 | 50% | 640 | 13 | 184 | 120 | - | 1 |
| 3 | 60% | 750 | 16 | 195 | 240 | 20 | 1 |
| 4 | 60% | 750 | 19 | 205 | 400 | - | 1 |
| 5 | 60% | 750 | 21 | 217 | 600 | - | 1 |
| 6 | 75% | 830 | 23 | 230 | 840 | 100 | 1 |
| 7 | 75% | 830 | 25 | 255 | 1,120 | - | 1 |
| 8 | 75% | 830 | 27 | 282 | 1,440 | - | 1 |
| 9 | 90% | 930 | 32 | 311 | 1,800 | 200 | 1 |
| 10 | 90% | 930 | 36 | 344 | 1,900 | - | 3 |
| 11 | 90% | 930 | 43 | 381 | 2,000 | - | 3 |
| 12 | 100% | 1,010 | 47 | 398 | 2,100 | 400 | 3 |
| 13 | 100% | 1,010 | 53 | 415 | 2,200 | - | 5 |
| 14 | 100% | 1,010 | 57 | 432 | 2,300 | - | 5 |
| 15 | 110% | 1,120 | 61 | 449 | 2,400 | 600 | 5 |
| 16 | 110% | 1,120 | 66 | 466 | 2,500 | - | 7 |
| 17 | 110% | 1,120 | 70 | 483 | 2,600 | - | 7 |
| 18 | 120% | 1,200 | 75 | 500 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Grand Warden |
| Ability Type | Passive |
| Rarity | Common |
| Unlock Requirement | Available by default |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `percentHPIncrease` = `MainAbilities:special_abilities[GrandWardenLifeAura] → AuraSpell:spells[Life Gem Aura].ExtraHealthPermil` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client permil ÷ 10)
- `maxHPIncrease` = `MainAbilities:special_abilities[GrandWardenLifeAura] → AuraSpell:spells[Life Gem Aura].ExtraHealthMax` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)

**Client columns and interpretation notes**

- `special_abilities[GrandWardenLifeAura]` → `AuraSpell=Life Gem Aura`: `ExtraHealthPermil` 500 → 1200, `ExtraHealthMax` 640 → 1200, `ExtraHealthMin` 0, `Radius` 900, `TimeBetweenHitsMS` 300, `ImmunitySiegeMachines`, `DoesNotAffectOwner=TRUE`.
- Warden auras are spells cast on him (`AuraSpell`) with `Radius` 900 (9 tiles) that pulse every `TimeBetweenHitsMS`; effects on a unit persist for `BoostTimeMS`/`ShieldTime` (1000 ms) after its last pulse, which is the wiki's 'lose it one second after leaving the ring'.

**Mismatches / ambiguities**

- `hitpointIncrease` (level 9): wiki **311** vs client **312** — character_items.HitPoints
