# Hero Bell

- **Source:** https://clashofclans.fandom.com/wiki/Hero_Bell
- **Wiki revision:** 622571 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** building
- **Client record:** `seasonal_defense_archetypes.csv` → `HeroBooster`

> Crafted (seasonal) defense whose 50-tile aura raises defending heroes' damage and hitpoints until it is destroyed; three 10-level modules.

## Mechanics

- Chosen from the Crafting Station; modules: Hitpoints (400 → 4,900), Hero DPS Boost (+4% → +17%), Hero HP Boost (+8% → +35%). Only one module upgrades at a time.
- The boost switches on a few seconds after the battle starts (the bell rings to warn the attacker) and lasts until the Bell is destroyed; a hero leaving the 50-tile range loses it.
- It affects defending Heroes only — not Clan Castle troops or Guardians. Freezing the Bell does nothing.
- Boosts are passive buffs: they stack multiplicatively with difficulty modifiers but not with other defensive buffs such as Spell Tower Rage.

### Wiki table(s): Common Statistics

| Range |
|---|
| 50 tiles |


### Wiki table(s): Module 1: Hitpoints

| Level | Hitpoints | Cost | Build Time | Experience Gained |
|---|---|---|---|---|
| 1 | 400 | N/A | N/A | N/A |
| 2 | 900 | 4,000,000 | 1d | 293 |
| 3 | 1,400 | 5,000,000 | 1d 6h | 328 |
| 4 | 1,900 | 6,000,000 | 1d 12h | 360 |
| 5 | 2,400 | 7,000,000 | 1d 18h | 388 |
| 6 | 2,900 | 8,000,000 | 2d | 415 |
| 7 | 3,400 | 9,000,000 | 2d 6h | 440 |
| 8 | 3,900 | 10,000,000 | 2d 12h | 464 |
| 9 | 4,400 | 11,000,000 | 2d 18h | 487 |
| 10 | 4,900 | 12,000,000 | 3d | 509 |


### Wiki table(s): Module 2: Hero DPS Boost

| Level | Hero DPS Boost | Cost | Build Time | Experience Gained |
|---|---|---|---|---|
| 1 | +4% | N/A | N/A | N/A |
| 2 | +5% | 5,000,000 | 12h | 207 |
| 3 | +7% | 6,500,000 | 16h | 240 |
| 4 | +8% | 8,000,000 | 20h | 268 |
| 5 | +10% | 9,500,000 | 1d | 293 |
| 6 | +11% | 10,000,000 | 1d 6h | 328 |
| 7 | +13% | 10,500,000 | 1d 12h | 360 |
| 8 | +14% | 11,000,000 | 2d | 415 |
| 9 | +16% | 11,500,000 | 2d 12h | 464 |
| 10 | +17% | 12,000,000 | 3d | 509 |


### Wiki table(s): Module 3: Hero HP Boost

| Level | Hero HP Boost | Cost | Build Time | Experience Gained |
|---|---|---|---|---|
| 1 | +8% | N/A | N/A | N/A |
| 2 | +11% | 25,000 | 1d 12h | 360 |
| 3 | +14% | 30,000 | 2d | 415 |
| 4 | +17% | 35,000 | 2d 12h | 464 |
| 5 | +20% | 40,000 | 2d 14h | 472 |
| 6 | +23% | 55,000 | 2d 16h | 480 |
| 7 | +26% | 70,000 | 2d 18h | 487 |
| 8 | +29% | 85,000 | 2d 20h | 494 |
| 9 | +32% | 100,000 | 2d 22h | 501 |
| 10 | +35% | 115,000 | 3d | 509 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `cost` = `seasonal_defense_modules[HeroBoosterHPModule]` `BuildCost` (+`BuildResource`) (9 levels)
- `buildTimeSeconds` = `seasonal_defense_modules[HeroBoosterHPModule]` `BuildTimeD/H/M/S` (9 levels)
- `experienceGained` = `seasonal_defense_modules[HeroBoosterHPModule]` floor(√(build seconds)) — derived, no XP column (9 levels)
- Module 1: Hitpoints: `hitpoints` = `special_abilities[HeroBoosterHPAbility].HealthOverride` (10 levels)
- `cost` = `seasonal_defense_modules[HeroBoosterAttackModule]` `BuildCost` (+`BuildResource`) (9 levels)
- `buildTimeSeconds` = `seasonal_defense_modules[HeroBoosterAttackModule]` `BuildTimeD/H/M/S` (9 levels)
- `experienceGained` = `seasonal_defense_modules[HeroBoosterAttackModule]` floor(√(build seconds)) — derived, no XP column (9 levels)
- Module 2: Hero DPS Boost: `heroDPSBoostPercent` = `spells[SeasonalDefenseHeroBoosterRageAura].DamageBoostPercent × HERO_RAGE_MULTIPLIER 50% (truncated)` (10 levels)
- `cost` = `seasonal_defense_modules[HeroBoosterEffectModule]` `BuildCost` (+`BuildResource`) (9 levels)
- `buildTimeSeconds` = `seasonal_defense_modules[HeroBoosterEffectModule]` `BuildTimeD/H/M/S` (9 levels)
- `experienceGained` = `seasonal_defense_modules[HeroBoosterEffectModule]` floor(√(build seconds)) — derived, no XP column (9 levels)
- Module 3: Hero HP Boost: `heroHPBoostPercent` = `spells[SeasonalDefenseHeroBoosterHealthBoostAura].ExtraHealthPermil ÷ 10` (10 levels)
- Range 50 tiles = aura spell `Radius` 5000; boost starts after `ActiveAfterTime` 2200 ms (`ActiveOnAttackBegin`)

**Client columns and interpretation notes**

- `seasonal_defense_archetypes.csv` → `HeroBooster` (modules `HeroBoosterHPModule;HeroBoosterAttackModule;HeroBoosterEffectModule`, `TotalModuleLevelThresholds` 9;18;27 for the visual tiers).
- Module costs/timers are in `seasonal_defense_modules.csv` (`BuildCost`, `BuildResource`: HP module Elixir, DPS module Gold, HP-boost module Dark Elixir).
- DPS boost: aura spell `SeasonalDefenseHeroBoosterRageAura` `DamageBoostPercent` 8 → 35 (radius 5000, refresh 300 ms, `BoostTimeMS` 1000). The wiki's +4…+17% is half of that, consistent with `globals.HERO_RAGE_MULTIPLIER` 50 (rage effects on heroes are halved), truncated to whole percent.
- HP boost: `SeasonalDefenseHeroBoosterHealthBoostAura` `ExtraHealthPermil` 80 → 350 (= 8 → 35%). Both abilities use `ActiveAfterTime` 2200 ms with `ActiveOnAttackBegin=TRUE`; auras set `ImmunityGuardians` and `ImmunityOtherCharacters`.

**Mismatches / ambiguities**

- None found in the compared fields.
