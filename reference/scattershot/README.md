# Original Scattershot

The late Goblin Map campaign uses Scattershot levels 2 and 3 (villages 75–84, 86 and 89, zero-based); all seven source levels are supported. Values come only from the pinned client 18.400.21 bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, downloaded from `https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/` into `output/native-campaign-source/<path>`.

Reproduce with `OPENBLAS_NUM_THREADS=1 PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-scattershot.py --check` (prints `Verified 14 original Scattershot assets`). Every input matches its SHA-1 entry in `fingerprint.json` and the SHA-256 pinned in the importer:

| Input | SHA-256 |
| --- | --- |
| `fingerprint.json` | `ecb5b05d632831cd706e4e993158b63635445257ad254bec97c371b078e3044b` |
| `sc/buildings.sc` | `f73ec949fc070bc03175d6bb3af8b62d8f607094bf2b343c9846a499a35be0ed` |
| `sc/buildings_8.sctx` | `588eba7d5739a5d9b53d3e14f2ab83bd170cad735363a81dd37bea7bcc0bb3bd` |
| `sc/buildings_25.sctx` | `c290a82b3940513f16b55dba2305e875d923d4120c5997b6b6908c680ec8ca3d` |
| `sc/buildings_39.sctx` | `dd27d9612fe135c3be364840eeabe45b53a229b24192246b56a08fa0606fdb16` |
| `sc/buildings_45.sctx` | `ce0425622f22f1dade3fd1614e1c3ce5fabe4e09d9c5f32d014dd1f12cdc9287` |
| `logic/buildings.csv` | `9aed5fed876e2914a22fa7fed688a651c691ab06170d60e2bda8dc9262fbccb1` |
| `logic/projectiles.csv` | `71cda0e457ad88a6772f6421a22419b24d6bcf78d0ed305f09184404889a72dc` |
| `logic/spells.csv` | `385159e00327e6a1567cd91f1585b4ed0717d3f4475f0823398243482598289d` |
| `logic/effects.csv` | `5c6d5b67d6407345123b8d55872ed77ee6697b466d20d1fa21e25a723c511e9f` |
| `logic/mini_levels.csv` | `548d592770d5e0799a13a9e70da9092da4e282d5293bba852f5e0424c78812d3` |
| `csv/particle_emitters.csv` | `8d80bbf714386c4f24e6aed8f2eef671a2eac5c3b3ad41e4d275b757ced64cef` |
| `sfx/building_destroyed_01.ogg` | `fd8295765aa86ff5c7c6be1159cd8fc97aed3c858c29fbdb1af5e3d5c5ce7f04` |
| `sfx/scattershot_atk_01.ogg` | `2337ea8e9a7f69338523778c02beea3b61ba893f3173459a8ec86208a1ab76fe` |
| `sfx/scattershot_atk_hit_01.ogg` | `b27f44da6f9bc0cd6ba201271da151fcc62a55817db74774c19d331c6b8e4695` |

Outputs: `native.json` keeps the raw sparse rows (building, seven `Scattershot Projectile` rows, `Scattershot Hit Spell`, both raw `Scattershot Mini Levels` rows, effect and emitter closure). `combat.json` is the compact runtime catalogue (including 24×15 throw directions per body), `effects.json` the battle effects, emitters and sounds, and `runtime.json` the scene graph (56 exports). Packed texture crops, seven previews and three sounds are in `public/assets/buildings/scattershot-native/`.

## Source rows

| Level | Town Hall | HP | DPS | Impact (DPS × 3.228 s) | Shard `Damage` | Shard `MinDamage` | Body | Projectile | Trail emitter |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 13 | 3600 | 125 | 403.5 | 300 | 100 | `ice_breaker_lvl1` | `ice_breaker_lvl1_projectile` | `Ice_Breaker_lvl1_trail_emitter` |
| 2 | 13 | 4200 | 150 | 484.2 | 360 | 120 | `ice_breaker_lvl2` | `ice_breaker_lvl2_projectile` | `Ice_Breaker_lvl1_trail_emitter` |
| 3 | 14 | 4800 | 170 | 548.76 | 380 | 130 | `ice_breaker_lvl3` | `ice_breaker_lvl2_projectile` | `Ice_Breaker_lvl1_trail_emitter` |
| 4 | 15 | 5100 | 175 | 564.9 | 400 | 140 | `ice_breaker_lvl4` | `ice_breaker_lvl2_projectile` | `Ice_Breaker_lvl1_trail_emitter` |
| 5 | 16 | 5410 | 180 | 581.04 | 420 | 150 | `ice_breaker_lvl5` | `ice_breaker_lvl5_projectile` | `Ice_Breaker_lvl1_trail_emitter` |
| 6 | 17 | 5600 | 185 | 597.18 | 440 | 155 | `ice_breaker_lvl6` | `ice_breaker_lvl6_projectile` | `Ice_Breaker_lvl1_trail_emitter` |
| 7 | 18 | 5800 | 190 | 613.32 | 450 | 160 | `ice_breaker_lvl7` | `ice_breaker_lvl7_projectile` | `e_scattershot_Trail_Blue` |

Shared fields: 3×3, `MinAttackRange` 300 and `AttackRange` 1000 (3–10 tiles), `AttackSpeed` 3228, `CoolDownOverride` 1500, `NewTargetAttackDelay` 2200, `DamageRadius` 100, `AmmoCount` 90, ground and air targets, `AnimationActionFrame` 5. Projectile: `Speed` 1200, `StartHeight` 190, `IsBallistic`, `UseRotate`, shadow `simple_shadow_small`, `SmoothDamage`, `HitSpellInheritAffectType`. Hit spell: `Radius` 500, `MinRadius` 100, `ConeAngle` 90, one hit, `HitTimeMS` 0, `Ice Breaker Hit lvl1`.

## Combat model (`src/game/scattershot.ts`)

Engine semantics that the rows do not encode follow the older retained 9.256 reconstruction [bns34/Supercell.Magic-my-turn@52c5953](https://github.com/bns34/Supercell.Magic-my-turn/tree/52c5953f5e5802c64ac36e53d5599f8700976085). It predates the Scattershot and cone hit spells, so it supports only the shared attacker, projectile and spell mechanics:

| File | SHA-256 |
| --- | --- |
| [`Supercell.Magic.Logic/GameObject/Component/LogicCombatComponent.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/Component/LogicCombatComponent.cs) | `5a2e1f66c7815e5d1668da0340690e7ed8248a1f8a064e99723d516e7548a09f` |
| [`Supercell.Magic.Logic/Data/LogicAttackerItemData.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Data/LogicAttackerItemData.cs) | `9c078566127cf3977d622db8bc622fa15d446215856ca6496cdf34eec7eddb71` |
| [`Supercell.Magic.Logic/GameObject/LogicProjectile.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/LogicProjectile.cs) | `d8d9ba06f66794a8af5fa49786626489e8b275c6f280ee5816dee89864574d1f` |
| [`Supercell.Magic.Logic/Data/LogicProjectileData.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Data/LogicProjectileData.cs) | `93eb2b53a6256548bdfedb256f0f53bbee4964d98dc06ef6f614777f48b12299` |
| [`Supercell.Magic.Logic/GameObject/LogicSpell.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/LogicSpell.cs) | `9dd6493f33e586f467dfe99c501a12995aa5bc38c9b864fc7b214ad6733d2bb3` |
| [`Supercell.Magic.Logic/Data/LogicSpellData.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Data/LogicSpellData.cs) | `684ca07cbd54e106da3529375715c6fdb1fd15a7df470a70b04487917eba5850` |
| [`Supercell.Magic.Logic/Level/LogicLevel.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Level/LogicLevel.cs) | `485ce9b2a5ab7eb4bc3193c93575dd4f949700e6d646f658f2372d8d880f13e7` |
| [`Supercell.Magic.Logic/Util/LogicGamePlayUtil.cs`](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Util/LogicGamePlayUtil.cs) | `10c31f80fcbe124fbf09b8c8bdc4955f2790fcacced8e05f2edff1fee854a0e1` |

Public descriptions confirm the interpretation: range 3–10 tiles, 3.228 s, ground and air, per-hit damage DPS × 3.228 ([coc.guide](https://coc.guide/defense/scattershot)); a 90° splash cone behind the target that spares units beside or in front, with zones within 1 tile and 1–5 tiles ([Fandom Scattershot](https://clashofclans.fandom.com/wiki/Scattershot)); damage only on the target's layer ([1337wiki](https://clash-of-clans.1337wiki.com/scattershot)); Rage affects Scattershot damage ([Supercell, December 2022](https://supercell.com/en/games/clashofclans/blog/release-notes/december-update-2022/)).

- **Clock and range.** 16 ms logic steps with a 64 ms combat tick in the late campaign `defenses` phase; 512 native units per tile. Character range has a strict 3-tile minimum and a 10-tile maximum plus half a tile.
- **Targeting.** `RefreshTarget` keeps a valid target; otherwise the nearest available attacker is searched at most every 500 ms.
- **Timing.** `LogicAttackerItemData` turns `AttackSpeed` − `CoolDownOverride` into 1,728 ms of charge and `NewTargetAttackDelay` into a 1,028 ms (`AttackSpeed` − 2200) charge preset for a new target. A target found on the first tick releases after 11 ticks (640 ms), then every 50 ticks (3.2 s): 1,500 ms cooldown plus charge, with the retained carry-over.
- **Impact.** Damage per throw is `DPSToSingleHit(DPS, AttackSpeed)` = DPS × 3.228. The projectile moves 98 units per logic step (`Speed` 1200) and tracks its target until the target is removed. On arrival (`DamageDelay` 0) the impact damages every unit on the target's layer strictly within one tile (`DamageRadius` 100) of the target.
- **Shards (local interpretation).** The hit spell acts on the next logic step. Its apex is the projectile's last position and its axis the final direction toward the target. With `HitSpellInheritAffectType` it damages only the target's layer, at distances `MinRadius` ≤ d < `Radius` (1–5 tiles) within ±45° (`ConeAngle` 90), falling linearly from `Damage` at 1 tile to `MinDamage` at 5 tiles. Excluding the inner tile avoids double-hitting units already struck by the impact splash; native cone and falloff arithmetic is unverified.
- **Ammunition and state.** Every throw uses one of 90; the tower empties at its 90th throw. Freeze, construction, upgrade and destruction clear the target and charge.
- **Spell Tower Rage.** `spellTowerDefenseBoost(battle, building)` multiplies impact and shard damage at release and scales the tick step `trunc((round((rate - 1) × 100) × 64 + 6400) / 100)` for charge and cooldown. It is neutral until the Spell Tower family provides casts.
- **Results** wait for projectiles in flight (`scattershotPending`).

## Presentation

`scattershot-poses.ts`, `scattershot-effects.ts` and `scattershot-scene.ts` render only from recorded throws, projectiles and impacts, so replay seeks rebuild the same presentation.

- Registration is local: scale 1.2 with the source root 80 px above the 3×3 ground center, matching the retained X-Bow and Mortar meshes; `rapidfire_base` below the body and `destroyedBuilding_3l_pit_rockwood` as rubble.
- The `turret` control selects one of 24 aimed bands (15° each, frame 0 along map +X) and one of 15 throw frames at 30 fps. `AnimationActionFrame` 5 is aligned with the recorded release and the pre-roll is predicted from the retained charge state. Reduced motion shows the aimed idle frame.
- The projectile export rotates with its screen velocity and descends from `StartHeight` 190 (0.8 altitude scale) to the target layer along a local quarter-distance arc (the row has no `BallisticHeight`), with its shadow and trail emitter.
- `Ice Breaker Attack` faces the throw, `Ice Breaker Hit lvl1` plays at the impact, and `ice_breaker_shard_cone_rotate` selects its rotation frame from the map angle while its `ib_effect` child keeps its own clock.

## Replays and campaign gate

Replay version 44 accepts Scattershots only in campaign recordings; versions ≤ 43 and practice replays reject them. `SCATTERSHOT_READY` is set, and with every other late family complete all Scattershot villages are playable.

## Verification

- `tests/scattershot-combat.test.ts`: source rows and per-hit values, blind spot and range allowance, nearest targeting and retargeting, 640 ms / 3.2 s cadence, impact splash layers, cone falloff and exclusions, 90-throw depletion.
- `tests/eagle-artillery-scattershot-rage.test.ts`: Rage damage and rate hook.
- `tests/eagle-artillery-scattershot-replay.test.ts`: version-44-only validation and live-versus-replay reconstruction with backward seeks for villages 75 and 80.
- `tests/eagle-artillery-scattershot-art.test.ts`: all 24 × 15 throw frames at levels 1 and 7, every level's aimed bands, upgrade and ruin, cone rotation and end, effects and sound hashes.
- `tests/browser/eagle-artillery-scattershot-live.spec.ts` (`npx playwright test tests/browser/eagle-artillery-scattershot-live.spec.ts` with the standard config): real deployments in villages 75 and 80 with screenshots in `output/playtest/scattershot/`.

## Limits

- Native executable playback is not verified; the cone apex, `MinRadius` exclusion and linear falloff are interpretations, and `SmoothDamage` is unresolved.
- The level-7 trail `e_scattershot_Trail_Blue` lives in `sc/vfx_env.sc`, which is not imported, so level 7 throws have no trail. Campaign villages use levels 2–3.
- The two raw mini-level rows (level 1: `DPS` 3 and `ProjectileSpellDamageBoost` 3; level 2: `Hitpoints` 150) are retained but not applied or interpreted; campaign placements carry no mini level.
- `Scattershot Pickup` and `Scattershot Placing` rows are retained; their sounds are not shipped.
- Projectile flight arc, registration and throw pre-roll are local choices checked visually; previews omit additive glints and are only thumbnails.
- Arrival is quantized to 16 ms logic steps.
