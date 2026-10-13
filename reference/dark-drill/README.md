# Original Dark Elixir Drill source definitions

Captured alongside Inferno Towers by `scripts/import-native-midnight-oil.py` from pinned client 18.400.21, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`. All source files have SHA-256 pins and fingerprint SHA-1 membership checks. `native.json` retains 11 raw base-level rows, explicitly inherited base levels, three separate raw mini-level records, three original effect records and their three referenced emitters. `catalog.json` preserves HP, size, Town Hall/build requirements, original art references and production/capacity units.

Production remains explicitly `ResourcePer100Hours`: level 1 produces 2,000 per 100 hours and holds 160, while level 11 produces 20,000 per 100 hours and holds 4,600. Mini-level values are not folded into base levels or interpreted as cumulative bonuses. Original art and live production/loot integration remain pending. Midnight Oil contains one level-1 Drill; its complete implementation, Inferno Towers and the level-15 Archer Tower tier are required before campaign access expands.

Run `PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-midnight-oil.py --check` to reconstruct the captured records. Tests cross-check all base HP values against the existing campaign catalogue and retain the village's unresolved-family gate.

The pinned scene file also resolves every building and particle export. `artInventory` records original export IDs, reachable clip/shape counts and required source texture files and dimensions. Texture payload decoding and independent pixel witnesses remain the next asset step.

The Drill inventory resolves 39 building/particle exports, 46 clips and 97 shapes across source textures 8, 25, 39 and 41. These reachable clips use normal blend mode 0. The inventory validates references only; it is not a substitute for decoding the source texture payloads and comparing rendered pixels.


## Original artwork capture

`scripts/import-native-dark-drill-art.py` now captures every inventoried export and reachable display object into `art-runtime.json` and preserves the uncropped source graph in `art-source.json`. The graph contains 39 exports, 46 clips, 97 shapes and 5,479 clip frames, with normal blend mode only. Four PNG texture regions retain the exact decoded source texels and remapped UVs. The source-definition SHA-256 is bound into the metadata.

Texture 41 is pinned to SHA-256 `b3382bdda1665f62f476dca4afc8896cd1251d53f2c0b533f2fa2c09dfa94260`; all six source inputs also verify membership against the original fingerprint SHA-1 records. `PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-dark-drill-art.py --check` reconstructs and compares the complete graph documents and decoded texture pixels.

The reconstruction check and three source tests pass, including every tier's art references, source geometry preservation and sampling all 5,479 clip frames with finite transforms. A temporary CPU source-rendered contact sheet of all 39 export frame-zero poses was visually reviewed. Production build passes. Independent frame-by-frame browser pixel qualification, native state composition, UI portraits and live production/loot integration remain pending. These captures do not expand campaign access or establish native executable playback parity.


## Animation-state evidence

All eleven `darkelixir_pump_lvl*` body clips have 450 frames at 24 fps, with source labels at frame 0 (`idle`), 51 (`start_drill`), 70 (`lower_drill`), 129 (`DRILL`), 279 (`rise_drill`) and 359 (`idle2`). Each contains a named `resource` child: clip 18598 for levels 1–4 and 18578 for levels 5–11. Both resource clips have 100 frames and no labels. These names and frame counts are retained evidence; mapping resource frames to stored amounts and choosing idle/working loop semantics still require integration and verification. The separate base export names its `base` and `shadow` children.

Both resource timelines resolve to four distinct source display lists: frames 0–8, 9–24, 25–49 and 50–99. A separate CPU rendering of frames 0, 25, 50, 75 and 99 for both clips was reviewed and shows the reservoir filling, with the last three samples sharing the same full display. The artwork therefore should not be treated as a continuously animated 100-state liquid surface. The gameplay amount-to-frame conversion remains unverified.


## Original UI portraits

`scripts/native-dark-drill-portraits.py` renders each of the eleven original body exports at source frame zero together with its separate base. It preserves native scale, adds two pixels of crop padding, converts the independently composed premultiplied pixels to straight-alpha RGBA and records source-coordinate bounds, normalized origins and RGBA hashes in `portraits.json`. The metadata binds the exact captured art-source document. These are static UI assets; they do not replace the retained animated world geometry.

The `--check` reconstruction reproduces every PNG pixel and registration field. All eleven portraits were visually reviewed together, including tier-specific bases, metalwork and machinery. Production build passes. Menu wiring and live building integration remain subsequent work, and the full animation browser-pixel comparison is still pending.


## Menu portrait integration

The shared UI asset lookup now resolves each Drill level to its original portrait, rejecting unsupported portrait tiers instead of substituting a generic image. Context and building-info menus consume this lookup. The scene explicitly retains its existing Drill world texture until the animated native presentation is integrated; the shared preload path would otherwise have replaced the world sprite with a UI thumbnail.

Chromium and WebKit each pass desktop (1440 px) and phone (390 px) checks for all eleven portrait paths, successful image decoding, context selection and info-dialog visibility. The phone level-3 dialog was visually reviewed after its opening animation. Production build passes. Existing production, capacity, HP and progression values shown beside these images still await source-backed integration; this change does not claim their authenticity or expand campaign access.


## Source production and reservoir capacity

`dark-drill-production.ts` converts the captured `ResourcePer100Hours` to per-hour production and exposes the original reservoir capacities for all eleven levels. Home ticks and the building-info table now use this source: level 1 produces 20/hour and holds 160, while level 11 produces 200/hour and holds 4,600. Upgrade completion continues to produce only for the elapsed interval after completion, at the new tier's rate.

Already-earned amounts above the newly applied capacity are preserved through save restoration and remain collectible; new production resumes once collection creates space. This is a local migration policy, not native overflow behavior. The shared home tick's existing eight-hour offline cap remains, and HP, build cost/time and progression still need source-backed integration. Battle/replay combat behavior is unchanged by this home-production update.

All 27 model/save/production tests pass, including one-hour production, every tier's cap, post-upgrade production and legacy overflow restoration. Chromium and WebKit each pass desktop and phone menu checks for all eleven source rates and capacities. The updated phone dialog was visually reviewed and production build passes.


## Original construction prices and deadlines

`dark-drill-stats.ts` now exposes validated original base-level records. Initial placement uses the source 180,000 Elixir and four-hour timer; upgrades resolve the destination level's exact source price and duration, including all eleven captured tiers. Production shares this validated lookup. Existing TH1–8 access ceilings remain in force, and HP and native world presentation are still pending.

All 29 construction/production/model/save tests pass. Tests verify the complete cost/time tables and actual placement, a saved construction deadline, exact completion, the level-2 six-hour upgrade, and no duplicate charge. Chromium and WebKit each pass desktop and phone info-menu checks, including the source prices for currently available upgrades. Production build passes. Existing in-progress saved deadlines are retained rather than retroactively rescheduled.


## Full elapsed offline Drill production

Drills now use the full nonnegative elapsed home interval instead of the shared eight-hour production cap. Their source reservoir capacity bounds the result. Upgrade/construction time is excluded before production starts, and preserved legacy overflow remains unchanged. Other producers keep their existing timing behavior.

All 31 focused construction/production/model/save tests pass. A level-3 Drill updated once after eleven hours and one updated hourly both contain 495; a longer interval stops at the original 540 capacity. An upgrade completing three hours into a twelve-hour offline interval produces only for the remaining nine hours. Production build passes. This implements continuous source-rate accumulation under the existing home clock; native clock tamper handling and exact native resource quantization remain unverified.


## Native state composition layer

`dark-drill-art.ts` composes the original base, body, construction, upgrade scaffold and ruined exports for all eleven tiers. Working samples the complete body timeline; idle and upgrading hold its frame-zero idle pose. The named reservoir accepts an explicit integer source frame 0–99 independently of the body clock. No gameplay amount-to-frame mapping is embedded here. Registration is supplied explicitly by the caller. These state choices are local interpretations, not native executable state-machine proof.

Three tests cover all 55 tier/state combinations, finite geometry, working motion, stationary inactive states, distinct reservoir artwork, identical full reservoir frames, explicit registration and invalid-input rejection. Chromium and WebKit each render a 55-case state gallery with zero GL errors and adequate framebuffer height. The WebKit gallery was visually reviewed. Production build passes. This pose layer is not yet connected to live village buildings, and full independent animation pixel qualification is still running.


## Live native Drill meshes and bounds

`DarkDrillPresentation` now preloads and renders the retained graph for visible village/battle Drills, reuses per-building views and destroys removed views. The legacy world thumbnail is hidden. Empty/nonfull reservoirs use working poses; full reservoirs hold idle, construction/upgrades use their source layers, and destroyed buildings use the original ruin. Reduced motion holds source time at zero. The reservoir frame is locally interpreted as floor(stored/capacity × 100), clamped to 0–99, including preserved legacy overflow. Native executable storage-frame and state-loop semantics remain unverified.

World registration uses the existing three-tile convention (1.2 scale, −96 vertical offset). Selection and status geometry traverse the exact native poses. Intact height metadata and collection-bubble placement use original bounds; selection remains rectangular, not alpha-pixel picking. Registration is a local world interpretation rather than native executable alignment proof.

Ten focused art/production/construction tests pass. Chromium and WebKit each pass 55 live tier/state cases covering native view presence, hidden legacy sprites, inside selection, outside rejection, eleven simultaneous tiers, view retirement and zero GL errors. The WebKit village screenshot was visually reviewed. Production build passes. Full independent animation pixel qualification is still running, and this does not expand campaign access or finish source HP integration.


## Complete retained-frame browser pixel qualification

`scripts/native-dark-drill-art-fixtures.py` independently samples the uncropped original graph and original decoded textures through the CPU source compositor. It produces 5,518 cases: frame zero of all 39 exports plus all 5,479 frames of the 46 retained clips. The 35 source sheets have explicit case RGBA hashes and bounded dimensions (at most 2,400 × 6,000). The browser test verifies the actual framebuffer covers every compared pixel. Run the producer with `--check` to reconstruct and compare all reference pixels and metadata; generation is intentionally exhaustive and reports page progress.

Chromium and WebKit each passed all 35 pages / 5,518 cases. Worst per-case mean channel error was 0.6632653061 in Chromium and 0.8520408163 in WebKit. Maximum individual channel error was 146 in both; maximum per-case fraction of pixels differing by more than 16 was 0.0006102936 / 0.0006106870 respectively. Existing mean/fraction thresholds were not relaxed. Texture-batch changes, graphics-context restoration changes and GL errors were zero throughout. Seven source/art tests also pass and verify exhaustive export/frame coverage.

The largest inspected discrepancy (clip 18582, frame 313) affects seven pixels along one horizontal row. Its original strip vertices 0 and 2 lie at y=111.49975776672363 in the reference cell, immediately above the pixel-center boundary. Enlarged source/GPU crops and the source vertices were inspected; this is consistent with CPU/GPU subpixel edge rasterization differences. No source geometry was shifted to fit the reference. These results are not pixel identity or native executable playback proof. They cover the retained individual clip frames and frame-zero exports, not every combination of nested phases, reservoir controls and live world attachment.


## Original health and legacy snapshot preservation

New Drill buildings and the info table now use the eleven original HP values (800 through 1,600). The existing audited-home migration also includes Drills: it preserves the current damage fraction while replacing prototype max HP. A half-damaged level-3 building therefore becomes 460/920 instead of 675/1,350. New practice battles start at the migrated source maximum. Recorded battle initial states continue to supply their own HP unchanged; no combat-step algorithm or replay version changes in this update.

Tests cover every source HP tier, save migration, new practice health and opening recorded 1,350-HP Drill snapshots under every compatible replay version 34–39. The full unit run passed 1,456 tests and found one outdated hero-production test still expecting the earlier prototype rate; its production/collection/upgrade expectations were corrected to the already-integrated source rates. The focused hero/health recheck passed all 15 tests. Chromium and WebKit each pass desktop/phone info checks for all eleven source HP values, and production build passes. Frozen historical replay fixtures were not changed.


## Original sound capture and building handling

`scripts/import-native-dark-drill-sounds.py` preserves three original Ogg files (25,653 bytes), verifies pinned SHA-256 and original fingerprint SHA-1 membership, and binds the source effect definitions. Pickup uses `dark_drill_pickup_02.ogg`; placement uses `dark_drill_place_07.ogg`. Both retain source volume 70%, pitch 100% and zero delay. The destruction sample is captured but not yet connected to a destruction event.

Drill movement, successful placement/new construction and cancellation now use the shared native-handling event route. Dated, uniquely identified cues pass through the existing sample-audio lifecycle; rejected moves do not emit placement sound. Cancellation, scene changes and cleanup remove pending events. Audio uses the elapsed home clock independently of reduced-motion artwork time. Event history is locally bounded to 16 entries and five seconds; native voice allocation and output loudness remain unverified.

The importer reconstruction and two handling/model tests pass. Chromium and WebKit each decode all three samples and pass reduced-motion, cancel and cleanup cue checks. Production build passes. Original handling particles and destruction presentation remain subsequent work.


## Original handling grass particles

`dark-drill-effects.ts` resolves pickup/placement effects to their original `Grass` emitter and four retained export variants. It preserves the source three-particle count, 200-ms emission window, 200–600-ms lifetimes, explicit normal blending and original scale/fade/motion parameters. Seeds and view keys derive from immutable handling event identity and particle index, so retiring another event does not change surviving particles.

The live presentation reuses native particle views and removes them on expiry, cancellation, reduced motion or scene cleanup. Reduced motion suppresses visual bursts while preserving the independent audio clock. Four focused effect/handling tests pass, including both actions, future/expired events, serialization, event retirement and unique particles. Chromium and WebKit pass live three-particle view creation, cancellation cleanup and reduced-motion suppression with audio cues retained. Production build passes. Motion, damping, source emission spacing and world projection use the existing local particle interpretation; native executable particle behavior remains unverified.


## Replay-safe destruction history

Replay version 40 initializes an optional Drill destruction map only when the initial battle contains a Drill. The first fatal hit records the building identity, damage timestamp, tile center and tier; repeated damage cannot overwrite that event. This is the foundation for reconstructing original destruction particles and sound during playback and seeking. Those effects are not connected in this change.

Versions 34–39 retain the absence of this field, including after a Drill dies. Initial recorded building HP remains authoritative. Tests cover nonfatal/fatal/repeated damage, serialization, every compatible older version and battles without Drills. All 1,463 tests across 154 files pass, including historical replay checks, and production build passes. Frozen historical fixtures were not modified.


## Original destruction presentation

Version-40 destruction history now drives the original Building Destroyed, Smoke and Grass emitters (30, 10 and 3 particles respectively). Native views reconstruct from immutable building identity and the recorded fatal-hit timestamp, retire after their source lifetimes, and disappear under reduced motion or scene cleanup. The original destruction Ogg uses source volume 80%, zero delay and deterministic pitch within 85–95%. Cues join the existing shared audio lifecycle. Version-40 Drill destruction suppresses the duplicate generic effect; older replay events retain their previous route.

Focused tests cover source particle counts, unique identities, serialized reconstruction, future/expired events, reduced motion, cue parameters and the old/new fatal-effect routes. Chromium and WebKit each pass sample decoding, handling, destruction view reconstruction after a backward seek, expiry and cleanup checks with zero GL errors. A WebKit world screenshot was visually reviewed after waiting for the loading overlay to leave. Production build and the complete unit suite pass. These checks do not prove native executable motion or audio mixing parity: particle projection, damping, bounce and emission spacing still use the shared local interpretation.


## Original placement and movement preview

The Drill placement ghost now renders the original native layers rather than the prototype thumbnail. Existing buildings retain their current tier, reservoir and construction/upgrade state in a stationary source-frame preview; new placement uses level one. Valid placement retains original colors, while rejected placement applies the existing red cue through native color multipliers. Preview alpha (72%) and foreground depth retain local UI conventions, not verified native executable values. Cancellation, switching building kinds and scene cleanup destroy the retained preview view.

Chromium and WebKit each pass eleven-tier preview creation, valid/invalid tile checks, hidden legacy thumbnail, new level-one preview, cancellation and switching back to a non-Drill ghost, with zero GL errors. The WebKit preview screenshot was visually reviewed. Eight focused art/handling/effect tests and production build pass. The fixture exposes all captured tiers for rendering qualification; home progression remains capped at level three.


## Campaign identity and captured tiers

The campaign adapter now resolves original building ID 1000023 to Dark Elixir Drill. Enemy placement supports all eleven captured base tiers independently of the level-three home progression cap. Each placement retains its original coordinates, tier and campaign-source HP. Replay version 40 accepts those tiers; older versions retain their earlier validation limit. Level twelve remains rejected.

Tests exercise every captured tier through a temporary campaign fixture, battle creation, recording, serialized save validation and replay opening; they also reject an unsupported tier and confirm the home cap. Midnight Oil's resolved Drill blocker disappears, but its missing Inferno Tower and level-15 Archer Tower support still gates the map. Existing playable campaign content is unchanged. This adapter does not interpret mini-level bonuses or unlock incomplete villages.

Validation: the full suite passed 1,465 tests and identified one stale source-capture assertion still listing the now-supported Drill blocker. That assertion was updated; the four-test source/campaign recheck passes. Production build passes. No frozen historical replay fixtures were modified.
