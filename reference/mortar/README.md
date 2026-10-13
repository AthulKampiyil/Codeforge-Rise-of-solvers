# Original Mortar source reference

This reference preserves the Mortar from public client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`. Sixteen inputs are pinned by SHA-256 and independently checked against the bundle fingerprint's SHA-1 membership. The original [fingerprint](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/fingerprint.json), [building table](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/buildings.csv), [projectile table](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/projectiles.csv), [effect table](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/effects.csv) and [particle table](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/csv/particle_emitters.csv) are the source of the retained records.

The original world graph contains **78 exports, 110 clips and 346 shapes**. Five lossless crops preserve the used regions of `buildings_8`, `25`, `36`, `39` and `66`. The import ships **28 assets / 3,551,318 bytes**: five cropped textures, eighteen transparent portraits and five unchanged Ogg files. The graph keeps source polygons, strips, transforms, colors, timelines, instance names and normal/additive blend boundaries. Texture packing copies original sampling regions and bilinear neighbors; it does not resize or redraw the artwork.

All eighteen normal levels now render and simulate from these original records. The live scene uses the source base, directional barrel, construction, scaffold, rubble, shells, shadows, particles and five original sounds. Home Town Hall eight still caps Mortars at level six and four buildings. High Pressure remains gated by Cannon level 15; geared-up mode remains unsupported.

## Bodies and controls

All eighteen `mortar_lvlN` bodies have one-frame roots at **24 fps**. Their named `turret` child selects eight original barrel views: source indices **0–44, 45–89, 90–134, 135–179, 180–224, 225–269, 270–314 and 315–359**. Levels 15–18 retain a **361st frame**, index 360, with the final view. That extra frame is preserved rather than trimmed into an assumed 360-frame format.

Levels 5–18 contain a separate named `gearup` child. The graph retains both enabled and disabled controls for verification. Live normal mode and its portraits explicitly disable gearup. Its presence at a source level does not establish a playable gear-up unlock. The source `GearUpBuilding=BB Multi Mortar`, level requirement and alternate weapon fields remain in the building records for later investigation.

The source also supplies `mortar_base`, `mortar_const`, `mortar_upg` and all six variants of `destroyedBuilding_3s_pit_rock`. Eighteen portraits combine the original base with turret frame zero and `gearup=false`. Their shared native bounds **[-84, -22, 89, 146]** enclose all retained directional, gear-up, construction and rubble geometry with eight units of padding. Portraits are **346×336 pixels at 2×**. Live world registration uses local scale 1.2, source anchor (0,80), and altitude conversion 0.8. The source origin is shared by the native assembly and portrait proxy, including selection and moving previews.

## Normal-mode source values

The source identity is `GlobalID=1000013`, with a 3×3 footprint, ground-only targeting, `AttackRange=1100`, `MinAttackRange=400`, `AttackSpeed=5000` and `DamageRadius=150`. The compact projection retains these fields separately from renderer choices. Build prices are gold; durations refer to reaching each level.

| Level | TH  |    HP | DPS |       Gold | Build time |
| ----- | --- | ----: | --: | ---------: | ---------- |
| 1     | 3   |   400 |   4 |      5,000 | 30m        |
| 2     | 4   |   450 |   5 |     25,000 | 1h         |
| 3     | 5   |   500 |   6 |     90,000 | 2h         |
| 4     | 6   |   550 |   7 |    180,000 | 3h         |
| 5     | 7   |   600 |   9 |    300,000 | 6h         |
| 6     | 8   |   650 |  11 |    500,000 | 8h         |
| 7     | 9   |   700 |  15 |    900,000 | 12h        |
| 8     | 10  |   800 |  20 |  1,200,000 | 18h        |
| 9     | 11  |   950 |  25 |  1,600,000 | 20h        |
| 10    | 11  | 1,100 |  30 |  1,800,000 | 1d         |
| 11    | 12  | 1,300 |  35 |  2,300,000 | 1d 6h      |
| 12    | 12  | 1,500 |  38 |  2,400,000 | 1d 12h     |
| 13    | 13  | 1,700 |  42 |  2,800,000 | 2d         |
| 14    | 14  | 1,950 |  48 |  4,300,000 | 2d 12h     |
| 15    | 15  | 2,150 |  54 |  5,000,000 | 3d         |
| 16    | 16  | 2,300 |  60 |  7,000,000 | 4d         |
| 17    | 17  | 2,450 |  66 | 13,000,000 | 5d         |
| 18    | 18  | 2,550 |  72 | 21,000,000 | 12d 12h    |

The first ten rows retain their previous audited values; levels eleven through eighteen now use the same source-backed progression path. The TH8 home ceiling remains level six. High Pressure still requires Cannon 15.

## Shells, particles and audio

Thirteen projectile families cover the eighteen levels. All retain `Speed=500`, `StartHeight=95`, `StartOffset=20`, `IsBallistic=TRUE`, `DontTrackTarget=TRUE`, `UseRotate=FALSE` and the original `simple_shadow_small` export. Projectile and trail graphs retain their own nested animations, tint and additive groups. New version-35 battles use ground distance divided by five tiles per second for arrival, following the other source-backed projectiles. Version-34 recordings retain their original 1.15-second arrival. The visual 115-pixel sinusoidal arc remains a local projection, not a verified native ballistic equation. A shell retains the selected ground location, launch damage and original source export after target loss or launcher destruction.

Seven effect records refer to **24 emitters and 64 ordered particle variants**. They include launch smoke/fire, three impact tiers, debris, pickup grass and placing effects. Repeated effect rows are significant: the first hit tier includes three separate Grass rows. The `yellow_fireball_trail_emitter` has the ordered blend flags **true, false, true, false, true**; a single emitter-wide additive flag would incorrectly brighten its smoke. Source placement/attachment, heights, durations, delays and camera-shake fields are retained without asserting native playback parity.

The five source sounds are `mortar_fire_02_with_fall.ogg`, `mortar_hit_01.ogg`, `mortar_pickup_01.ogg`, `mortar_place_02.ogg` and `building_destroyed_01.ogg`. Launch uses source volume 70 and pitch range 95–105. The live mixer uses the original effect volumes, pitch ranges and delays from `effects.json`. At master gain 0.12, launch gain is 0.084, the first hit tier 0.108, and later hit/pickup/place gains 0.096. Effects and sample positions reconstruct from bounded simulation history; pause, speed, seek, mute and reduced motion share the established mixer. Reduced motion keeps the first-tier ring or later-tier static crater while suppressing flight and smoke.

## Reproduction and verification

With the native-art Python requirements installed:

```sh
PYTHONPATH=scripts python scripts/import-native-mortar.py --check
PYTHONPATH=scripts python scripts/native-mortar-gpu-fixtures.py --check
npx vitest run tests/native-mortar-reference.test.ts
npm run build
npm run test:mortar:assets
npm run test:mortar:production
```

The importer checks every source fingerprint entry, original sound byte, output image pixel and graph field. The independent Python witnesses use original full SCTX textures; the browser tests use the packed runtime textures and the production mesh renderer. **173 body and 140 effect compositions per engine** cover all 78 exports, every level's eight views, optional/disabled controls, late terminal frames, all rubble variants, projectile animation samples and every ordered emitter variant. Two deliberately empty `d6` smoke endpoints remain empty.

The Chromium and WebKit tests retain the established mean-error and outlier-fraction criteria. They also test forced single-texture batching, context restoration and GL errors. Four body compositions have a total of 30 pixels above 16/255 in each engine, localized to original polygon edges on or within 0.000003815 pixels of pixel centers. These CPU/GPU coverage differences remain visible in the reports; neither source geometry nor thresholds are changed to hide them. Effect compositions have no pixels above 16/255.

The September 13 garrison audit found that the earlier 6600-pixel body sheet slightly exceeded the actual framebuffer after the game's render-budget scaling. Its original browser capture is superseded by a complete **three-strip** rerun in both engines: two body strips and one effect strip, each explicitly bounded by the measured framebuffer. All 313 source compositions pass, with zero changed bytes under forced single-texture batching and graphics-context restoration and all GL checks zero. The original source PNGs, meshes, thresholds and 30 edge outliers per engine remain unchanged. Earlier frozen evidence is preserved with this qualification correction recorded separately.

The live normal assembly also matches all eighteen independently rendered portraits in Chromium and WebKit. Maximum per-level mean channel error is 0.325111 and 0.351541 respectively; neither engine has pixels above 16/255 in this comparison. The separate foundation witnesses above retain their documented edge-coverage differences.

Combat version 35 keeps version-34 import, log playback and export available. Three immutable Mortar recordings were generated by the archived pre-integration commit `0f9449ea29dd3fa7393c1c60fef916097380e6d2`, with 3,143 independently hashed battle states. Every prior physical field remains equal; only the new presentation history and explicit compatibility flag are excluded. The two older Air Sweeper recordings retain all 1,371 previously hashed states as well. New source-speed timing changes the fixed Magic Practice fixture from 33% to 42% destruction, preserving all 75 shrink pulses and deterministic reconstruction.

Original executable projection, sector boundaries, ballistic and particle equations, damage knockback and final sound mixing remain unverified. Live barrels choose the nearest of eight local map directions. The source contains no authored normal barrel recoil animation; none is claimed. Gear-up simulation and Mortar knockback remain unsupported. The source references and measured comparisons establish artwork/data preservation and deterministic local integration, not equivalence with the full original executable.
