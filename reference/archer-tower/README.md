# Original Archer Tower source foundation

Captured from public client 18.400.21, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, at [the original asset host](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/fingerprint.json).

`scripts/import-native-archer-tower-source.py` pins SHA-256 for the fingerprint, building, projectile, effect and emitter tables, and independently verifies each table's SHA-1 membership in that fingerprint. `--check` reconstructs the complete document and compares it byte for byte.

The capture preserves all 21 raw tier rows and inherited tier records, 10 referenced projectile definitions (including alternate variants), 7 effects with recursive spawned effects, and 11 particle emitters. Source fields and units remain strings, without inferred timing, projectile trajectories or alternate-mode arithmetic. Level 15 specifies 1,230 HP, 85 DPS, a 500-ms attack interval and range 1000 source units; alternate fields separately specify 200 DPS, 250 ms and range 800. The level-15 regular and alternate body exports and projectile names remain distinct.

Importer reconstruction and the focused source test pass. This is a definition capture, not an artwork or combat integration. Original scene graphs, textures, resident archers, projectiles, effects, timings and mode behavior still require implementation and qualification. Midnight Oil remains gated by Archer Tower level 15 and Inferno support. No runtime behavior or home progression changes in this commit.

## Current scope

Original artwork renders in the home village and placement previews for every captured tier, with rooftop residents and source construction, upgrade and ruin states. Independent building/effect, resident and projectile frame comparisons pass in Chromium and WebKit. These checks qualify the retained source graphics within explicit pixel thresholds; native executable playback, resident world attachment, battle timing, projectile flight, alternate-mode gameplay and later-tier campaign support remain separate work. The sections below record the implementation history and supersede their earlier pending statuses as each stage completes.

## Reachable artwork inventory

`scripts/native-archer-tower-inventory.py` resolves building, alternate, construction, ruin, projectile and particle export references against pinned original scene files, verifying fingerprint membership. Its `--check` mode reconstructs the inventory byte for byte. It records export IDs, reachable shape IDs, clip frame counts, frame labels, named children, blend modes and original texture identities/dimensions, and explicitly records masks and text fields.

The building/effect graph contains 80 exports, 84 clips, 102 shapes and 6,078 frames on building textures 8, 18, 25 and 39, using blend mode 0. The projectile graph contains four exports, six clips, eight shapes and 15 frames on character texture 7, using modes 0 and 8. Neither reachable graph includes masks or text fields. Reconstruction passes.

This inventory does not yet contain graph geometry or texture pixels. The tower's separately named resident defender also needs capture: level 15 specifies `DefenderCharacter=Archer7`. That character is not a building export and is not included in these counts. World attachment and attack synchronization remain unverified.

## Exact graph and texture capture

`scripts/import-native-archer-tower-art.py` captures both inventoried scene graphs into separate building and character namespaces. Source evidence retains original polygon strips, UV coordinates, matrices, colors, clip timelines, named children, frame labels and blend modes. Runtime copies remap UVs onto tightly packed texture regions without resizing or simplifying source geometry. The five texture inputs are SHA-256 pinned and checked against the source fingerprint; metadata binds the definition and inventory hashes.

The importer `--check` reconstruction passes for every graph document and every decoded RGBA texture pixel. Three focused tests pass, checking the source bindings, inventory, unchanged geometry and transforms, UV ranges and finite poses across all 6,093 retained frames. Projectile mode-8 groups remain isolated and are traversed in the frame checks. No source blend was flattened or replaced.

This qualifies source preservation, not GPU pixel parity or native executable animation playback. Independent CPU/browser pixel comparisons and runtime presentation are still pending, as is the separately referenced resident Archer character capture.

## Resident Archer source capture

`scripts/import-native-archer-tower-defenders.py` preserves the nine animation blocks named by all 21 tower tiers, together with every original building field beginning with `Defender`. Level 15 maps to Archer7. Idle and attack each resolve to three exact directional exports, totaling 54 exports, 54 clips and 2,654 frames. Their original character texture is retained as exact cropped pixels. Source modes 0 and 8 are preserved; mode-8 groups are not flattened.

The animation table, character scene and texture are SHA-256 pinned and fingerprint-membership checked. The metadata binds the building definition hash. `--check` reconstructs all source/runtime documents and compares every decoded texture pixel. Both focused tests pass, checking all tier bindings, the original attack ActionFrame value 5, directional export resolution, timelines/transforms/colors, and finite poses through every frame including isolated groups.

Only idle and attack graphics are captured here; the complete animation records retain other named states as evidence. No combat timing, facing/mirroring, number of resident archers or world attachment is inferred in this capture. CPU/browser pixel qualification and runtime integration remain pending.

## Pixel qualification in progress: projectile discrepancy

The independent CPU witness generator now supports building, projectile and resident-defender families. The projectile sheet includes all four export frame-zero cases and every retained clip frame (19 cases). Reconstruction of that sheet passes. The building reference generation is a separate longer-running job; its output is not yet qualified.

The initial browser pixel test failed in Chromium and WebKit (resolved below). It retains the established mean-error <1 and large-pixel-fraction <0.003 thresholds. Texture-batch changes, context restoration changes and GL errors are zero; all six original isolated groups remain present. Several source/GPU edge pixels differ, especially clip 352. Its first Chromium frame has mean error about 0.979 and large-pixel fraction about 0.0202; WebKit also exceeds the mean threshold in some cases. Initial reported outliers cluster along a vertical edge where the CPU darkens pixels that the GPU leaves at background color. The cause remains unproven. Neither source geometry nor thresholds have been changed to conceal this difference.

`projectile-pixel-investigation.json` records the failing measurements. The initial failing measurements are retained as investigation history; the resolution below supersedes that failure.


## Projectile pixel discrepancy resolved

The discrepancy came from the CPU reference's affine fast path: its half-open bounds used local vertex orientation. For flipped quad 352, the vertices are (167.5,214), (167.5,86), (132.5,214), (132.5,86), so that rule incorrectly included right-edge pixel centers and excluded left-edge ones. New Archer witnesses opt into screen-space top/left-inclusive triangle coverage. The source vertices, textures, runtime renderer and comparison thresholds are unchanged. Legacy rasterizer defaults and frozen witnesses remain untouched. Two Python tests verify orientation-independent coverage and unchanged default behavior.

The corrected 19-case projectile reference reconstructs exactly. Chromium and WebKit both pass, with worst mean channel error 0.433409 / 0.625 and maximum channel error 2. Large-error fractions, texture-batch changes, context changes and GL errors are zero. The WebKit sheet was visually reviewed. `projectile-pixel-resolution.json` retains the geometry diagnosis and final measurements alongside the initial failure record. These results cover the projectile family, not the whole tower or native executable parity.

The previously running building-reference generation was stopped and restarted with the corrected explicit coverage option; those larger references remain in progress.

## Explicit source pose API

`archer-tower-art.ts` exposes the original building and resident-character graphs. Building poses compose the base with ready, construction, upgrade or ruined artwork for all 21 tiers. Alternate forms require an actual source export (tiers seven and above); missing forms throw instead of falling back. Resident poses resolve the tier's Archer variant and explicit direction 1–3, using the original idle/attack animation rows. Nonlooping attacks hold their last source frame. Some original attacks return to their first pose at the end, so start/end visual inequality is not assumed.

The caller supplies world registration, direction and sampling time. No tower attachment, shot timing, target-facing rule or gearing eligibility is inferred here. Six focused pose/source tests pass across all tiers and directions, and production build passes. Full building and resident CPU reference generation remains in progress; these APIs are not yet wired into live village/battle presentation.

## Browser state gallery

The three-page browser gallery covers all 21 tiers with normal, alternate (when present), construction, upgrade and ruined bodies, plus all three idle and attack resident directions: 225 populated cells. Chromium and WebKit each pass all three pages, with nonempty native views, adequate actual framebuffer dimensions, zero GL errors and complete view destruction. All three WebKit pages were visually reviewed. Each cell fits its own source geometry for inspection; this does not establish relative world scale or rooftop attachment. The exhaustive resident pixel comparisons are tracked separately.

## Exhaustive resident pixel witnesses

The resident source renderer has completed 2,708 cases: frame zero of all 54 idle/attack exports plus all 2,654 retained clip frames. Seventeen bounded sheets retain independent CPU pixels, source transforms and per-case RGBA hashes. A coverage test verifies every export and frame is represented. Seven focused source/pose/coverage tests pass.

Chromium passes all 17 resident sheets, plus the existing projectile sheet. Worst resident mean channel error is 0.4359244, maximum individual channel error 85, and worst large-error fraction 0.001953761, below the unchanged thresholds. Batching changes, context-restoration changes and GL errors remain zero. This is threshold-based qualification, not pixel identity. WebKit qualification is still running and must be recorded separately when complete. Building-frame source generation also remains in progress.

## Resident qualification completed and generation recovery

WebKit completed all 17 resident sheets: pages 1–14 in the initial run, then pages 15–17 after the original process disappeared. All 2,708 resident cases pass in both browsers with unchanged thresholds. Worst mean error is 0.43592437 in Chromium and 0.58385965 in WebKit; maximum channel error is 85 and worst large-error fraction is 0.001953761 in both. Batching changes, context changes and GL errors are zero. `resident-pixel-qualification.json` records the source binding, coverage, metrics and split WebKit run. This supersedes the earlier pending status, without claiming pixel identity or world-attachment accuracy.

The reference generator now writes and releases each completed sheet instead of retaining all sheets until the end. Input-bound checkpoints in ignored output permit reuse only when the generator, source metadata, source compositor/rasterizer, NumPy version, PNG and JSON hashes match. The complete index is written after all sheets finish. `--check` always reconstructs pixels independently and never uses checkpoint shortcuts. The 19-case projectile fixture was verified unchanged, valid reuse was exercised, and an invalidated checkpoint correctly forced regeneration followed by a passing independent check. The interrupted building job had not written its in-memory sheets, so it was restarted with this bounded-memory, per-sheet workflow after confirming its process and handle were gone.

## Combined rooftop preview

`archerTowerComposition` combines the original body with its resident variant for ready/upgrading states, omitting residents from construction and ruins. The source-defined single resident uses the tier's normal or alternate defender height. The explicit local projection places the three-tile platform center at source y=60 and projects vertical units at 0.5 pixels. This is a visually reviewed interpretation, not verified native executable attachment or depth ordering.

A 36-cell gallery covers all normal tiers and all available lowered forms. Chromium and WebKit pass view presence, actual framebuffer height and zero-GL-error checks; both rendered previews were reviewed, and gallery labels were moved clear of taller artwork. WebKit's first attempt failed during module import; its completed rerun passed. Three focused pose/composition tests and production build pass. The composition is still separate from live village/battle rendering and combat timing.

## Live village native artwork

`VillageArcherTowers` now preloads and renders the original tower and resident graphs in the home village, reusing separate per-building views and destroying retired views. Construction and ruin omit the resident; upgrades preserve the idle resident. Reduced motion samples time zero. The old home thumbnail is hidden. Selection and status-height calculations use bounds traversed from the actual native geometry, including resident blend groups. World registration uses the existing three-tile local convention (1.2 scale, −96 vertical offset), with the previously documented local rooftop projection.

Chromium and WebKit each pass 84 tier/state cases, resident presence/absence, inside/outside selection, 21 simultaneous native buildings, village-to-battle retirement, restored village views and removal cleanup. The WebKit live village screenshot was reviewed. Eight focused source/pose tests and production build pass. Gallery fixtures exercise all captured tiers without expanding home progression. Battle artwork/timing and placement preview integration remain separate work; the current battle path retains its prior presentation. Full building pixel witnesses are still generating.

### Placement preview

Home placement and movement use the original tower and resident graphs, preserving the moved building tier and state. The stationary preview shares the village transform, uses 72% opacity, and tints both graphs red on invalid tiles. Cancellation, changing building types, and scene cleanup retire both views. All 21 tier previews, invalid boundaries, new level-one placement, and switching to a Gold Mine pass Chromium and WebKit; the WebKit screenshot was visually reviewed. This does not change battle artwork, progression, or the locally interpreted resident attachment.

## Building pixel qualification completed

All 6,158 independent cases are retained in 39 bounded sheets: 80 original export frame-zero cases plus all 6,078 retained clip frames. Coverage checks pass for every export and frame, and all saved PNG cells match their independent RGBA hashes. The source artwork importer again passes complete geometry and decoded texture reconstruction. The first browser sheet, including all tower exports and referenced effects, was visually reviewed in both browsers.

Chromium and WebKit pass every case with the unchanged mean-error <1 and large-error fraction <0.003 thresholds. Worst mean error is 0.71655247 in Chromium and 0.85204082 in WebKit. Maximum single-channel difference is 8 in both browsers, with zero large-error pixels in both. Texture-batch changes, context-restoration changes and GL errors are zero. WebKit completed pages 1–23 before the shared server stopped after Chromium finished; pages 24–39 then passed with a WebKit-managed server. `building-pixel-qualification.json` records the source hash, every fixture file hash, metrics and split-run circumstances. This completes the previously pending building-frame qualification without claiming exact pixel identity or native executable parity.

## Original audio capture

Nine source-referenced Ogg samples (71,202 bytes) are preserved byte for byte, including all attack sound variants, pickup, placement, mode toggle, destruction and impact samples. The importer pins SHA-256 and verifies each sample against the original fingerprint's SHA-1 membership. Metadata binds the complete original effect rows and definition hash; reconstruction and sample integrity tests pass. Playback integration is separate work.

## Home handling audio and particles

Archer Tower pickup, successful placement and cancellation now flow from model events into the native village presentation. Pickup uses the original three Grass particles; placement uses three Place particles and three Grass particles, preserving source emission durations, lifetime ranges, variants and layers through the shared local particle-motion interpretation. Motion equations remain locally interpreted rather than verified against the original executable. Both original handling samples play at source volume 80%, pitch 1 and zero delay through the existing shared sample queue. Cancellation clears the building's pending events, event history is bounded, and expired/cleared views retire. Reduced motion suppresses particles while retaining audio.

The generic placement sound is suppressed for Archer Towers and Dark Elixir Drills, preventing duplicate native/generic playback. Twenty focused model, particle, audio source and shared sample-queue tests pass. Chromium and WebKit each pass five browser checks covering all nine audio decodes, handling/cancellation/reduced motion, rejected and accepted placement without duplicate sound, all-tier previews and live native village transitions. The placement screenshot waits for postrender; its WebKit image was reviewed with the HUD hidden to expose the original dust and grass. Production build passes. Attack, impact and destruction sample playback still await battle integration.

## Source-rendered UI portraits

Twenty-one transparent portraits now use the original base, tier-specific tower and matching resident idle direction-three frame. The independent Python renderer reads original geometry and uncropped textures in separate namespaces, retains isolated resident blend groups and uses the explicit live-village rooftop projection. Rendering at 2× source coordinates improves high-DPI menu sampling without changing source geometry. Metadata records both source graph hashes, the definition hash, exports, resident root, bounds and decoded pixel hashes. The importer reconstructs all portrait pixels and metadata exactly; two tests also verify every tier's live composition bounds, image dimensions, pixel hashes and missing-tier rejection. This is a local composition of original assets, not proof of the original game's UI portrait layout.

The HUD portrait selector uses these images in selection, information/upgrade details, shop and progression UI. Battle/legacy world textures remain on their existing asset path. Chromium and WebKit each pass all 21 selection/information portraits at 1440px and 390px widths, successful image decoding and viewport bounds, level-seven upgrade details, and level-one shop art. Phone information/shop and desktop information screenshots were visually reviewed. Production build passes. Higher-tier fixtures validate artwork without expanding home progression or campaign gates.

## Source-derived progression and weapon fields

The numeric catalog derives all 21 base levels directly from the captured source: HP, gold cost, build duration, required Town Hall, footprint, normal weapon and explicit alternate weapon records. Its reconstruction check binds the complete source hash. The shared defense progression and normal range/interval now use this catalog, replacing the hand-maintained Archer Tower rows. All previously supported tier values remain identical; later-tier stat queries use their recorded values instead of the generic fallback.

The weapon API retains original projectile references and exposes full projectile rows for subsequent battle integration. Alternate DPS is preserved literally (level 15: normal 85, alternate 200), without assuming a doubling rule or granting gearing eligibility. Mini-level bonuses remain outside this base catalog. Home caps, accepted saved tiers and the Midnight Oil campaign gate remain unchanged while native battle support is incomplete. Sixty-five focused progression, combat, source and campaign-gate tests pass, as does the production build.

The full unit suite also passes: 1,485 tests across 164 files, including historical combat evidence.

## Version-41 tracking flight

New battles containing Archer Towers opt into source-speed tracking through `nativeArcherTowers`. Tower arrows receive their exact source tier as projectile variant and a simulation-owned flight point. The captured projectile rows specify Speed 1800 (18 tiles/second) and DontTrackTarget FALSE; the implementation uses the shared bounded continuous homing step, updates the remaining arrival time as the original target moves, and preserves the last aim after target death. A fired shot survives shooter death and never switches to another unit. The shared 10-ms minimum arrival guard is a local convention, not a verified native timing rule. The ordinary troop-arrow path is unchanged.

Version 41 records this changed combat behavior. Versions 34–40 remain playable and do not acquire the new battle marker, projectile variant or flight fields. The dedicated level-ten version-40 fixture and all 836 complete state hashes were captured from the previous committed runtime `c613024` before these changes; source-file and fixture hashes are retained with that immutable evidence. Every state matches during playback under the new runtime. Do not regenerate this historical witness from current code.

The existing arrow graphic now follows the physical flight point when the target turns, using the existing locally interpreted muzzle/target heights. This is not yet original projectile artwork or a native ballistic/attack-animation claim. Native shot graphics, launch-height registration, resident release-frame synchronization and attack/impact effects remain subsequent integration work.

The full pre-witness unit run passes 1,495 tests across 166 files; the dedicated historical test passes separately. Ten focused flight/replay tests cover all captured tier tags, legacy object shapes, moving/dead targets, shooter death, serialization and complete natural level 1/7/10/12 battles with reverse seeks and home isolation. All complete battle states match Node in Chromium and WebKit for those four levels. Both browsers also pass physical arrow positioning, retirement, reduced-motion hiding, restoration and zero GL errors; the WebKit screenshot was reviewed. Production build passes. `flight-qualification.json` records the comparison scope and per-scenario state counts.

## Native projectile meshes in battle

Version-41 tower arrows now render the captured character scene graph in their own namespace, selecting the source tier's normal, fire, elixir-fire or dark-elixir-fire export. Original timeline sampling, texture pixels and isolated mode-8 groups remain intact. The original arrow tip points along +Y; rotation aligns it with the current projected target. Mesh scale follows source Scale at the local village factor 1.2. Source StartHeight 190 and StartOffset 50 use the explicit local altitude factor 0.6 and map conversion of 100 units per tile, tapering toward the supplied target height as the physical flight approaches. This projection and the existing depth-8000 projectile layer remain local rendering conventions, not original executable ballistic or occlusion verification.

`ArcherTowerProjectiles` reuses views while shots live and destroys them after impact, battle exit, reduced-motion hiding or scene cleanup. Generic drawn arrows are excluded for native tower shots. The temporary generic tracking-height helper is removed; older untagged tower and troop arrows retain their existing graphics. No simulation fields or projectile physics change in this step.

Eight focused tests pass for all 21 tier exports, original launch projection, blend groups, eight ground/air facings, serialization, physical flight and all 836 historical version-40 states. Chromium and WebKit each pass a 64-cell projectile gallery and a live flight/retirement/reduced-motion test with no generic duplicate and zero GL errors. The gallery enlarges artwork 2× for inspection; its WebKit image and the normal-scale live shot were visually reviewed. Production build passes. Native tower/resident battle animation, release timing, impact particles/audio and source layer semantics remain integration work.

## Native battle bodies

Version-41 battles now reuse the verified original body and idle resident composition for all captured tiers, with original ruin art and no resident after destruction. The native meshes replace the legacy sprite, and selection bounds and intact height use the same original geometry. Battle animation samples simulation elapsed time, so paused battles and replay seeks do not advance on the home render clock; reduced motion samples frame zero. Versions 34–40 retain their previous tower presentation. No simulation state or combat timing changed.

Chromium and WebKit each pass the home integration test and a battle test covering all 21 tiers alive and destroyed, native bounds, legacy fallback, and view restoration with zero GL errors. Production build passes. The battle gallery was visually inspected. Residents still use idle direction three: target-facing, attack/release synchronization, destruction particles and battle audio remain outstanding.

## Rooftop target facing

Current native battles derive resident facing directly from the assigned living, in-range target. The captured resident clips provide rear, side and front views facing right; mirroring supplies their left views. Only the resident root is reflected, preserving the original tower, source roof height and attachment. Selection bounds sample the same facing as rendering. Home previews, portraits and historical battles keep their prior default facing. Reduced motion keeps target-facing information while freezing animation time. No battle fields or combat rules change, and facing reconstructs from serialized battle state.

The projected sectors use x=dx−dy and y=(dx+dy)/2, choosing rear/front outside the ±|x|/2 side sector. These thresholds are a local interpretation, not verified original executable angle boundaries. Dead, missing and out-of-range targets return to the default idle view; retained last-facing behavior is not claimed. Attack windup/release remains outstanding.

Seven focused unit tests pass, including all 21 tier compositions, reflection without body changes, target validity and serialization without mutation. Chromium and WebKit each pass three integration tests: all six facings under normal/reduced motion, a 54-cell gallery spanning all nine resident variants, and existing home/battle state transitions. Both report zero GL errors. Gallery inspection identified label overlap; the labels were moved above the artwork and the WebKit gallery rerun. Production build passes.

## Recorded release and follow-through

Version-41 native tower launches retain one latest `{at,x,y}` release per tower in `archerTowerShots`. This bounded history samples the original resident attack at its captured ActionFrame 5 / 24 fps when the actual projectile launches, then continues through the remaining original frames even if the projectile has already hit. A later shot replaces the previous release. Direction during follow-through uses the recorded aim rather than a subsequently moved target. Finished battles, destroyed/construction/upgrading towers, active stuns and reduced motion suppress the attack pose. Selection geometry uses the same pose and reduced-motion setting. Versions 34–40 never acquire the release history, and projectile speed, damage, cadence and targeting are unchanged.

This integrates release and follow-through only. Pre-release windup is deliberately not inferred from cooldown: stuns and target loss can invalidate that prediction. Full windup scheduling, battle audio, hit/destruction effects and original executable motion parity remain unverified or unfinished.

All 1,500 tests across 170 files pass, including source release timing across 21 tiers, projectile retirement, serialized pose reconstruction, reduced motion/stun/expiry, complete reverse-seek battles and the immutable version-40 witness. Complete state matches Node at every step in Chromium and WebKit for levels 1/7/10/12. Both browsers pass idle and attack six-direction galleries covering all nine resident variants and live normal/reduced-motion metadata, with zero GL errors; the attack gallery was visually reviewed. Production build passes.

## Original release audio

Native tower shots now retain a two-second release window for sound playback, in addition to the latest release used for animation. This prevents a new half-second shot from cutting off the previous sample: the three original files last 0.729388, 0.879410 and 0.799410 seconds before pitch adjustment. The window is pruned on launches and expired cues are omitted during rendering. It remains bounded when towers stop firing. Historical versions 34–40 do not acquire the field.

The source AttackEffect binds `Archer Attack`, with three sound rows, volume 50, pitch 90–110 and zero delay. The local presentation selects one variant deterministically per tower/release and varies pitch within those bounds using the independent visual hash. Selection probabilities and the original client's row-selection behavior are not verified; this is an explicit local interpretation, not executable audio parity. Cues retain both tower ID and exact release time as identity and join the single shared sample queue. Reduced motion does not mute them. Existing shared controls provide pause, mute, speed and seek behavior. No combat randomness or timing changes.

All 1,501 tests across 170 files pass, including overlap/history bounds, source sample/pitch/volume, serialization and immutable historical replay evidence. Chromium and WebKit each pass eight tests covering all nine sample decodes, native handling, real release overlap, duplicate prevention, speed adjustment, pause cleanup, and four complete Node/browser battle-state comparisons. Production build passes. Native impact and destruction audio/particles remain outstanding.

## Recorded impact audio

Version-41 native arrow resolution now records projectile identity, source tower, captured tier, impact time, final position and air/ground flag in a two-second impact window. Resolution records once even after shooter or target death, matching the existing last-position impact behavior; this does not claim verified original dead-target sound semantics. History is pruned on impacts, and expired cues are omitted. Historical versions do not acquire the field. Damage, targeting and flight are unchanged.

The source building HitEffect selects Generic Hit for levels 1–9 (original generic_hit_01, volume 30, pitch 95–105) and Explosive Arrow for levels 10–21 (original explosive_arrow_01v2, volume 65, pitch 100). Both have zero sound delay. Independent deterministic pitch uses the existing local audio convention. Stable projectile IDs deduplicate cues in the shared queue; the synthetic generic hit sound is suppressed only when that exact impact has a native record. Generic impact graphics remain until native particles are integrated.

All 1,502 tests across 170 files pass. New coverage checks every tier, recorded time/position, single resolution, shooter/target death, cue expiration, source sound values, serialization and historical field absence. Chromium and WebKit each pass nine audio and complete-state tests, including native cue delivery under reduced motion and synthetic audio suppression at tiers 1/10/21. Four full battles match Node at every step in both browsers. Production build passes. Original impact particles, destruction effects and pre-release windup remain outstanding.

## Original impact particles

Recorded tower impacts now sample the captured building scene graph and emitter definitions. Levels 1–9 emit two DefenceHit particles; levels 10–21 retain all six Explosive Arrow entries (15 particles once emission has begun), including both separate light flashes. Original export variants, timelines and additive flags are preserved through the shared native particle sampler. Visual randomness is independent of combat and stable across serialization. No simulation state changes in this step.

Target registration follows the existing local Wizard Tower convention: projected impact position minus 16 pixels, plus the scene's 46-pixel air lift for flying targets. Emitter altitude, damping, depth and motion remain the shared local interpretation rather than original executable verification. Air particles use depth 8000. Native views retire on expiry, reduced motion, battle exit and scene cleanup; restoration resamples recorded impacts. Generic impact graphics and synthetic sound are bypassed for the exact recorded native projectile ID, while native audio still joins the shared queue.

Ten focused tests pass, including all tier counts, distinct flash identities, air offset, immutable pose serialization, expiration, flight behavior and all frozen version-40 battle states. Chromium and WebKit each pass six browser tests covering audio continuity, native effect creation/retirement/restoration, no generic duplicate, and a 20-cell ground/air/time gallery with zero GL errors. Screenshot review exposed a loading overlay in the gallery harness; an explicit loading-completion wait fixed it, and the rerun WebKit gallery was visually reviewed. Production build passes. Destruction effects and pre-release windup remain outstanding.

## Original destruction presentation

The first fatal damage to a version-41 native tower now records `{at,x,y,level}` once per building. The original Building Destroyed effect supplies 30 debris particles, 10 smoke particles and three grass particles, plus building_destroyed_01 at volume 80 and pitch 85–95. Original source particle variants and timelines use the shared local particle-motion interpretation at the tower's ground center; native executable motion parity is not claimed. Hit and destruction effects share the event sampler while retaining distinct event identities, random streams and target registration.

The native destruction event bypasses the generic burst, sound and shake and invalidates scene synchronization so the original ruin replaces the tower and resident. Reduced motion suppresses particles but preserves the shared audio cue. Effects expire naturally; backward time reconstruction restores them from recorded destruction. Versions 34–40 retain previous behavior and acquire no destruction history. Combat damage/timing are unchanged.

All 1,504 tests across 171 files pass, including all 21 destruction tiers, first-fatal-only recording, 43-particle composition, source sound values, serialization, reduced motion, expiration and historical replay evidence. Chromium and WebKit each pass the destruction integration/gallery and four complete Node/browser state comparisons, with zero GL errors. The eight-age ruin/debris gallery was visually reviewed. Production build passes after adding an explicit missing-source-sound guard. Pre-release windup and original executable angle/projection/audio-selection verification remain outstanding; the campaign level-15 admission gate has not been changed.

## Frozen version-41 compatibility baseline

Before introducing pre-release scheduling, three portable replay fixtures and their complete battle-state hashes were captured from committed runtime `24a6b8a586e6cfc741dec7d8a1f32713b063fe7d`, extracted with git archive into an isolated runtime. Its 299 source/reference/fixture file hashes are retained in `tests/fixtures/archer-tower-v41-witness.json`. Captures use exclusive file creation. Do not regenerate these witnesses or replay files from a future runtime to make compatibility tests pass.

The level-1 fixture contains 828 states, level 10 contains 836, and level 12 contains 870, sampled every 50 ms through natural completion (2,534 states total). Coverage counters establish live tracking arrows, release history, hit history and tower destruction in each case. Each portable replay has its own SHA-256. The historical test opens each replay and seeks every sampled time, comparing the full serialized Battle hash. All three pass; the existing frozen version-40 test also passes unchanged. This step changes no runtime behavior and needs no new asset/build qualification.

The next scheduler must preserve this version-41 behavior behind replay compatibility. Captured building rows specify AttackSpeed 500 ms, and all captured resident attack rows specify ActionFrame 5 at 24 fps. They do not explicitly specify first-attack delay. Any 5/24-second windup scheduling policy is therefore a local interpretation until original executable behavior is independently verified. Required checks include target acquisition/loss during windup, stun interruption/resumption, release cadence, shooter death, and replay reconstruction; no new timing behavior is implemented by this baseline commit.

## Version-42 explicit windup scheduling

New battles use an explicit per-tower ready deadline and pending target/draw/release state. The first valid target begins a full 5/24-second draw. Sustained fire reserves the next draw before its deadline so releases remain 500 ms apart across fixed-step boundaries. The original resident samples elapsed draw time before release, then the existing recorded shot drives follow-through and sound. Release timestamps use the reserved deadline; target position is sampled at the resolving simulation step. This is a local scheduling/projection policy, not verified original executable first-shot behavior.

Target death or range loss cancels a draw; reacquisition starts a full draw subject to the remaining cooldown. A step overlapping a stun cancels the draw and shifts the ready deadline by inactive time; recovery starts another full draw. Disabled, destroyed, constructing and upgrading towers cannot release. The next active simulation step handles recovery, so partial-step recovery is quantized. Damage, normal range, projectile speed and source interval are unchanged. The scheduler currently resolves at most one release per simulation step; unusually long steps are not a native multi-release simulation claim.

Replay version 42 enables the new state only for battles containing an Archer Tower. Versions 34–41 retain their prior scheduling; shared release recording preserves their field order and complete serialized state. Current-version tests that assumed an immediate shot now advance through the draw, while retaining their damage, range, construction, target-layer and arrival-order assertions. Historical fixture bytes and hashes are unchanged.

The new scheduler tests cover initial draw, exact repeated release intervals, target loss/reacquisition, stun restart, disabled cancellation and serialized poses. Chromium and WebKit each pass a live eight-frame windup gallery and four complete Node/browser comparisons (levels 1/7/10/12); the Chromium gallery was visually reviewed and both browsers report zero GL errors. Production build passes. Source first-shot delay, angle boundaries, audio-variant selection and particle/projectile projection remain locally interpreted; campaign level-15 admission is still gated.

The final full suite passes 1,509 tests across 173 files, including all 2,534 frozen version-41 states, the 836-state version-40 witness, current backward-seek reconstruction and existing historical defense/garrison checks. The production goal remains broader than this scheduler integration.

## Campaign and replay tier admission

Campaign conversion now accepts all 21 captured Archer Tower tiers, backed by the original artwork, source stats, attack/effect integration and version-42 scheduler. It still compares source campaign DPS against the runtime weapon and rejects unsupported tier 22. Replay validation permits tiers 13–21 only from version 42 onward; versions 34–41 retain their previous limit of 12. Home building limits and Town Hall progression are unchanged.

The campaign test converts every tier without clamping, starts a campaign, exports its replay, validates the saved raid log, imports it independently, and verifies original HP/tier retention. It rejects malformed tier 22 and checks that version-41 validation does not admit the new tiers. Midnight Oil's resolved Archer Tower level-15 blocker is removed; its Inferno Tower blocker remains, so the village is not prematurely enabled.

Complete natural level-15 and level-21 battles now join the export/import, backward-seek and home-isolation tests. Chromium and WebKit match Node at every complete state for both scenarios (878 and 900 states). Production build passes. The broad unit run passed 1,512 tests and found one stale Midnight Oil blocker assertion; that assertion was corrected, and all four focused campaign/Midnight Oil tests pass. Existing frozen replay evidence was unchanged and passed in the broad run. No new visual assets or projection changes were introduced here.
