# Native Skeleton Trap reference

`native.json` preserves all five original rows for `Skeleton Trap` (GlobalID `12000008`) from public client **18.400.21**, with the exact pinned source URL prefix and SHA-256 hashes. Source artwork belongs to Supercell; these are reconstructed native assets, not generated original artwork. Raw SC6/SCTX containers stay under ignored `output/native-campaign-source/`.

The three art tiers represent levels 1–2, levels 3–4 and level 5. Each includes ground setup, air setup, unarmed, ground trigger and air trigger exports. Setup and unarmed clips contain 35 identical frames each. Trigger clips contain 43 frames at 24 fps. Deduplication retains the complete timeline while reducing 191 frames per tier to 35 unique atlas cells for the first two tiers and 38 for the third. Every pose uses the same native origin within its tier. Two output pixels per native coordinate unit retain source texture detail; sprite size must be set independently by the scene.

The light wooden coffin changes to darker wood, reinforced bands and studs at level 3, and to its own exports again at level 5. Ground setup displays a skull, air setup a wing badge. The lid opens during the native trigger animation. The shared unarmed export has an open lid and cobwebs.

`spawned` preserves both levels of `Trap Skeleton` and `Trap Air Skeleton` from the pinned `logic/characters.csv`: 30 hitpoints and 25 DPS at level 1, 45 and 30 at level 2, sharing a 700ms attack interval, a 3 tiles/s ground and 2.2 tiles/s air speed, and a 0.4-tile ground reach. Only a level 5 coffin releases the level 2 skeleton.

Runtime presentation uses a measured ground registration of `(-2, 24)` native units and 1.5 world pixels per native unit. These are visual calibration choices. The full trigger clip plays on the battle clock, then the coffin is hidden after 43/24 seconds. Reduced motion uses setup until the first spawn and then the unarmed export. The [community reference](https://clashofclans.fandom.com/wiki/Skeleton_Trap?page=1) describes the coffin disappearing after deployment and scorch marks fading later; it does not establish the exact removal clock. The native final trigger frame still contains the open coffin, so disappearance at clip completion is an interpretation. Native particles, scorch marks and removal/fade timing remain unverified.

| Trap level | Skeletons | Spawned skeleton level |       Gold | Build/upgrade time |                                   Native TH requirement |
| ---------- | --------: | ---------------------: | ---------: | -----------------: | ------------------------------------------------------: |
| 1          |         2 |                      1 |      6,000 |            Instant | 1 in trap row; actual placement gated by townhall count |
| 2          |         3 |                      1 |    250,000 |            5 hours |                                                       8 |
| 3          |         4 |                      1 |    400,000 |            8 hours |                                                       9 |
| 4          |         5 |                      1 |  1,000,000 |           12 hours |                                                      10 |
| 5          |         5 |                      2 | 18,000,000 |             7 days |                                                      18 |

Shared fields inherit within the named record. Trigger radius is five tiles, first spawn occurs at 600ms, later spawns are separated by 150ms, and minimum trigger housing is one. Spawning uses the explicit delay fields; the separate action-frame value 37 is retained without replacing those delays. The native action-counter and clip playback conventions have not been observed in a running client.

Reproduce or verify using the same isolated Python environment as [the Pumpkin importer](../pumpkin-bomb/README.md):

```sh
output/native-art-venv/bin/python scripts/native_art/test_sc6.py
output/native-art-venv/bin/python scripts/import-native-skeleton-trap.py --check
output/native-art-venv/bin/python scripts/import-native-pumpkin.py --check
```

Omit `--check` to regenerate. The checks compare decoded RGBA pixels and reference metadata. Source download verification is shared in `scripts/native_art/bundle.py`. The format reader now samples native polygon triangle strips as well as affine quads, without filling polygon cutouts or double-blending shared edges. Format research and remaining CPU/GPU sampling and subclip interpretation limits are documented in [the Pumpkin reference](../pumpkin-bomb/README.md). The new polygon test independently checks a cutout and half-opacity shared edges.

Defending characters, sound, particles, collision/alert behavior, display scale and native GPU pixel matching remain separate fidelity work. This reference does not establish that the complete Skeleton Trap system is identical to the original client.
