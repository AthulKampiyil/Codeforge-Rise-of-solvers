# Original Eagle Artillery

The late Goblin Map campaign uses Eagle Artillery levels 1–5 (villages 61–89, zero-based); all seven source levels are supported. Values come only from the pinned client 18.400.21 bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, downloaded from `https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/` into `output/native-campaign-source/<path>`.

Reproduce with `OPENBLAS_NUM_THREADS=1 PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-eagle-artillery.py --check` (prints `Verified 18 original Eagle Artillery assets`). Every input matches its SHA-1 entry in `fingerprint.json` and the SHA-256 pinned in the importer:

| Input | SHA-256 |
| --- | --- |
| `fingerprint.json` | `ecb5b05d632831cd706e4e993158b63635445257ad254bec97c371b078e3044b` |
| `sc/buildings.sc` | `f73ec949fc070bc03175d6bb3af8b62d8f607094bf2b343c9846a499a35be0ed` |
| `sc/building_bases.sc` | `964584a104a31088dfa6bef53f6c2df7bc9e59e0b05d4354bbe8ac4431c49d9f` |
| `sc/building_bases_0.sctx` | `6bc35b86398b457643446ed8d86e24a1fe68d1daadf9155cfe94e13c4840d9fd` |
| `sc/buildings_2.sctx` | `ff0f766b8d361eeb942384600ace1082a11c7c7404bed41d976fbafbdd2dc622` |
| `sc/buildings_19.sctx` | `26df2233dcb1d4470f9bf3f110dfd1d354361850181fb7b3c69d866aea9b7b7c` |
| `sc/buildings_25.sctx` | `c290a82b3940513f16b55dba2305e875d923d4120c5997b6b6908c680ec8ca3d` |
| `sc/buildings_39.sctx` | `dd27d9612fe135c3be364840eeabe45b53a229b24192246b56a08fa0606fdb16` |
| `logic/buildings.csv` | `9aed5fed876e2914a22fa7fed688a651c691ab06170d60e2bda8dc9262fbccb1` |
| `logic/projectiles.csv` | `71cda0e457ad88a6772f6421a22419b24d6bcf78d0ed305f09184404889a72dc` |
| `logic/spells.csv` | `385159e00327e6a1567cd91f1585b4ed0717d3f4475f0823398243482598289d` |
| `logic/effects.csv` | `5c6d5b67d6407345123b8d55872ed77ee6697b466d20d1fa21e25a723c511e9f` |
| `logic/characters.csv` | `5c3acc5b46ff9e7978f406b540264e65c93a846b69d03cd43326a9853703cb89` |
| `logic/heroes.csv` | `658c9721fb0fd5488b69ca3555ef5597d521f28dde95af051a2a98ccbdd65197` |
| `logic/globals.csv` | `16210fc28bfb86d00ea04d581a99fe98e128172017b2d4f637b8848c0cf20087` |
| `csv/particle_emitters.csv` | `8d80bbf714386c4f24e6aed8f2eef671a2eac5c3b3ad41e4d275b757ced64cef` |
| `sfx/ancient_explo_01.ogg` | `eeb8489f327d9b6dec5d7032f712dd30df1f1e2245a3f2fdb03e95d74eb497ea` |
| `sfx/ancient_fire_02.ogg` | `4f87389359b8392642a661a3be223e1dd8d4f38b0cc8b3d25ae7e10d99351a6d` |
| `sfx/ancient_target_02.ogg` | `b74fb2d3712307999788e096febd38b1693c657acfa8b99b0bcb9f31ca1848d2` |
| `sfx/building_destroyed_01.ogg` | `fd8295765aa86ff5c7c6be1159cd8fc97aed3c858c29fbdb1af5e3d5c5ce7f04` |
| `sfx/mech_eagle_sad_no_ammo_01.ogg` | `7600e40c633f2b8992c03c2159bdc416a734e18836959ce43a9d33b4642f0170` |
| `sfx/mortar_hit_01.ogg` | `3d54d10262b8ac7b59faef7a4c75a62c161855bb78ed90a2a02fb414f317d4cc` |

Outputs: `native.json` keeps the raw sparse rows (building, seven `Artillery Ammo` projectiles, `Eagle Artillery Hit Spell`, effect and emitter closure, attacker/hero/spell housing rows, globals). `combat.json` is the compact runtime catalogue, `effects.json` the battle effects, emitters and sounds, `runtime.json` the main scene graph (54 exports from `buildings.sc`) and `base.json` the separate `eagle_artillery_base` graph from `building_bases.sc`. Packed texture crops, seven dormant previews and six sounds are in `public/assets/buildings/eagle-artillery-native/`.

## Source rows

| Level | Town Hall | HP | Hit spell damage | Shockwave `Damage` | Body | Shell |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 11 | 4000 | 225 | 20 | `doom_cannon_lvl1` | `doom_ammo_big_asset_lvl1` |
| 2 | 11 | 4400 | 250 | 25 | `doom_cannon_lvl2` | `doom_ammo_big_asset_lvl2` |
| 3 | 12 | 4800 | 275 | 30 | `doom_cannon_lvl3` | `doom_ammo_big_asset_lvl2` |
| 4 | 13 | 5200 | 350 | 35 | `doom_cannon_lvl4` | `doom_ammo_big_asset_lvl2` |
| 5 | 14 | 5600 | 425 | 40 | `doom_cannon_lvl5` | `doom_ammo_big_asset_lvl2` |
| 6 | 15 | 5900 | 475 | 45 | `doom_cannon_lvl6` | `doom_ammo_big_asset_lvl2` |
| 7 | 16 | 6200 | 525 | 50 | `doom_cannon_lvl7` | `doom_ammo_big_asset_lvl2` |

Shared fields: 4×4, `MinAttackRange` 700 and `AttackRange` 5000 (7–50 tiles), `AttackSpeed` 10000, `CoolDownOverride` 6992, `BurstCount` 3, `BurstDelay` 750, `AmmoCount` 30, `TargetGroups` with `TargetGroupsRadius` 500, `WakeUpSpace` 200, `WakeUpSpeed` 1125, `DamageRadius` 300, `Pushback` 50, `PushbackHousingLimit` 3, ground and air targets. Projectile: `FixedTravelTime` 5000, `DamageDelay` 580, `IsBallistic`, `BallisticHeight` 5000, `TrajectoryStyle` 1, `StartHeight` 200, effect `Artillery Trail`. Hit spell: `Radius` 75, one hit, `Artillery Hit`. Level-7 `ExportNameUpgrade` inherits `doom_cannon_lvl6_upgrade` and is kept as written.

## Combat model (`src/game/eagle-artillery.ts`)

Engine semantics that the rows do not encode follow the older retained 9.256 reconstruction [bns34/Supercell.Magic-my-turn@52c5953](https://github.com/bns34/Supercell.Magic-my-turn/tree/52c5953f5e5802c64ac36e53d5599f8700976085). It predates Eagle Artillery changes after 2018, so it is supporting evidence, not proof of current native execution:

| File | SHA-256 |
| --- | --- |
| [`Supercell.Magic.Logic/GameObject/Component/LogicCombatComponent.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/Component/LogicCombatComponent.cs) | `5a2e1f66c7815e5d1668da0340690e7ed8248a1f8a064e99723d516e7548a09f` |
| [`Supercell.Magic.Logic/Data/LogicAttackerItemData.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Data/LogicAttackerItemData.cs) | `9c078566127cf3977d622db8bc622fa15d446215856ca6496cdf34eec7eddb71` |
| [`Supercell.Magic.Logic/GameObject/LogicProjectile.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/LogicProjectile.cs) | `d8d9ba06f66794a8af5fa49786626489e8b275c6f280ee5816dee89864574d1f` |
| [`Supercell.Magic.Logic/Data/LogicProjectileData.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Data/LogicProjectileData.cs) | `93eb2b53a6256548bdfedb256f0f53bbee4964d98dc06ef6f614777f48b12299` |
| [`Supercell.Magic.Logic/GameObject/LogicSpell.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/LogicSpell.cs) | `9dd6493f33e586f467dfe99c501a12995aa5bc38c9b864fc7b214ad6733d2bb3` |
| [`Supercell.Magic.Logic/Level/LogicLevel.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Level/LogicLevel.cs) | `485ce9b2a5ab7eb4bc3193c93575dd4f949700e6d646f658f2372d8d880f13e7` |
| [`Supercell.Magic.Logic/GameObject/Component/LogicMovementSystem.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/Component/LogicMovementSystem.cs) | `1c0c3d9482f21ecc724abe1898987e3822a646066610e67f38dde3ab49e0589d` |
| [`Supercell.Magic.Logic/Battle/LogicBattleLog.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Battle/LogicBattleLog.cs) | `945f5b15fdd3a392bb2067b0b318a30de478c955a5d008636718fee374b16bd7` |
| [`Supercell.Magic.Titan/Math/LogicMath.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Titan/Math/LogicMath.cs) | `b26dc9b22ac26c8b30c9f1bcfa1312be7086d11da271fc3ffd7a192dee9afa95` |

Public descriptions are used only to confirm the interpretation: activation "set to 200 for all levels" ([Supercell, June 2022](https://www.supercell.com/en/games/clashofclans/blog/release-notes/balance-changes-june-22-2)); heroes count 25, each spell housing space 5, Clan Castle troops 0, warnings at 50/100/150, three shells 0.75 s apart then a cooldown for an 11.5 s cycle, heavy 0.75-tile hit plus a small knock-back shockwave to 3 tiles, heat-map targeting and a reticle that follows its unit ([Fandom Eagle Artillery](https://clashofclans.fandom.com/wiki/Eagle_Artillery)); ground and air ([coc.guide](https://coc.guide/defense/ancient-artillery)).

- **Clock.** The family steps in the late campaign `defenses` phase on 16 ms logic steps with a 64 ms combat tick every fourth step. Positions use 512 native units per tile in a local frame offset by one tile; CSV distances become `(value << 9) / 100`.
- **Activation.** Deployed housing follows `LogicBattleLog`: troop `HousingSpace` × `UNIT_HOUSING_COST_MULTIPLIER` 100%, the hero's 25 × `HERO_HOUSING_COST_MULTIPLIER` 100%, and each spell housing space × `SPELL_HOUSING_COST_MULTIPLIER` 500% (from pinned `globals.csv`). Alliance and pet multipliers are 0; this game has no attacking Castle troops, pets or siege machines, and hero-summoned units are not deployments. At 200, `WakeUpSpeed` decreases 64 ms per tick, so the tower wakes on the 18th tick (1,088 ms after the qualifying tick). Presentation stages record the first ticks reaching 50/100/150/200.
- **Timing.** `LogicAttackerItemData` subtracts `CoolDownOverride` from `AttackSpeed`: 3,008 ms of charge (47 ticks), burst ids `(BurstDelay + t - 1) / BurstDelay` launch at +0, +704 and +1,472 ms, then 6,992 ms of cooldown and a 500 ms group-search throttle: 180 ticks (11.52 s) per cycle.
- **Targeting.** `RefreshTargetGroups` over a 25×25 grid of 1,024-unit cells, summed character `EnemyGroupWeight` (hero 2,500), the retained 5×5 radius multiplier table and distance weighting `((1000 × (141 - d) / 141)^2) / 1000` with `d` in half tiles; units inside the winning window become the group. The tracked unit is the heaviest member, nearest on ties, and the reticle moves 30 units per logic step toward it when within 10 tiles (`UpdateSelectedTargetGroup`). Groups persist until members are removed and are refreshed only between bursts. Character range: strict 7-tile minimum, 50-tile maximum plus half a tile.
- **Shells.** `FixedTravelTime` 5000 lands on the first logic step at or after launch + 5 s. While flying, the destination follows the tracked unit while it is alive and inside the tower's range; otherwise the shell keeps its last tracked point (the public "lands at the range edge", quantized to 16 ms). Shells from a destroyed tower still land.
- **Impact.** The hit spell acts on the first logic step after arrival: spell `Damage` within 0.75 tiles on ground and air. After `DamageDelay` 580 ms (36 steps, +576 ms) the building `Damage` shockwave hits the target's layer within 3 tiles, centered on the tracked unit if it survives, otherwise on the impact point. Radii are strict. The retained `AreaDamage` includes the center, so units inside 0.75 tiles take both hits; the public 0.75–3-tile shockwave wording is treated as descriptive (uncertainty).
- **Pushback.** `LogicLevel.AreaDamage` and `LogicMovementSystem.PushBack`: surviving non-hero units with housing ≤ `PushbackHousingLimit` get force `trunc((min(damage × 100, 5000) × 256 / 5000) / housing)`, a direction normalized to 512 plus 0..127 − 63 jitter per axis, duration `(1000 × force) >> 8` ms and end position `start + 2 × force × direction / 256`, eased quadratically by `UpdatePushBack`. Ground pushes stop at solid building tiles. A stable per-unit/per-shell hash replaces the native object RNG. Pushed units are held through `lateUnitHeld` and plan a new path afterwards (local integration).
- **Ammunition and state.** Every launch uses one of 30 shells; the tower empties at its 30th launch and clears its group. Freeze, construction, upgrade and destruction reset charge, burst and group.
- **Spell Tower Rage.** `spellTowerDefenseBoost(battle, building)` multiplies each shell's hit spell and shockwave damage at launch and scales the tick step `trunc((round((rate - 1) × 100) × 64 + 6400) / 100)` for charge, burst and cooldown. It is neutral until the Spell Tower family provides casts.
- **Results** wait for in-flight shells (`eagleArtilleryPending`).

## Presentation

`eagle-artillery-poses.ts`, `eagle-artillery-effects.ts` and `eagle-artillery-scene.ts` render only from recorded state (activation stages, wake time, volleys and launches, shells, impacts, empty and destruction times), so replay seeks rebuild the same presentation.

- Registration is local: scale 1.2 with the source root 80 px above the 4×4 ground center, matching the retained X-Bow, Mortar and Goblin Town Hall meshes; the base graph draws at ground depth.
- `turret_load` labels drive the body: `idle`, sequential 25-frame activation segments per recorded stage, the `battleidle` loop once awake, `attack_start`/`attack_end` per launch, `load` after a completed burst, `deactivate` then `empty`. Reduced motion holds the settled frame of each state. Label timing relative to native listeners is unverified.
- `ExportNameBeamStart` (`beam_up`) plays from the charge start at the named `targeting_pivot`; `ExportNameBeamEnd` (`beam_down`) marks the reticle, the last shell or the impact; both use their `warmup`/`loop`/`fade` labels.
- Shells use the level's shell export on a parabola whose peak is `BallisticHeight` at the game's 0.8 altitude scale, with `Artillery Trail`; `Artillery PreAttack`, `Artillery Attack`, `Ancient Hit` (crater), `Artillery Hit` (lifted for air targets), `Artillery No Ammo` and `Building Destroyed` play their source emitters and sounds.

## Replays and campaign gate

Replay version 44 accepts Eagle Artillery only in campaign recordings; versions ≤ 43 and practice replays reject it. The complete 820-entity Underground Workaround (village 61) exceeded the 600-building replay bound, so version 44 now admits up to 1,000 buildings; older versions keep 600/400. `EAGLE_ARTILLERY_READY` is true, and with every other late family complete all Eagle Artillery villages are playable.

## Verification

- `tests/eagle-artillery-combat.test.ts`: source rows, housing weights, dormancy and wake timing, blind spot, group preference, hit spell/shockwave layers, pushback, tracking, destruction and 30-shell depletion.
- `tests/eagle-artillery-scattershot-rage.test.ts`: Rage damage and rate hook.
- `tests/eagle-artillery-scattershot-replay.test.ts`: gates, version-44-only validation, the 820-entity recording, and live-versus-replay reconstruction with backward seeks for villages 65 (recorded through the campaign), 80 and 85.
- `tests/eagle-artillery-scattershot-art.test.ts`: all seven levels' dormant/activation/awake/attack/load/empty/upgrade/ruin compositions, beams, schedule, effects and sound hashes.
- `tests/browser/eagle-artillery-scattershot-live.spec.ts` (`npx playwright test tests/browser/eagle-artillery-scattershot-live.spec.ts` with the standard config): real deployments in villages 65, 80 and 85 with screenshots in `output/playtest/eagle-artillery/`, and replay seeks whose rendered objects equal the live ones.

## Limits

- Native executable playback is not verified; timing, targeting and pushback follow the older reconstruction.
- `TrajectoryStyle` 1 and the screen-space shell arc are local; `CameraShake` fields are retained but not implemented.
- The group grid uses the local one-tile native offset; exact native map origin effects on cell boundaries are unverified.
- Jitter uses a stable hash instead of the native RNG stream; pushed units are held without attacking during the push.
- `Artillery Load`, `Artillery Placing` and `Basic Turret Pickup` rows are retained; their sounds are not shipped.
- Registration (anchor 80) and beam/label choreography are local interpretations checked visually, not pixel witnesses of the client.
