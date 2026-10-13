# Native X-Bow source reconstruction

The home-village X-Bow artwork and sound sources are preserved from Supercell's public client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`. `native.json` contains the original building, projectile, effect and particle rows, source scene graph and SHA-256 pins. `runtime.json` retains the scene graph with texture coordinates remapped to the shipped PNGs. `combat.json` contains the inherited numeric progression and projectile values without importing the large artwork graph. Original artwork and audio belong to Supercell.

The [combat and live-scene integration](../../docs/XBOW-COMBAT.md) now includes both targeting modes, finite ammunition, tracking bolts, native attack/hit/empty audio, UI previews and replay persistence. Its [native GPU renderer](../../docs/NATIVE-MESH-RENDERING.md) is validated against independent source fixtures. Home construction remains gated at the source Town Hall 9 requirement. The campaign still supports its first 50 layouts. Invaders and subsequent stages also require Dark Elixir rewards and alternate defense modes; importing their weapon art alone does not make them supported.

## Source facts

- [buildings.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/buildings.csv): `X-Bow`, GlobalID `1000021`, 13 levels, 3×3 placement footprint, `AttackSpeed=128`, 1,500 ammunition, ground range `1400`, alternate range `1150`. Ground mode targets ground only; alternate mode targets ground and air. The Builder Base X-Bow is a different record and is not substituted. Blank continuation fields inherit within this named record.
- Source `DPS` is 60, 70, 80, 85, 95, 110, 130, 155, 185, 205, 225, 235 and 245. Hitpoints are 1,500 through 5,000. Per-shot rounding, target acquisition, ammo consumption, attack scheduling and recoil remain engine behaviors to validate separately.
- [projectiles.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/projectiles.csv): seven projectile records, source speeds 2300/2400/2500, `StartHeight=97`, non-ballistic, `UseRotate=TRUE`, random character hit position, tracking enabled, shared `bolt_projectile_shadow`. The combat integration uses speeds of 23/24/25 tiles per second. Its world projection is a documented visual calibration; exact native-engine projection remains unverified.
- [effects.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/effects.csv) and [particle_emitters.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/csv/particle_emitters.csv): the selected attack, hit, loading, empty, targeting, pickup and placement records are preserved with their particle references, volume and pitch. Seven Ogg files are copied unchanged. Particle simulation is not reconstructed here.

Supercell's [August 2021 balance note](https://supercell.com/en/games/clashofclans/blog/release-notes/balance-changes-august21/) corroborates the 11.5-tile ground-and-air range, including the original UI's rounded display. The pinned client data, rather than a rounded screenshot value, supplies the source range.

## Geometry and controls

The 63 exports comprise 52 building variants (13 levels × two modes × armed/upgrade), three foundations, seven bolts and their shadow. Their reachable graph has **1,038 shapes, 99 clips and 28 shared directional controls**. Each aiming or ammunition control has 360 source frames with 36 distinct views, held for ten frames each. The named `turret` and `ammo` instances remain independent; they must be selected by direction instead of playing as spinning idle animations. Upgrade exports omit ammunition. The upgrade export is not assumed to be the native empty-ammo state.

All polygon strips, vertex coordinates, six affine transform values, color multiplication/addition, frame labels, child-slot identity and layer order remain intact. Shared native objects stay shared. Empty 100-frame clip `26527` remains empty rather than receiving invented art. Decorative spark clips retain their own timing and additive blend flags. Projectile levels 3–7 also contain additive layers and color transforms.

The format reference is [SupercellFlash's MovieClip definition](https://github.com/sc-workshop/SupercellFlash/blob/41e894d5a20cc17e47fe32db3106c4c1bec60a3e/supercell-flash/source/flash/display_object/MovieClip.h), pinned at `41e894d`. Its normal and additive modes are 0 and 8. The existing normal-alpha atlas flattener still rejects other blends. The diagnostic graph compositor accepts additive leaf shapes and empty clips; an additive group with nonempty children requires isolated compositing and fails explicitly.

## Lossless texture handling

The live renderer textures copy source texels without resizing or rasterizing new directional poses. Every source UV rectangle retains its bilinear sampling neighbours. Sparse regions are packed with an extruded one-pixel border, preserving the source texture's clamp behavior at its outer edges. UV remapping reverses to within `1e-10` of the original 16-bit coordinates. Every copied region and complete decoded output has an RGBA SHA-256 digest.

| Source texture | Shipped dimensions | Treatment |
| --- | ---: | --- |
| `buildings_8.sctx` | 59×85 | Cropped foundation region |
| `buildings_39.sctx` | 64×242 | 13 packed projectile/shadow regions |
| `buildings_70.sctx` | 2048×3192 | Native dense layout; unused sampling regions cleared |

The projectile texture occupies 15,488 pixels instead of the original 3,083,544. The 36 shipped assets total **7,049,395 bytes**: three source texture PNGs, seven original Oggs and 26 UI preview PNGs. No source containers, unrelated CSV data or diagnostic contact sheets enter the production asset directory.

The 26 static UI previews cover every level and targeting mode at source direction 225. Each uses the same `[-100, -30, 100, 140]` bounds and a 2× raster density, so their position and relative size remain registered. Transparent PNG previews omit additive sparks, which require live composition against the actual background. The live scene graph retains those layers. The importer rejects clipped geometry and verifies every preview pixel.

## Reproduction and checks

Use the pinned Python environment described in [the Pumpkin reference](../pumpkin-bomb/README.md):

```sh
output/native-art-venv/bin/python scripts/native_art/test_sc6.py
output/native-art-venv/bin/python scripts/native_art/test_atlas.py
output/native-art-venv/bin/python scripts/native_art/test_scene_graph.py
output/native-art-venv/bin/python scripts/import-native-xbow.py --check
output/native-art-venv/bin/python scripts/render-native-xbow.py --verify
npx vitest run tests/native-xbow-reference.test.ts --maxWorkers=1
npx playwright test tests/browser/native-xbow-assets.spec.ts
```

Omit `--check` to regenerate the assets and references. Raw downloads remain in ignored `output/native-campaign-source/`; unpinned requests and checksum mismatches fail before parsing. The importer checks every clip frame, including otherwise invisible empty timelines, and compares the exact shipped file set. The independent Python tests cover child identity, nested clocks, removal/reinsertion, shear, color transforms, additive restrictions, cycles, fractional sampling, transparent RGB and packed source-edge clamping.

The contact-sheet tool compares the original decoded textures with the shipped texture sampling. It rejects viewport clipping and writes five studies under `output/playtest/`: both modes across all levels, eight aiming frames per mode, projectile animation frames and the foundation/shadow exports. All **74 comparisons match exactly**, including the additive projectile layers. These are diagnostic source reconstructions against an opaque background; they are not captures of gameplay.

The 18 Python reader/atlas/scene tests and four X-Bow reference tests pass. Image and audio decoding passes in Chromium and WebKit at DPR 2. The integrated production build and both-engine smoke checks pass; Chromium reloads offline with all 250 manifest entries cached. The [combat integration record](../../docs/XBOW-COMBAT.md) details the current model, browser and release checks. The existing Pumpkin, Skeleton and Santa importers still reproduce unchanged metadata and pixels after the reader extension.

Exact native direction-to-world mapping, engine subclip clocks, recoil, ammunition transitions and particle projection still require validation and further reconstruction. GPU composition now has independent browser reference checks, with measured edge and color-rounding differences documented in the renderer record. Source facts and diagnostic playback are kept separate from the remaining native-engine fidelity claims.
