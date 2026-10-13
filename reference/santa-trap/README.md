# Native Santa Trap and spell presentation

Source: Supercell's public client **18.400.21**, fingerprint `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`. `native.json` preserves source rows, scene graph, export identities and SHA-256 pins. `runtime.json` contains compact rendering and numeric data. Original artwork and audio belong to Supercell; raw downloads stay under ignored `output/native-campaign-source/`.

The source assets now power the [Santa Trap combat integration](../../docs/SANTA-TRAP.md) in Goblin Picnic. Engine timing and particle interpretations remain explicitly documented; the full game is not production complete.

## Source facts

- [traps.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/traps.csv): `SantaTrap`, GlobalID `12000007`, level 1, passable 1×1 footprint, ground trigger only, `TriggerRadius=150`, `ActionFrame=44`, zero direct damage/radius. It calls `Spell=Santas Surprise`.
- [spells.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/spells.csv): called record GlobalID `26000006`. Level 1 has `Damage=180`, `Radius=150`, `RandomRadius=100`, five hits, 100ms hit spacing, zero deployment time, 4500ms charging time and 6000ms hit time. All 13 level rows are preserved. Separate legacy `xmas` (`26000004`) has different values and remains distinct.
- [effects.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/effects.csv): gift debris, red smoke, Santa sound after 2500ms, gift drops and explosion effects. All referenced effect and particle rows remain intact.
- [particle_emitters.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/csv/particle_emitters.csv): `xmas_anim` uses `xmas_spell`, 10,000ms life, `StartZ=600`, `ScaleTimeline=TRUE`. Falling gifts use `StartZ=800`, `Gravity=800`, 1400ms life. These fields are preserved without claiming their engine-unit/timeline interpretation is established.

Blank continuation fields inherit within each named record. Trap action frames, spell charging/hit times and effect clocks stay independent. Native trap-to-spell level selection, allegiance, cast timing, hit placement, RNG and `ScaleTimeline` semantics still require validation.

The [Goblin Picnic walkthrough](https://clash-wiki.com/tactics/single-player-walkthrough/38-goblin-picnic/) describes this hidden effect behind the P.E.K.K.A statue. The pinned layout places both at native `(34,27)`. A [2013 player capture](https://gaming.stackexchange.com/questions/144774/what-does-the-santa-strike-do-in-clash-of-clans) shows the present opening, smoke, sleigh and bombardment, but contains conflicting damage claims. It corroborates presentation, not current numerical behavior or exact timing.

## Reconstructed assets

| Group                        | Timeline frames | Unique atlas cells | Cell size |
| ---------------------------- | --------------: | -----------------: | --------- |
| Trap setup, unarmed, trigger |              46 |                 32 | 194×234   |
| Three sleigh components      |              90 |                 90 | 280×272   |
| Moving shadow                |             320 |                 20 | 378×312   |
| Three gift variants          |            1050 |                 28 | 122×128   |
| Gift shadow, smoke, debris   |             182 |                 57 | 108×100   |

Clips use 24 fps. The trap trigger has 44 frames: `Init` at frame 0, `Ignite` at frame 19. Setup, open-box preview and trigger share registration; the source spelling `bomp_trap_xmas` is retained.

The 320-frame `xmas_spell` graph stays separate from its three 30-frame components: flying hogs, Santa with presents, and Santa after release. Santa's component changes at frame 120. Frames 111–117 include shear as he tips the sack. Runtime tuples retain the atlas frame, six affine values and alpha; position/rotation alone would lose this detail. The game now renders these quads with Phaser 4.2.1's `Mesh2D`; [combat, presentation and fidelity limits](../../docs/SANTA-TRAP.md) are documented separately.

Component separation reduced the sleigh from about 13 MB to 2.8 MB while retaining native placements, colors and nested phases. Recursive comparison verifies **2040 draw commands across all 320 root frames**. Five atlas pages stay within 4096×4096, rasterized at two output pixels per native unit with polygon cutouts and premultiplied bilinear sampling. GPU poses are compared against an independent Canvas compositor; exact native subclip clocks and particle simulation remain unverified.

Eleven assets total **4,004,922 bytes**: five atlas PNGs, two registered previews and four unchanged Ogg files. Original volume/pitch fields remain in the effect rows. Large source evidence is separated from compact runtime data. The source character poses and gift colors were visually reviewed.

## Verification

Use the isolated environment from [the Pumpkin reference](../pumpkin-bomb/README.md):

```sh
output/native-art-venv/bin/python scripts/native_art/test_sc6.py
output/native-art-venv/bin/python scripts/native_art/test_atlas.py
output/native-art-venv/bin/python scripts/import-native-santa.py --check
```

Omit `--check` to regenerate. Checks cover source hashes, decoded pixels, sound bytes, both references and the exact shipped file set. Independent atlas tests cover fractional travel, relative movement, deduplication, nested frame rate and reinsertion. Pumpkin and Skeleton imports still reproduce unchanged metadata/pixels.

`tests/native-santa-reference.test.ts` covers identity, independent timing facts, every unique frame, alpha margins, compact shear geometry, preview registration and sound hashes. `tests/browser/native-santa-assets.spec.ts` checks browser image/audio decoding and renders loaded, tipping and empty poses. These validate the asset pipeline. Separate model, renderer, audio, browser and production tests cover the new Goblin Picnic integration; see [the implementation record](../../docs/SANTA-TRAP.md).
