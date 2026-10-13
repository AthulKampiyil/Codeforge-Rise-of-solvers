# Original Wizard Tower source

Pinned client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, from Supercell's [original fingerprint](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/fingerprint.json). The importer verifies all **23 SHA-256 input pins** and each input's SHA-1 membership in that fingerprint.

Live combat uses all seventeen source levels and the four original projectile tiers. Shots travel at 5 or 9 tiles/s and keep the target position captured at launch, replacing the previous 16-tile/s tracking behavior. The live scene now renders the original bodies, rooftop Wizards, projectile graphics, particles and sounds, including construction, upgrades, rubble and home handling. The first 54 native villages and Graduation Ceremony (stage 58) have supported mechanics. Native progression prerequisites remain enforced, and Magic Practice still requires the campaign Shrink Trap. Combat version 34 expires incompatible playback while preserving old results and save version 4.

## Source records

[buildings.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/buildings.csv) identifies `Wizard Tower`, GlobalID `1000011`, in seventeen sparse level rows. Blank fields inherit their preceding nonempty value. Every row specifies a 3×3 footprint, 700-unit range, 1,300 ms interval, 100-unit splash radius and both ground/air targeting after inheritance. Prices are gold and times apply to reaching the destination level.

| Level | HP | DPS | Gold | Hours | Source TH | Rooftop family | Body suffix |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| 1 | 620 | 11 | 100,000 | 1 | 5 | Wizard | 1 |
| 2 | 650 | 13 | 150,000 | 1.5 | 5 | Wizard | 4 |
| 3 | 680 | 16 | 250,000 | 4 | 6 | Wizard2 | 7 |
| 4 | 730 | 20 | 400,000 | 8 | 7 | Wizard2 | 8 |
| 5 | 840 | 24 | 550,000 | 10 | 8 | Wizard3 | 9 |
| 6 | 960 | 32 | 660,000 | 12 | 8 | Wizard3 | 10 |
| 7 | 1,200 | 40 | 1,000,000 | 18 | 9 | Wizard6 | 11 |
| 8 | 1,440 | 45 | 1,100,000 | 20 | 10 | Wizard6 | 12 |
| 9 | 1,600 | 50 | 1,300,000 | 24 | 10 | Wizard7 | 13 |
| 10 | 1,900 | 62 | 2,000,000 | 30 | 11 | Wizard7 | 14 |
| 11 | 2,120 | 70 | 2,500,000 | 36 | 12 | Wizard8 | 15 |
| 12 | 2,240 | 78 | 2,600,000 | 42 | 13 | Wizard8 | 16 |
| 13 | 2,500 | 84 | 3,000,000 | 48 | 13 | Wizard9 | 17 |
| 14 | 2,800 | 90 | 4,500,000 | 72 | 14 | Wizard10 | 18 |
| 15 | 3,000 | 95 | 5,500,000 | 96 | 15 | Wizard11 | 19 |
| 16 | 3,150 | 102 | 8,000,000 | 108 | 16 | Wizard12 | 20 |
| 17 | 3,300 | 110 | 14,000,000 | 132 | 17 | Wizard13 | 21 |

All seventeen retained values now supply the gameplay table; the original first eight values are unchanged. Source TH fields do not replace the home count/upgrade gates: home play remains capped at level 6 through TH8. The original body suffixes are not building levels; level 2 uses `wizard_tower_lvl4`, and level 17 uses `wizard_tower_lvl21`. Foundation, construction, upgrade and four inherited rubble families remain distinct.

[animations.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/csv/animations.csv) retains each Wizard family's own header and all five action rows. Idle and attack each have three original directions from [chr_wizard.sc](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/sc/chr_wizard.sc): 66 exports in total. Idle has one frame; attack has 24 frames, both at 24 fps. `ActionFrame=14` aligns the local attack pose with each recorded launch; native frame numbering and handoff timing remain unverified. Walk, celebration and death metadata remain inspectable but are not imported as rooftop actions. The death row names `barbarian_death_1` with no SWF; its source is not guessed.

[projectiles.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/projectiles.csv) preserves the four `ps_chr_WizardAttack_TowerProjectile` families. Levels 1–4 use tier 1 (speed 500, scale 50), levels 5–7 tier 2 (900, 50), levels 8–9 tier 3 (900, 60), and levels 10–17 tier 4 (900, 65). All specify nontracking, nonballistic, rotating, looping projectiles with `StartHeight=180` and `StartOffset=70`. Their original art comes from [vfx_character.sc](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/sc/vfx_character.sc). Combat now uses source speed divided by 100, with fixed landing coordinates and damage applied once at impact on the selected air/ground layer. Native height/offset conversion and launch handoff remain unverified.

[effects.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/effects.csv) and [particle_emitters.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/csv/particle_emitters.csv) retain eleven effects, 26 emitters and every repeated/variant row. Particle variants inherit an omitted `ParticleSwf` from their containing emitter. This includes all debris variants, smoke, sparks, glows, charge, impact and trail art. Seven unchanged sounds cover three attack samples, hit, destruction, pickup and placing, with original volume/pitch fields retained.

## Artwork and reconstruction

Three original graphs preserve **135 exports, 141 clips and 396 shapes**:

| Graph | Exports | Clips | Shapes | Texture crops |
| --- | ---: | ---: | ---: | ---: |
| Body, scaffolds, rubble and general particles | 53 | 57 | 64 | 5 |
| Rooftop Wizards | 66 | 66 | 242 | 1 |
| Wizard projectiles and effects | 16 | 18 | 90 | 1 |

`native.json` contains source rows, full graphs, source hashes and texture sampling regions. `body.json`, `defender.json` and `effect_art.json` keep original geometry, transforms, colors, blend slots and clip timelines while remapping UVs to lossless crops. `combat.json` and `effects.json` expose focused projections, including projectile tier speed, scale, height, offset, rotation and playback flags. Texture packing copies every required bilinear neighbor without resizing or color baking.

**31 assets total 3,198,493 bytes**: seven texture crops, seventeen transparent previews and seven Ogg files. Each preview composes the original body, base and direction-three idle Wizard at the source origin, at two pixels per native unit in bounds `[-90,-60,90,130]` (360×380). Every transformed vertex is checked against those bounds. Initial tighter margins rejected level 14's original geometry; the output framing was expanded to retain it. Preview framing and rooftop registration are local choices, not verified native projection or an original Info export.

The higher projectile tiers contain isolated screen-blended clips with animated RGB multiplication/addition. The [shared renderer](../../docs/NATIVE-SCENE-RENDERER.md) preserves those container boundaries, applies color after child composition, clamps straight RGB before premultiplication and restores source-over alpha. Normal, screen and additive source enums are retained. Unsupported blends and group alpha addition still fail closed.

```sh
output/native-art-venv/bin/python scripts/import-native-wizard-tower.py --check
output/native-art-venv/bin/python scripts/native-wizard-tower-gpu-fixtures.py --check
npx vitest run tests/native-wizard-tower-reference.test.ts
npm run build
npm run test:wizard-tower:assets
```

## Verification and limits

Independent original-texture witnesses cover **252 cases**: 71 body/general-particle cases, 132 rooftop cases (all directions at idle and attack frames 0, 14 and 23), and 49 effect cases including four deliberately empty frames. Both Chromium and WebKit at DPR 2 pass comparisons with zero changed bytes after forcing a single texture per batch or restoring WebGL context. All reported GL checks are zero. Body cases differ by at most 2 channel values, and effects by at most 4. Maximum per-case mean maximum-channel error is 0.664/255 in Chromium and 0.853/255 in WebKit.

Rooftop comparisons contain nineteen pixels per engine above 16/255, with maximum difference 61/255 and at most 0.1293% of colored pixels in any case. Every such pixel center lies on an original polygon edge or within 0.000001 pixel of it. The CPU and GPU use different boundary coverage/rounding; original geometry and texture regions match. The established mean/fraction thresholds are unchanged. These are sampled reconstruction checks, not evidence of native executable rendering or motion. All seventeen previews and the effect sheet were visually inspected. See [QA.md](../../docs/QA.md) for the release and regression evidence.

All seventeen complete live assemblies additionally pass comparisons with the independent source previews in Chromium and WebKit at DPR 2. Maximum per-level mean maximum-channel errors are 0.296/255 and 0.395/255. Levels 11 and 12 each retain two pixels above 16/255; all other levels stay at or below 16. The established comparison thresholds and source geometry are unchanged. Home checks cover all seventeen selection bounds and preview origins, setup/construction/upgrade/rubble, original Info images and touch placement. Live flight/effect geometry reconstructs exactly after replay seeking; original screen and additive groups survive WebGL context restoration with zero changed bytes.

## Live presentation and fidelity limits

The local isometric scene scales source geometry by 1.2 and places the common body anchor at native `(0, 80)`. Rooftop Wizards retain the original `(0, 0)` foot origin, without additional animation-row scaling. Complete previews display at 216×228 with origin `(0.5, 140/190)`. These choices keep the source bodies, actors, moving ghosts and selection bounds registered to the existing three-tile footprint. The source `DefenderZ` varies by level; its native world-projection relationship is not established by the shared art origin.

Original direction-one/two/three views face right and are mirrored for targets to the left. Local isometric screen vectors choose the nearest of those three views. Source-frame visual inspection corrected an initially reversed mirror rule. The 24 fps attack pose reaches frame 14 at an actual recorded shot, plays the remaining ten frames and prepares the next cast during the final 14/24 seconds of the cooldown. Combat's first shot is not delayed to add a visual windup. Stuns, upgrades, reduced motion and completed battles return the actor to idle. Native directional boundaries, zero-based frame interpretation and exact launch handoff remain unverified.

Fireballs preserve the four source scale values, use a straight path to the fixed launch-time target position and rotate their original positive-Y leading axis into the flight direction. `StartOffset=70` becomes 0.7 map tiles toward the target; `StartHeight=180` becomes 144 display pixels using the local 0.8 altitude scale. Landing registration is 16 display pixels above the ground target, with the scene's additional 46-pixel lift for airborne targets. `ScaleTimeline=TRUE` fits the source clip timeline to flight lifetime; otherwise the original 24 fps clock runs by age. Source offsets, height conversion and timeline-fitting semantics are local interpretations, not measured native executable behavior.

Bounded shot, hit and destruction histories derive from actual combat events without consuming combat randomness. All 26 source emitters use the shared particle equations and their original geometry, blend/color groups, variants and lifetime fields. Tower charge effects inherit the source `OffsetZ=150`, interpreted as 120 display pixels; trail sampling evaluates only births within the live particle window and keeps surviving particles after impact. Empty landings and shots from destroyed towers still produce the original impact feedback. Air impacts sort above flying troops; ground impacts retain ground ordering. Complete native particle behavior, projection and effect pairing remain unverified.

All seven unchanged sounds use the original volume and pitch ranges. All three explicit attack sound rows play with deterministic pitch variation; native layer selection/mixing remains unverified. Accepted pickup/drop gestures use the original samples once, and cancellation removes pending home effects. Valid ghosts preserve original color while blocked ghosts show the placement warning tint. Pause, mute, seeking, finish and scene transitions clean up sample nodes and native views. Reduced motion suppresses transient particles/projectiles and uses an idle rooftop Wizard.

The shipping UI imports, exports, completes and rewinds all six Wizard Tower recordings in both engines, including the unchanged version-34 level-ten file exported before native presentation. All 31 original assets load; images and all seven Ogg files decode in both engines. Chromium repeats asset decoding and all six recordings offline. Replay version 34, save version 4, the home level-six ceiling and native campaign gates remain unchanged. Later campaign mechanics, WebKit offline, physical-device qualification and complete native executable equivalence remain unfinished. The production-clone goal remains active.
