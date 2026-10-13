# Original Shrink Trap source

Pinned client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, from Supercell's [original fingerprint](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/fingerprint.json). The importer checks all **14 SHA-256 input pins** and each file's SHA-1 membership in that fingerprint before decoding it.

The original trap bodies, bottle animation, direct reveal clip, aura, particle variants, sounds and mechanical source fields are now integrated in Magic Practice. All eight original campaign placements remain intact. [The implementation notes](../../docs/SHRINK-TRAP.md) distinguish retained facts from local clock, radius, recovery and visual choices.

## Identity and source fields

[traps.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/traps.csv) contains two distinct records:

| Record | GlobalID | Availability fields |
| --- | ---: | --- |
| `ShrinkTrap` | 12000015 | Calendar-enabled, source TH1 |
| `ShrinkTrap_SinglePlayer` | 12000017 | Disabled, source TH9999 |

Only the second identity appears in the pinned campaign: eight level-one placements in **Magic Practice, native stage 55**. The disabled/home fields must not erase explicit NPC layout entities or expose the old seasonal trap as a permanent home purchase. Both rows share a passable 2×2 footprint, two-tile trigger radius, three-tile damage-radius field, minimum trigger housing of one, ground/air triggering, 20,000 ms duration and `ActionFrame=14`. Both name the same `ShrinkTrap` spell and original armed/unarmed/trigger art.

[spells.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/spells.csv) retains the spell's separate fields:

| Field | Source value |
| --- | ---: |
| GlobalID | 26000021 |
| Deploy time | 0 ms |
| Charging time | 300 ms |
| Hit time | 1,000 ms |
| Radius | 400 native units |
| Number of hits | 75 |
| Interval between hits | 250 ms |
| Random radius | 400 native units, graphics only |
| `ShrinkReduceSpeedRatio` | −50 |
| `ShrinkHitpointsRatio` | 50 |

[globals.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/globals.csv) contains `SHRINK_SPELL_DURATION_SECONDS=7`. These values are preserved separately. The trap's three-tile radius, spell's four-tile radius, 20-second duration, pulse clock and seven-second status field do not by themselves establish how the native executable combines activation, area membership and recovery.

## Health behavior changed after the original event

Supercell's [August 2017 announcement](https://supercell.com/en/games/clashofclans/blog/news/week-3-season-of-the-witch/) describes a 20-second trap that halves movement speed, attack speed and health. Its [February 2022 release notes](https://supercell.com/en/games/clashofclans/blog/release-notes/quality-of-life-bonus-update-2/) explicitly remove the health reduction. Consequently, the retained `ShrinkHitpointsRatio=50` field and old descriptive text are historical source facts, not sufficient evidence for reducing HP in this modern client. The [behavior evidence](behavior-evidence.json) records both official announcements and requires preserving current and maximum HP. The current source projection deliberately does not invent a gameplay health multiplier. Movement/attack slowdown, refresh/recovery, overlap and hero interactions now have explicit local rules and tests; native ordering remains unverified.

## Original graphics and sound

The retained [buildings.sc](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/sc/buildings.sc) graph contains **23 exports, 25 clips and 35 shapes**, sampling three original SCTX textures. Packing copies every required bilinear neighbor without resizing, color baking or modifying geometry, transforms, timeline slots or container blends.

| Export | Frames | FPS | Observation |
| --- | ---: | ---: | --- |
| `Shrink_trap_armed` | 1 | 24 | Original flask, wooden compartment and small tree |
| `Shrink_trap_unarmed` | 1 | 24 | Original empty compartment |
| `Shrink_trap_trigger` | 14 | 24 | Separate rising flask; final frame 13 is empty |
| `gen_appear_fx` | 18 | 30 | Direct reveal clip; first and last frames are empty |
| `shrink_glow` | 601 | 24 | Original animated aura geometry and color transforms |
| `shrink_range` | 1 | 24 | Original ground range primitive |
| `shrink_circle` | 1 | 24 | Intentionally empty retained export |

The trigger contains only the flask. Live playback registers it beside the unarmed ground compartment with a shared locally calibrated root. Source `ActionFrame=14` lies at the end of the 14-frame clip under a zero-based local interpretation. Native frame numbering, spell handoff and empty terminal-frame behavior remain unverified; the importer preserves every frame.

Six [effect records](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/effects.csv) retain eight [particle emitters](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/csv/particle_emitters.csv), including all repeated variant rows. The deploy effect combines grass, glow, range, the empty circle export and confetti. Aura emitters retain their 20-second lifetimes. Confetti variants use additive/normal/additive/additive blends, respectively; those explicit variant choices remain distinct. Live projection, scale, color, fade and lifetime combination use the shared renderer and retained source fields, with documented local interpretations.

**Nine assets total 217,901 bytes**: three lossless texture crops, two transparent previews and four unchanged Ogg files. Previews use common bounds `[-55,-84,58,86]`, covering every trap frame with eight native units of padding, at two pixels per native unit (226×340). Their shared source origin is preserved; preview framing is a local choice. The source names the armed world export as its BigPicture, without a separate UI portrait.

The trigger uses `shrink_spell_03.ogg`, volume 90 and pitch 100. Original generic pickup, placing and hit samples are also retained because the trap records reference them. Their presence is not a claim that every generic effect should fire during a damage-free shrink pulse.

## Reproduction and verification

```sh
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-shrink-trap.py --check
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/native-shrink-trap-gpu-fixtures.py --check
npx vitest run tests/native-shrink-trap-reference.test.ts
npm run build
npm run test:shrink-trap:assets
```

Independent source-texture witnesses cover **59 cases**, including every trigger frame, sampled long-aura phases, all exports, eight nested range phases and six explicit additive particle variants. Five cases are intentionally empty: the trigger's final frame, reveal endpoints and the empty circle sampled with both source/export and emitter blend settings. Expected pixels come from full original textures through the independent CPU compositor. Browser comparisons use the packed runtime graph, exercise single-texture batching and context restoration, and retain the established mean/fraction error criteria. See [QA.md](../../docs/QA.md) for actual results and limitations.

This is source reconstruction and a tested local integration, not proof of native executable rendering or combat parity. World registration, area/clock semantics, debuff application/recovery, sound, reduced motion and live replay are documented in the implementation notes. Magic Practice is enabled with its native prerequisite. Replay version 34 remains compatible for previous identities; new Shrink Trap records require that identity to be understood by the viewer. Home save version remains 4.
