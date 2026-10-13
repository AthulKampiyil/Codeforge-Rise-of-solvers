# Original Inferno Tower source definitions

`native.json` and `catalog.json` retain the pinned client 18.400.21 Inferno Tower data from bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`. Reproduce with `PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-midnight-oil.py --check`. All six inputs have SHA-256 pins and fingerprint SHA-1 membership verification, including the newly captured `logic/mini_levels.csv` (`548d592770d5e0799a13a9e70da9092da4e282d5293bba852f5e0424c78812d3`).

All 12 base levels preserve raw sparse rows and explicitly inherited level records. The compact catalogue includes original single/multi artwork references, construction/upgrading/ruin/base exports, HP, cost, build time, Town Hall requirements, target layers, 128-ms attack interval, source ranges 900/1000, all three DPS stages, 1,500/5,250-ms switch fields, target counts and ammo fields. The target count changes from five to six at level 8. Original effects include all three beam strengths and the higher-level variants, transition effects, targeting/ammo and handling effects: 15 effect records and 17 referenced emitters. Their original continuation rows remain intact.

The two mini-level records remain separate and raw. This capture does not infer mini-level cumulative bonuses or missing-field inheritance, native ramp threshold arithmetic, target lock/reset behavior, ammo consumption, mode-bit conventions, beam attachment or particle motion. Original scene graphs, sound payloads and live simulation are subsequent work. No executable parity is claimed.

Midnight Oil (zero-based stage 58) has four level-1 Inferno Towers and one level-1 Dark Elixir Drill. Both families and the currently unsupported level-15 Archer Tower tier remain required before enabling that village. Source capture must not substitute a generic weapon or silently omit either family. Unit checks compare all base HP/DPS values with the independently captured campaign combat catalogue and ensure every referenced effect/emitter resolves.

The pinned scene file also resolves every building and particle export. `artInventory` records original export IDs, reachable clip/shape counts and required source texture files and dimensions. Texture payload decoding and independent pixel witnesses remain the next asset step.

The Inferno inventory resolves 91 building/particle exports, 134 clips and 219 shapes across source textures 8, 18, 25, 28 and 39. It contains blend modes 0, 3 and 8. **Twenty-two clips use mode 3, which was unsupported at source-capture time.** The audit preserves each affected clip ID in `unsupportedBlendClips`; it does not coerce that mode into normal or additive blending. Establishing mode 3 semantics and independent compositing witnesses is required before faithful art integration.

Validation: deterministic `--check` reconstruction passes for both families, all 1,398 unit tests across 132 files pass, and the final source-reference/blend inventory checks pass separately. This is a source-definition and renderer-readiness step; Midnight Oil remains gated by both missing families and Archer Tower level 15.

## Multiply compositing implementation

The pinned [SupercellFlash enum at 41e894d](https://github.com/sc-workshop/SupercellFlash/blob/41e894d5a20cc17e47fe32db3106c4c1bec60a3e/supercell-flash/source/flash/display_object/MovieClip.h) identifies mode 3 as Multiply. The implementation follows the standard [Multiply/source-over composition equations](https://www.w3.org/TR/compositing-1/#blendingmultiply). This establishes a format interpretation and a tested compositing equation, not native executable pixel parity.

For premultiplied source/destination colors Cs/Cd and alpha As/Ad, the result is `Cs*Cd + Cs*(1-Ad) + Cd*(1-As)`, with alpha `As + Ad*(1-As)`. `nativeMultiplyModes` uses two consecutive draws: the first computes `Cs*Cd + Cd*(1-As)` while preserving Ad, and the second adds `Cs*(1-Ad)` and computes source-over alpha. Preserving destination alpha between passes matters on transparent intermediate buffers. The runtime isolates the source clip, including multi-command shapes, before applying these two passes.

`NativeSceneView` uses two images of the same isolated texture, ordered adjacently. Color transforms run on an inner isolated source before the destination passes. Applying the color filter to pass one itself was rejected by GPU validation: its preserved zero alpha erased the filter input on transparent buffers. The corrected implementation retains clamped group colors and releases the extra image on clear, mode changes and destruction.

Sixteen GPU cases per engine cover empty, partial and opaque backdrops; transparent, partial and opaque sources; clamped color transforms; and nested isolated groups. Chromium and WebKit match independent numerical expectations within 2/255 per channel. Direct Multiply leaves, forced single-texture batches, context restoration, repeated teardown, framebuffer counts and listener counts also pass. Existing Screen/Additive compositing tests pass, all 1,400 unit tests across 132 files pass, and the production build succeeds with 580 cached files.

The capture-time `unsupportedBlendClips` inventory remains unchanged. The runtime can now compose mode 3. The following qualification adds corresponding Python composition and original level-1 frame witnesses. No source art is silently relabeled or dropped.


## Original level-1 pixel qualification

`multiply-runtime.json` contains the original `dark_tower_lvl1`, `dark_tower_lvl1_multi` and `dark_tower_base` exports: 10 clips, 20 shapes and two packed source textures. `multiply-source.json` retains the original graph and source pins. The new texture input `buildings_28.sctx` has SHA-256 `4f25555390bd05b262fd4b0eec96bf89cc97db8d2d4e862afb791f0713962f40`; every input also passes fingerprint SHA-1 membership verification.

The independent Python compositor in `scripts/native_art/multiply_scene.py` evaluates premultiplied Multiply directly, including transparent intermediate groups and original color transforms. It does not reproduce the runtime's two GPU passes. Graph capture accepts Multiply only through an explicit opt-in; its historical default and older fixture producers remain unchanged.

Reproduce with `OPENBLAS_NUM_THREADS=1 PYTHONPATH=scripts output/native-art-venv/bin/python scripts/native-inferno-multiply-fixtures.py --check`. The 321 cases cover 100 frames of each complete visible single/multi model cycle, the separate base, and every frame of all reachable clips. Visible 20- and 50-frame descendants combine into a 100-frame cycle; the empty 43-frame locator is checked separately. Test-only clip aliases are absent from the runtime exports.

Chromium and WebKit each pass all 321 source-texture comparisons. Maximum per-case mean channel errors are 0.485713 and 0.901303 respectively, on a 0–255 scale; maximum individual channel errors are 3 and 4. No pixels exceed the 16-channel outlier threshold. Forced single-texture batching and context restoration change zero pixels, with no GL errors. The harness verifies actual framebuffer dimensions before comparing bounded pages. Visual review also compares both modes at three animation phases against their source compositions.

Validation: deterministic source reconstruction, 28 Python tests, all 1,402 unit tests across 133 files, all six browser pages, and the production build pass (582 cached files). This qualifies the level-1 original-art composition under the documented format interpretation. It does not qualify all 12 tiers, live Inferno combat, world registration or native executable playback. Midnight Oil remains gated.


## Complete source artwork capture

`art-runtime.json` and `art-source.json` extend the capture to all 91 exports in the original inventory: all 12 single/multi tiers, their upgrade exports, construction, base, ruin and referenced particle/effect artwork. The retained graph has 134 clips, 219 shapes, 2,241 clip frames and all 22 Multiply-containing clips. Five original texture inputs are pinned and checked against fingerprint membership. Packing verifies every retained source region after composition, including bilinear neighbors and texture-edge padding, and checks that normalized UVs recover their original coordinates within numerical precision. Geometry, color transforms, placement order, labels and timelines are preserved.

Reproduce with `OPENBLAS_NUM_THREADS=1 PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-inferno-art.py --check`. The source metadata also binds the definition file by SHA-256. The earlier level-1 Multiply fixture remains separate and unchanged.

Validation for this capture: deterministic reconstruction passes; three new unit checks cover every catalogue artwork reference, original geometry preservation, all retained transforms and blends, and finite runtime sampling across all 2,241 clip frames. The production build passes with 587 cached files. A source-composited visual sheet was reviewed for all 24 single/multi tier models. Full browser pixel qualification of this expanded graph and animation coverage remain pending; the level-1 browser result above must not be extrapolated to these other tiers. Live simulation and native executable playback remain unverified.


## Expanded browser pixel witnesses

`scripts/native-inferno-art-fixtures.py` independently composes the full original SCTX textures into 2,332 reference cases in 15 bounded pages: frame zero of all 91 exports plus every one of the 2,241 retained clip frames, sampled through test-only root aliases. Those aliases are added only in the browser harness and never written into the runtime asset. Reproduce with `OPENBLAS_NUM_THREADS=1 PYTHONPATH=scripts output/native-art-venv/bin/python scripts/native-inferno-art-fixtures.py --check`.

Both Chromium and WebKit pass all 2,332 comparisons using the existing mean-error and outlier thresholds. Maximum per-case mean errors are 0.663265 and 0.901088 respectively, on a 0–255 channel scale. The maximum individual channel difference is 26 in both engines: four edge pixels on `dark_tower_lvl1_upgrade` (also sampled as clip 12959) differ from the Python rasterizer. Magnified review confirms the difference is localized to that model edge; this is retained as a qualification limit, not erased by changing thresholds. The maximum outlier fraction is 0.000227002. All 15 pages per engine have zero GL errors and zero changed pixels after forced single-texture batching or graphics-context restoration.

Source regeneration and the four Inferno art unit checks pass. Visual comparison includes higher-tier single/multi models, upgrade art, construction and handling effects. These witnesses cover each original clip timeline individually and each export's initial composition. They do not prove every combined descendant phase, live particle motion, world attachment, combat timing or native executable playback. The earlier level-1 combined-cycle qualification remains separate. No runtime code or campaign gate changes in this step.


## Weapon profile and lock foundation

`src/game/inferno-weapon.ts` reads all 12 base profiles directly from the captured catalogue, rejects unsupported tiers, selects the source DPS stage, and retains eligible target locks before accepting replacements. Lock acquisition times use simulation seconds; stage queries explicitly use elapsed milliseconds. Single mode has one lock, multi mode has five through level 7 and six thereafter. Multi mode remains at stage zero. Replacement starts a new acquisition time; callers must clear locks on mode changes. Candidate eligibility and priority are supplied by the future battle adapter.

Timing evidence comes from the older [LogicCombatComponent source at 52c5953](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/Component/LogicCombatComponent.cs), SHA-256 `5a2e1f66c7815e5d1668da0340690e7ed8248a1f8a064e99723d516e7548a09f`. `SelectTarget` resets `m_damageTime`; `GetDamageLevel` compares both switch fields against that same timer and returns stage zero for alternate multi-target mode. Thus the captured 1,500/5,250-ms fields are interpreted as absolute acquisition thresholds, not consecutive durations. `RefreshTarget` retains valid damaging targets rather than always choosing a newly nearer unit. This older reconstructed engine is supporting evidence, not proof of current native execution.

Four focused tests cover exact threshold boundaries at every tier, multi-target DPS, retained locks, fresh acquisition after replacement, unique target capacity and invalid clocks/tiers. Production compilation passes. This module is not yet connected to battle damage or rendering. Attack pulse rounding, the older engine's 64-ms update ordering, freeze/reset behavior, acquisition delays, ammo and modern mode-bit interpretation still require battle integration and verification. The source shows alternate target-kill delay applied to a slot; this helper does not claim to implement that scheduler.


## Discrete scheduler foundation

`inferno-scheduler.ts` adds a standalone 64-ms scheduler with stable beam slots and source 128-ms pulse intervals. It samples the damage stage on each pulse: under the implemented acquisition convention, the first stage-two pulse is at 1,536 ms and the first stage-three pulse at 5,376 ms. Output retains DPS and interval separately; HP rounding remains the battle adapter's responsibility.

The older `LogicCombatComponent.Tick` refreshes targets before decrementing `m_hideTime`, then charges the attack. `Hit` sets that delay only when an alternate multi-target slot kills its target. The scheduler preserves that ordering: a 50-ms delay blocks one subsequent refresh, then expires during that tick. Surviving slots retain their identities and clocks. Disabled ticks clear targets and attack charge while preserving, and not advancing, pending replacement delays. New acquisition resets the ramp. Candidate eligibility and priority remain caller inputs.

Five scheduler tests plus four weapon tests cover pulse cadence, ramp boundaries, freeze/reacquisition, stable surviving slots, target-kill delay, duplicate candidates, ordinary eligibility loss and suspended replacement delay. The implementation is not yet connected to battle state. Its fresh-charge policy on target replacement, discrete acquisition convention and modern freeze semantics still need integration qualification against the client; this is not a claim of complete native combat parity. Ammo, attack-speed modifiers, range checks and HP quantization are still outside this module.


## Battle-unit damage adapter

`inferno-combat.ts` resolves a scheduler tick against actual `Unit` records. It interprets captured ranges 900/1000 as 9/10 tiles, measures from the two-tile building center, excludes dead/ejected/future-born units, and prioritizes distance with an explicit ID tie-break. Existing valid scheduler locks retain priority. Source profiles permit ground and air targets. Pulse damage uses the existing game's floating HP convention (`DPS * 128 / 1000`), clamps kills to zero, records death time and informs the killed beam's replacement scheduler. Hit records retain target coordinates, flight layer, source center, stage and pulse time for subsequent rendering.

Four adapter tests cover actual HP changes and beam records, both range boundaries, birth/ejection/death eligibility, kill timestamps and delay, deterministic ties and 99 ticks after serialization round-trip. All 13 focused weapon/scheduler/adapter tests pass; production build passes. This adapter is still awaiting main battle-loop dispatch, saved/replay state integration, source-art presentation and campaign enablement. Modern native HP quantization and target geometry remain qualification limits; source assets and standalone tests do not establish a playable Inferno integration.


## Gameplay art-state composer

`inferno-art.ts` composes source exports for active, empty, construction, upgrade and ruined states across all 12 tiers and both modes. Empty state disables the original named `ammo` subtree. Upgrade state combines the mode-specific upgrade export with the original build scaffold and base; ruin uses the source damaged export alone. Registration is supplied explicitly by the caller and defaults to source identity, so this helper does not assert world alignment. Animation time remains derived from simulation time.

Three tests cover all 120 tier/mode/state combinations, named ammo-layer suppression, original ruin selection and caller registration. Production compilation passes. State composition follows source export/instance naming and is an integration interpretation; modern executable switching behavior and live world presentation remain unverified. Previous browser witnesses qualify individual source exports and clip frames, not these newly composed gameplay states. Building registry exposure and battle-loop integration remain subsequent work.


## Original UI portraits

`scripts/native-inferno-portraits.py` produces 24 transparent, source-resolution portraits, one for each tier and mode. It composes the original base/body at frame zero, crops against transformed mesh bounds with two-pixel padding, converts the premultiplied result to straight-alpha PNG, and records dimensions, source-coordinate origins and RGBA hashes in `portraits.json`. The metadata binds `art-source.json` by SHA-256. `infernoPortrait`, `infernoTexture` and `infernoAsset` expose validated mode-specific references for UI/registry integration.

Reproduce with `OPENBLAS_NUM_THREADS=1 PYTHONPATH=scripts output/native-art-venv/bin/python scripts/native-inferno-portraits.py --check`. Deterministic pixel/metadata reconstruction, existing art-state tests and production build pass; all 24 portraits were visually reviewed. These flattened transparent images are UI thumbnails, not a replacement for destination-dependent live blending. Native mesh presentation must remain the world renderer. Registry exposure, main battle-loop wiring and replay integration are still pending.


## Initial live registry, battle and mesh integration

The `inferno` building kind now uses source HP, upgrade progression, costs, Town Hall requirements and portrait references. Home availability remains zero within the current TH8 cap. `stepInfernos` is connected to `GameModel.step`, and the generic defense projectile branch explicitly skips Infernos. Optional per-building state is created only when an Inferno exists, with an integer 64-ms tick cursor and two seconds of recent hit records for presentation. The first live path uses single-target mode. Freeze, construction, upgrading and destruction disable the scheduler; surviving active pulses apply damage to battle units.

`InfernoPresentation` preloads the original packed textures and renders the animated native body/base and source state exports for all 12 tiers, with lifecycle cleanup and hidden thumbnail sprites. Local registration uses scale 1.2 and a -64 source-root screen offset at the two-tile center; this is a local integration convention pending native world-registration proof. Reduced motion samples frame zero.

Validation: the existing 1,422 tests across 138 files pass, plus three new battle/registry tests. The added tests cover dispatch across the 50-ms battle cadence, serialized-state continuation, actual model freeze/thaw damage and absence of generic projectiles. Both Chromium and WebKit pass live 12-tier/ruin rendering tests with zero GL errors, and the live screenshot was reviewed. Production build passes with 611 cached files.

This is a development integration, not campaign enablement. The campaign source ID remains unmapped, and current replay validation rejects Inferno buildings until a versioned mode/state contract is added. Single/multi persistence, visible beams and sounds, ammo, exact selection bounds and full live combat browser validation remain outstanding. Tick damage currently samples unit positions available at the enclosing model step; exact native movement/combat ordering and HP quantization remain unverified. Midnight Oil remains gated by its required families/tiers.


## Live selection and marker bounds

`infernoBounds` traverses the exact rendered native poses, including isolated blend groups, and measures transformed vertices. Selection and status-marker placement now use those bounds at the displayed simulation time (frame zero for reduced motion). Projectile height metadata uses intact source geometry. The scene and bounds sampler share `INFERNO_ROOT`, eliminating duplicate registration constants. This remains rectangular hit geometry, not alpha-pixel picking, and local world registration is still unverified against native execution.

Both browsers pass 48 live tier/state cases covering active, constructing, upgrading and ruined Infernos, original bounds equality, intact height metadata, inside selection and outside rejection. The six focused art/battle tests and production build pass (611 cached files). Live single-target presentation remains the currently integrated mode; replay mode support and beam effects are still outstanding.


## Versioned single/multi persistence

Replay version 39 accepts Inferno buildings and their optional `infernoMode` (`single`/`multi`, absent means single). Versions 34–38 remain playable but reject the newly introduced building/field. Save validation checks modes, portable replay export preserves the field, and saved layout creation/restoration plus browser save snapshots retain it. Modes on unrelated replay/building records are rejected. Older frozen fixtures are unchanged; assertions for newly recorded replay versions advance to 39.

The battle scheduler and live mesh presentation now consume the building's selected mode. A mode or tier change rebuilds scheduler slots and clears recent hit records. Selection bounds use the corresponding mode, and the selected range ring uses 9/10 tiles. Player-facing toggles, thumbnail mode plumbing and complete mode-aware info text remain subsequent UI work.

All 1,427 tests across 140 files pass, including portable mode round-trip, a resumed six-target multi battle, invalid-mode rejection and old-version rejection. Both browsers pass mixed single/multi live tier rendering, and production compilation passes. Campaign source mode-bit interpretation, beam effects and ammo still remain unresolved; this does not enable Midnight Oil.


## Player-facing mode controls

The building context now exposes an accessible Single-target/Multi-target toggle. It is blocked during battle, placement and wall movement, and participates in edit undo/redo and saved layouts. Context and info portraits follow the selected mode. The info table displays the three-stage single-target DPS ramp and acquisition thresholds, or multi-target DPS per target and simultaneous target count; both show their corresponding range and flight layers. Hover range and intact mesh height also follow the mode.

Focused mode/edit/layout/save and replay tests pass. Chromium and WebKit each pass desktop (1440px) and phone (390px) UI checks, including both toggle directions, portraits, ranges and source DPS. The completed phone dialog was visually reviewed after disabling its opening animation for capture. Production build passes. Campaign entry, beam/sound presentation and ammo remain outstanding.


## Original live beam meshes

`inferno-beam.ts` resolves each tier's three attack effects through the captured emitter records to the six original `dbeam_*_light` exports. Live occupied scheduler slots now render those retained graphs with their original Multiply/Additive groups, rather than generic lines. Per-slot views are reused and cleared on lost/dead/ejected targets, freeze, inactive buildings, battle completion and scene cleanup. Multi mode displays one beam per occupied slot; single mode selects artwork from its current damage stage.

Endpoint mapping is a local interpretation of the horizontal source artwork's approximately 48-unit span. Start height uses emitter `StartZ=100` at the local 1.2 scale, independently of the body's registration offset. Initial visual review exposed an erroneous extra body offset; removing it aligned the beam origin with the tower head in the reviewed level-8 scene. Flying targets use the existing 46-pixel local lift. This is not native endpoint/width parity. Source fade metadata is retained in the profile but acquisition/release fades, phase-reset semantics, hit sparks, ramp transitions and sound playback remain subsequent work.

Two tests resolve all 36 tier/stage combinations and coincident endpoints. Both browsers pass a live six-target beam and freeze-cleanup check with zero GL errors; corrected attachment was visually reviewed. Production build passes. Previously captured individual beam clip pixels remain qualified by the expanded source fixtures; the new live stretching/attachment interpretation is separately limited as described above.


## Detached original hit particles

`inferno-effects.ts` samples all three original `Dark Tower Hit` emitters at recorded pulse endpoints: one looping-sparks particle, five light-dust particles and eight impact particles. Original variant rows preserve explicit blend overrides. Each seed/key uses tower ID, immutable 64-ms pulse tick, beam slot, emitter and particle index; retiring older records cannot re-seed remaining effects. Air impacts retain the existing local 46-pixel lift. Particle views retire on lifetime expiry and clear at battle/scene completion; reduced motion suppresses these bursts.

Three tests cover all 14 source particles, flight-layer placement, stable retirement/serialization, future/expired events and reduced-motion/completion suppression. Chromium and WebKit pass the live six-beam/84-particle check with zero GL errors; the live impact screenshot was reviewed. Production build passes. Motion, damping, bounce, source emission cadence interpretation and world projection use the shared local particle model and are not native executable parity. Source clip pixels remain independently qualified by the earlier original-art fixtures. Beam fades, transition effects, sounds and ammo remain unfinished.


## Original audio capture and live laser loop

`scripts/import-native-inferno-sounds.py` preserves seven byte-identical Ogg files (75,183 bytes total), verifies SHA-256 pins and fingerprint SHA-1 membership, and records source effect audio fields in `sounds.json`. The source-definition SHA-256 is retained. `--check` reconstructs every output byte and manifest field.

`SampleAudio` now supports explicit looping cues, wrapped simulation-time offsets and live loop gain changes while retaining existing short-sample behavior. Inferno active locks submit one local laser voice per tower, with source volume 40/60/80% and pitch 100/120/140% by heat stage. Stage start times derive from source thresholds rounded to the scheduler's 64-ms ticks. Pause/mute/seeking use the shared audio lifecycle; freeze, lost locks, inactive towers and battle completion remove the cue. One voice per multi-target tower is a local mixing choice, not verified native voice allocation. Only the laser loop is wired in this step; captured transition, placement, reload, no-ammo and destruction samples await corresponding event integration.

Eight focused sample/cue tests pass. Both browsers decode all seven original samples successfully. The full unit run passed 1,434 tests with one historical Air Sweeper test timing out during parallel load; rerunning that unchanged historical file alone passed both tests in 2.69 seconds. Production build passes with 618 cached files. Native loop phase, spatial mixing and output loudness have not been verified against the executable.


## Detached heat-transition bursts and sounds

The 64-ms battle scheduler now records each single-target heat crossing once, including crossings on ticks without a damage pulse and a transition pulse that kills its target. Presentation consumes immutable dated events, preserving the original `DarkRay Up2`/`DarkRay Up3` additive `dark_beamup_fx` bursts and `beam_up_02.ogg` sample. Source volume/pitch are 60%/90% and 75%/110%; source life is 650–700 ms, StartZ is 175, and ending scale is 100/125. Events survive lost locks and freeze until their detached lifetime expires, and their randomness remains stable after JSON restoration. Reduced motion suppresses visual bursts.

Eight focused battle/effect/sound tests pass, including crossings at 1.536 and 5.312 seconds, retirement, duplicate prevention, serialization and detached cues after freeze. Chromium and WebKit each pass a live single-target transition burst with zero GL errors and beam removal on freeze. The Chromium screenshot was visually reviewed; the burst appears above the head using the shared particle altitude projection. Production build passes with 618 cached files. The source camera-shake fields remain unwired; particle projection, audio mixing and executable timing parity remain local interpretations. This does not enable the next campaign stage or implement ammo.


## Simulation-driven heat-transition camera motion

`inferno-shake.ts` now consumes the detached transition history through the existing `CameraShakeLayer`. It resolves original `CameraShake` strengths 30/40, durations 300/400 ms and enabled replay flags directly from the captured effect rows. The offset is a pure function of battle time and event identity, so paused frames hold still, seeking reconstructs the same offset, and disappearing towers do not cancel an already-triggered shake. Reduced motion, scouting, home and finished battles suppress it. Concurrent Inferno impulses are capped at the largest active source amplitude.

The 30 Hz smooth noise, linear taper and 0.32 screen-unit conversion follow the existing local battle camera convention; these are not verified native shake equations. Four focused tests pass across shake and transition history, covering both source windows, deterministic restoration, no battle-state mutation, suppression and 100 simultaneous detached events. Chromium and WebKit pass the live transition check with a nonzero camera offset, identical paused transforms, reduced-motion removal, and accurate screen/world pointer round-trip. Production build passes.


## Beam acquisition fade

Live Inferno beam views now apply the captured emitter `FadeInTime=128` ms as a linear opacity envelope. Acquisition time is reconstructed from the stable slot's lock clock and last 64-ms scheduler tick; the render-time remainder supplies intermediate opacity. This follows the existing local laser-loop acquisition convention. Creating a new view, paused rendering and restoring the same battle time do not restart the envelope. Heat-stage changes retain the current lock's acquisition age. The native easing curve, stage replacement/crossfade policy and emitter/particle release fade distinction remain unverified; release still removes a beam immediately.

Seven focused beam/battle/sound tests pass, including the envelope across all 36 tier/stage profiles and invalid-time rejection. Chromium and WebKit each validate six live beams at half and three-quarter opacity, restored view opacity, source hit particles, freeze cleanup and zero GL errors. The opacity assertions inspect the actual native scene render objects, including isolated blend passes. Production build passes.

## Explicit campaign state capture

The campaign importer now retains every original Inferno building record in `infernoStates`, separately from the existing truthy `activeModes` list. The previous truthy filter omitted explicit false mode records and their ammunition. All 182 Infernos across the captured layouts are preserved byte-for-value as parsed source objects, including draft/war fields: 79 active mode bits are false and 103 are true; all captured ammo counts are 1000. Midnight Oil's four level-one towers explicitly store false and 1000 rather than relying on defaults.

`nativeInfernoStates` validates a one-to-one placement match, unique source IDs/positions, exact integer fields, explicit boolean active mode and ammunition within the captured tier capacity. It returns the literal `attackMode` bit and original grid coordinates, without choosing draft/war bits or converting mode semantics. Zero ammunition remains zero. Missing, duplicate, unmatched or malformed state is rejected and adds an Invalid Inferno state campaign issue. The source building family remains unmapped, so this does not enable campaign Infernos or implement ammo consumption.

Importer regeneration and `--check` pass for all 90 villages/97 pinned sources; only the compact runtime output and its provenance digest changed. Nine focused tests pass, including exact comparison against all raw layouts, malformed-state rejection, Midnight Oil gating and all frozen version-41 Archer Tower replay states. Existing campaign reference and behavior tests also pass. Production build passes. The next work remains source-informed ammo consumption, empty-state presentation, and a versioned campaign mode/ammo contract; original executable depletion rules remain unverified.

## Frozen version-42 pre-ammunition baseline

Three portable replay fixtures were captured from committed runtime `f7ba28e` extracted with git archive, before adding depletion rules. The capture uses a new legal fifty-space ground-army fixture; its source hash is included separately from the committed runtime provenance. `tests/fixtures/inferno-v42-witness.json` retains runtime/source hashes, fixture hashes, every complete serialized Battle hash and observed coverage. Exclusive file creation prevents overwriting prior captures. Do not regenerate these files from a later runtime to make compatibility tests pass.

The level-1 single scenario has 887 states and reaches heat stage 2; level-8 multi has 986 states and acquires all six slots; level-12 single has 1,179 states and reaches stage 1. All battles complete naturally. The historical test imports each portable replay and seeks every 50-ms sample, reproducing all 3,052 complete states exactly. All three tests pass. This baseline step changes no gameplay or rendering and does not require another production build.

The captured primary data supplies AmmoCount 1000 and AttackSpeed 128 ms, but no explicit multi-beam consumption algorithm. Web research did not locate primary-source documentation resolving that algorithm. Any future shared active-time depletion policy must therefore be labeled as a local interpretation, preserve old version-42 behavior, and explicitly test simultaneous versus staggered beams, idle/freeze intervals, exact exhaustion, empty startup and replay reconstruction. This baseline does not implement or claim verified ammunition consumption.

## Version 43 ammunition depletion and empty presentation

New Inferno battles start with the captured tier capacity of 1,000 ammunition. A shared tower counter consumes one charge per 128 ms of active targeting, independent of beam count and heat stage. Idle and freeze intervals pause consumption while retaining fractional active time. The final active tick can deal damage, then exhaustion clears every lock and prevents further hits. The original empty body hides the named ammunition subgraph; beam views and the firing loop disappear. Serialization retains ammunition, fractional charge and exhaustion time. Versions 34–42 retain their previous behavior and serialized state.

This shared active-time consumption policy is a local interpretation, not verified executable behavior. Primary source data establishes capacity and attack interval but does not establish their exact relationship to consumption. Initial map ammunition, campaign mode interpretation, no-ammo sound/effect and refill behavior are not part of this step; campaign Infernos remain gated.

The full suite passes 1,520 tests, including all 3,052 frozen version-42 Inferno states. Four further tests pass for portable replay backward seeking, home isolation, staggered targets and restored empty state. Exhaustion is tested across all 12 tiers and both modes at exactly 128 active seconds. Chromium and WebKit each pass three complete Node/browser battle-state comparisons and a live exhaustion check with six beams, firing-loop removal, empty native views after restoration/reduced motion, no subsequent damage and zero GL errors. The empty Chromium screenshot was visually inspected. Production build passes.

## Explicit starting ammunition in battle setups

Version-43 building setups now accept optional `infernoAmmo`, restricted to integer values from zero through the captured tier capacity. Portable replay export retains it explicitly, including zero. Missing values retain the full-capacity default; versions 39–42 reject the new field, and unrelated building kinds and home saves reject it. Runtime ammunition uses the setup value without clamping and remains separate from the immutable starting value. A tower beginning empty never acquires a target or emits a depletion event. Scouting renders the original empty art even before combat state has initialized.

Checks cover partial/full/zero round trips, malformed values and tiers, old-version rejection, explicit exhaustion with targets, portable backward seeks and home isolation. Chromium and WebKit both pass the existing six-beam exhaustion check and empty scouting before the first tick, with zero GL errors; the Chromium scouting screenshot was visually inspected. This prepares campaign state mapping but does not yet admit campaign Infernos, interpret their source mode bit, or implement refill/no-ammo effects.

Validation: production build passes. The full run passed 1,528 tests and hit the existing five-second timeout in the version-40 Archer historical test; its isolated rerun passed all frozen state comparisons in 4.33 seconds. The six focused replay/mode tests pass, including the new backward-seek cases. No frozen fixtures or expected hashes were changed.

## Campaign Inferno admission

The native adapter now maps source building 1000027 directly to Inferno Tower. The captured `NormalModeTID` names SINGLE_CONFIG and `AlternateModeTID` names MULTI_CONFIG; the explicit active `attack_mode` bit selects single when false and multi when true. Draft and war bits remain unused. All 182 records supply their original ammunition to version-43 battle setups and portable replays. Truthy active-mode records must agree with the fully preserved Inferno record; conflicting state remains a gate. This mapping follows the source configuration labels and existing alternate-mode serialization convention, without claiming recovered client executable semantics.

The shared defense damage helper now resolves Inferno base-tier DPS from the captured weapon table rather than generic level scaling. Live Inferno combat already uses that table; this corrects generic stat consumers and the campaign weapon consistency check without changing historical Inferno simulation.

Midnight Oil (58), All Angle Attack (59), Burning Sensation (60) and Teamwork Opportunity (62) are now admitted, bringing the supported campaign set to 62 villages: indices 0–60 plus 62. Missing Eagle Artillery, freeze traps and later building/mechanic families continue to gate other maps. Original placements, tiers, scenery, HP, loot and dependency paths remain governed by the existing source adapter and campaign tests.

Twenty-two focused tests pass, including every captured mode/ammo mapping, all twelve base DPS values, inconsistent mode rejection, four real campaign starts, portable replay restoration/backward seeks and home-save isolation. Chromium and WebKit each pass all four original campaign layouts with native Inferno views and zero GL errors. Midnight Oil in Chromium and All Angle Attack in WebKit were visually inspected. Production build passes.

Final validation: the full run passed 1,546 tests with two obsolete admission assertions (the former 58-village set and Midnight Oil's former Inferno gate). Those assertions were updated to the actual four newly supported maps; all 18 tests in the affected files and the new campaign combat test pass. The combat test exercises actual imported towers on all four maps with stationary targets, checking mode-specific slot counts, damage and ammunition consumption. Historical full-state witnesses passed unchanged. This run used a 20-second test timeout to accommodate existing exhaustive replay tests; their comparisons were not weakened.
