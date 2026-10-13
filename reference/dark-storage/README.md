# Native Dark Elixir Storage

Pinned public client 18.400.21, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, downloaded from `https://game-assets.clashofclans.com/`. Original SC6 polygon strips, affine transforms, vertex UVs, clip layers and source pixels are retained. No generated repaint is used for the placed storage.

- `native.json`: original sparse building rows, complete selected graph, source hashes, texture crop maps and decoded RGBA witnesses.
- `levels.json`: 13 inherited building levels, including native hitpoints, capacity, Town Hall requirement, Elixir cost and duration.
- `runtime.json`: 27 shapes and 15 clips, with UVs translated into one 1024×895 lossless packed texture.
- `public/assets/buildings/dark-storage-native`: one texture PNG and 13 registered full-storage previews, each 400×340.

The source `sc/buildings_42.sctx` is 1276×1974. Its SHA-1 `3ca0ded35c0ae3e08b5366a8695945ef47493b32` matches the pinned bundle fingerprint, and its SHA-256 is `b08ef6869de242d7e284cc89db27c6f0633346e59d122af7c12a4e5d1e49983d`. Other input SHA-256 values are in `native.json`. Downloads use normal HTTPS certificate verification.

Each root has one named `resource` child. Its 160 control frames contain nine distinct fill states: frame 0 is empty, 1–19 are the first liquid state, and 20-frame bands continue through the full state at 140–159. Levels 1–10 use child 18909; levels 11–13 use 18921, with foreground glass in their parent. The importer verifies every level at all 160 control frames fits the common source bounds `[-100,-40,100,130]` and uses normal blending.

Reproduce with the pinned Python dependencies in `scripts/native_art/requirements.txt`:

```sh
output/native-art-venv/bin/python scripts/import-native-dark-storage.py --check
```

This verifies original input hashes, complete output membership, every decoded PNG pixel and reference JSON contents. Source bundle decoding and graph capture use the shared `scripts/native_art` implementation.

Runtime projection uses a calibrated 1.2 display scale and source anchor `(0,80)`. Fill fraction is linearly mapped to frames 0–159 with positive fractions kept above frame 0; this is an interpretation of the exposed control, not a verified native-engine formula. Exact native world projection, fill thresholds, construction/upgrade presentation, glass-pit destruction, pickup/placement effects and audio remain unverified or unfinished. The imported rows retain their native export names for those future passes.
