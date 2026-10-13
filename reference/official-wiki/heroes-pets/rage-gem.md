# Rage Gem

- **Source:** https://clashofclans.fandom.com/wiki/Rage_Gem
- **Wiki revision:** 622981 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Grand Warden
- **Client record:** `character_items.csv` → `Rage Gem`

> Warden Common passive item (Blacksmith 4): aura raising allies' damage (or healing) by 15% → 50% without speed boosts; passive DPS and attack speed.

## Mechanics

- Common equipment for the Grand Warden; ability type **Passive**; unlock/obtain: Blacksmith level 4.
- Levels 1–18. Blacksmith level required by equipment level: 1–12 → 4; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): % Damage Increase 15 → 50; Damage per Second Increase 12 → 88; Attack Speed Increase 5% → 22%.
- Passive aura: friendly units in the ring deal +15% (levels 1–2) → +50% (18) damage (healers heal more); unlike Rage Spells there is no movement or attack-speed boost.
- Not applied to the Warden himself or Siege Machines; halved on other heroes. It vanishes when the Warden is knocked out.
- Stacking: a Rage Spell inside the ring overrides it; Rage Vial and the Mighty Yak's post-hero rage override it; it overrides Sneezy's 1% rage.
- Passive: +12 → +88 DPS and +5% → +22% attack speed (Warden interval 1.71 s → 1.475 s).

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | % Damage Increase | Hero Boosts / Damage per Second Increase | Hero Boosts / Attack Speed Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|
| 1 | 15% | 12 | +5% | N/A | N/A | 4 |
| 2 | 15% | 14 | +6% | 120 | - | 4 |
| 3 | 20% | 16 | +7% | 240 | 20 | 4 |
| 4 | 20% | 18 | +8% | 400 | - | 4 |
| 5 | 20% | 20 | +9% | 600 | - | 4 |
| 6 | 25% | 22 | +10% | 840 | 100 | 4 |
| 7 | 25% | 24 | +11% | 1,120 | - | 4 |
| 8 | 25% | 26 | +12% | 1,440 | - | 4 |
| 9 | 30% | 30 | +13% | 1,800 | 200 | 4 |
| 10 | 30% | 36 | +14% | 1,900 | - | 4 |
| 11 | 30% | 43 | +15% | 2,000 | - | 4 |
| 12 | 35% | 49 | +16% | 2,100 | 400 | 4 |
| 13 | 35% | 56 | +17% | 2,200 | - | 5 |
| 14 | 35% | 62 | +18% | 2,300 | - | 5 |
| 15 | 45% | 69 | +19% | 2,400 | 600 | 5 |
| 16 | 45% | 75 | +20% | 2,500 | - | 7 |
| 17 | 45% | 82 | +21% | 2,600 | - | 7 |
| 18 | 50% | 88 | +22% | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Grand Warden |
| Ability Type | Passive |
| Rarity | Common |
| Unlock Requirement | Blacksmith level 4 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `attackSpeedIncreasePercent` = `character_items.AttackSpeedPercentage` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `percentDamageIncrease` = `MainAbilities:special_abilities[GrandWardenRageAura] → AuraSpell:spells[Rage Gem Aura].DamageBoostPercent` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)

**Client columns and interpretation notes**

- `special_abilities[GrandWardenRageAura]` → `AuraSpell=Rage Gem Aura`: `DamageBoostPercent` 15 → 50, `SpeedBoost`/`SpeedBoost2` 0, `BoostTimeMS` 1000, `Radius` 900, `TimeBetweenHitsMS` 300, `ImmunitySiegeMachines`, `DoesNotAffectOwner`.
- Halving on heroes matches `globals.HERO_RAGE_MULTIPLIER` 50.
- Warden auras are spells cast on him (`AuraSpell`) with `Radius` 900 (9 tiles) that pulse every `TimeBetweenHitsMS`; effects on a unit persist for `BoostTimeMS`/`ShieldTime` (1000 ms) after its last pulse, which is the wiki's 'lose it one second after leaving the ring'.

**Mismatches / ambiguities**

- None found in the compared fields.
