# Official Clash of Clans Wiki cross-reference: Home Village troops

Behaviour and number reference for every Home Village Elixir and Dark Elixir troop and the units they spawn, taken from the official Clash of Clans Wiki (clashofclans.fandom.com) on 2026-09-15 and compared with the pinned client 18.400.21 logic tables. Mechanics text is paraphrased; wiki content is CC BY-SA, see each source link and revision id.

## Coverage

- 19 Elixir troops, 13 Dark Elixir troops, 8 secondary units and 6 mechanic references: 46 entities, each with `<slug>.md` and `<slug>.json`, listed in `index.json`.
- Troop and secondary-unit pages: 2519 wiki numbers compared with client-derived values, 2481 exact matches (38 mismatch entries: 26 from the troop statistics tables and 12 from other wiki text such as summaries, history and the speed page; plus 11 Barbarian research rows that only differ under the inherited-minute reading).
- Laboratory/Upgrade Chart: 818/819 research values for the 32 troops equal the client.
- JSON shape per troop: `constants` (wiki-first, with client counterparts), `client` (raw derived client constants), `levels` (wiki level table), `clientLevels` (same keys from the client), `spawned`, `mismatches`, `ambiguities`.

### elixir-troop

| Title | Slug | Wiki revid | Client row | Summary |
|---|---|---|---|---|
| [Barbarian](barbarian.md) | `barbarian` | 624623 | Barbarian | Cheap single-target melee ground troop; no ability. |
| [Archer](archer.md) | `archer` | 624208 | Archer | Single-target ranged (3.5 tiles) ground troop that hits ground and air. |
| [Giant](giant.md) | `giant` | 625274 | Giant | Slow defense-targeting melee tank. |
| [Goblin](goblin.md) | `goblin` | 625104 | Goblin | Fast resource-targeting melee troop; x2 damage to resource buildings incl. Town Hall and Clan Castle. |
| [Wall Breaker](wall-breaker.md) | `wall-breaker` | 624864 | Wall Breaker | Suicide bomber that targets walls; x40 wall damage on attack and on death. |
| [Balloon](balloon.md) | `balloon` | 624220 | Balloon | Flying defense-targeting bomber; 1.2-tile ground splash, death blast after 416 ms. |
| [Wizard](wizard.md) | `wizard` | 625289 | Wizard | Ranged 0.3-tile splash troop hitting ground and air. |
| [Healer](healer.md) | `healer` | 624772 | Healer | Flying healer of ground units (1.5-tile splash heal); reduced Hero healing; 7-healer stacking cap. |
| [Dragon](dragon.md) | `dragon` | 624759 | Dragon | Flying ranged splash attacker hitting ground and air. |
| [P.E.K.K.A](pekka.md) | `pekka` | 625276 | PEKKA | Slow, heavy single-target melee troop too heavy to be sprung outright. |
| [Baby Dragon](baby-dragon.md) | `baby-dragon` | 624765 | Baby Dragon | Flying splash troop that enrages (+100% damage, +50% attack rate) with no allied flyer within 4.5 tiles. |
| [Miner](miner.md) | `miner` | 624732 | Miner | Burrows underground between targets (untargetable, ignores walls and traps). |
| [Electro Dragon](electro-dragon.md) | `electro-dragon` | 625283 | Electro Dragon | Flying chain-lightning attacker (5 targets, -20% per jump); 6 lightning strikes on death. |
| [Yeti](yeti.md) | `yeti` | 624065 | Yeti | Melee bruiser that releases 1 Yetimite per 600 damage taken and the rest on death. |
| [Dragon Rider](dragon-rider.md) | `dragon-rider` | 625318 | Dragon Rider | Flying defense-targeting ranged unit with a 2-tile death explosion. |
| [Electro Titan](electro-titan.md) | `electro-titan` | 624602 | Electro Titan | Tank with a 1.25-tile whip and a permanent 3.5-tile damage aura (buildings and troops, not walls). |
| [Root Rider](root-rider.md) | `root-rider` | 625331 | Root Rider | Defense-targeting tank that rides over walls while a wall-only aura destroys them; cannot be sprung. |
| [Thrower](thrower.md) | `thrower` | 625288 | Thrower | Long-range (6 tiles) single-target ground troop hitting ground and air. |
| [Meteor Golem](meteor-golem.md) | `meteor-golem` | 624499 | Meteor Golem | Throws one of its two Meteormites (5x vs walls), splitting and later re-merging. |

### dark-troop

| Title | Slug | Wiki revid | Client row | Summary |
|---|---|---|---|---|
| [Minion](minion.md) | `minion` | 625278 | Minion | Fast flying ranged troop immune to Seeking Air Mines. |
| [Hog Rider](hog-rider.md) | `hog-rider` | 624385 | Hog Rider | Fast defense-targeting melee troop that jumps walls. |
| [Valkyrie](valkyrie.md) | `valkyrie` | 624089 | Valkyrie | Spinning 1-tile self-centred splash melee troop. |
| [Golem](golem.md) | `golem` | 625101 | Golem | Defense-targeting tank; death blast and 2-4 Golemites on death. |
| [Witch](witch.md) | `witch` | 624601 | Witch | Ranged splash troop summoning Skeletons every 7 s up to a live cap. |
| [Lava Hound](lava-hound.md) | `lava-hound` | 624357 | Lava Hound | Flying Air-Defense-targeting tank; death blast and 8-22 Lava Pups. |
| [Bowler](bowler.md) | `bowler` | 625333 | Bowler | Throws a bouncing boulder that splashes twice in a line. |
| [Ice Golem](ice-golem.md) | `ice-golem` | 624194 | Ice Golem | Defense-targeting tank that slows what it hits and freezes a 7.5-tile area on death. |
| [Headhunter](headhunter.md) | `headhunter` | 625334 | Headhunter | Hero-hunting wall-jumper with x4 Hero damage and slowing poison. |
| [Apprentice Warden](apprentice-warden.md) | `apprentice-warden` | 624360 | Apprentice Warden | Wall-hopping ranged support granting +20-26% max HP in 7 tiles; follows groups. |
| [Druid](druid.md) | `druid` | 624267 | Druid | Chain healer (4 targets, ground and air) that becomes a Bear after 30 s or on death. |
| [Furnace](furnace.md) | `furnace` | 625281 | Furnace | Stationary 60-second spawner releasing 19-22 Firemites on a timer. |
| [Ruin Witch](ruin-witch.md) | `ruin-witch` | 625328 | Ruin Witch | Non-attacking summoner that vacuums rubble to create Ruin Knights (wiki 10 max, client 8). |

### secondary-unit

| Title | Slug | Wiki revid | Client row | Summary |
|---|---|---|---|---|
| [Yetimite](yeti-yetimite.md) | `yeti-yetimite` | 623075 | Yetimite | Wall-jumping kamikaze leaper: x4 vs defenses, x0.5 vs resources; ignores traps. |
| [Meteormite](meteor-golem-meteormite.md) | `meteor-golem-meteormite` | 625266 | Meteormite | Half of a Meteor Golem; melee, wall-jumping, merges back into a golem. |
| [Golemite](golem-golemite.md) | `golem-golemite` | 623847 | Golemite | Small defense-targeting Golem with its own death blast. |
| [Skeleton (Witch)](witch-skeleton.md) | `witch-skeleton` | 624632 | Skeleton | Weak melee summon that neither triggers traps nor opens the Clan Castle. |
| [Lava Pup](lava-hound-lava-pup.md) | `lava-hound-lava-pup` | 620375 | Lava Pup | Weak flying ranged pup released by a Lava Hound; fixed stats. |
| [Bear (Druid form)](druid-bear.md) | `druid-bear` | 623243 | Bear | Druid's defense-targeting melee form; cannot jump walls. |
| [Firemite](furnace-firemite.md) | `furnace-firemite` | 625356 | Firemite Spawn | Wall-jumping leaper that leaves a 10-second burning pool; ignores traps. |
| [Ruin Knight](ruin-witch-ruin-knight.md) | `ruin-witch-ruin-knight` | 625189 | Ruin Knight | Melee knight from rubble with x3 wall damage; client still has 80 HP/s decay. |

### mechanic

| Title | Slug | Wiki revid | Client row | Summary |
|---|---|---|---|---|
| [Troop Movement Speed](troop-movement-speed.md) | `troop-movement-speed` | 624844 | characters.Speed | In-game speed = round(internal/12.5); tiles per second = internal/100 (8 in-game points per tile/s). |
| [Template:PreferredTarget](preferred-target.md) | `preferred-target` | 619579 | characters.PreferedTargetBuildingClass | Favorite-target behaviours (None, Defenses, Resources, Walls, Air Defense, Heroes, Healing, transform) and their client columns. |
| [Troops (Army)](troops.md) | `troops` | 623017 | characters (ProductionBuilding) | Home Village roster: 19 Elixir + 13 Dark Elixir troops; lists match the client. |
| [Army Camp/Home Village](army-camp.md) | `army-camp` | 624555 | buildings.Army Camp | Army capacity per Army Camp level (20 to 88) and how housing space is counted. |
| [Laboratory/Upgrade Chart](laboratory-upgrade-chart.md) | `laboratory-upgrade-chart` | 623672 | characters research columns | Research cost/time/lab level per troop level; 818 of 819 chart values equal the client. |
| [Barracks / Dark Barracks](barracks.md) | `barracks` | 625112 | buildings.Barracks, buildings.Dark Barracks | Barracks level -> unlocked troop -> Town Hall requirement for all 32 troops. |

## Method

1. Fetched `api.php?action=parse&prop=wikitext|revid|templates` sequentially with curl (about 1 request per second), following tabber pages (Barbarian, Baby Dragon) to their `/Home Village` subpages and secondary units to their subpages (`Yeti/Yetimite`, `Witch/Skeleton`, ...). Raw JSON stayed in the session scratchpad, not in the repo.
2. Parsed the Statistics info box and level table of each page (MediaWiki table markup, rowspan/colspan, `class=...|` cell prefixes and templates stripped), the Summary bullets, targeted Strategy/Trivia/History lines, `Template:PreferredTarget`, `Laboratory/Upgrade Chart`, `Troop Movement Speed`, Barracks, Dark Barracks and Army Camp.
3. Derived client values from the decoded 18.400.21 tables: `characters.json` level rows (forward inheritance, except the split research-minute column, see below), then linked rows: `SpecialAbilities` -> `special_abilities.json` -> `SelfSpell` / `PoisonOnHitSpell` -> `spells.json`; `AuraSpell` -> `spells.json`; `Projectile` -> `projectiles.json` -> `HitSpell`; `DefensiveTroop`, `SecondaryTroop`, `SummonTroop`, `BunkerTroops`; and `globals.json`.
4. Compared every wiki number that has a client counterpart (tolerance 0.01) and recorded matches, mismatches and the client column that encodes each mechanic.

## Unit conversions established

- **Movement speed.** Wiki in-game Movement Speed = round(client `Speed` / 12.5), half up (220 -> 17.6 -> 18, 130 -> 10.4 -> 10, 160 -> 12.8 -> 13). Evidence: 39/40 troop pages in this folder (only the Headhunter page differs); on the Troop Movement Speed page 61/62 rows satisfy in-game = round(internal/12.5) and 56/62 wiki internal values equal client `Speed`.
- **Tiles per second** = `Speed` / 100, i.e. about 8 in-game speed points per tile per second. The wiki states this as its belief; it is consistent with the client using 1/100 tile for every distance column (next bullet). `src/game/extra-troops.ts` already uses `Speed / 100`.
- **Distances.** `AttackRange`, `DamageRadius`, `DieDamageRadius`, spell `Radius`/`RandomRadius`, `ChainAttackDistance`, `MergeSearchRadius`, `ActiveWhileAloneRadius`, `TargetGroupsRadius/Range`, `SecondarySpawnDist` are 1/100 tile. Evidence: all ground-troop ranges match the wiki exactly except Wall Breaker, Miner, Bear and Firemite (Barbarian 40 = 0.4, Archer 350 = 3.5, Thrower 600 = 6, Electro Titan 125 = 1.25), and every radius the wiki gives matches (Balloon 120 = 1.2, Valkyrie 100 = 1, Electro Titan aura 350 = 3.5, Ice Golem freeze 750/550 = 7.5/5.5, Apprentice aura 700 = 7, Electro Dragon chain 300 = 3, Baby Dragon alone radius 450 = 4.5, Golem death 150 = 1.5).
- **Flying attack range caveat.** For 7 flying units the wiki range is exactly client `AttackRange`/100 + 0.5 tile (Balloon 0 -> 0.5, Minion and Baby Dragon 2.25 -> 2.75, Dragon and Electro Dragon 2.5 -> 3, Healer 4.5 -> 5, Dragon Rider 3.5 -> 4). Lava Hound (0.25 -> 1) and Lava Pup (2.25 -> 2) do not follow it, so it is a wiki presentation convention rather than a rule you can rely on; use client `AttackRange` for simulation and treat the wiki value as a display value.
- **Time.** `AttackSpeed`, `*MS`, `*Delay`, `SummonTime`, `SummonCooldown`, `EvolveTime`, `BunkerDegenerationTime`, `PoisonOnHitDuration`, `FrostOnHitTime`, `LoseHpInterval` are milliseconds; `UpgradeTimeH`/`UpgradeTimeM` are hours/minutes.
- **Damage and heal.** `DPS` is per second; the wiki "damage per hit/attack" equals `DPS` x `AttackSpeed`/1000 for every troop. Negative `DPS` is healing per second (Healer, Druid).
- **Multipliers.** `PreferedTargetDamageMod` is a plain factor (Goblin 2, Wall Breaker 40, Yetimite 4); `HeroDamageMultiplier` and `DamageMultiplierPercent` are percent (Headhunter 400 = x4, Healer 55 = 55% hero healing, Meteor Golem 500 = x5 vs walls); `ExtraHealthPermil` is per mille (200 = +20% HP); `BoostAttackSpeedPercentage` multiplies attack rate (Baby Dragon enraged DPS = DPS x 2 x 1.5); Poison `SpeedBoost`/`AttackSpeedBoost` are negative percents.
- **Research.** Level N costs `UpgradeCost` and takes `UpgradeTimeH`/`UpgradeTimeM` of row N-1, and needs `LaboratoryLevel` of row N (all 32 troops; row 1 `LaboratoryLevel` is a placeholder).

## Most important mismatches and ambiguities

1. **Blank research minutes.** Barbarian row 1 is the only row in the whole client logic set with `UpgradeTimeM` (30) followed by blank minutes. The wiki (troop page and Laboratory chart) gives whole hours for levels 3-13, i.e. blank = 0, but `reference/full-client/progression.json` forward-inherits the 30 minutes and adds 1,800 s to Barbarian levels 3-13. Meteor Golem rows write `UpgradeTimeM=0` explicitly, so the client alone does not settle the semantics.
2. **Flying ranges +0.5 tile on the wiki** (see conversions), plus Lava Hound 1 vs 0.25, Lava Pup 2 vs 2.25, Wall Breaker 1 vs 0.5, Firemite 2.5 vs 2, Miner 0.5 vs 0.6, Bear 0.2 vs 0.6. `src/game/data.ts` currently mixes both sources (Balloon 0.5 and Wall Breaker 1 from the wiki, Dragon 2.5 and Healer 4.5 from the client).
3. **Client snapshot predates the 2026-08-31 balance changes.** Wiki: Ruin Witch summons up to 10 Ruin Knights and the knights no longer lose hitpoints; client: `SummonLimit`/`SummonLifetimeLimit`=8 and `LoseHpPerTick`=40 per 500 ms (80 HP/s). The client already contains the 2026-07-14 changes (Dragon Rider, Electro Dragon, Druid, Meteor Golem), so it dates from between those updates.
4. **Bear housing.** Wiki 10 (history: 16 -> 10 on 2025-03-24) vs client `HousingSpace`=16; this changes Spring Trap ejection, Clone and Recall weight. The Bear page also still says the Druid transforms after 25 s (Druid page and client: 30 s).
5. **Headhunter speed.** Troop page 32; client `Speed`=300 (24) and the Troop Movement Speed page agree on 24.
6. **Wall Breaker radii.** The wiki gives one 2-tile "Damage Radius"; the client uses 0.8 tile for the wall attack (`DamageRadius`=80) and 1.5 tiles for the death blast (`DieDamageRadius`=150). `src/game/data.ts` uses deathRadius 2.
7. **Ice Golem defensive freeze.** Wiki 3.5 s at levels 7-9; client Defensive Ice Golem stays on ability level 6 (3.25 s). Both freeze spells also carry an undocumented `FreezeOuterTimeMS` (shorter freeze for part of the area).
8. **Furnace and Firemite.** Firemite splash 0.8 tile on the wiki is the burn pool (`FireSpiritBurn.Radius`=80), not the character `DamageRadius` (10). The spawn interval is not published anywhere. The client already carries level-5 Firemite data and a level-4 Furnace upgrade cost (380,000 / 384 h), i.e. unreleased level 5.
9. **Stale speed table.** Troop Movement Speed lists Baby Dragon 16/200 (client and troop page 20/250), Electro Dragon 12/150 (client 160, troop page 13), Thrower internal 225 (client 220), Miner on defense 250 (client global 70% would give 280); also Bat 57 vs 700/12.5 = 56 and two Super troops (outside this folder).
10. **Targeting in the generic repo path.** `src/game/extra-troops.ts` sets `prefersDefenses` from `PreferedTargetBuilding === "Defense"`, a value no client row uses (the class column is `PreferedTargetBuildingClass`), so Hog Rider, Golem, Ice Golem, Dragon Rider and Root Rider currently do not prefer defenses; it also ignores `HeroDamageMultiplier` (Headhunter x4, hero healing), `SelfAsAoeCenter`, `PreferHeroes`, `PreferedTargetBuilding=Air Defense`, spell-based death damage (Electro Dragon) and all special abilities. `src/game/data.ts` also keeps Balloon at 1.25 tiles/s (client 1.3).

Other notes: client Defensive Meteor Golem/Meteormite keep pre-2026-07-14 stats; Wizard page says Barracks 7 needs Town Hall 6 (Barracks page and client: 5); the Laboratory chart lists Wizard level 13 as 12d 12h (page and client: 10d 12h); the Army page still says 31 troops (lists and client: 32); the Electro Titan aura deals 25% to Heroes in the client (not on the wiki); the Healer "2 housing or less" rule is encoded in the client as per-unit `HealerWeight`; the Headhunter poison reuses Poison spell rows that carry `HeroDamageMultiplier`=5; the Bowler bounce distance (`ChainShootingDistance`=400) is not on the wiki; Firemite targeting (template "None" vs "targets buildings") is unresolved.

## Not found or substituted

- No "Favorite Target" or "Preferred Target" article exists; the behaviour text lives in `Template:PreferredTarget` (`preferred-target`).
- No "Housing Space" article; housing is covered by `Army Camp/Home Village` (`army-camp`) and each troop info box.
- "Troops" redirects to "Army"; the lists are on "Elixir Troops" and "Dark Elixir Troops" (`troops`). "Movement Speed" is "Troop Movement Speed".
- "Barbarian" and "Baby Dragon" are tabber pages; the Home Village subpages were used. "Skeleton" is a disambiguation page; "Witch/Skeleton" was used.
- The wiki does not publish: Furnace spawn interval, Lava Hound death radius, Meteor Golem splash radius, Balloon death delay, Electro Titan aura Hero factor, Ice Golem outer-freeze duration, Witch summon animation time, Yeti spawn distance, Druid bounce distance. These are given from the client in the relevant files and marked as client-only.
- The Ruin Knight hitpoint decay (80 HP/s) appears only in an HTML comment on its page and was removed in-game on 2026-08-31 per the page history.
