# Complete official client asset archive and TH8–18 library

The full fingerprint of Supercell client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, is now available locally. This is a fixed source snapshot, not a claim to track future client updates. All **9,075 files / 2,030,883,678 bytes** match the official fingerprint's SHA-1 entries; the manifest also records their SHA-256 hashes. The fingerprint itself has the SHA-256 pin `ecb5b05d632831cd706e4e993158b63635445257ad254bec97c371b078e3044b`.

## Deliverables

| Location | Contents |
| --- | --- |
| `art/source/native-client-18.400.21/files/` | Every original client file: 2D scenes and textures, 3D models and animation clips, scenery, effects, sounds, music, fonts, UI, logic and supporting data. Includes all TH8–18 content and a superset of Builder Base, Capital and event assets. |
| `reference/full-client/manifest.json` | Complete file inventory, download base URL, byte counts and checksums. |
| `public/assets/catalog-native/` | **823 transparent PNGs**: 552 building/trap level portraits and 271 troop/hero/pet/spell/equipment icons. |
| `reference/full-client/catalog.json` | All 47 Home Village building families and eight permanent trap families, including registration, source bounds, source export references, frame selection and pixel hashes. |
| `reference/full-client/roster.json` | Every standalone icon declared by the five roster tables, plus the 152 helper records that declare no standalone icon. |
| `public/asset-catalog.html` | Searchable, responsive asset browser with TH8–18 filtering, highest-level selection and full progression comparison. |

Open `/asset-catalog.html` on the local dev server. Each card opens its transparent PNG. Building records include earlier levels because they are still relevant to TH8 villages and imported saves. At TH18, the latest-level view contains 55 building/trap families, including Monolith, Spell Tower, merged defenses, Firespitter, Revenge Tower, Super Wizard Tower, Giga Bomb and the level-18 Town Hall.

Roster icons comprise 146 troops, eight heroes, 18 pets, 38 spells and 61 equipment items. These include Builder Base and event content; they are not filtered by Town Hall. The full source archive also includes the animation assets associated with these records.

## Rebuild and verification

Use the project's existing native-art Python environment (`scripts/native_art/requirements.txt`). From the repository root:

```sh
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-full-client.py
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/native-full-catalog.py
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/native-roster-catalog.py
```

Pass `--check` to each command to verify existing output without replacing it. The archive importer resumes interrupted downloads, verifies bytes before accepting a file, and fails if any file is missing or mismatched. The portrait importers reconstruct the pixels, dimensions, anchors and complete metadata and compare them with the checked-in results. Source reads always verify original fingerprint membership.

For browser verification:

```sh
npm run dev
node scripts/asset-library-check.mjs
```

Set `ASSET_LIBRARY_URL` when using another port. The check covers Chromium and WebKit at desktop and phone sizes, decodes all 823 PNGs, checks image dimensions, TH filtering, all 18 Town Hall levels, hero selection, horizontal overflow and script errors. Screenshots and reports go to `output/`.

## Asset boundaries

Building PNGs compose the original declared base and body at source frame zero. Shared base exports resolve in the declared scene first, then the original shared-base/secondary-building libraries. Empty layout text fields remain nonpainting. Normal, multiply, screen and additive composition use the existing CPU source renderer. No AI generation, recoloring, invented higher-level silhouettes or replacement of original pixels is involved.

The runtime now loads original mesh/timeline packs for 32 additional building families (348 level records) and all 32 trainable troop families (305 level records). Each troop level retains declared walk, idle, attack and death roots, direction variants, native transforms, color changes and texture sampling. Building packs retain base, body, construction, upgrade, damaged and triggered references when declared by the source. Existing specialized native defense renderers remain in use.

TH9–18 progression tables, new normal/dark troops, research gates and resource capacities are connected to the village. Storage artwork follows resource fill. New recordings use version 44; compatible earlier recordings retain their historical validation boundaries. This is asset and progression coverage, not full live-game simulation parity: additional heroes, pets, equipment and spells have catalog artwork and original archived sources, while their corresponding gameplay systems remain separate work. New specialized defense and troop abilities are not all simulated by the generic combat paths. See [experience coverage](../../docs/EXPERIENCE-PARITY.md).

The 1.9 GiB original archive stays outside `public/` and is ignored by Git. The fingerprint, manifest, extraction scripts and browser-ready output are retained. A fresh checkout can reconstruct the archive with the pinned importer. Catalog images and native animation packs load on demand and are cached after use; they are excluded from the initial service-worker download.

### Reconstruct and verify native runtime packs

```sh
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-progression.py --check
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-village-art.py --check
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-troop-art.py --check
npm test -- --maxWorkers=2
GAME_URL=http://localhost:5191 node scripts/th18-playtest.mjs
```

Omit `--check` to rebuild. Both animation importers compare graph bytes and decoded texture pixels. Troop import supports external SCTX and embedded KTX ASTC 4×4/6×6 textures. The browser check loads every runtime building family at its TH18 ceiling, deploys every troop, waits for all 32 animation packs, and captures desktop/phone views in Chromium and WebKit.

Artwork and audio remain the property of Supercell. Acquisition uses the public official `game-assets.clashofclans.com` bundle. This fan project is not endorsed by Supercell. Existing project asset attribution and usage conditions continue to apply.

## Verified September 15, 2026

- Complete archive reconstruction: 9,075/9,075, zero missing/mismatched files.
- Building/trap PNG reconstruction: 552/552, zero unresolved exports.
- Roster PNG reconstruction: 271/271, zero unresolved declared icons.
- Chromium and WebKit, 1440×1050 and 390×844: 823/823 images decoded per run, no script errors or horizontal overflow. Desktop/phone library and full Hall progression screenshots visually reviewed.

- Native building reconstruction: 32 packs / 348 levels; every declared state and decoded texture matches.
- Native troop reconstruction: 32 packs / 305 levels; external and embedded texture formats verified.
- Automated suite: 180 files / 1,636 tests passed. Production build passed.
- Chromium and WebKit gameplay: 46 building kinds, all 32 troop packs loaded, high-level placement preview, desktop and phone captures; zero page or HTTP errors.
- Production service worker: fetched TH18 portrait and building/troop graphs online, then verified identical SHA-256 bytes with networking disabled.
