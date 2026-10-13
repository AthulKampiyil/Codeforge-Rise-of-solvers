# Official wiki reference: Home Village heroes, hero equipment and pets

Cross-reference dossier built from the Clash of Clans Fandom wiki (clashofclans.fandom.com) for parity work against the pinned Supercell client **18.400.21**. Retrieved **2026-09-15** through the MediaWiki API; wiki revisions 610468–625353. **73 entities**: 6 heroes, 42 equipment items, 12 pets, 5 buildings and 8 mechanic/hub pages. 81 wiki-vs-client mismatch or ambiguity records are listed across the JSON files.

Mechanics text is paraphrased from the wiki (CC BY-SA 3.0; every file links the exact source page and revision). Level tables are transcribed factual data. No game code or other repository files were changed by this dossier.

## Files

- `<slug>.md` — title, source URL, wiki revision and retrieval date, **Mechanics** bullets, the wiki **Level table** exactly as displayed, other wiki tables (constants, summoned units, lower-Town-Hall rows), and **Client comparison** (matches, client-column notes, mismatches/ambiguities).
- `<slug>.json` — `{title, url, revid, retrieved, clientName, clientTable, category, hero?, summary, constants: {wiki, client, notes?, wikiTables?}, fields: {key: {wikiHeader, unit}}, levels: [...], subpages: [...], mismatches: [{field, level, wiki, client, note}], clientColumns?}`. Level rows keep the wiki's destination-level convention (the cost on row N buys level N); `null` means the wiki shows N/A or '-'.
- `index.json` — every entity with slug, title, url, revid, clientName, category, owning hero (equipment), one-line summary and mismatch count.

## Coverage

| Category | Entities |
|---|---|
| Heroes | [Archer Queen](archer-queen.md), [Barbarian King](barbarian-king.md), [Dragon Duke](dragon-duke.md), [Grand Warden](grand-warden.md), [Minion Prince](minion-prince.md), [Royal Champion](royal-champion.md) |
| Equipment — Barbarian King (8) | [Barbarian Puppet](barbarian-puppet.md), [Earthquake Boots](earthquake-boots.md), [Giant Gauntlet](giant-gauntlet.md), [Rage Vial](rage-vial.md), [Snake Bracelet](snake-bracelet.md), [Spiky Ball](spiky-ball.md), [Stick Horse](stick-horse.md), [Vampstache](vampstache.md) |
| Equipment — Archer Queen (8) | [Action Figure](action-figure.md), [Archer Puppet](archer-puppet.md), [Frozen Arrow](frozen-arrow.md), [Giant Arrow](giant-arrow.md), [Healer Puppet](healer-puppet.md), [Invisibility Vial](invisibility-vial.md), [Magic Mirror](magic-mirror.md), [Monolith Arrow](monolith-arrow.md) |
| Equipment — Grand Warden (7) | [Eternal Tome](eternal-tome.md), [Fireball](fireball.md), [Healing Tome](healing-tome.md), [Heroic Torch](heroic-torch.md), [Lavaloon Puppet](lavaloon-puppet.md), [Life Gem](life-gem.md), [Rage Gem](rage-gem.md) |
| Equipment — Royal Champion (7) | [Electro Boots](electro-boots.md), [Frost Flake](frost-flake.md), [Haste Vial](haste-vial.md), [Hog Rider Puppet](hog-rider-puppet.md), [Rocket Spear](rocket-spear.md), [Royal Gem](royal-gem.md), [Seeking Shield](seeking-shield.md) |
| Equipment — Minion Prince (6) | [Dark Crown](dark-crown.md), [Dark Orb](dark-orb.md), [Henchmen Puppet](henchmen-puppet.md), [Metal Pants](metal-pants.md), [Meteor Staff](meteor-staff.md), [Noble Iron](noble-iron.md) |
| Equipment — Dragon Duke (6) | [Electro Fangs](electro-fangs.md), [Fire Heart](fire-heart.md), [Flame Blower](flame-blower.md), [Revenge Deck](revenge-deck.md), [Rocket Backpack](rocket-backpack.md), [Stun Blaster](stun-blaster.md) |
| Pets | [Angry Jelly](angry-jelly.md), [Diggy](diggy.md), [Electro Owl](electro-owl.md), [Frosty](frosty.md), [Greedy Raven](greedy-raven.md), [L.A.S.S.I](lassi.md), [Mighty Yak](mighty-yak.md), [Phoenix](phoenix.md), [Poison Lizard](poison-lizard.md), [Sneezy](sneezy.md), [Spirit Fox](spirit-fox.md), [Unicorn](unicorn.md) |
| Buildings | [Blacksmith](blacksmith.md), [Hero Banner](hero-banner.md), [Hero Bell](hero-bell.md), [Hero Hall](hero-hall.md), [Pet House](pet-house.md) |
| Mechanics / hubs | [Hero Equipment](hero-equipment.md), [Hero's Journey](heros-journey.md), [Heroes](heroes.md), [Ore Calculations](ore-calculations.md), [Ores](ores.md), [Pets](pets.md), [Prospector](prospector.md), [Troop Movement Speed](troop-movement-speed.md) |

Related wiki pages folded into their parent entity (listed under `subpages` in the JSON): Snake Bracelet/Snake, Henchmen Puppet/Henchmen, Lavaloon Puppet/Lavaloon, Giant Giant (Action Figure), Frosty/Frostmite, Sneezy/Booger, Template:Warden Weight (Grand Warden) and Template:Equipment Migration (Hero Equipment).

Client record renames: Giant Arrow = `Piercing Arrow`, Frost Flake = `Frost Charm`, Electro Fangs = `ElectroAttack`, Revenge Deck = `Draconic Counter`, L.A.S.S.I = `LASSI`, Greedy Raven = `Crow`.

## Method

1. **Fetch.** `api.php?action=parse&prop=wikitext|revid&redirects=1` with curl, one request at a time about 1.1 s apart (84 pages including subpages/templates). Raw JSON stayed in the session scratchpad; searches confirmed there are no separate Shiny/Glowy/Starry Ore pages.
2. **Parse.** Section extraction plus a MediaWiki table parser that expands `rowspan`/`colspan`, strips cell attributes, `{{Res}}` icons, links and HTML, and merges two-row headers. Values are normalised to numbers: percentages, seconds, tiles, day/hour times → seconds.
3. **Client tables.** Decoded 18.400.21 logic JSON with forward inheritance per record. `heroes`, `pets` and `character_items` store the *next* upgrade price on the current row, so wiki level N is compared with client row N−1 for costs/times; requirement columns are compared on row N.
4. **Automatic matching.** Every numeric wiki column is compared, level by level, with the flattened client record, following `MainAbilities`/`ExtraAbilities` → `special_abilities` → `GivenAbility`/`SelfSpell`/`AuraSpell`/`CastSpell`/`SpawnedTroop`/projectiles, under unit transforms (identity, ms ÷ 1000, ÷ 100 for tiles, permil ÷ 10, speed × 0.08 with display truncation, negation). A column is reported as a match only if all levels agree; partial matches are listed as per-level mismatches. Columns needing a formula (e.g. 5 pulses × permil, depth − 1, 1200 ÷ attack-speed override) were verified by hand and are shown as explained matches.
5. **Buildings/hubs.** Hero Hall, Pet House and Blacksmith tables were checked against `buildings.csv`, `globals.TAVERN_LEVEL_TO_HERO_SLOT_COUNT`, hero/pet level gates and equipment `RequiredBlacksmithLevel`; ore and war tables against `townhall_levels.csv` and `globals.csv`; the Hero Bell against `seasonal_defense_*` tables; the Prospector against `villager_apprentices.csv`.

## Hero slot and unlock rules

| Hero Hall | Town Hall | Unlocks | Hero slots | Elixir cost | Build time |
|---|---|---|---|---|---|
| 1 | 4 | Barbarian King | 1 | 30,000 | 1 h |
| 2 | 8 | Archer Queen | 1 | 1,600,000 | 2 d |
| 3 | 9 | Minion Prince | 2 | 2,300,000 | 3 d |
| 4 | 10 | — | 2 | 2,500,000 | 4 d |
| 5 | 11 | Grand Warden | 3 | 4,500,000 | 4.5 d |
| 6 | 12 | — | 3 | 5,500,000 | 5 d |
| 7 | 13 | Royal Champion | 4 | 8,500,000 | 6 d |
| 8 | 14 | — | 4 | 9,500,000 | 6.5 d |
| 9 | 15 | Dragon Duke | 4 | 11,000,000 | 7 d |
| 10 | 16 | — | 4 | 13,000,000 | 8 d |
| 11 | 17 | — | 4 | 17,000,000 | 9 d |
| 12 | 18 | — | 4 | 26,000,000 | 13.5 d |

- Slots come from `globals.TAVERN_LEVEL_TO_HERO_SLOT_COUNT` = Hero Hall 1/3/5/7 → 1/2/3/4. On attack a slot is one hero plus its pet; on defense a slot is one Hero Banner (banners exist from TH7: 1 at TH7, 2 at TH9, 3 at TH11, 4 at TH13). Attack and defense choices are independent.
- TH4–6: the Barbarian King is level 1 with fixed Barbarian Puppet + Rage Vial, attack-only, and his DPS/HP/recovery plus the items' passive boosts are scaled 50% (TH4) / 75% (TH5) / 100% (TH6) (`ScaleByTH`, `townhall_levels.ScaleByTHPercent`); ability attributes are not scaled.
- Hero upgrades need a free Builder, cost Dark Elixir (Grand Warden: Elixir), can be cancelled for a 50% refund, and make the hero unavailable for attacks. Heroes no longer regenerate between battles.
- Ability: exactly one activation per battle (`MaxActivations` 1). It always restores the hero's recovery amount (+ equipment `HealOnActivation`) and triggers the active effects of both equipped items; if unused it fires automatically on KO (`SimulatePlayerInputOnDeath`; a player setting). Two passive items still leave a recovery-only ability.
- Defense: heroes patrol their banner, use no equipment or pets; the Grand Warden defends in ground mode, the Minion Prince and Dragon Duke fly. Defending heroes are not needed for three stars.

Hero level caps (wiki table = client `RequiredHeroTavernLevel` in every cell):

| Hero Hall Level | Barbarian King | Archer Queen | Minion Prince | Grand Warden | Royal Champion | Dragon Duke | Total Levels |
|---|---|---|---|---|---|---|---|
| 1 | 10 | — | — | — | — | — | 10 |
| 2 | 20 | 10 | — | — | — | — | 30 |
| 3 | 30 | 30 | 10 | — | — | — | 70 |
| 4 | 40 | 40 | 20 | — | — | — | 100 |
| 5 | 50 | 50 | 30 | 20 | — | — | 150 |
| 6 | 65 | 65 | 40 | 40 | — | — | 210 |
| 7 | 75 | 75 | 50 | 50 | 25 | — | 275 |
| 8 | 85 | 85 | 60 | 60 | 30 | — | 320 |
| 9 | 90 | 90 | 70 | 65 | 40 | 10 | 365 |
| 10 | 95 | 95 | 80 | 70 | 45 | 15 | 400 |
| 11 | 100 | 100 | 90 | 75 | 50 | 20 | 435 |
| 12 | 110 | 110 | 95 | 85 | 55 | 25 | 480 |

## Equipment, Blacksmith and ore rules

- Two equipment slots per hero (`ItemSlotCount` 2); starting pairs: King Barbarian Puppet + Rage Vial, Queen Archer Puppet + Invisibility Vial, Prince Henchmen Puppet + Dark Orb, Warden Eternal Tome + Life Gem, Champion Seeking Shield + Royal Gem, Duke Fire Heart + Flame Blower.
- Active items change the ability; passive items work all battle (Vampstache, Snake Bracelet, Stick Horse, Frozen Arrow, Monolith Arrow, Noble Iron, Dark Crown, Meteor Staff, Life Gem, Rage Gem, Electro Boots, Fire Heart, Electro Fangs, Revenge Deck).
- Common items max at 18, Epic at 27. Epic items come from event medal shops (3,100 medals) and later the Trader (1,500 gems); Giant Gauntlet and Frozen Arrow are also in the League Shop (750).
- Upgrades are instant, cost only ore, and are gated by Blacksmith level. Missing ore can be bought with gems during the upgrade: 1 / 5 / 35 gems per Shiny / Glowy / Starry.
- Identical cost ladder for every item of a rarity: Shiny on every level (120 at level 2 … 2,700 at 18 … 3,600 at 27), Glowy on levels 3, 6, 9 … (20, 100, 200, 400, then 600), Starry only on Epic levels 9, 12 … 27 (10, 20, 30, 50, 100, 120, 150). Totals to max: Common 27,260 Shiny + 1,920 Glowy; Epic 56,060 Shiny + 3,720 Glowy + 480 Starry.
- Ability attributes usually step at item levels 1, 3, 6, 9, 12, 15, 18 (21, 24, 27); passive stats change every level.

| Blacksmith | Town Hall | Common item unlocked | Max Common | Max Epic | Ore caps Shiny / Glowy / Starry |
|---|---|---|---|---|---|
| 1 | 8 | Earthquake Boots | 9 | 12 | 10,000 / 1,000 / 200 |
| 2 | 9 | Giant Arrow | 9 | 12 | 15,000 / 1,500 / 300 |
| 3 | 10 | Vampstache; Metal Pants | 12 | 15 | 20,000 / 2,000 / 400 |
| 4 | 11 | Rage Gem | 12 | 15 | 25,000 / 2,500 / 500 |
| 5 | 12 | Healer Puppet; Noble Iron | 15 | 18 | 30,000 / 3,000 / 600 |
| 6 | 13 | Healing Tome | 15 | 18 | 35,000 / 3,500 / 700 |
| 7 | 14 | Hog Rider Puppet | 18 | 21 | 40,000 / 4,000 / 800 |
| 8 | 15 | Haste Vial | 18 | 24 | 45,000 / 4,500 / 900 |
| 9 | 16 | Stun Blaster | 18 | 27 | 50,000 / 5,000 / 1,000 |
| 10 | 17 | Electro Fangs | 18 | 27 | 50,000 / 5,000 / 1,000 |

Ore sources: Star Bonus (Skeleton league and above), Clan War attacks on TH8+ bases (Starry only from TH10+), Hero's Journey quests/Ore Chests, Trader (weekly free Glowy, Raid Medal deals), event shops and offers, and the TH10 Prospector helper (converts up to 2,000 Shiny / 120 Glowy / 2 Starry once per helper day).

## Pet rules

- Pet House (TH14–18, 12 levels) unlocks one pet per level and upgrades pets with Dark Elixir, one at a time; pet levels are gated by `pets.LaboratoryLevel` (= Pet House level).
- Each hero carries at most one pet and each pet serves one hero; pets deploy only with their hero, stay near it (wiki 'within X tiles' ≈ (`LeashLength` + `AttackRange`) ÷ 100), change behaviour when the hero falls, never defend, and need no regeneration. Pets count 20 housing for counters (e.g. Dark Crown) and 3 Warden weight.

## Most important wiki-vs-client mismatches and ambiguities

1. [Earthquake Boots](earthquake-boots.md): wiki troop damage 10/15/17/18/19/20% for levels 3+ is simply half the building damage; client `TroopDamagePermil` gives 6/7/7/8/9/10% (5 pulses). Building damage and radius match. `src/game/equipment.ts` already follows the client values.
2. [Barbarian King](barbarian-king.md) upgrade costs for levels 83–89 are 5,000–15,000 DE higher on the wiki; [Grand Warden](grand-warden.md) levels 76–80 are 0.5–1.5 M Elixir lower on the wiki (and the wiki shows a 1,000,000 cost on level 1). All other hero HP/DPS/recovery/time/Hero Hall gates match.
3. Attack-speed stacking is undocumented in data: wiki trivia adds percentages (Vampstache + Snake Bracelet, Stick Horse + Vampstache), but Haste Vial's documented intervals only fit `AttackSpeed override ÷ (1 + passive %)`; Stick Horse and Haste Vial use `AttackSpeed` overrides (1170→900 ms, 750/666/600 ms) rather than percentages.
4. [Monolith Arrow](monolith-arrow.md): the client implements its three damage stages as three simultaneously active abilities (only two deactivate at 181/251 housing), each with `ShieldProtectionPercent`; the engine must apply only the highest stage and one damage reduction.
5. Range/radius constants that disagree: [Dragon Duke](dragon-duke.md) range 0.3 tiles (wiki) vs `AttackRange` 125; [Rocket Spear](rocket-spear.md) splash 0.8 vs 0.9 tiles; [Electro Boots](electro-boots.md) aura 5 vs 4.5 tiles (plus hidden `HeroDamageMultiplier` 25); [Rocket Backpack](rocket-backpack.md) damage area 4 tiles vs 1.5-tile radius; [Electro Owl](electro-owl.md) 6 vs 5.5; [Angry Jelly](angry-jelly.md) 1.5 vs 5 (7 while brainwashing); [Sneezy](sneezy.md) 5.5/1.5 vs 5/2.5; [Revenge Deck](revenge-deck.md) counter range '25 (?)' vs `ReflectedRange` 100000.
6. [Sneezy](sneezy.md) rage lasts 30 s on the wiki but `VisualRage.BoostTimeMS` is 300000; [Mighty Yak](mighty-yak.md) speed is 20 (250) on the wiki vs `Speed` 300 in the client.
7. [Diggy](diggy.md) has levels 11–15 (Pet House 12) on the wiki but only 10 client rows — the wiki is newer than 18.400.21 here.
8. Per-level data errors on the wiki: [Noble Iron](noble-iron.md) boosted shots 8 vs 9 at levels 15–17; [Stun Blaster](stun-blaster.md) level-6 Shiny cost 940 vs 840; [Dark Orb](dark-orb.md) level-8 HP 600 vs 690; [Life Gem](life-gem.md) level-9 HP 311 vs 312; [Minion Prince](minion-prince.md) level-22 recovery 175 vs 360; Hero Hall XP for levels 6–7.
9. [Ores](ores.md): TH14 war Starry cap 4 (wiki) vs 5; draw payout 4/7 (wiki) vs 75% (`ALLIANCE_WAR_ORE_LOOT_BONUS_PERCENT_DRAW`); the client also has war ore caps at TH6–7; the current Star Bonus ore table is not in the decoded client (only the legacy `leagues.csv` table).
10. Hidden client-only mechanics worth verifying: Seeking Shield `PreActivationDelayTime` 933 ms, Haste Vial `DisableRetargeting`, Healing Tome `ExecuteHealthPermil` −60, Snake Bracelet `SpawnFirstGroupSize` 2, Giant Giant rage thresholds (`ActiveAfterTakingDamage`) that are not exactly half HP at levels 3–9, Phoenix Egg `TriggersTraps=FALSE` although the wiki says it triggers air traps.
11. Heroes' wiki 'Search Radius' (9–10 tiles) has no direct client column (`AlertRadius`, `MaxSearchRadiusForDefender`, `PatrolRadius` are candidates); Heroic Torch wall-walking has no visible column.
12. Consistent but easy to miss: wiki speed boosts are truncated displays of internal × 0.08 (Barbarian Puppet +120 → 9.5); Hero Bell's hero DPS boost (+4…+17%) is half the aura's `DamageBoostPercent` 8…35 because rage on heroes is halved (`HERO_RAGE_MULTIPLIER` 50); Eternal Tome/Heroic Torch durations include a 1 s `ShieldTime` linger.

## Not found or not comparable

- No wiki pages titled Shiny Ore, Glowy Ore or Starry Ore (search confirmed); all ore facts are in [Ores](ores.md) and [Blacksmith](blacksmith.md).
- Hero's Journey reward track, quest rules and Ore Chest ranges have no decoded client table (likely server-configured); see [Hero's Journey](heros-journey.md).
- [Ore Calculations](ore-calculations.md) is a community analysis page with an outdated league structure; kept only for its cost-scaling table.
- Template-driven tables (the Equipment Migration `#switch` table, Warden Weight) were transcribed from the template source; the migration ranges match `heroes.MigrationGearLevel`.
- Out of scope: Builder Base heroes, hero skins, and the spells/traps that interact with heroes (only the interactions stated on these pages are recorded).

## Entity index

| Entity | Category | Hero | Client record | Revision | Mismatches | Summary |
|---|---|---|---|---|---|---|
| [Archer Queen](archer-queen.md) | hero |  | Archer Queen | 625026 | 1 | Ranged ground-and-air hero unlocked at Hero Hall 2 (TH8); 5-tile single-target attacks, Dark Elixir upgrades to level 110. |
| [Barbarian King](barbarian-king.md) | hero |  | Barbarian King | 623671 | 8 | First Home Village hero: melee ground-only tank unlocked with Hero Hall 1 at TH4, upgraded with Dark Elixir from TH7 to level 110. |
| [Dragon Duke](dragon-duke.md) | hero |  | Dragon Duke | 625035 | 2 | Flying melee hero unlocked at Hero Hall 9 (TH15) with the Royal Rampage passive (double damage, +50% attack speed when no other air units are within 6 tiles); upgrades to level 25. |
| [Grand Warden](grand-warden.md) | hero |  | Grand Warden | 625324 | 7 | Elixir-upgraded support hero (Hero Hall 5, TH11) with air/ground modes, 7-tile single-target attacks, a 9-tile aura ring and Warden-weight group targeting. |
| [Minion Prince](minion-prince.md) | hero |  | Minion Prince | 625353 | 2 | Flying ranged hero unlocked at Hero Hall 3 (TH9); hits ground and air from 4.5 tiles, Dark Elixir upgrades to level 95. |
| [Royal Champion](royal-champion.md) | hero |  | Royal Champion | 624597 | 1 | Defense-targeting, wall-jumping spear thrower unlocked at Hero Hall 7 (TH13); 3-tile range, Dark Elixir upgrades to level 55. |
| [Action Figure](action-figure.md) | equipment | Archer Queen | Action Figure | 621807 | 2 | Queen Epic active item: summons one Giant Giant (level 1 → 10) and gives 1 s invisibility; passive DPS, HP and self-heal. |
| [Archer Puppet](archer-puppet.md) | equipment | Archer Queen | Archer Puppet | 621670 | 0 | Queen's starting active item: summons 5 → 35 invisible Archers at the player's Archer level; passive DPS and recovery. |
| [Frozen Arrow](frozen-arrow.md) | equipment | Archer Queen | Frozen Arrow | 621294 | 1 | Queen Epic passive item: every hit slows the target 25% → 65% for 0.75 → 3 s; passive DPS. |
| [Giant Arrow](giant-arrow.md) | equipment | Archer Queen | Piercing Arrow | 623346 | 0 | Queen Common active item (Blacksmith 2): a piercing giant arrow aimed at an Air Defense that damages everything in a 1-tile-wide path across the village. |
| [Healer Puppet](healer-puppet.md) | equipment | Archer Queen | Healer Puppet | 621291 | 0 | Queen Common active item (Blacksmith 5): summons 1 → 3 Healers of fixed level 4 → 8; passive HP and self-healing. |
| [Invisibility Vial](invisibility-vial.md) | equipment | Archer Queen | Invisibility Vial | 623169 | 0 | Queen's starting active item: invisibility for 4.2 → 7.8 s with +340 → +1,740 damage per shot; passive HP. |
| [Magic Mirror](magic-mirror.md) | equipment | Archer Queen | Magic Mirror | 621024 | 0 | Queen Epic active item: summons 1 → 2 temporary Queen clones with fixed stats and makes her invisible for 1 s; passive HP and recovery. |
| [Monolith Arrow](monolith-arrow.md) | equipment | Archer Queen | Monolith Arrow | 625282 | 2 | Queen Epic passive item: attacks deal bonus damage equal to a % of the target's max HP (9.5% → 14%, reduced after 180 and 250 housing deployed) plus 3% → 10% damage reduction; passive HP. |
| [Barbarian Puppet](barbarian-puppet.md) | equipment | Barbarian King | Barbarian Puppet | 623371 | 0 | King's starting active item: summons raged Barbarians (8 → 44) at the player's Barbarian level; passive HP and recovery. |
| [Earthquake Boots](earthquake-boots.md) | equipment | Barbarian King | Earthquake Boots | 621771 | 6 | King Common active item (Blacksmith 1): 8-tile earthquake that destroys Walls and damages buildings (10% → 40% max HP) and ground troops; passive DPS/HP. |
| [Giant Gauntlet](giant-gauntlet.md) | equipment | Barbarian King | Giant Gauntlet | 621486 | 0 | King Epic active item: grows giant for 14 → 19 s with 2.5-tile splash attacks over Walls and 20% → 60% damage reduction; passive DPS and self-heal. |
| [Rage Vial](rage-vial.md) | equipment | Barbarian King | Rage Vial | 623370 | 0 | King's starting active item: 10-second self-rage (+120% → +155% damage, large move-speed boost) with big recovery; passive DPS. |
| [Snake Bracelet](snake-bracelet.md) | equipment | Barbarian King | Snake Bracelet | 621017 | 1 | King Epic passive item: spawns wall-jumping Snakes for every 300 damage he takes (cap 11 → 54); passive DPS, HP and attack speed. |
| [Spiky Ball](spiky-ball.md) | equipment | Barbarian King | Spiky Ball | 621313 | 0 | King Epic active item: kicks a ricocheting ball that hits 2 → 8 different buildings for 1,000 → 3,250 each; passive DPS and HP. |
| [Stick Horse](stick-horse.md) | equipment | Barbarian King | Stick Horse | 622735 | 2 | King Epic passive item: on deployment grants 12 → 30 s of wall jumping with faster movement and attacks; passive DPS and HP. |
| [Vampstache](vampstache.md) | equipment | Barbarian King | Vampstache | 621314 | 1 | King Common passive item (Blacksmith 3): heals a flat amount on every hit (60 → 300); passive DPS and attack speed. |
| [Electro Fangs](electro-fangs.md) | equipment | Dragon Duke | ElectroAttack | 624750 | 0 | Duke Common passive item (Blacksmith 10): his attacks chain lightning to 1 → 4 extra nearby targets (330 → 400 damage, −20% per jump); passive HP. |
| [Fire Heart](fire-heart.md) | equipment | Dragon Duke | Fire Heart | 624518 | 0 | Duke's starting passive item: a one-time 4-tile death explosion (1,000 → 3,000) and strong self-regeneration; passive DPS and HP. |
| [Flame Blower](flame-blower.md) | equipment | Dragon Duke | Flame Blower | 624519 | 0 | Duke's starting active item: a 12-tile, 60° cone of fire dealing 1,300 → 2,500 damage, with added recovery; passive HP. |
| [Revenge Deck](revenge-deck.md) | equipment | Dragon Duke | Draconic Counter | 625297 | 1 | Duke Epic passive item: counter-attacks anything that damages him with a card (150 → 225 damage) and heals 30 → 60 per counter, max once per 0.8 s per attacker; passive HP. |
| [Rocket Backpack](rocket-backpack.md) | equipment | Dragon Duke | Rocket Backpack | 623906 | 1 | Duke Epic active item: an untargetable dash in a straight line through the village centre to the far edge, flaming everything on the path (575 → 2,150); passive DPS, HP and recovery. |
| [Stun Blaster](stun-blaster.md) | equipment | Dragon Duke | Stun Blaster | 624501 | 3 | Duke Common active item (Blacksmith 9): an 8-tile shockwave that damages (150 → 400) and stuns defenses and defending troops for 4.5 → 7.5 s; passive DPS, HP and recovery. |
| [Eternal Tome](eternal-tome.md) | equipment | Grand Warden | Eternal Tome | 621300 | 0 | Warden's starting active item: makes himself and all friendly units in his ring invincible for 3.2 → 8.2 s; no passive boosts. |
| [Fireball](fireball.md) | equipment | Grand Warden | Fireball | 621036 | 0 | Warden Epic active item: a fireball at the nearest defense (any range) dealing 1,500 → 4,100 splash damage in a 4 → 6 tile radius; passive DPS. |
| [Healing Tome](healing-tome.md) | equipment | Grand Warden | Healing Tome | 621304 | 1 | Warden Common active item (Blacksmith 6): a 15 → 20 s healing aura that follows him and heals allies (heroes at full rate) 60 → 150 HP/s; passive HP and recovery. |
| [Heroic Torch](heroic-torch.md) | equipment | Grand Warden | Heroic Torch | 623829 | 1 | Warden Epic active item: for 16 → 27.5 s allies in his ring move faster, take 6% → 15% less damage and can pass through Walls; passive DPS, HP and recovery. |
| [Lavaloon Puppet](lavaloon-puppet.md) | equipment | Grand Warden | Lavaloon Puppet | 623290 | 1 | Warden Epic active item: summons 1 → 3 weakened Lavaloons (level 1 → 11) that hunt Air Defenses, bomb as they fly and burst into pups; passive DPS and HP. |
| [Life Gem](life-gem.md) | equipment | Grand Warden | Life Gem | 623272 | 1 | Warden's starting passive item: aura giving nearby allies +50% → +120% extra HP up to a 640 → 1,200 cap; passive DPS and HP. |
| [Rage Gem](rage-gem.md) | equipment | Grand Warden | Rage Gem | 622981 | 0 | Warden Common passive item (Blacksmith 4): aura raising allies' damage (or healing) by 15% → 50% without speed boosts; passive DPS and attack speed. |
| [Dark Crown](dark-crown.md) | equipment | Minion Prince | Dark Crown | 624599 | 1 | Prince Epic passive item: gains up to three stacking-tier buffs (+10/20/30% HP and damage at max) as 60/120/180 housing of his allies die; passive HP and attack speed. |
| [Dark Orb](dark-orb.md) | equipment | Minion Prince | Dark Orb | 622302 | 2 | Prince's starting active item: a slow-moving dark orb that damages and slows everything within 5 tiles along its path; passive DPS and HP. |
| [Henchmen Puppet](henchmen-puppet.md) | equipment | Minion Prince | Henchmen Puppet | 621392 | 0 | Prince's starting active item: summons two flying Henchmen (level 1 → 7) and 1 s invisibility; passive DPS, flat +500 HP and recovery. |
| [Metal Pants](metal-pants.md) | equipment | Minion Prince | Metal Pants | 621028 | 0 | Prince Common active item (Blacksmith 3): 9 → 15 s shield reducing all damage by 46% → 70%, with large recovery; passive HP. |
| [Meteor Staff](meteor-staff.md) | equipment | Minion Prince | Meteor Staff | 624746 | 0 | Prince Epic passive item: every 10 → 5 s a meteor hits the nearest defense at any distance for 250 → 850 area damage; passive DPS and HP. |
| [Noble Iron](noble-iron.md) | equipment | Minion Prince | Noble Iron | 621029 | 1 | Prince Common passive item (Blacksmith 5): his first 5 → 10 shots after deployment reach 10 → 12 tiles and deal +350 → +770 damage; passive attack speed and flat +500 HP. |
| [Electro Boots](electro-boots.md) | equipment | Royal Champion | Electro Boots | 621042 | 2 | Champion Epic passive item: a permanent electric aura hitting nearby enemies every 0.4 s (132 → 200 DPS); passive HP and self-heal. |
| [Frost Flake](frost-flake.md) | equipment | Royal Champion | Frost Charm | 621307 | 0 | Champion Epic active item: fires 4 → 7 ice flakes at separate nearby defenses, each dealing small damage and freezing the target for 5.2 → 7 s; passive HP. |
| [Haste Vial](haste-vial.md) | equipment | Royal Champion | Haste Vial | 621283 | 0 | Champion Common active item (Blacksmith 8): 7 → 10 s of +60% → +100% attack speed and a big movement boost; passive DPS and attack speed. |
| [Hog Rider Puppet](hog-rider-puppet.md) | equipment | Royal Champion | Hog Rider Puppet | 621803 | 0 | Champion Common active item (Blacksmith 7): summons 8 → 10 Hog Riders of fixed level 5 → 12 and 1 s invisibility; passive HP and recovery. |
| [Rocket Spear](rocket-spear.md) | equipment | Royal Champion | Rocket Spear | 621041 | 1 | Champion Epic active item: her next 7 → 10 throws become 10-tile rocket spears at the closest defense with +350 → +980 damage and small splash; passive DPS and HP. |
| [Royal Gem](royal-gem.md) | equipment | Royal Champion | Royal Gem | 621038 | 0 | Champion's starting active item: adds 1,200 → 2,400 recovery to her ability; passive DPS and HP. |
| [Seeking Shield](seeking-shield.md) | equipment | Royal Champion | Seeking Shield | 621327 | 1 | Champion's starting active item: a thrown shield that hits four different targets anywhere on the map (defenses first) for 1,000 → 2,500 each; passive HP. |
| [Angry Jelly](angry-jelly.md) | pet |  | Angry Jelly | 623397 | 1 | Pet House 10 flying pet that brainwashes its hero into defense-targeting for 25 → 35 s while riding above it untargetable. |
| [Diggy](diggy.md) | pet |  | Diggy | 625147 | 1 | Pet House 6 burrowing pet that bypasses Walls and stuns defenses when it surfaces next to them. |
| [Electro Owl](electro-owl.md) | pet |  | Electro Owl | 620659 | 1 | Pet House 2 flying pet that shoots chain lightning (two targets, −20% on the second) at its hero's target. |
| [Frosty](frosty.md) | pet |  | Frosty | 625102 | 1 | Pet House 5 ranged pet whose hits chill targets and who spawns wall-jumping, defense-hunting Frostmites every 8 s. |
| [Greedy Raven](greedy-raven.md) | pet |  | Crow | 624123 | 0 | Pet House 12 flying pet that pelts resource buildings near its hero with rapid feathers for 5× damage. |
| [L.A.S.S.I](lassi.md) | pet |  | LASSI | 622251 | 0 | Pet House 1 ground melee pet that stays close to its hero and jumps over Walls (High Jumper). |
| [Mighty Yak](mighty-yak.md) | pet |  | Mighty Yak | 620660 | 2 | Pet House 3 high-HP ground pet dealing 20× damage to Walls; rages for 8 s when its hero is knocked out. |
| [Phoenix](phoenix.md) | pet |  | Phoenix | 625128 | 1 | Pet House 8 pet that waits as an invulnerable egg, revives its hero once with 6.5 → 8.5 s of invincibility, then fights as a splash-damage air unit. |
| [Poison Lizard](poison-lizard.md) | pet |  | Poison Lizard | 621535 | 1 | Pet House 7 fast-spitting ranged pet that prefers heroes/troops and poisons them (slow, attack-rate cut, damage over time). |
| [Sneezy](sneezy.md) | pet |  | Sneezy | 622902 | 2 | Pet House 11 flying pet that keeps its distance and sneezes out Boogers (max 2), turning into an enraged short-range defense attacker when its hero falls. |
| [Spirit Fox](spirit-fox.md) | pet |  | Spirit Fox | 620669 | 0 | Pet House 9 ground pet that repeatedly turns itself and its hero invisible (3 → 4 s, then a 6 s gap). |
| [Unicorn](unicorn.md) | pet |  | Unicorn | 619842 | 0 | Pet House 4 healer pet that heals its hero (ground or air) every second at full rate. |
| [Blacksmith](blacksmith.md) | building |  | Blacksmith | 624544 | 0 | 3x3 building (TH8+) that stores ore and instantly upgrades hero equipment; its level caps equipment levels (Common 9→18, Epic 12→27) and unlocks Common equipment. |
| [Hero Banner](hero-banner.md) | building |  | — | 622708 | 1 | 2x2 untargetable defensive post: each banner holds one defending hero; banners come from Hero Hall slots (1/2/3/4 at TH7/9/11/13). |
| [Hero Bell](hero-bell.md) | building |  | HeroBooster | 622571 | 0 | Crafted (seasonal) defense whose 50-tile aura raises defending heroes' damage and hitpoints until it is destroyed; three 10-level modules. |
| [Hero Hall](hero-hall.md) | building |  | Hero Hall | 623819 | 2 | 4x4 army building (TH4+) that unlocks heroes, sets hero level caps and hero slots (1/2/3/4 at levels 1/3/5/7), hosts hero upgrades, skins and Hero's Journey. |
| [Pet House](pet-house.md) | building |  | Pet House | 625146 | 1 | 3x3 army building (TH14+) that unlocks one new pet per level (12 levels) and researches pet upgrades with Dark Elixir, one at a time. |
| [Hero Equipment](hero-equipment.md) | mechanic |  | — | 625074 | 0 | Hub page: 42 Home Village equipment items (8 BK, 8 AQ, 6 MP, 7 GW, 7 RC, 6 DD), active vs passive, rarity, history and the 2023 migration table. |
| [Hero's Journey](heros-journey.md) | mechanic |  | — | 625220 | 1 | TH7+ Hero Hall reward track driven by cumulative Home Village hero levels, with hero quests, Epic equipment rewards and TH-scaled Ore Chests. |
| [Heroes](heroes.md) | mechanic |  | — | 621611 | 1 | Hub page: six Home Village heroes (plus two Builder Base heroes); cross-page hero rules for slots, abilities, equipment, defense and early-TH scaling. |
| [Ore Calculations](ore-calculations.md) | mechanic |  | — | 610468 | 1 | Community (user-written) calculation page: relative ore values from war/Star Bonus/gem/medal prices and cumulative equipment costs; not official data. |
| [Ores](ores.md) | mechanic |  | — | 617303 | 5 | Shiny, Glowy and Starry Ore: Blacksmith-only currencies earned from Star Bonus, Clan Wars, Hero's Journey, Trader and offers; capped by Blacksmith level. |
| [Pets](pets.md) | mechanic |  | — | 621456 | 1 | Hub page: twelve Pet House pets that accompany a hero on attack; immortal between battles, one per hero, never defend. |
| [Prospector](prospector.md) | mechanic |  | Prospector | 623235 | 2 | TH10 Helper (Gold Pass CPoints) who converts up to 2,000 Shiny / 120 Glowy / 2 Starry Ore into another ore type once per helper work day. |
| [Troop Movement Speed](troop-movement-speed.md) | mechanic |  | — | 624844 | 3 | Reference for converting internal speed values (tiles/s × 100) to the wiki's in-game speed numbers (internal ÷ 12.5); hero and pet rows only are relevant here. |
