# Original Air Sweeper source

Pinned client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, from Supercell's [original fingerprint](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/fingerprint.json). The importer checks all **16 SHA-256 input pins** and each file's SHA-1 membership in that fingerprint before decoding. All seven source levels, original bodies, controllable animation, particles and sounds are now integrated. [The live implementation notes](../../docs/AIR-CONTROL.md#live-original-air-sweeper-presentation) distinguish source facts from local registration, clocks, particle projection and gust rendering.

## All seven source levels

The [original building table](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/buildings.csv) identifies `Air Sweeper` as **GlobalID 1000028**, with a 2×2 footprint and seven levels. Sparse source rows remain intact in `native.json`; `combat.json` keeps the building rows and projectile together without inferring unsupported mechanics.

| Level |    HP |      Gold | Build seconds | Source TH | Push, tiles |
| ----- | ----: | --------: | ------------: | --------: | ----------: |
| 1     |   750 |   200,000 |        14,400 |         6 |         1.6 |
| 2     |   800 |   300,000 |        21,600 |         6 |         2.0 |
| 3     |   850 |   450,000 |        28,800 |         7 |         2.4 |
| 4     |   900 |   800,000 |        43,200 |         8 |         2.8 |
| 5     |   950 | 1,200,000 |        86,400 |         9 |         3.2 |
| 6     | 1,000 | 1,900,000 |       172,800 |        10 |         3.6 |
| 7     | 1,050 | 3,400,000 |       259,200 |        11 |         4.0 |

Push uses the project's existing 100-native-units-per-tile convention. Common fields retain air-only targeting, minimum/range 100/1500, `PrepareSpeed=600`, `AttackSpeed=5000`, `CoolDownOverride=4800`, `ShockwaveArcLength=700`, `ShockwaveExpandRadius=250`, `TargetingConeAngle=105`, `AimRotateStep=45` and `AnimateTurret=TRUE`. The targeting angle, arc length and expansion radius are distinct source fields. Their names alone do not prove the native cone geometry or clock ordering. Existing local interpretations are recorded in [AIR-CONTROL.md](../../docs/AIR-CONTROL.md).

## Original graphics

The retained [buildings.sc](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/sc/buildings.sc) graph contains **45 exports, 54 clips and 166 shapes**, sampling six original SCTX textures: 1, 2, 8, 25, 39 and 61. Every retained container uses normal blending. Original color transforms, geometry, source coordinates, child names, transforms, strip topology, display order, frames and labels remain intact. Runtime packing only copies necessary texels and bilinear neighbors and remaps UVs. It does not resize or recolor source pixels.

Each normal level has a static 30-fps parent with four children, in source order:

| Child           | Source timeline    | Purpose of retained control              |
| --------------- | ------------------ | ---------------------------------------- |
| `turret_load`   | 325 frames, 30 fps | Labeled loading mechanism                |
| unnamed         | Fixed shape        | Level-specific body                      |
| `turret_sector` | 360 frames         | Independently rotatable sector component |
| `turret`        | 360 frames         | Independently rotatable nozzle           |

Nozzle families are shared by levels 2–4 and 5–6; levels 1 and 7 have their own families. All seven upgrade exports retain their own bodies and their static one-frame loading child. Construction, build-animation, the separate `windmachine_base` with its shadow, and both six-frame wood/rockwood rubble exports are also present.

The normal loading clip retains these **zero-based** source labels:

| Segment | Start | End, inclusive | Frames |
| ------- | ----: | -------------: | -----: |
| Idle    |     0 |            223 |    224 |
| Loading |   224 |            314 |     91 |
| Attack  |   315 |            324 |     10 |

These durations at 30 fps do not directly match the 600-ms preparation or 5,000-ms attack fields. Native executable selection, time scaling, loop boundaries and cooldown handoff remain unverified. Every frame is retained. Live playback fits the loading segment to the existing preparation and begins the original attack segment at the actual launch; this local clock choice is documented separately.

The **56 transparent previews** pair the original base with each level in eight 45-frame orientations. Source frame 0 points toward the lower right in the decoded image, frame 45 downward, and frame 90 toward the lower left. Mapping these to this game's isometric grid is a local presentation interpretation, not an observation of native executable aiming. All previews share bounds **`[-71,-52,71,113]`**, **284×330** pixels at 2×, enclosing all body, construction, upgrade and rubble phases with eight native units of padding. No individual preview is recentered. Bounds and magnification are local framing choices.

## Projectile, particles and sound

[Air Blaster Ammo1](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/projectiles.csv) retains speed 600, start height/offset 125, rotation/top-layer fields and `dummy_particle`. That export is a small polygon with coincident UVs and an additional approximately quarter-scale transform. It paints a tiny white marker; it is neither empty nor a complete traveling wind-wave texture. Native procedural shockwave rendering remains a separate question.

Four [effect records](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/effects.csv) preserve four [particle emitters](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/csv/particle_emitters.csv), including every repeated variant row:

- `Wind Machine Attack` attaches ten `soft_smoke1` particles to the parent, with 800–1,500 ms lifetime, source gravity −100 and the original fire sound at volume 90, pitch 95–105.
- `Wind Machine Pickup` and `Wind Machine Place` retain the four grass variants and distinct original handling sounds/settings.
- `Building Destroyed` retains all 19 debris variants, smoke and grass, plus the original destruction sound. `smoke01` has animated source color transforms; browser rendering retains the sampled color rather than dropping it.

**66 assets total 3,072,913 bytes**: six lossless texture crops, 56 previews and four unchanged Ogg files (`air_cannon_fire_04`, `air_cannon_pickup_03`, `air_cannon_place_02`, `building_destroyed_01`). Source emitter, scale and sound settings are preserved in live integration with separately documented local projection and clock choices. Their presence does not establish native particle trajectories or audio mixing.

## Reproduction and scope

```sh
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-air-sweeper.py --check
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/native-air-sweeper-gpu-fixtures.py --check
npx vitest run tests/native-air-sweeper-reference.test.ts
npm run build
npm run test:air-sweeper:assets
```

**128 independent source-texture witnesses** cover every export, all 56 level/direction combinations, all upgrade bodies, both construction exports, all rubble frames, the base/projectile, independent and disabled rotation controls, 22 loading samples including every attack frame and all label boundaries, and all 25 particle variants. The tiny dummy is magnified 32× for meaningful pixel-center comparison; other samples are at most 2×. Expected pixels come from full original textures through the independent CPU sampler. Browser rendering uses the packed runtime graph, single-texture batching and context restoration. [QA.md](../../docs/QA.md) records actual measurements and limitations.

All seven source levels now render in live scenes, retained villages and practice. The TH8 home ceiling remains level four; High Pressure and No Flight Zone retain their other unresolved gates. [Live verification](../../docs/QA.md) compares all 56 assembled world views with independent source portraits, checks construction/upgrade/rubble/selection, and exercises source particles/audio, reduced motion, portable replay and offline delivery. Replay/save formats remain 34/4; two original pre-change recordings retain every physical state. Native executable aiming, clock, procedural shockwave rendering and particle/audio equivalence remain unverified.
