# Official wiki cross-reference: Home Village spells, siege machines, super troops

This folder cross-references the Clash of Clans Wiki (clashofclans.fandom.com) against the pinned client tables (**18.400.21**). It covers every Home Village spell, both spell factories, the Workshop, every Siege Machine, every Super Troop, the Super Troop boosting rules, and the Clan Castle's reinforcement capacity and siege delivery. There are 50 entities in total.

Wiki pages were retrieved on **2026-09-15**. Every entity file records the exact wiki revision id. The wiki text is paraphrased, since the wiki is licensed CC BY-SA 3.0. Only short phrases are quoted, and the numbers are transcribed from its tables.

## Files

- `<slug>.md`: a human-readable dossier for one entity:
  - source URL and revision
  - **Mechanics** (paraphrased)
  - wiki constants
  - **Level table**. Cells that disagree with the client appear as `wiki (client X)`.
  - **Client comparison**: the column map, an automatic per-field check, and manual notes and ambiguities.
- `<slug>.json`: the same data in machine form. The keys `title`, `url`, `revid`, `clientName` and `category` come first, then:
  - `constants` and `levels`: numbers with explicit units in the key names (`...Seconds`, `...Tiles`, `...Hours`, `...Percent`)
  - `mismatches`: a list of `{field, level, wiki, client, note}`
  - extras: `retrieved`, `contentPage`, `parentPage`/`parentRevid` (for pages transcluded from `.../Home Village` subpages), `clientTable`, `clientColumnMap`, `extraTables`, and `boost` for super troops
- `index.json`: every entity with its slug, title, url, revid, clientName, category, one-line summary and mismatch count.

## Coverage

| Category | Count | Entities |
|---|---|---|
| `elixir-spell` | 10 | [Clone Spell](clone-spell.md), [Freeze Spell](freeze-spell.md), [Healing Spell](healing-spell.md), [Invisibility Spell](invisibility-spell.md), [Jump Spell](jump-spell.md), [Lightning Spell](lightning-spell.md), [Rage Spell](rage-spell.md), [Recall Spell](recall-spell.md), [Revive Spell](revive-spell.md), [Totem Spell](totem-spell.md) |
| `dark-spell` | 8 | [Angry Spell](angry-spell.md), [Bat Spell](bat-spell.md), [Earthquake Spell](earthquake-spell.md), [Haste Spell](haste-spell.md), [Ice Block Spell](ice-block-spell.md), [Overgrowth Spell](overgrowth-spell.md), [Poison Spell](poison-spell.md), [Skeleton Spell](skeleton-spell.md) |
| `siege-machine` | 9 | [Battle Blimp](battle-blimp.md), [Battle Drill](battle-drill.md), [Flame Flinger](flame-flinger.md), [Log Launcher](log-launcher.md), [Siege Barracks](siege-barracks.md), [Sky Wagon](sky-wagon.md), [Stone Slammer](stone-slammer.md), [Troop Launcher](troop-launcher.md), [Wall Wrecker](wall-wrecker.md) |
| `super-troop` | 17 | [Ice Hound](ice-hound.md), [Inferno Dragon](inferno-dragon.md), [Rocket Balloon](rocket-balloon.md), [Sneaky Goblin](sneaky-goblin.md), [Super Archer](super-archer.md), [Super Barbarian](super-barbarian.md), [Super Bowler](super-bowler.md), [Super Dragon](super-dragon.md), [Super Giant](super-giant.md), [Super Hog Rider](super-hog-rider.md), [Super Miner](super-miner.md), [Super Minion](super-minion.md), [Super Valkyrie](super-valkyrie.md), [Super Wall Breaker](super-wall-breaker.md), [Super Witch](super-witch.md), [Super Wizard](super-wizard.md), [Super Yeti](super-yeti.md) |
| `building` | 4 | [Clan Castle](clan-castle.md), [Dark Spell Factory](dark-spell-factory.md), [Spell Factory](spell-factory.md), [Workshop](workshop.md) |
| `mechanic` | 2 | [Siege Machines](siege-machines.md), [Super Troops](super-troops.md) |

The task list also had these items:

- **Siege Workshop**: the wiki has no such title. The page is **Workshop** (`workshop.md`); the client building is `Siege Workshop`.
- **Angry Spell** and **Sky Wagon** were not in the task list. They are included because the wiki's Dark Spell Factory and Workshop tables list them, and the pinned client contains them (`AngrySpell`, and `Air Troop Launcher` with Workshop level 9).
- **Super Troops** is an overview page. Boost cost and duration come from `Template:SuperTroopBoost`, which every Super Troop page transcludes, and the detailed boosting rules come from the **Super Sauna** page. Both are cited in `super-troops.md`.
- **Siege Machines** is also an overview page. `siege-machines.md` combines it with `Template:Siege Donations` (the level cap for each Clan Castle level).
- Sub-pages used for sub-units:
  - Super Hog Rider/Super Rider
  - Super Hog Rider/Super Hog
  - Super Witch/Big Boy
  - Ice Hound/Ice Pup
  - Super Yeti/Electromite
  - Troop Movement Speed (speed units)
- **Clan Castle** is covered only for reinforcement capacity, donation caps and how Siege Machines deliver troops.

## Method

1. **Fetching.** Pages were fetched one at a time, about 1.1 s apart, with `curl` against `api.php?action=parse&prop=wikitext|revid&redirects=1`, using the user agent `crown-and-clan-reference/1.0 (local fan project)`. Pages that are only a `<tabber>` wrapper (for example Lightning Spell and Super Barbarian) transclude `{{:<Title>/Home Village}}`. For those, the subpage was fetched too; its revid is the primary `revid` and the wrapper revid is `parentRevid`. Raw JSON stayed in the session scratchpad and is not committed.
2. **Extraction.** Scripts pulled `==Summary==`, the `==Statistics==` tables and the most recent `==History==` rows. They parsed MediaWiki `{| |}` tables with rowspan/colspan support, stripped `class="..."|` prefixes, `{{Res|..}}`/`{{H|..}}` templates and HTML comments, and parsed `5*`-style event-only levels.
3. **Client rows.** Rows were read from the decoded JSON tables `spells`, `characters`, `special_abilities`, `projectiles`, `buildings`, `super_licences` and `globals`, applying forward inheritance of per-level rows.
4. **Comparison.** Numbers were compared field by field, with a small tolerance for derived decimals such as lifetimes. Anything not reducible to a column (targeting text, formulas, stacking rules) was checked by hand and written up as notes or manual mismatches.

## Client encodings you need to know

| Topic | Encoding in the pinned client |
|---|---|
| Research rows (spells, sieges) | `UpgradeCost` / `UpgradeTimeD/H/M` on row N buy level **N+1**. `LaboratoryLevel` on row N gates level **N**. The max-level row repeats the previous cost/time as a placeholder. Matches every wiki research cell in this set. |
| Building rows (factories, Workshop, Clan Castle) | `BuildCost`, `BuildTime*` and `TownHallLevel` line up with the level itself. Wiki XP = floor(sqrt(build seconds)). |
| Distances | `Radius`, `AttackRange`, `DamageRadius`, `Damage2Radius`, `DieDamageRadius` and `TargetingRadius` are in 1/100 tile. |
| Times | `*MS`, `AttackSpeed`, `DeactivateAfterTime`, `DuplicateLifetime`, `BunkerDegenerationTime` and `LoseHpInterval` are in ms. |
| Movement speed | Internal `Speed` / 12.5 = in-game speed. The wiki truncates: Log Launcher 70 shows as 5, Flame Flinger 80 as 6. The wiki's Troop Movement Speed page says 100 internal units = 1 tile/s. |
| Spell speed boosts | `SpeedBoost` (troops) and `SpeedBoost2` (Heroes, half) are **in-game** units added to the displayed speed, so multiply by 12.5 for internal units. Poison stores negative values used as percent slows. |
| Super licences | `MinOriginalLevel` is **0-based** (all 17 rows are one below the wiki). Global `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 means TH11. `MAX_ACTIVE_SUPER_LICENCES` = 2. Super troop `VisualLevel` = base troop level. |
| Array columns | Multi-value columns span consecutive level rows. Example: Siege Barracks `BunkerTroops` is PEKKA on row 1 and Wizard on row 2, with counts in `BunkerTroopCount1` and `BunkerTroopCount2`. Naive inheritance breaks these. |
| Chained rows | Totem Spell -> `ChainSpell` TotemSummon -> character `Totem`. Flame Flinger projectile -> `HitSpell` FireSpiritExplosion. Troop Launcher / Sky Wagon barrels -> `HitSpell` TroopCatapultSummonTroopNew / AirTroopSummon. Ice Block and Angry spells -> `GiveSpecialAbility` rows. |

## Spell column mappings

| Mechanic | Client column(s) | Transform / notes |
|---|---|---|
| Housing, unlock | `HousingSpace`, `SpellForgeLevel` + `ProductionBuilding` | factory level that unlocks the spell |
| Area | `Radius` (Revive: `TargetingRadius`) | /100 tiles. `RandomRadius` is visual/spawn scatter. |
| Instant damage | `Damage` (Lightning) | absolute HP |
| Heal per pulse | `Damage` negative (Healing) | total = pulses x value. Heroes x `HeroDamageMultiplier` 55%. Stacking falloff in globals `HEAL_STACK_PERCENT` [100,100,90,90,70,40,10,0]. |
| Pulse count / duration | `NumberOfHits` x `TimeBetweenHitsMS` | Healing 41x300; Rage/Clone 60x300 (18 s); Jump & Haste N x 250 (+0.25 s vs wiki); Invisibility N x 250 (exact); Poison 40x400 (16 s); Earthquake 5x400; Angry 50x100 (5 s) |
| Linger after each pulse | `BoostTimeMS` (Rage/Haste 1000, Poison 500), `JumpBoostMS` 400, `InvisibilityTime` 600 | wiki gives "boost time 1 s" for Rage and Jump |
| Rage | `DamageBoostPercent` (additive %), `SpeedBoost`, `SpeedBoost2` | Heroes 50% (globals `HERO_RAGE_MULTIPLIER`, `HERO_RAGE_SPEED_MULTIPLIER`) |
| Freeze | `FreezeTimeMS` (+ undocumented `FreezeOuterTimeMS` = 90%) | seconds = /1000 |
| Stun | `StunTimeMS` (Lightning 100, Totem 200) | |
| Clone | `DuplicateHousing`, `DuplicateLifetime` 30000 | globals `CLONE_HEALER_WEIGHT_PERCENT` 40 |
| Invisibility | duration = `NumberOfHits` x 250 ms | `ImmunityWalls`, `ImmunitySiegeMachines` |
| Recall | `RecallHousing` | Hero 25 / Pet 20 weights are not in the row |
| Revive | `ResurrectHitpointPercentage`, `TargetingRadius` 800 | Heroes only (all other immunity flags set) |
| Totem | `ChainSpell`/`ChainSpellLevel` -> `TotemSummon` -> `Totem` `Hitpoints`, `LoseHpPerTick` 167 per `LoseHpInterval` 500 | 334 HP/s, `TargetableByGroundAndAir`, `DisableAttacking` |
| Poison | `PoisonDPS` (max), `PoisonIncreaseSlowly`, `SpeedBoost` / `AttackSpeedBoost` (negative %), `HeroDamageMultiplier` 5, `GuardianDamageMultiplier` 30 | `BoostDefenders`, `PoisonAffectAir`; globals `USE_POISON_AVOIDANCE` |
| Earthquake | `BuildingDamagePermil` x `NumberOfHits` / 10 = % of max HP; `TroopDamagePermil` likewise (L6+) | walls: `PreferredTarget` Wall + `PreferredTargetDamageMod` 5 (the wiki's 1/n + 5(n-1)^2 % rule lives in code); diminishing 1/(2n-1) for buildings |
| Haste | `SpeedBoost`/`SpeedBoost2`, duration pulses x 250 | Rage/Haste speed does not stack (largest wins) |
| Skeleton / Bat | `SummonTroop`, `UnitsToSpawn`, `SpawnFirstGroupSize` (4 / 2), `SpawnDuration`, `SpawnUpgradeLevel` | unit rows `Spell Shielded Skeleton` -> `Spell Unshielded Skeleton`, `Spell Bat`; `DamageReductionToStorages` 85 |
| Overgrowth | `FreezeTimeMS` = `ShieldTime` = `InvisibilityTime`, `ShieldProtectionPercent` 100, `NumTombStones` 40 | `ImmunityHeroes`/`OtherCharacters`/`Walls`/`Guardians` |
| Ice Block | `FreezeTimeMS` 7000, `GiveSpecialAbility` IceBlockSpell -> `ShieldProtectionPercent` 86..96 | snapshot on cast |
| Angry | `GiveSpecialAbility` AngrySpellAnger -> `DeactivateAfterTime` 7..12 s, `PreferedTargetBuildingClass` Defense | `BoostTimeMS` 25000 unexplained |
| Immunities | `ImmunityTH_CC`, `ImmunityStorages`, `ImmunityWalls`, `ImmunityOtherBuildings`, `ImmunitySiegeMachines`, `ImmunityTotems`, `ImmunityHeroes`, `ImmunityOtherCharacters`, `ImmunityGuardians` | |

## Most important wiki-vs-client discrepancies and ambiguities

1. **Super Troop cooldown.** Every `super_licences` row has `CooldownH` = 72. The Super Sauna page says there is no cooldown between boosts. Do not add a cooldown.
2. **Speed-boost units in abilities.** The wiki's Super Barbarian Rage (+16 speed, +70%, 8 s) and Rocket Balloon Boosters (+52 speed, 4 s) match the legacy spell rows `TroopRage` and `TroopHaste` exactly. The abilities the characters actually reference store `SpeedBoost` 150 and 318, and the unit is unknown. Damage and duration agree.
3. **Bat Spell.**
   - The wiki's Bat table says x0.4 damage to resource buildings. Client `DamageReductionToStorages` = 85 means x0.15, and the same wiki page's strategy text also says 15%.
   - Bat range: wiki 0.8 vs client 0.3 tile.
   - Skeleton and Bat Spell radius: wiki 3.5 tiles vs client `Radius` 225.
4. **Poison Spell.** The wiki says the effect lingers 6 s after a unit leaves the cloud; the client has only `BoostTimeMS` 500. The wiki says Heroes take "much less" damage; the client uses `HeroDamageMultiplier` = 5 (5%).
5. **Flame Flinger.**
   - DPS: wiki 124-179 vs client 127-184.
   - Range: wiki 11 vs client 10.05 tiles.
   - Burn: wiki summary 22 s vs 30 s in the client and in the wiki's own history.
   - Per-projectile damage cannot be derived exactly from the tables.
6. **Unit DPS drift.**
   - Super Hog Rider and Super Rider L10/L11: wiki 180/200 vs client 190/210.
   - Inferno Dragon L10-12 initial DPS: wiki 86/88/90 vs client 87/89/91. The client keeps an exact 1x/2x/20x ramp. The wiki table labels L12 as a second "11" and has an unresolved May 2026 nerf line.
   - Super Dragon: wiki DPS is client − 1 at every level.
7. **Durations and linger.**
   - Jump Spell boost time: wiki 1 s vs `JumpBoostMS` 400.
   - Super Valkyrie death rage: the wiki says it is shorter than a Rage Spell, but the client pulses 60x300 ms = 18 s, the same as Rage.
8. **Targeting and ranges.**
   - Sky Wagon: the wiki says it targets defenses; the client says `PreferedTargetBuildingClass` 'Any Building'.
   - Flying units show client range + 0.5 tile on the wiki: Super Minion 4/10.25 vs 3.5/9.75, Inferno Dragon 4 vs 3.5, Ice Hound 0.75 vs 0.25, Ice Pup 2.75 vs 2.25, Rocket Balloon 0.5 vs 0.
   - Super Wizard: wiki 3 vs client 3.5. Super Valkyrie: wiki 0.6 vs client 0.5.
   - Super Archer projectile reach: wiki 12 vs client 10 tiles.
9. **Super Wall Breaker.** The Super Sauna table says Wall Breaker level 8 is required; the troop page and the client say 7. The contact splash is 0.8 tile in the client; the wiki gives 1.6, which matches only the death explosion.
10. **Stacking and hidden rules that live only in globals or code.**
    - Healing stack falloff: `HEAL_STACK_PERCENT`.
    - Earthquake wall formula.
    - Recall Hero/Pet weights.
    - Stone Slammer: the wiki applies the x25 Wall bonus to hitbox 2 only; the client stores it on the character.
    - Super Yeti Electromite spawn: the Super Yeti page says the first spawn comes at 400 damage and then every 800, while the Electromite page and client `SpawnnedTroopsPerDamage` say every 400.

Smaller items:

- **Clan Castle.** Request cooldown: wiki 10 min vs `ALLIANCE_TROOP_REQUEST_COOLDOWN` 1200. Level 1 Town Hall requirement: 2* vs 3.
- **Dark Spell Factory.** The L4 XP cell (587) corresponds to a 4-day build, but the build time is 3 days.
- **Page summaries out of date.** Some wiki summary texts lag behind their own tables: Healing still says 40 pulses, Workshop 8 machines, Spell Factory 9 spells.
- **Undocumented client fields.** `FreezeOuterTimeMS` on Freeze, Ice Hound death freeze radius 650, Ice Hound chill 50% for 2 s, Super Witch summon cooldown 25 s, Battle Drill surfacing stun 2 s in 1.5 tiles, Totem impact stun 0.2 s.

## Mismatch digest (from the JSON files)

| Entity | Fields |
|---|---|
| [Jump Spell](jump-spell.md) | `boostTimeSeconds`: wiki 1 / client 0.4 |
| [Bat Spell](bat-spell.md) | `radiusTiles`: wiki 3.5 / client 2.25; `bat.damageVsResourcesMultiplier`: wiki 0.4 / client 0.15; `bat.rangeTiles`: wiki 0.8 / client 0.3 |
| [Poison Spell](poison-spell.md) | `lingerAfterLeavingSeconds`: wiki 6 / client 0.5 |
| [Skeleton Spell](skeleton-spell.md) | `radiusTiles`: wiki 3.5 / client 2.25 |
| [Flame Flinger](flame-flinger.md) | `dps` L1,2,3,4,5: wiki 124/137/151/165/179 vs client 127/141/155/169/184; `rangeTiles`: wiki 11 / client 10.05; `burnDurationSeconds`: wiki 22 / client 30; `damagePerHit` L1: wiki 225 / client 211.67 |
| [Sky Wagon](sky-wagon.md) | `preferredTarget`: wiki Defenses (summary text) / client Any Building |
| [Ice Hound](ice-hound.md) | `rangeTiles`: wiki 0.75 / client 0.25; `icePup.rangeTiles`: wiki 2.75 / client 2.25 |
| [Inferno Dragon](inferno-dragon.md) | `rangeTiles`: wiki 4 / client 3.5; `dpsInitial` L10,11,12: wiki 86/88/90 vs client 87/89/91 |
| [Rocket Balloon](rocket-balloon.md) | `rangeTiles`: wiki 0.5 / client 0.0; `boosterSpeedIncrease`: wiki 52 / client 318 |
| [Super Archer](super-archer.md) | `projectileRangeTiles`: wiki 12 / client 10 |
| [Super Barbarian](super-barbarian.md) | `rageSpeedIncrease`: wiki 16 / client 150 |
| [Super Dragon](super-dragon.md) | `dps` L3,4,5,6,7,8,9,10,11,12,13: wiki 300/325/351/376/401/426/451/476/496/516/536 vs client 301/326/352/377/402/427/452/477/497/517/537; `splashRadiusTiles`: wiki 1 / client 1.6 |
| [Super Hog Rider](super-hog-rider.md) | `dps` L10,11: wiki 180/200 vs client 190/210; `damagePerHit` L10,11: wiki 180/200 vs client 190/210; `superRider.dps` L10,11: wiki 180/200 vs client 190/210; `superRider.damageVsWalls` L10,11: wiki 360/400 vs client 380/420 |
| [Super Minion](super-minion.md) | `rangeTiles`: wiki 4 / client 3.5; `longShotRangeTiles`: wiki 10.25 / client 9.75 |
| [Super Valkyrie](super-valkyrie.md) | `rangeTiles`: wiki 0.6 / client 0.5; `deathRageDurationSeconds`: wiki shorter than Rage Spell (18 s) / client 18 |
| [Super Wall Breaker](super-wall-breaker.md) | `attackSplashRadiusTiles`: wiki 1.6 / client 0.8 |
| [Super Wizard](super-wizard.md) | `rangeTiles`: wiki 3 / client 3.5 |
| [Super Yeti](super-yeti.md) | `electromiteSpawnDamageInterval`: wiki first at 400 then every 800 (Super Yeti page); every 400 (Electromite page) / client 400 |
| [Clan Castle](clan-castle.md) | `townHallLevel` L1: wiki 2* / client 3; `requestCooldownMinutes`: wiki 10 / client 1200 |
| [Dark Spell Factory](dark-spell-factory.md) | `experience` L4: wiki 587 / client 509 |
| [Super Troops](super-troops.md) | `cooldownHours`: wiki 0 / client 72; `Super Wall Breaker.minBaseLevel (Super Sauna)`: wiki 8 / client 7 |

## Not found / limitations

- The Laboratory level cap that each Clan Castle level applies to donations, and the Siege Machine level-cap table, do not appear as columns in the client tables examined (`buildings`, `characters`, `globals`, `townhall_levels`). They are recorded from the wiki only.
- The Recall Spell's Hero (25) and Pet (20) housing weights and its Hero-first priority are not columns on the spell row.
- The Super Hog Rider and Super Yeti pages give no explicit Town Hall requirement, so TH13 is derived from the client Laboratory data. The Super Yeti page's hidden (commented-out) TH13/CC9 line was ignored.
- The per-level Town Hall column on Rocket Balloon, Super Dragon, Super Minion and Ice Hound was compared only for boostable levels. Event-only starred levels reflect event eligibility.
- The exact meaning of these client fields could not be settled from data alone: `FreezeOuterTimeMS`, `InvisibilityTime`, Battle Blimp `AttackCount` 20, Angry Spell `BoostTimeMS` 25000, and the special-ability `SpeedBoost` units. They are flagged in the entity files.
- Wiki History sections were read only for recent entries, to date balance changes. All tables reflect the live revision on 2026-09-15.
