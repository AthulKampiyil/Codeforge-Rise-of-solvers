# Native character families for campaign garrisons

Pinned public client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`. `scripts/import-native-characters.py` captures original character art and the source rows that campaign garrison defenders need. It is generic: a family is one original `sc/chr_*.sc` file, and each captured animation block becomes one graph. Adding a family means adding its animation block, pins and (for projectiles) its projectile row.

```sh
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-characters.py --check
npx vitest run tests/character-presentation.test.ts tests/garrison-families.test.ts
```

## Inputs

All 62 inputs (the fingerprint included) have SHA-256 pins. The 51 bundle files also match their SHA-1 entries in the pinned fingerprint. The ten layout files are absent from this fingerprint; they are verified only by SHA-256, as in the garrison foundation. New downloads came from the approved pinned host: `logic/special_abilities.csv` and the Goblin, PEKKA, Valkyrie, Headhunter, Super Minion and Baby Dragon character files with their `_0.sctx` textures. Archer, Dragon, `sc/characters.sc`, `characters_7.sctx`, `sc/buildings.sc` and `buildings_39.sctx` were already cached.

The remaining defending families added 22 downloads, each checked against its fingerprint SHA-1 before its SHA-256 was pinned. Every `.sc` was downloaded first and its external texture list read. The character files are `chr_electro_dragon.sc` (117 KB) with `_0` (3.18 MB) and `_1` (876 KB), `chr_golem.sc` (43 KB) with `_0` (1.27 MB), `chr_witch.sc` (28 KB) with `_0` (222 KB), and `chr_skeleton.sc` (11 KB) with `_0` (123 KB) and `_1` (28 KB). Also downloaded were `chr_bowler.sc` (39 KB) with `_0` (1.14 MB), `chr_lava_hound.sc` (16 KB) with `_0` (633 KB) and `_1` (14 KB), `chr_electro_titan.sc` (38 KB) with `_0` (1.32 MB), `chr_royale_ghost.sc` (6 KB) with `_0` (153 KB), and `chr_worker.sc` (32 KB) with `_0` (196 KB). One shared texture came too: `buildings_6.sctx` (437 KB), which the Bowler's `trollBoulder_lvl3` views and shadow sample. `logic/traps.csv` and `logic/globals.csv` were already cached and pinned by other importers.

## Outputs

- `catalog.json` (runtime): resolved campaign rosters with their layout bunkers; inherited combat/presentation rows for every roster character and its secondary, summoned and defensive troops (economy/UI columns omitted); every roster animation block, kept literal; used projectile, special-ability and poison-spell rows; and level-resolution evidence.
- `<family>/<block>.json`: one runtime graph per animation block, with `shadowShapes`. Captured blocks are `Goblin7`, `Archer9`, `Dragon5`, `PEKKA8`, `WarriorGirl_lvl4` (Valkyrie 7), `HeadHunter_lvl3`, `SuperMinion` and `Baby Dragon 6`, plus `ElectroDragon_lvl3`, `Golem_lvl6`, `Necromancer_lvl2` (Witch 4), `Skeleton`, `Troll_lvl3` (Bowler 4), `ADSeeker_lvl6` (Lava Hound 6), `TinyBaby_lvl1` (Lava Pup), `ElectroTitan_lvl2`, `Prototype_Ghost` (Royal Ghost) and `Defending Builder` (`worker_battle_*`). `Golden Dragon` (`dragonx_*` in `chr_dragon.sc`) and `MOMMA` (`pekka9_*` in `chr_pekka.sc`) are captured too. MOMMA's `pekka9` clips reuse PEKKA 8's shapes, with its block's `Scale=200`. `GolemSmall_lvl6` (Golemite) names exactly the `Golem_lvl6` exports at `Scale=75`; the importer verifies that and records it in `catalog.graphAliases` rather than duplicating the texture. The Defending Builder's die row names `temp_dummya4` with an empty SWF, an empty one-frame clip in `sc/characters.sc`; nothing is captured for it.
- `projectiles/<file>.json`: projectile exports grouped by original file: the dark-elixir fire arrow, Headhunter card, both Super Minion rockets and their shadow, and the Baby Dragon fireball. Later rows form their own graphs so these stay byte-identical (`catalog.projectileGroups`). `projectiles/witch.json` holds `witch_projectile`, `projectiles/bowler.json` the three `trollBoulder_lvl3_1..3` views (`DirectionCount=6`) with the multiply-blend `shadow_trollBoulder`, and `projectiles/lava-hound.json` the Hound and Pup shots.
- `catalog.json` also records `trapSpawners` (the Ghost Trap row) and `defenceTroops` (per-level Builder's Hut `DefenceTroop*` fields). It adds the `ElectroDragonDie` and `Electro Titan Aura` spell rows, `RoyalGhostAbility`, and `absentGlobals`: `CHAINED_PROJECTILE_BOUNCE_COUNT`, which the older engine read for Bowler bounces, is asserted absent from the pinned globals. `repairGlobals` carries `HEAL_STACK_PERCENT` (the eight healer slot percentages) and `ALLOW_REPAIR_AFTER_DAMAGE_TICKS`, read by the Defending Builder.
- `art.json` (evidence, not bundled): source graphs with 16-bit UVs, crop and packing evidence with per-region RGBA hashes, source texture paths, shadow maximum alpha, empty text-field locators, previews and icons.
- `public/assets/characters-native/<family>/<block>/`: cropped or losslessly packed textures, `preview.png` (idle row frame zero, view 3 when directional, 2 pixels per native unit) and `icon.png` (8-pixel padding).

Every view named by a block's rows is captured: `_1`, `_2` and `_3` for directional rows, or the literal export for fixed-view rows (for example `WarriorGirl_lvl4_Idle1_3`). Die rows name `barbarian_death_1` with an empty SWF. They resolve to the common `sc/characters.sc` export already imported as `reference/garrison/dragon-death.json`. Empty `attack_pivot`/text locators remain nonpainting nodes. Additive (8) groups are retained; no masks or other blends occur.

Each character file contains exactly one black-RGB shape with nonzero alpha among the shapes reachable from its animation exports (shape 0; shape 3 for Super Minion). Projectile shadows are excluded. That shape is recorded as the original ground shadow and rendered on its own layer. Dragon 7 reproduces the previously verified shape 0 with maximum alpha 188.

## Level resolution

`AllianceUnitLevel` selects the unique row whose `VisualLevel` equals it. A `DefensiveTroop` column then substitutes that character at the same VisualLevel. Evidence from the pinned `logic/npcs.csv`, recorded in `catalog.levelResolution.evidence`:

- `CHALLENGE_AUGUST_QUALIFIER_2021` lists **Rocket Balloon 10**, whose nine rows have VisualLevels 5–13. A row-ordinal reading is out of range; only the VisualLevel reading resolves.
- The same challenge lists Super Minion 10 alongside Rocket Balloon 10, consistent with one displayed level for both.
- For every other roster family, VisualLevel equals the row ordinal, so both readings coincide. This includes all 1-based campaign levels except Super Minion.

Suspicious Gap's **Super Minion 9** therefore resolves to row 6, **Defensive Super Minion** (1,600 HP, 325 DPS, `SuperMinionSpecialProjectiles_DEF`). A row-ordinal reading would instead select VisualLevel 12 (1,900 HP, 385 DPS). At VisualLevel 9, the offensive and defensive rows have equal hit points and DPS. They differ only in their ability: 3 rather than 8 long-range shots. As corroborating context only, Minion VisualLevel 9 needs Laboratory 11, while the village recommends Town Hall 13. No executable lookup was run.

Secondary troops, summons, trap spawns and defence troops use their own level rules; see [the garrison reference](../garrison/README.md#remaining-defending-families-version-44).

Graph and texture integrity (exports for every row and view, one shadow shape, PNG dimensions and normalized UVs) are covered by `tests/character-presentation.test.ts`, which iterates every registered graph including the later ones; `tests/garrison-late-presentation.test.ts` adds the alias and grouped-projectile exports. The importer's `--check` regenerates every JSON and PNG byte-for-byte. The independent Python compositions used for previews are not a GPU pixel witness suite. Live rendering is covered by browser smoke checks described in the garrison README.
