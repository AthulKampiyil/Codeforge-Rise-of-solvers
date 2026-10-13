# Native Pumpkin Bomb

`native.json` retains the complete nonempty `Halloweenbomb` trap row and the two visual exports from public client **18.400.21**. Source URLs and SHA-256 hashes are embedded in that file. The source artwork belongs to Supercell; it is extracted game artwork, not original generated art. Raw containers remain in ignored `output/native-campaign-source/`.

The shipping PNG contains 45 registered frames: the setup sprite followed by all 44 trigger frames at 24 fps. Native geometry, UV rotation, matrices, color transforms and alpha are reconstructed directly from `sc/buildings.sc` and its external ASTC texture `sc/buildings_66.sctx`. The root clip's labels are `Init` at frame 0 and `Ignite` at frame 19. SC6 string references are zero-based. All frame positions share the original coordinate system; frames are never separately trimmed, stretched or centered.

The atlas is sampled at two output pixels per native coordinate unit. Its 130×152 cells retain source texture detail that would be downsampled at one pixel per native unit; this is a new rasterization from the original UV regions, not enlargement of the first PNG. Runtime display size remains 97.5×114 world pixels at camera zoom 1.

## Reproduction

Use Python 3.10–3.12 in an isolated environment:

```sh
python3 -m venv output/native-art-venv
output/native-art-venv/bin/pip install -r scripts/native_art/requirements.txt
output/native-art-venv/bin/python scripts/native_art/test_sc6.py
output/native-art-venv/bin/python scripts/import-native-pumpkin.py --check
```

Omit `--check` to regenerate. Downloads use verified HTTPS and must match pinned hashes before parsing. Checks compare decoded RGBA pixels, individual frame hashes and metadata; PNG compression bytes are not a visual correctness criterion. The importer rejects unsupported reachable masks, blend modes, compressed timelines, overlapping polygon interiors, extra chunks, malformed pointers and unsupported texture formats. It only downloads explicitly pinned sources. It is a focused extractor, not a complete SC player. Its triangle-strip extension for Skeleton Traps preserves the established Pumpkin pixel digest.

## Interpretation boundaries

The trap row specifies 25 damage, 1.5-tile ground trigger, 3-tile damage radius, a passable one-tile footprint, and action frame 48. It contains no pushback or minimum housing field. Dividing the action frame by the trigger clip's 24 fps gives **2 seconds**; the clip itself contains only 44 frames. The native action-frame counter and interaction with the `Ignite` label have not been observed in a running client. The runtime uses the two-second inference and holds the final animation frame until the damage event. This remains an inference until verified.

Nested clips advance from their latest continuous placement and loop at their own frame rate. This produces the source's animated fuse sparks rather than freezing every nested clip at frame zero. Native subclip restart/loop semantics remain unverified. The CPU renderer uses premultiplied bilinear sampling at pixel centers. Native GPU sampling, color space and blend precision have not been compared pixel for pixel. Exporting these assets does not establish that the entire game is visually identical to the original.

The runtime registers the measured ground contact at native coordinate (-3, 26), with 1.5 world pixels per native pixel. This is a visual calibration to the current 64×32 isometric grid, not a recovered native camera transform. Reduced motion displays stable setup/ignited poses; damage timing is unchanged. Spent traps use the source setup export at the existing local spent-trap opacity.

Explosion particles, sound and spent-trap opacity still use the local effects system; this import reconstructs the setup and triggered building exports. The native effect names remain in the source record for a later effects pass.

## Format research

The focused reader was implemented from the public format schemas and loaders in [SupercellFlash](https://github.com/sc-workshop/SupercellFlash/tree/41e894d5a20cc17e47fe32db3106c4c1bec60a3e) and [SupercellTexture](https://github.com/sc-workshop/SupercellTexture/tree/ebd2b0e91f3114e40453c99d26d52cdb0d3cbf2c). The optimized matrix divisor is **1024**, as used by the C++ loader, despite the older schema comment saying 1000. The SCTX header includes a proxy texture and separate mip descriptors; decoding the final bytes by assumption is deliberately avoided. Flag value 12 means padding plus a flag the reference loader stores without changing decoding. The payload is aligned to 16 bytes and decoded as ASTC RGBA8 6×6.

Initial format exploration also used [sc5-parser](https://github.com/obus-globus/sc5-parser/tree/9108080256a0df6cd772d81afdbc26047d79d78d) with local SC6 adaptations. That diagnostic copy is not a build dependency. Its default nested-frame selection was unsuitable for exporting this animation. The committed reader, sampler and importer live in `scripts/native_art/` and `scripts/import-native-pumpkin.py`.
