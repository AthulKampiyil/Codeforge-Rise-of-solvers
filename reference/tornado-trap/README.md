# Original Tornado Trap source and campaign integration

Pinned client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, from Supercell's
[original fingerprint](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/fingerprint.json).
`scripts/import-native-tornado-trap.py` checks **14 SHA-256 input pins** and each file's SHA-1
membership in that fingerprint before decoding. Three inputs were newly downloaded from the approved
host for this family: `sc/vfx_env.sc`, `sc/vfx_env_0.sctx` and `sfx/total_suckage_01.ogg`.

```sh
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-tornado-trap.py --check
npx vitest run tests/native-tornado-freeze-reference.test.ts tests/tornado-trap.test.ts \
  tests/tornado-freeze-poses.test.ts tests/tornado-freeze-replay.test.ts
```

The Tornado Trap is the real `BuildingKind` `tornadotrap` (1×1, passable, one hit point, immune to
damage, concealed until triggered). It appears in four villages: **Fireworks Inc.** (index 66, four
level-1 traps), **Ring of Power** (76, one level-1), **Cold Flame** (81, two level-3) and **Corner
Case** (82, four level-3). `TORNADO_TRAP_READY` is true. With every late family implemented, all four
villages are playable and reachable along their original map prerequisites (see
[CAMPAIGN-RULES.md](../../docs/CAMPAIGN-RULES.md#late-goblin-map-villages-6290)).

## Source facts

[traps.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/traps.csv)
record `Tornado Trap` (12000016), levels 1–3 after explicit continuation-row inheritance:

| Field | Level 1 | Level 2 | Level 3 |
| --- | ---: | ---: | ---: |
| TriggerRadius / DamageRadius | 300 / 300 | same | same |
| DurationMS | 5000 | 6000 | 7000 |
| ExportName / ExportNameBroken | `tornado_trap_setup_lvl1` / `tornado_trap_unarmed_lvl1` | `…_lvl2` | `…_lvl2` (reused) |
| ExportNameTriggered | `tornado_trap_lvl1` | `tornado_trap_lvl2` | `tornado_trap_lvl2` |

Every level has MinTriggerHousingLimit 1, AirTrigger and GroundTrigger TRUE, EjectVictims FALSE,
SpeedMod 100, ActionFrame 8, AppearEffect `Shrink Trap Appear` and Spell `Tornado Trap`. The table has
no `HealerTrigger` column; the Healer character keeps `TriggersTraps=TRUE`.

[spells.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/spells.csv)
record `Tornado Trap` (26000025): DeployTimeMS 0, ChargingTimeMS 300, HitTimeMS 375, **Damage 1**,
Radius 400, **NumberOfHits 39/47/55**, TimeBetweenHitsMS 128, RandomRadius 200 (graphics only),
DeployEffect `ps_trap_tornadoTrap`, TornadoForce1–5 **400/300/200/100/100**, TornadoForceAir1–5
**500/400/300/200/150**, TornadoRotationSpeed −180, TornadoSpeedTowardsCenter 75,
TornadoInnerRadius 70, TornadoInnerForcePercent 100 and TornadoOuterForcePercent 65. No
HeroDamageMultiplier is present. [globals.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/globals.csv)
has `TORNADO_SIEGE_FORCE_TIER=1` (no Siege Machines exist in this game). Hit counts times the interval
span each DurationMS within one interval (4.992, 6.016 and 7.040 s).

The client localization describes a vortex that draws enemy troops in and hinders their charge.

## Mechanics and interpretations

The client data does not encode the executable's clocks, trigger scan, membership rule or the
equation that turns the force fields into motion. Every rule below is a **local interpretation**
unless marked as a source value.

| Rule | Implementation | Basis |
| --- | --- | --- |
| Trigger | Live, spawned, non-ejected attacker of either layer within 3 tiles of the tile center, sampled after attacker movement (the `traps` phase); target id is the nearest eligible attacker, then lower id | Source radius/flags; sampling as existing traps. The reconstruction scans every 32 subticks and triggers on any unit inside the radius (strict `<`); not modeled |
| Housing gate | Heroes count 25; every troop meets the limit of 1 | Source; hero value as existing traps |
| Healers | Trigger and are affected | No HealerTrigger column exists; Healer TriggersTraps TRUE |
| Spell deployment | Trigger + ActionFrame/24 fps = 1/3 s | Shrink Trap convention. Reconstruction's `LogicTrapData` uses 1000×ActionFrame/24 ms but ticks at 64 ms, which would add up to about 51 ms |
| Hits | First at deployment + 375 ms, then every 128 ms; 39/47/55 hits | Source; the reconstruction's `LogicSpell.SubTick` schedules hits from deployment and uses ChargingTimeMS only for charging effects |
| Damage | 1 HP per hit to every live, spawned, non-ejected attacker within the **4-tile spell radius** on both layers, heroes included (100%); totals 39/47/55 | Source Damage/NumberOfHits; totals match [SpokLand](https://clashofclans.spokland.com/building/defense/tornado_trap); spell radius, not DamageRadius, as for the Shrink Trap |
| Membership | Each hit refreshes which attackers the vortex carries until the next hit; defenders and buildings are never affected | Spell team rule in the reconstruction's `AreaDamage` |
| Force tier | ceil(housing/3), capped at 5; heroes 5 | [Clash of Clans Wiki](https://clashofclans.fandom.com/wiki/Tornado_Trap) via its [1337wiki copy](https://clash-of-clans.1337wiki.com/tornado-trap/) (heroes and pets 5, Siege Machines 1) |
| Force limit | TornadoForce[tier] (air table for flying units) × distance percent, in character Speed units converted like troop speeds (÷100 tiles/s) | Local; preserves the ratio to walking speed (Barbarian Speed 220 → 2.2 tiles/s) |
| Distance percent | 100% inside 0.7 tiles, linear to 65% at the 4-tile radius | Local reading of Inner/Outer fields |
| Flow | Inward 0.75 tiles/s until the inner radius, plus rotation at 180°/s × current radius; the unit follows this flow at no more than its force limit (the vector is scaled) | Local; small troops settle into a tight orbit, heavy tiers are pulled and spun less, air tiers more (wiki: smaller troops affected more; air spins more at equal tier) |
| Direction | Clockwise on screen (+map X toward +map Y), matching the measured swirl of the original triggered clip | Local registration of the negative source sign |
| Own movement | While carried, the attacker's movement speed is zero, but it keeps its target logic and attacks anything still in range | Wiki: carried troops still attack targets in range and are forced around the trap; reconstruction pushes suspend path movement but not combat |
| Walls and buildings | A ground unit is never carried onto a different tile occupied by a live, known, non-trap building; that step is cancelled, so a unit pulled into a Wall stays stuck until release. Air units ignore footprints | Wiki (stuck on a Wall until the effect ends); reconstruction `UpdatePushBack` passability check; separation's solid-tile rule |
| Release | One interval after the last hit; released units drop their stale route and path again | Reconstruction: push end triggers a new route |
| Interactions | Spring Trap airtime: hit but not carried. Air Sweeper pushes and the vortex both displace. Frozen attackers are still carried. Shrink, Rage and Spell Tower time scaling do not change the vortex clock | Local; reconstruction pushes are independent of freeze |
| One use | One trigger per attack; `battle.traps[id] = { activatedAt, resolved, targetId, x, y }` reveals the trap and resolves at the release time | Existing trap bookkeeping |
| Results | Never delays the battle result (`tornadoTrapPending` is false) | The vortex cannot damage buildings |

Hits catch up once each over wide steps using then-current positions. Carrying integrates each step
from the latest membership; a newly caught unit can be carried for up to one step before its
catching hit. The turn uses a rational (Cayley) rotation by half the turned arc, so only correctly
rounded arithmetic and square roots run: browser engines may disagree on the last bits of
`sin`/`cos`/`atan2`, and portable replays must not. The effective turn per 50 ms step is
2·atan(arc/2r), within 0.001 rad of the arc at the fastest source speeds. This is deterministic and
replay/seek safe, not a claim of step-size-independent native motion. Node and Chromium produce
identical complete battle states at every step in villages 64, 66 and 81.

## Presentation

All art is the retained original graph with unchanged texels, registered at 1.2 screen pixels per
native unit.

- **Body:** before triggering, `tornado_trap_setup_lvl{1|2}` (only visible outside concealed battles
  and in previews). From trigger until release, the triggered clip `tornado_trap_lvl{1|2}` plays its
  `Init` frames 0–8 and then loops the `Attack` section (frames 9–613) as a ground layer. After release,
  or once the battle has finished, `tornado_trap_unarmed_lvl{1|2}`.
- **Reveal:** `Shrink Trap Appear` at trigger: `gen_appear_fx`, Grass particles and
  `shrink_spell_03.ogg` (volume 90, pitch 100).
- **Deploy:** `ps_trap_tornadoTrap` at spell deployment, from `sc/vfx_env.sc`: Shadow, the Model
  particle (the machine bursting out of its box; 614 frames scaled to its 5.375 s life), branches ×2,
  WindStart, Wind and WindOverlay (300 ms delay), plus `total_suckage_01.ogg` (volume 80, pitch
  96–104, drawn from the visual random stream). Source lifetimes are kept; at levels 2–3 the Model and
  Wind end before the longer vortex, leaving the triggered whirl until release.
- **Layers (local):** Shadow, whirl, wind and Model draw below every y-sorted object; particle rows with
  source `IsoLayer=Top` (WindOverlay, branches) draw above troops.
- **Reduced motion:** unarmed body after trigger and one static Wind marker for its lifetime.
- Registration: ground contact (0,20) in the export's coordinates centers the spent box and the whirl's
  hole on the tile, where the Model particle (origin at the spell point) also appears. Previews use
  common bounds `[-51,-24,57,62]` (216×172 at 2 px/native unit).

Assets: **8 files, 1,157,783 bytes** — texture crops 18, 39 and 66 from `sc/buildings.sc`, texture 0
from `sc/vfx_env.sc` (full source layout), two tier previews and two unchanged Ogg files. The
buildings graph retains 11 exports, 20 clips and 58 shapes; the vfx graph 7 exports, 13 clips and 32
shapes. Home-village effects (`Generic Pick Up`, `Generic Placing`, `Trap broken`, `Generic Hit`) keep
their source rows only.

## Evidence

- Reconstruction (older client, no tornado code): [Supercell.Magic](https://github.com/bns34/Supercell.Magic-my-turn/tree/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic)
  `GameObject/LogicTrap.cs`, `Data/LogicTrapData.cs`, `GameObject/LogicSpell.cs`,
  `Level/LogicLevel.cs`, `GameObject/Component/LogicMovementSystem.cs`,
  `GameObject/Component/LogicTriggerComponent.cs`.
- Supercell [October 2018 update notes](https://supercell.com/en/games/clashofclans/blog/news/october-2018-update-patch-notes/)
  (original 3-tile trigger and area, ground and air) and the
  [Spring 2019 balance changes](https://forum.supercell.com/showthread.php/1805186-Spring-Update-2019-New-Levels-and-Balance-Changes)
  (shorter durations); the pinned rows supersede both.
- [House of Clashers sneak peek](https://houseofclashers.com/r/clash-of-clans/en/news/2018/10/20/sneak-pee-tornado-trap-explained/)
  (stalls and spins troops, small damage, one activation).

## Verification

- `tests/native-tornado-freeze-reference.test.ts`: source rows, every campaign placement, packed graph
  transforms/timelines, exact texture sampling regions, previews and Ogg bytes.
- `tests/tornado-trap.test.ts`: levels and force tiers, trigger radius and eligibility, hit schedule
  and catch-up, both layers and heroes, clockwise inward carrying, wall blocking, carried troops that
  still attack in range, release, finished battles and version 43/practice/level rejection.
- `tests/tornado-freeze-poses.test.ts`: body states, effect layers and lifetimes, reduced motion, sounds.
- `tests/tornado-freeze-replay.test.ts`: real deployments in Fireworks Inc. and the level-3 traps in
  Cold Flame reconstruct identically across portable files and backward seeks, without touching the
  home village. `tests/native-campaign-combat.test.ts` now also resolves three armies in Fireworks Inc.
- `tests/browser/tornado-freeze-traps.spec.ts` (standard `playwright.config.ts` and its development
  server): real ground and air deployments in Fireworks Inc. and Cold Flame, isolated level-1/3
  states, reduced motion, armed bodies, replay seeks, and complete battle state hashes equal to Node at
  every step in Chromium and WebKit. Screenshots: `fireworks-{trigger,deploy,vortex,village-vortex,spent}`,
  `cold-flame-{vortex,late-whirl,spent,replay-seek}`, `isolated-tornado-{1-reveal,1-deploy,1-vortex,1-spent,3-vortex,3-late-whirl,3-spent,1-reduced}`,
  `isolated-armed-bodies`; calibration captures `fp-tornado{1,3}-{armed,spent}` show the tile registration.

## Limits

Native executable parity is not claimed. Unverified: the force equation, rotation sign mapping,
inner-radius orbit, tick quantization and 32-subtick trigger scan, strict radius comparisons, hero and
Healer trigger handling, frozen-unit carrying, how the modern engine combines the legacy triggered whirl
with the `vfx_env` Model, particle IsoLayer precedence, and emitter lifetimes at levels 2–3. Carried
troops do not visibly spin their sprites. Sound and particle playback use the shared local samplers.
Browser evidence is under `output/playtest/tornado-freeze/`.
