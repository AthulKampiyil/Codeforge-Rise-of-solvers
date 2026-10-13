# Heroes

- **Source:** https://clashofclans.fandom.com/wiki/Heroes
- **Wiki revision:** 621611 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** mechanic
- **Client record:** none (see Client comparison)

> Hub page: six Home Village heroes (plus two Builder Base heroes); cross-page hero rules for slots, abilities, equipment, defense and early-TH scaling.

## Mechanics

- Home Village heroes and Hero Hall unlock level: Barbarian King 1 (TH4), Archer Queen 2 (TH8), Minion Prince 3 (TH9), Grand Warden 5 (TH11), Royal Champion 7 (TH13), Dragon Duke 9 (TH15). Builder Base heroes (Battle Machine, Battle Copter) are outside this dossier.
- Heroes are reusable units: they attack and (from TH7, via Hero Banners) defend, are upgraded by Builders in the Hero Hall, and are unavailable for attacks while upgrading.
- Hero slots (Hero Hall 1/3/5/7 → 1/2/3/4 slots) cap how many heroes join an attack and how many defend; attack and defense picks are independent.
- Each hero has one ability per battle: flat health recovery plus the active effects of its two equipped items; passive items act all battle. If unused, the ability triggers on KO (can be disabled in settings).
- Equipment (two slots per hero) and pets (one per hero) only apply on attack; defending heroes use neither.
- Heroes do not need to be destroyed for three stars. Heroes no longer regenerate between battles (removed March 2025): each attack starts at full health, and defending heroes are restored after each defense.
- Barbarian King at TH4–6 is limited (level 1, fixed equipment, attack only) and scaled 50/75/100%.
- Spell/aura interactions on heroes are commonly reduced: rage-type damage boosts are halved on heroes (Rage Gem/Hero Bell pages).

## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Barbarian King: `heroes.csv` level-1 row `RequiredTownHallLevel` 4 / `RequiredHeroTavernLevel` 1, 110 levels, `ItemSlotCount` 2
- Archer Queen: `heroes.csv` level-1 row `RequiredTownHallLevel` 8 / `RequiredHeroTavernLevel` 2, 110 levels, `ItemSlotCount` 2
- Grand Warden: `heroes.csv` level-1 row `RequiredTownHallLevel` 11 / `RequiredHeroTavernLevel` 5, 85 levels, `ItemSlotCount` 2
- Royal Champion: `heroes.csv` level-1 row `RequiredTownHallLevel` 13 / `RequiredHeroTavernLevel` 7, 55 levels, `ItemSlotCount` 2
- Minion Prince: `heroes.csv` level-1 row `RequiredTownHallLevel` 9 / `RequiredHeroTavernLevel` 3, 95 levels, `ItemSlotCount` 2
- Dragon Duke: `heroes.csv` level-1 row `RequiredTownHallLevel` 15 / `RequiredHeroTavernLevel` 9, 25 levels, `ItemSlotCount` 2
- Builder Base heroes (`BB Battle Machine`, `BB Battle Copter`) are out of scope for this Home Village dossier

**Client columns and interpretation notes**

- Per-hero data: `heroes.csv` (level rows), `special_abilities.csv` (`<Hero>AbilityHeal`), `character_items.csv` (equipment). `globals`: `TAVERN_LEVEL_TO_HERO_SLOT_COUNT`, `HERO_UPGRADE_CANCEL_MULTIPLIER` 50, `HERO_RAGE_MULTIPLIER` 50 and `HERO_RAGE_SPEED_MULTIPLIER` 50 (rage on heroes), `HERO_HOUSING_COST_MULTIPLIER` 100, `HERO_DEFENCE_AUTO_HEAL` TRUE, `BOOSTER_HERO_POTION_ADD_LEVELS` 5 / `BOOSTER_HERO_POTION_DURATION` 3600.
- Legacy regeneration columns survive (`FREE_HERO_HEALTH_CAP`, `HERO_HEALTH_SPEED_UP_COST_MULTIPLIER`) although heroes no longer regenerate.
- `townhall_levels.csv` `ScaleByTHPercent`: TH1–3 25, TH4 50, TH5 75, TH6+ 100 (only heroes with `ScaleByTH=TRUE`, i.e. the King, use it).

**Mismatches / ambiguities**

- `ScaleByTHPercent` (level TH1–3): wiki **not applicable (no heroes before TH4)** vs client **25** — client defines a 25% value for TH1–3 that is unreachable in normal progression
