# Native Goblin campaign buildings

Client 18.400.21, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, from the public `game-assets.clashofclans.com` bundle. `native.json` retains original sparse Town Hall/Goblin Hut rows, graph, clip metadata, source hashes, texture crop maps and decoded pixel hashes. `levels.json` contains the eleven passive campaign Hall levels and the single Hut level. `runtime.json` preserves 14 shapes and seven clips in a compact graph.

All Town Hall levels used in the 90 campaign layouts are 1–11. Their `ExportNameNpc` inherits `goblin_townhall_lvl1`. Levels 9–11 have 4,600, 5,500 and 6,800 hitpoints. The next source level introduces `Weapon=Townhall12` and remains outside this passive implementation. Home Town Hall progression is separate. The Hut uses `goblin_hut_lvl1`, has 250 HP, and does not define DPS or housing capacity.

The Hall's flag is an original 24-frame, 24-fps child clip containing eight distinct states. The Hut is static. Two dedicated foundation exports (`goblin_townhall_base`, `goblin_hut_base`) retain their stone/dirt artwork and baked shadows. Their association by native export names and exact native world registration are not verified in a running client; the Hut's `ExportNameBase` also identifies its foundation directly.

Original input texture dimensions and fingerprint SHA-1 values:

| Source | Dimensions | Fingerprint SHA-1 |
| --- | --- | --- |
| `sc/buildings_8.sctx` | 444×448 | `92f93c6e63aa1147085b453c57743d4601630669` |
| `sc/buildings_37.sctx` | 448×474 | `a3d8ba47e3318061db818d53bea35b2178d9f9ff` |

Their SHA-256 pins are in `native.json`. Downloads use ordinary HTTPS certificate verification. Cropping copies all sampled texels and bilinear neighbours without repainting or resampling. The runtime ships two lossless textures (256×352 and 256×398) and four registered preview PNGs.

```sh
output/native-art-venv/bin/python scripts/import-native-goblin-buildings.py --check
```

Install the pinned Python dependencies from `scripts/native_art/requirements.txt`. The check verifies complete output membership, every decoded output pixel, original input hashes, reference JSON, and all 24 source frames against registered bounds. Native-clone world projection, flag playback rules, placement effects, destruction graphics and audio remain separate fidelity work.
