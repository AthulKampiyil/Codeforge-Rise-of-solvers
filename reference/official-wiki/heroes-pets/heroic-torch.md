# Heroic Torch

- **Source:** https://clashofclans.fandom.com/wiki/Heroic_Torch
- **Wiki revision:** 623829 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Grand Warden
- **Client record:** `character_items.csv` → `Heroic Torch`

> Warden Epic active item: for 16 → 27.5 s allies in his ring move faster, take 6% → 15% less damage and can pass through Walls; passive DPS, HP and recovery.

## Mechanics

- Epic equipment for the Grand Warden; ability type **Active**; unlock/obtain: Buy in Splash Bash event for 3,100 Splash Medal; Buy in Equipment Blast event for 3,100 Relic Medal; or purchasable from the Trader for 1,500 Gem.
- Levels 1–27. Blacksmith level required by equipment level: 1–12 → 1; 13–15 → 3; 16–18 → 5; 19–21 → 7; 22–24 → 8; 25–27 → 9.
- Total ore from level 1 to max (sum of wiki costs): 56,060 Shiny Ore, 3,720 Glowy Ore, 480 Starry Ore.
- Per-level stats (level 1 → max): Ability Duration 16 s → 27.5 s; Speed Increase 5 → 9; Incoming Damage Reduction % 6% → 15%; HP Recovery Increase 110 → 390; Damage per Second Increase 12 → 78; Hitpoint increase 35 → 137.
- Ability: a radial burst; while active, every friendly unit in the ring (the Warden included) gains +5 → +9 movement speed, 6% → 15% damage reduction and the ability to walk through Walls (if it could not already). Duration 16 s (levels 1–2) … 26 s (24–26), 27.5 s (27), including the one-second linger.
- Units leaving the ring keep the effects for 1 s; units entering gain them while the ability lasts. Siege Machines are excluded; other heroes get half the speed bonus but the full reduction and wall passing.
- Implementation hazard noted by the wiki: units still inside Walls when the effect ends could become stuck (a bug that persisted after release).
- Passive: +12 → +78 DPS, +35 → +137 HP, recovery +110 → +390.
- Obtain: 3,100 event medals (Splash Bash, Equipment Blast) or 1,500 gems at the Trader.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Ability Duration | Ability Attributes / Speed Increase | Ability Attributes / Incoming Damage Reduction % | Hero Boost / HP Recovery Increase | Hero Boost / Damage per Second Increase | Hero Boost / Hitpoint increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Upgrade Cost / Starry Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 16s | 5 | 6% | 110 | 12 | 35 | N/A | N/A | N/A | 1 |
| 2 | 16s | 5 | 6% | 120 | 13 | 40 | 120 | - | - | 1 |
| 3 | 17s | 6 | 7% | 130 | 14 | 42 | 240 | 20 | - | 1 |
| 4 | 17s | 6 | 7% | 140 | 16 | 45 | 400 | - | - | 1 |
| 5 | 17s | 6 | 7% | 150 | 18 | 50 | 600 | - | - | 1 |
| 6 | 18s | 6 | 8% | 160 | 20 | 52 | 840 | 100 | - | 1 |
| 7 | 18s | 6 | 8% | 170 | 22 | 55 | 1,120 | - | - | 1 |
| 8 | 18s | 6 | 8% | 180 | 24 | 60 | 1,440 | - | - | 1 |
| 9 | 19s | 7 | 9% | 190 | 27 | 63 | 1,800 | 200 | 10 | 1 |
| 10 | 19s | 7 | 9% | 200 | 29 | 66 | 1,900 | - | - | 1 |
| 11 | 19s | 7 | 9% | 210 | 31 | 71 | 2,000 | - | - | 1 |
| 12 | 21s | 7 | 10% | 220 | 34 | 74 | 2,100 | 400 | 20 | 1 |
| 13 | 21s | 7 | 10% | 230 | 36 | 77 | 2,200 | - | - | 3 |
| 14 | 21s | 7 | 10% | 240 | 38 | 82 | 2,300 | - | - | 3 |
| 15 | 23s | 7 | 11% | 250 | 41 | 85 | 2,400 | 600 | 30 | 3 |
| 16 | 23s | 7 | 11% | 260 | 43 | 88 | 2,500 | - | - | 5 |
| 17 | 23s | 7 | 11% | 270 | 45 | 93 | 2,600 | - | - | 5 |
| 18 | 24s | 8 | 12% | 285 | 48 | 96 | 2,700 | 600 | 50 | 5 |
| 19 | 24s | 8 | 12% | 295 | 51 | 99 | 2,800 | - | - | 7 |
| 20 | 24s | 8 | 12% | 305 | 54 | 104 | 2,900 | - | - | 7 |
| 21 | 25s | 8 | 13% | 320 | 58 | 107 | 3,000 | 600 | 100 | 7 |
| 22 | 25s | 8 | 13% | 330 | 61 | 110 | 3,100 | - | - | 8 |
| 23 | 25s | 8 | 13% | 340 | 64 | 115 | 3,200 | - | - | 8 |
| 24 | 26s | 8 | 14% | 355 | 68 | 118 | 3,300 | 600 | 120 | 8 |
| 25 | 26s | 8 | 14% | 365 | 71 | 121 | 3,400 | - | - | 9 |
| 26 | 26s | 8 | 14% | 375 | 74 | 126 | 3,500 | - | - | 9 |
| 27 | 27.5s | 9 | 15% | 390 | 78 | 137 | 3,600 | 600 | 150 | 9 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Grand Warden |
| Ability Type | Active |
| Rarity | Epic |
| Unlock Requirement | Buy in Splash Bash event for 3,100 Splash Medal; Buy in Equipment Blast event for 3,100 Relic Medal; or purchasable from the Trader for 1,500 Gem |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hpRecoveryIncrease` = `character_items.HealOnActivation` (all levels)
- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `speedIncrease` = `MainAbilities:special_abilities[GWHeroicTorch] → AuraSpell:spells[Heroic Torch Aura].SpeedBoost` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `incomingDamageReductionPercent` = `MainAbilities:special_abilities[GWHeroicTorch] → AuraSpell:spells[Heroic Torch Aura].ShieldProtectionPercent` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `abilityDurationSeconds`: = `GWHeroicTorch.DeactivateAfterTime` ÷ 1000 + 1 s linger (`ShieldTime`/`BoostTimeMS` 1000) — all 27 levels match

**Client columns and interpretation notes**

- `special_abilities[GWHeroicTorch]`: `DeactivateAfterTime` 15000/16000/17000/18000/20000/22000/23000/24000/25000/26500, `AuraSpell=Heroic Torch Aura`, `InfoScreenAttribute1` 25/29/33/35 (UI value not identified on the wiki).
- `spells[Heroic Torch Aura]`: `SpeedBoost`/`SpeedBoost2` 5 → 9 (aura speed values are already in wiki units), `ShieldProtectionPercent` 6 → 15, `Radius` 900, `TimeBetweenHitsMS` 250, `NumberOfHits` 61 → 107, `ShieldTime` 1000, `BoostTimeMS` 1000, building immunities and `ImmunitySiegeMachines`.
- Wall passing has no explicit column in these rows; the half speed on heroes matches `globals.HERO_RAGE_SPEED_MULTIPLIER` 50.
- Warden auras are spells cast on him (`AuraSpell`) with `Radius` 900 (9 tiles) that pulse every `TimeBetweenHitsMS`; effects on a unit persist for `BoostTimeMS`/`ShieldTime` (1000 ms) after its last pulse, which is the wiki's 'lose it one second after leaving the ring'.

**Mismatches / ambiguities**

- `wallWalking`: wiki **units can walk through Walls** vs client **no visible column (InfoScreenAttribute1 25–35 unexplained)** — engine rule to verify
