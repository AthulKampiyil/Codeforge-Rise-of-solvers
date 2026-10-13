# Native Hidden Tesla source

Pinned client **18.400.21**, asset bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`.
Inputs come from the [public client bundle](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/fingerprint.json).
Every input has a SHA-256 pin in `native.json` and is checked against the fingerprint's SHA-1 record.

- `native.json` preserves the 17 original sparse building rows, reveal globals, 12 Tesla effect groups, 12 particle emitter records, original scene graph, texture sampling evidence, sound hashes and preview hashes.
- `runtime.json` retains all 54 exports, 124 shapes and 65 clips. It changes only UV coordinates to address four tightly packed textures; original source texels and bilinear neighbours are copied without rescaling.
- `effects.json` projects the twelve raw effect groups and twelve emitter definitions into a runtime-sized file without duplicating the source graph.
- `combat.json` contains inherited HP, DPS, upgrade costs/times and Town Hall requirements for all 17 levels, plus the 600 ms cadence, 6-tile trigger and 7-tile attack radius.
- `public/assets/buildings/tesla-native` contains four textures, 17 portraits and five original Ogg files. The graph also includes trapdoors, construction and upgrade scaffolds, the source damaged export, reveal dust, electrical arcs, impact sparks and grass.

Reproduce and verify with the pinned Python dependencies:

```sh
output/native-art-venv/bin/python scripts/import-native-tesla.py
output/native-art-venv/bin/python scripts/import-native-tesla.py --check
output/native-art-venv/bin/python -m unittest discover -s scripts/native_art -p 'test_*.py'
npm test -- tests/native-tesla-reference.test.ts
```

The 18-frame reveal runs at 24 fps and first places `idle_electricity` at frame 17. Setup exports have one root frame with independent 150–192-frame idle clips. Several levels apply additive blending to the **whole idle group**, which must be isolated before compositing onto the world. Seven such subclips are recorded explicitly; treating their children as independently additive changes overlapping pixels. The shared flat mesh player rejects these groups; the [native scene renderer](../../docs/NATIVE-SCENE-RENDERER.md) preserves and composites them separately, with independent source-pixel checks in Chromium and WebKit.

DOM portraits include original normal-blend foreground polygons at density 2. Named idle electricity and additive leaves are omitted because one transparent PNG cannot encode their appearance over arbitrary backgrounds. Complete live effects remain in the graph.

The [live integration](../../docs/HIDDEN-TESLA.md) uses all 17 levels, source trapdoors and idle groups, native construction/upgrade/damaged exports and the original reveal/attack/hit sounds. Its bounded shot history drives original arc, coil-burst and impact-particle artwork through replay seeks. The reveal root holds its last frame while the electricity child advances independently; the same reveal clock drives the three-piece native grass burst. Pickup/drop audio and grass bursts now follow successful home handling actions on the home render clock. Camera shake still needs native integration. Targeted arc geometry, ballistic projection/bounce, timeline scaling, grass depth/collision and variant/audio selection remain documented local emitter interpretations. Captured data does not establish the native executable's reveal handoff, world registration, particle/audio row selection, ruined-frame choice or instantaneous damage behavior. No later campaign village becomes playable from Tesla support alone: Invaders still needs Bomb Tower 3.
