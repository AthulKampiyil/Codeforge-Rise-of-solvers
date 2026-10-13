# Original Cannon source reference

This reference preserves the Cannon from public client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`. Seventeen inputs are pinned by SHA-256 and checked independently against the original fingerprint's SHA-1 entries. Source records come from the [fingerprint](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/fingerprint.json), [building table](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/buildings.csv), [projectile table](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/projectiles.csv), [effect table](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/effects.csv), [particle table](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/csv/particle_emitters.csv), original SC graph, SCTX textures and five Ogg samples.

All twenty-one normal levels now render and fight with this source data. High Pressure is playable with its original four level-15 Cannons. Home progression ends at level 10 for Town Hall 8; higher source levels remain available in campaign and imported snapshots. Alternate bodies remain preserved without enabling geared-up combat.

## Preserved artwork

The original graph contains **101 exports, 153 clips and 1,305 shapes**. It preserves twenty-one normal bodies, fifteen alternate bodies, named turret and gear controls, eleven bases, construction, scaffolds, rubble, eleven projectile families and source effects. Polygons, transforms, colors, timelines, instance names and normal/additive blend boundaries are retained exactly.

The import ships **53 assets / 13,244,811 bytes**: six lossless packed textures, twenty-one transparent world portraits, twenty-one exact UI crops and five original Ogg files. Packing copies the original sampling regions and bilinear neighbors; it does not resize or redraw the art. Texture 18 contains 706 copied regions in a 2,552×4,056 atlas. The remaining texture sources are 2, 8, 25, 39 and 41.

Normal portraits combine the level's original base and body at source frame zero, with `turret=0` and `gearup=false`. All use conservative shared bounds **[-101, -25, 104, 148]**, producing **410×346 pixels at 2×**. These bounds enclose all source placements, including independently animated siblings, with eight native units of padding. Portrait framing is local and does not establish a native camera projection. UI icons crop the same source pixels with eight pixels of padding; world previews retain the shared registration. Levels 12–15 contain additive glows, which cannot be represented exactly by a flattened transparent portrait on every background. Live bodies retain the original blend groups and are compared against independent original-texture compositions on the same backdrop.

## Direction and animation

Every normal and alternate root retains its **360-frame, 30-fps** timeline. Levels **14–15** have 81 distinct parent placement patterns and nested animated effects. Their root animation runs at battle/home presentation time independently of the selected turret frame. Replay seeking reconstructs the same pose; reduced motion samples the animated root at time zero.

Normal turret timelines have 360 frames, except level 21, which has **365**. Most preserve 36 placement patterns, but equal ten-frame direction bins would corrupt the source: level 11 includes nine- and eleven-frame bands, level 12 has **41 patterns** including single-frame transitions, levels 17–20 have **35 patterns** with a shared twenty-frame band, and level 21 has a fifteen-frame terminal band. All normal and alternate timelines remain literal. Local aiming selects `floor(mapAngleDegrees + 5)` modulo 360, centering the usual bands while allowing every integer source frame. Native engine angle selection has not been verified.

Separate named gear controls begin at source level 7. Alternate bodies `basic_turret_lvl7_down` through `basic_turret_lvl21_down` are preserved with both enabled and disabled controls. Source burst fields retain range 700, interval 1600, four shots and a 192 delay, alongside the BB Double Cannon level-3 requirement. None is presented as implemented burst behavior.

## Source progression and projectiles

Normal mode is ground-only with `GlobalID=1000008`, a 3×3 footprint, range 900 and an 800-ms attack interval. Compact values retain source units and destination-level prices and durations separately from renderer assumptions.

| Level | TH  |    HP | DPS |      Gold | Seconds |
| ----- | --- | ----: | --: | --------: | ------: |
| 1     | 1   |   300 |   7 |       250 |       5 |
| 2     | 2   |   360 |  10 |     1,000 |      30 |
| 3     | 2   |   420 |  13 |     4,000 |     120 |
| 4     | 3   |   500 |  17 |    16,000 |   1,200 |
| 5     | 4   |   600 |  23 |    50,000 |   1,800 |
| 6     | 5   |   660 |  30 |    60,000 |   3,600 |
| 7     | 6   |   730 |  40 |   100,000 |   7,200 |
| 8     | 7   |   800 |  48 |   160,000 |  10,800 |
| 9     | 8   |   880 |  56 |   250,000 |  12,600 |
| 10    | 8   |   960 |  64 |   330,000 |  14,400 |
| 11    | 9   | 1,060 |  74 |   500,000 |  16,200 |
| 12    | 10  | 1,160 |  85 |   600,000 |  18,000 |
| 13    | 10  | 1,260 |  95 |   660,000 |  21,600 |
| 14    | 11  | 1,380 | 100 | 1,000,000 |  28,800 |
| 15    | 11  | 1,500 | 105 | 1,200,000 |  36,000 |
| 16    | 12  | 1,620 | 110 | 1,300,000 |  39,600 |
| 17    | 12  | 1,740 | 115 | 1,500,000 |  43,200 |
| 18    | 13  | 1,870 | 125 | 1,800,000 |  57,600 |
| 19    | 13  | 2,000 | 135 | 2,000,000 |  72,000 |
| 20    | 14  | 2,150 | 150 | 2,600,000 |  86,400 |
| 21    | 15  | 2,250 | 160 | 3,000,000 | 129,600 |

The first twelve HP/DPS/cost/time rows match the earlier runtime. The pinned building table now supplies the Town Hall 2 requirement for Cannon level 2, superseding the earlier wiki-derived Town Hall 1 exception. A previously paid upgrade still finishes once at its saved deadline without charging again. Counts remain 2, 2, 2, 2, 3, 3, 5, 5 across Town Halls 1–8; level ceilings are 1, 3, 4, 5, 6, 7, 8, 10.

Eleven projectile families retain `Speed=1200`, `IsBallistic=FALSE`, `DontTrackTarget=FALSE`, `UseRotate=TRUE` and `Scale=100`. Their start heights range from 48 to 75 and offsets from 50 to 76. No family declares a shadow export. Later levels reference the original Spark Trail, Spark Trail B or Spark Trail Jungle emitters. New normal Cannon projectiles travel at 12 tiles per second, track the living target with bounded movement, retain its last destination after death and survive launcher destruction. Damage applies once at arrival. The separate tutorial Cannon retains its earlier weapon rules and image; its texture key is not reused by the normal level-one portrait.

Seven effect records preserve **20 emitters and 47 ordered particle variants**, including per-variant blend flags. The source sounds are `cannon_08.ogg`, `cannon_drop2.ogg`, `cannon_pickup3.ogg`, `generic_hit_01.ogg` and `building_destroyed_01.ogg`. The live renderer samples the original effect rows, counts, variants, delays, gain and pitch. Signed backward smoke, parent firing direction and radius are interpreted by explicit opt-in particle options. Trail births follow the actual physical trajectory and remain at their birth positions after impact. Each Cannon retains at most sixteen shots and sixteen hits; each live trail is bounded by the source maximum lifetime. Sampling uses deterministic visual seeds without consuming combat randomness. Native executable playback parity is not claimed.

## Reproduction

With the native-art Python requirements installed:

```sh
PYTHONPATH=scripts python scripts/import-native-cannon.py --check
PYTHONPATH=scripts python scripts/native-cannon-gpu-fixtures.py --check
PYTHONPATH=scripts python scripts/native-cannon-live-fixture.py --check
npx vitest run tests/native-cannon-reference.test.ts tests/cannon-native.test.ts tests/cannon-combat.test.ts tests/cannon-historical.test.ts
npm run build
npm run test:cannon:assets
npm run test:cannon:production
```

Independent Python pixel witnesses sample original full SCTX textures. The browser suite uses the packed textures and production mesh renderer. Eight bounded pages cover **1,332 direction compositions, 90 detail/state compositions and 107 effect compositions**: all 101 exports, every distinct turret placement pattern and terminal frame, enabled/disabled controls, animated parents, construction/base/rubble states and all 47 particle variants. Page dimensions stay within 2,400×12,000 pixels.

The September 13 garrison checks exposed incomplete capture of the largest original witness sheets: the game's 16-million-pixel/8192-dimension backbuffer cap made part of the requested readback lie outside the framebuffer. Those earlier large-sheet browser results are superseded by **thirteen row-aligned strips per engine**, each explicitly checked against the actual framebuffer dimensions. The eight original Python PNGs, their source geometry and the acceptance thresholds are unchanged; every one of the 1,529 compositions is covered by the corrected run.

All 1,529 compositions pass in both Chromium and WebKit. Forced single-texture batching and restored graphics contexts produce zero changed bytes; all recorded GL checks are zero. Maximum per-case mean channel error is 0.663266 in Chromium and 0.852041 in WebKit. The corrected captures retain 54/55 pixels above 16/255 respectively, all within 0.000415199 pixels of an original triangle edge. Effects have no such outliers. These measured coverage differences remain visible in the reports. Earlier frozen evidence stays intact, with its capture limitation explicitly recorded in the later QA correction.

## Live compatibility and verification

Combat version **36** uses the source-speed tracking path. Versions **34 and 35** preserve their prior normal Cannon speed, fixed arrival deadline and physical projectile shape; version 34 also preserves the earlier fixed Mortar flight. Four immutable Cannon recordings were captured from archived commits `dc52f2077cd522dd4184b4c72384b829c74fe47c` and `0f9449ea29dd3fa7393c1c60fef916097380e6d2` before integration. All **3,375 historical physical states** retain their hashes. The new presentation history is excluded from those historical hashes; old projectile positions, health, paths, damage and results are included.

Twenty-one independent full-texture base/body compositions also verify the live world registration and additive groups. The largest per-level mean channel errors are **0.350461** in Chromium and **0.371193** in WebKit. Each engine has at most one pixel above 16/255 in a level composition (maximum channel difference 17); the established thresholds and source geometry remain unchanged. All GL checks are zero.

Browser coverage exercises every level's setup, construction, scaffolds, rubble, picking bounds and move preview; 320/390-pixel portrait and 844-pixel landscape Info cards; original pickup/place/fire/destroy sounds; mute, pause, reduced motion, rewind, launcher destruction and zero-byte-difference graphics-context restoration. Complete battle-state comparisons cover nine representative levels plus the untouched High Pressure layout. See `docs/QA.md` for final run totals and production delivery checks.

World scale 1.2, anchor (0, 80), altitude scale 0.8, target height 16, map-angle selection and particle inertia/slowdown equations are local registration/interpretation. Source rows and original meshes are exact; executable timing/projection remains unverified. Geared-up simulation, physical-device qualification, WebKit offline qualification, garrison/Clan Castle behavior and the wider production-clone goal remain open. The frozen source foundation evidence is retained separately from the live integration evidence.
