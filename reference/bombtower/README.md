# Native Bomb Tower presentation reference

Pinned client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, from the [original public client fingerprint](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/fingerprint.json). `native.json` records SHA-256 checksums for 22 inputs and verifies their SHA-1 membership in that pinned fingerprint.

The live game consumes these native bodies, rooftop defender clips, bombs, shadows, scaffolds, rubble, all referenced particles and six sounds. Combat, save validation and replay now support all thirteen source levels. Home purchases/upgrades retain their TH8 ceiling of level 2. Invaders (village 51) now uses its original level-3 tower; later campaign guards remain active.

## Preserved content

- `native.json`: original sparse building, projectile, effect, emitter and defender animation records; original SC6 graphs; texture sampling footprints and sound hashes.
- `body.json`: packed, unscaled runtime graph for all 13 bodies, separate foundation, construction/upgrade scaffolds, rubble, three projectiles, four death bombs and projectile shadow. It retains 25 exports, 30 clips and 39 shapes.
- `defender.json`: packed runtime graph for three defender families, each with three native directional idle and attack exports: 18 exports, 23 clips and 124 shapes. Named `ability_on` controls and additive container boundaries are retained. Idle clips have 101 frames and attacks have 21, both at 24 fps.
- `combat.json`: all 13 source level records with HP, DPS, death damage, costs, destination timers, projectile/defender/effect selection and common range/timing values. Both presentation variant selection and numerical gameplay use these source records through `bomb-tower-stats.ts`.
- `effects.json`: all 13 referenced effects (including spawned effects), 25 emitters and six original sounds.
- `particle_art.json`: all 39 non-charge particle exports, 44 clips and 57 shapes, including smoke, debris, fire, force/range rings, ground effects and the crater. The four configured death-charge exports remain in the body graph.
- `public/assets/buildings/bombtower-native`: eight losslessly packed texture crops, thirteen independently rasterized 360×420 source portraits and six unchanged original Ogg files. Source polygon geometry and texture sampling texels are preserved without repainting or resizing.

The animation CSV uses separate named tables with different headers. Its three `BomberTower_lvl*` tables specify `HasDirections=TRUE`, attack `ActionFrame=11`, `StopToLast=TRUE` and an idle scale of 108. The importer parses each table's own header instead of applying the file's first row as a global schema. Original-frame inspection establishes right-facing source views. Live presentation now mirrors them for targets to the left, correcting the initial reversed mirror rule. Exact native direction boundaries, scale inheritance and the engine's action-frame timing are not yet verified.

Level 3 changes HP to 750, DPS to 32 and death damage to 220. It also switches to `Bomb Tower Ammo2`, `BomberTower_lvl2`, `Bomb Tower Hit2` and `Bomb Tower Destroyed2`. Its source cost is 1,300,000 gold, timer 86,400 seconds and Town Hall requirement 9. Levels 1–2 keep the existing TH8 home purchase ceiling. All three projectiles specify speed 800, start height 200, start offset 10, ballistic travel, rotation and no tracking or bouncing. These source values do not prove the native executable's trajectory or damage timing.

## Reproduction

Using the dependencies in `scripts/native_art/requirements.txt`:

```sh
python scripts/import-native-bomb-tower.py --check
python scripts/native-bomb-tower-gpu-fixtures.py --check
python scripts/native-bomb-tower-gpu-fixtures.py --particles-only --check
```

The first check recreates every output pixel, original sound byte, remapped UV and reference field from checksum-pinned inputs. The second creates 45 independent source-texture witnesses: every body/weapon export, all 18 defender direction clips and two extra level-3 defender attack phases. It reuses the independent CPU compositor used for Tesla; it does not derive expected pixels from the TypeScript player or packed textures. Defender witnesses explicitly hide `ability_on`. The third command reproduces a separate 39-case particle sheet from full original textures. Tiny debris1/debris2 legitimately cover only 62/64 pixels at the declared witness scale; they retain the same per-pixel error criteria as all other exports.

`tests/native-bomb-tower-reference.test.ts` checks source transitions, per-table animation columns, unchanged geometry, UV remapping, every packed texture region and exact asset membership. `tests/browser/native-bomb-tower-mesh.spec.ts` compares original-source witnesses through a single-sample camera framebuffer, matching the CPU reference's pixel-center sampling. Forced single-texture batching and context restoration separately exercise the normal multisampled game canvas. Its polygon-edge antialiasing differs from a pixel-center CPU raster, especially around the small projectile fuses. Witness scale and placement are explicit diagnostic transforms, not a claim about in-village registration.

`tests/browser/native-bomb-tower-live.spec.ts` additionally compares all 13 complete live assemblies to the independently rendered portraits at the source sampling density. Body scale 1.2 and ground anchor `(0, 80)` match the live portrait geometry; defender scale 108% places its feet on source roof `(0, 0)`. Ability overlays and additive fuse glow are omitted from background-independent portraits. Live fuse glow uses the original isolated additive group.

[The gameplay presentation notes](../../docs/BOMB-TOWER.md) document local direction/mirror selection, action-frame-11 alignment to recorded launch timestamps, the unchanged ballistic curve, separate death-bomb ground registration and reduced motion. These choices are now implemented and tested locally, but native executable world projection, direction mapping, animation handoff/action-frame semantics and complete particle-engine equivalence remain unverified. Original hit/collapse/explosion particles, projectile trails, pickup/drop effects, all six native samples and replay-clock explosion shake are integrated. Explicit repeated/spawned emitter and sound rows are preserved. The documented damping, single rebound, fade overlap, ground anchors, camera strength conversion and duplicate sound/impulse combination are local interpretations. Source pixel preservation is separate from native executable equivalence.
