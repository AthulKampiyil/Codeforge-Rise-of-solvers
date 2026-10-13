# Original Goblin Freeze Trap source and campaign integration

Pinned client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, from Supercell's
[original fingerprint](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/fingerprint.json).
`scripts/import-native-freeze-trap.py` checks **11 SHA-256 input pins** and each file's SHA-1
membership in that fingerprint before decoding. `sfx/freeze_spell_01.ogg` was newly downloaded from the
approved host for this family.

```sh
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-freeze-trap.py --check
npx vitest run tests/native-tornado-freeze-reference.test.ts tests/freeze-trap.test.ts \
  tests/tornado-freeze-poses.test.ts tests/tornado-freeze-replay.test.ts
```

The Goblin Freeze Trap is the campaign NPC identity `freeze-trap` on the passable 2×2 `giantbomb`
archetype, with one hit point; it is never offered in the shop and home saves reject it. It appears in
**Keep Your Cool** (index 64, twelve traps) and **Cold Flame** (81, ten traps), all level 1.
`FREEZE_TRAP_READY` is true. With every late family implemented, both villages are playable and
reachable along their original map prerequisites (see
[CAMPAIGN-RULES.md](../../docs/CAMPAIGN-RULES.md#late-goblin-map-villages-6290)).

## Source facts

[traps.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/traps.csv)
contains two records sharing art and the `FreezeTrap` spell:

| Record | GlobalID | Availability |
| --- | ---: | --- |
| `FreezeBomb` (Freeze Trap) | 12000009 | Calendar-enabled, TH1 |
| `FreezeTrap_SinglePlayer` (Goblin Freeze Trap) | 12000018 | Disabled, TH9999 |

The campaign identity has Width/Height 2, TriggerRadius 200, DamageRadius 300, MinTriggerHousingLimit
1, AirTrigger and GroundTrigger TRUE, DurationMS 5000, SpeedMod 100, ActionFrame 14, EjectVictims
FALSE, AppearEffect `Bomb Appear` and exports `Freeze_trap_armed`, `Freeze_trap_trigger` and
`Freeze_trap_unarmed`. There is no `HealerTrigger` column.

[spells.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/spells.csv)
record `FreezeTrap` (26000018): DeployTimeMS 0, ChargingTimeMS 300, **HitTimeMS 10**, **Radius 350**,
**NumberOfHits 1**, RandomRadius 400 (graphics only), **FreezeTimeMS 5000**, **FreezeOuterTimeMS
4500**, DeployEffect `Freeze deploy lvl1`, DeployEffect2 `Freeze deploy2 lvl1`, ScaleByTH TRUE and no
Damage field (so TH scaling changes nothing). The client localization says the trap stops attackers in
their tracks.

## Mechanics and interpretations

| Rule | Implementation | Basis |
| --- | --- | --- |
| Trigger | Live, spawned, non-ejected attacker of either layer (Healers included) within 2 tiles of the 2×2 center, sampled after attacker movement; nearest eligible attacker recorded as target | Source radius/flags; Shrink Trap sampling convention |
| Spell deployment | Trigger + ActionFrame 14/24 fps (the last frame of the 14-frame trigger clip) | Shrink Trap convention; reconstruction tick quantization not modeled |
| Hit | Once, at deployment + 10 ms | Source HitTimeMS/NumberOfHits; the reconstruction's 60-subtick conversion makes it immediate |
| Area | Every live, spawned, non-ejected attacker within the **3.5-tile spell radius**, both layers, heroes and summoned troops included; never defenders or buildings | Spell radius (DamageRadius retained); reconstruction `AreaFreeze` skips the caster's team. [Clash of Clans Wiki](https://clashofclans.fandom.com/wiki/Freeze_Trap): freezes ground and air troops, heroes can still use abilities, their later spawns are not frozen |
| Duration | 5 s at the center to 4.5 s at the radius, reduced with the **squared** distance ratio | FreezeTimeMS/FreezeOuterTimeMS; the squared shape follows the reconstruction's `AreaFreeze`, which cut freeze ticks by distance² (it also delayed outer freezes by up to one 64 ms tick; not modeled) |
| Later arrivals | Not frozen: the spell has exactly one hit | Source NumberOfHits 1 |
| While frozen | No movement and no attacks (`freezeTrapHolds`); attack cooldown does not advance | Reconstruction `IsFrozen` zeroes speed and clears combat timers |
| On freeze | The attacker forgets its target, defender target and route | Reconstruction clears combat targets and the path while frozen |
| Overlap | A second freeze keeps the later expiry; a freeze after thawing starts a new interval | Reconstruction `Freeze(time, delay)` maximum rule |
| Other effects | Tornado Traps still carry frozen attackers; Air Sweeper pushes and Spring Trap airtime keep their own clocks; the King's ability stays usable | Local; reconstruction pushes run independently of freeze |
| One use | One trigger per attack; `battle.traps[id]` reveals the trap and resolves at the hit | Existing trap bookkeeping |
| Results | Never delays the battle result (`freezeTrapPending` is false) | The freeze cannot damage buildings |

Freeze expiry is evaluated per 20 Hz step (at most one step of quantization). The
[2016 community guide](https://clashfordummies.com/2016/12/28/clash-of-clans-new-freeze-trap-strategy/)
reports a 5-second freeze, a 2-tile trigger and an observed area of about 4.5 tiles; the pinned
3.5-tile spell radius (the level-1 [Freeze Spell](https://clashofclans.fandom.com/wiki/Freeze_Spell)
radius) is used instead, and the observation likely includes the 4-tile graphics-only random radius.

## Presentation

- **Body:** `Freeze_trap_armed` before triggering; afterwards the unarmed compartment, with the separate
  `Freeze_trap_trigger` bottle rising over it for 14/24 s (frame 13 is intentionally empty).
- **Reveal:** `Bomb Appear` at trigger: `gen_appear_fx`, Grass particles and `bad_move_06.ogg`
  (volume 80, pitch 100).
- **Deploy:** at spell deployment, `Freeze deploy lvl1` (blue glow, three frost-star emitters;
  `freeze_spell_01.ogg`, volume 80, pitch 90) on the ground layer and `Freeze deploy2 lvl1` (dot flakes
  and crystals) above troops (its source IsoLayer is Top).
- **Frozen troops:** screen-tinted `#5fa8e8` with frame, hover and King pose clocks stopped while frozen. The
  source contains no per-troop freeze art, so this tint is a local presentation choice.
- **Reduced motion:** spent compartment, a static glow for its lifetime and the frozen tint.
- Registration is the Shrink Trap compartment calibration: 1.2 screen pixels per native unit and ground
  contact (0,50). Previews use common bounds `[-58,-84,63,88]` (242×344 at 2 px/native unit).

Assets: **7 files, 179,117 bytes** — texture crops 18, 39 and 66, armed and unarmed previews, and two
unchanged Ogg files. The graph retains 17 exports, 19 clips and 12 shapes. Home-village effects keep their
source rows only.

## Evidence

Reconstruction (older client): [Supercell.Magic](https://github.com/bns34/Supercell.Magic-my-turn/tree/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic)
`Level/LogicLevel.cs` (`AreaFreeze`), `GameObject/LogicGameObject.cs` (`Freeze`, `IsFrozen`),
`GameObject/LogicSpell.cs`, `GameObject/LogicTrap.cs`,
`GameObject/Component/LogicCombatComponent.cs` and `GameObject/Component/LogicMovementSystem.cs`.
It predates FreezeOuterTimeMS, so its distance rule is used only for the reduction's shape.

## Verification

- `tests/native-tornado-freeze-reference.test.ts`: both identities, spell fields, every campaign
  placement, packed graph integrity, exact texture sampling regions, previews and Ogg bytes.
- `tests/freeze-trap.test.ts`: trigger radius and eligibility, one hit with the distance handoff, no
  effect on defenders or later arrivals, held movement/attacks and recovery in the full simulation,
  overlap and presentation clocks, tornado interaction, finished battles, and version 43/practice/
  archetype/level/home-save rejection.
- `tests/tornado-freeze-poses.test.ts`: compartment and bottle, both deploy effects and layers, reduced
  motion and sounds.
- `tests/tornado-freeze-replay.test.ts`: real deployments in Keep Your Cool and Cold Flame reconstruct
  identically across portable files and backward seeks. `tests/native-campaign-combat.test.ts` now also
  resolves three armies in Keep Your Cool.
- `tests/browser/tornado-freeze-traps.spec.ts`: real ground and air deployments in Keep Your Cool and Cold
  Flame, isolated states with the screen tint and its reset, replay seeks, and Node-equal battle state
  hashes at every step in Chromium and WebKit. Screenshots:
  `keep-your-cool-{bottle,burst,frozen,village-frozen,thawed}`, `cold-flame-freeze`,
  `isolated-freeze-{bottle,burst,frozen,thawed}` and `isolated-armed-bodies`; calibration captures
  `fp-freeze-{armed,spent}` compare the compartment registration with the Shrink Trap.

## Limits

Native executable parity is not claimed. Unverified: the modern center-to-edge freeze formula, outer
freeze delays, tick quantization of the ActionFrame handoff, whether frozen troops keep or reset attack
progress, frozen-unit carrying by tornadoes, strict versus inclusive radius comparisons, particle IsoLayer
precedence and the frozen troop appearance. Browser evidence is under `output/playtest/tornado-freeze/`.
