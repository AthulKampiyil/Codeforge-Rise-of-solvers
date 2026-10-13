# Crafting Station

- Source: [Crafting Station](https://clashofclans.fandom.com/wiki/Crafting_Station) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624956`; retrieved 2026-09-15
- Category: building
- Client reference (18.400.21): `buildings.csv` -> `Crafting Station`

## Mechanics

- A free 3x3 building (one per base). The page's summary still says it unlocks at the highest Town Hall (18), but the History records that from August 1, 2026 (Crafting Phase 4) it is also available from **Town Hall 11** (NumberAvailable TH11 = 1).
- Before a defense is chosen it has 1,000 HP and no attack, but already counts as a defensive building (defense-targeting troops, Seeking Shields and Fireballs treat it as one). Once a Crafted Defense is chosen it cannot return to the empty form.
- The owner chooses one of the current phase's three Crafted Defenses and can swap between them at any time for free; each keeps its own module progress.
- Each Crafted Defense has three modules (typically hitpoints, damage and a unique effect), each upgradable from level 1 to 10 with a Builder, costing resources and time; the defense's displayed level is the sum (3 at start, 30 max). Only one module per Crafted Defense can upgrade at a time, but different Crafted Defenses can upgrade simultaneously. Module upgrades behave like building upgrades (XP, gems, magic items, Gold Pass builder boosts).
- Crafted Defenses keep defending while a module upgrades.
- Module level caps follow the Town Hall (the module tables require TH11 for level 1, TH12 for level 2 ... TH18 for levels 8-10).
- Each Crafting Phase lasts about four months (three per year); when it ends all Crafted Defenses are removed and a new set appears. Players left at a previously-max Town Hall keep the station until the phase ends.
- Each module level awards 8 Sparky Stones (216 for one fully upgraded defense).
- Total module time per defense: 54 days in phases 1-3; phase 4 modules take 20d20h, 22d15h and 24d2h (67d13h per defense).
- Phases: 1 Hook Tower / Flame Spinner / Crusher Mortar; 2 Hero Bell / Bomb Hive / Light Beam; 3 Roaster / Air Bombs / Lava Launcher; 4 (Aug 1 - Dec 31, 2026) Hot Candle / Hero Hunter / Cake-A-Pult.

### Recent balance notes (from the page's History table)

- August 1, 2026: Crafting Phase 4 begins (Hot Candle, Hero Hunter, Cake-A-Pult); station made available from Town Hall 11.
- July 31, 2026: Crafting Phase 3 ended (defenses removed).

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH11: 1

Size: 3x3

**Statistics**

| Hitpoints | Build Cost | Build Time |
|---|---|---|
| 1,000* | None | None |

## Client comparison

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| unlockTownHall | 1 | 11 (since Aug 1, 2026; summary text still says 18) | TownHallLevel 17; townhall_levels count only at TH18 | the client predates (or does not encode) the TH11 availability; module level-1 rows also require TH12 in the client vs TH11 on the wiki |

**Interpretation of client columns**

- buildings.csv `Crafting Station`: single level, `BuildingClass` Defense, `SeasonalDefense` TRUE, `Hitpoints` 1000, `BuildCost` 0, `TownHallLevel` 17, 3x3.
- seasonal_defense.csv: `Season1` HookTower/FlameSpinner/CrusherMortar, `Season2` HeroBooster (Hero Bell)/LogLobber (Bomb Hive?)/SunBeam (Light Beam), `Season3` SDRoaster/SDAirBombs/SDLavaLauncher, `Season4` Inferno Candle (Hot Candle)/Headhunter Tower (Hero Hunter)/Cake Thrower (Cake-A-Pult). Unused archetypes also exist (LazyLaser, SlowdownTower).
- seasonal_defense_archetypes.csv: `SpecialAbility` (base attack), `Modules` (3 module ids), `TotalModuleLevelThresholds` 9;18;27 (appearance/strength tiers by summed module level).
- seasonal_defense_modules.csv: per module 10 rows with `StatType`, `SpecialAbility` (level = module level), `BuildResource`, `BuildCost`, `BuildTimeH` (hours) and `TownHallLevel`; the actual stats are in special_abilities.csv (`HealthOverride`, `Damage`/`DPS`, effect columns).
- globals: `CRAFTED_DEFENSE_UPGRADE_REWARD` 8 (Sparky Stones per module level), `SEASONAL_DEFENSE_SEASON_ENDS_SOON_TIME` 1209600 s (14-day warning), `SEASONAL_DEFENSE_STRENGTH_WEIGHTS` 5000..18500 (matchmaking weight by defense level).
