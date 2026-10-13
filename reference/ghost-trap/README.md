# Ghost Trap

Pinned public client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`. The Ghost Trap is the campaign NPC identity `ghost-trap`: `traps.csv` 12000019, one level, 1×1, bomb archetype. Go to Bat (index 75) places twelve and Suspicious Gap (index 77) six. The campaign gate accepts it from version-44 recordings (`GHOST_TRAP_READY`). Implementation: `src/game/ghost-trap.ts`, `ghost-trap-art.ts` and `ghost-trap-scene.ts`.

## Source

The row is captured by `scripts/import-native-characters.py` into `reference/characters/catalog.json` (`trapSpawners`), with `logic/traps.csv` SHA-256 pinned and fingerprint SHA-1 verified. Values used:

| Field | Value | Use |
| --- | --- | --- |
| `TriggerRadius` | 500 | 5 tiles from the trap center |
| `GroundTrigger` / `AirTrigger` | TRUE / FALSE | Only ground attackers trigger it |
| `MinTriggerHousingLimit` | 1 | Any troop; Heroes count as 25 (Skeleton Trap convention) |
| `SpawnedCharGround`, `SpawnLvl` | Royal Ghost, 7 | Royal Ghost row 7 (1-based: Skeleton Trap 5 names `SpawnLvl=2` of two Trap Skeleton rows) |
| `NumSpawns`, `SpawnInitialDelayMs`, `TimeBetweenSpawnsMs` | 1, 600, 150 | One ghost 0.6 s after the trigger |
| `ExportName` / `ExportNameTriggered` / `ExportNameBroken` | `troop_trap_land_lvl3_setup` / `troop_trap_land_lvl1` / `troop_trap_land_lvl1_unarmed` | Coffin art |
| `ActionFrame` | 37 | Retained; not used for spawn timing (the explicit delay is) |

Royal Ghost 7 (`characters.csv`): 300 HP, 720 DPS at 1,000 ms, range 0.5, speed 2, ground only, `NewTargetAttackDelay` 2,400, `FrostOnHitTime` 4,000 and `FrostOnHitPercent` 50, `RoyalGhostAbility` 1 (`IsInvisible`, `IgnoreObstacles`, `ActiveAfterPlaceCommand`, `DeactivateAfterTime` 10,000). Its behavior is documented with the other garrison families in [the garrison reference](../garrison/README.md#remaining-defending-families-version-44).

## Mechanics and interpretations

- **Trigger.** The first 20 Hz step where a live, spawned, non-ejected ground attacker is within 5 tiles triggers the trap, in the `traps` late phase. The nearest such attacker (ties by ID) is recorded. The trap also records `battle.traps[id]`, so the model's trap visibility and bookkeeping apply: an untriggered Ghost Trap stays concealed. The [older LogicTriggerComponent](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/Component/LogicTriggerComponent.cs) polls on a coarser tick cadence and uses a strict radius; the per-step check follows the existing Skeleton Trap implementation (local).
- **Spawn.** The spawn time follows the Skeleton Trap convention (`SpawnInitialDelayMs`, then `TimeBetweenSpawnsMs`). The position follows the [older LogicTrap.SpawnUnit](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/LogicTrap.cs): 384 internal units (0.75 tiles) from the trap center at `360·i/NumSpawns + 59·remaining % 360` degrees. That is 59° for the single ghost, computed with the source integer sine table, then the nearest passable point within 3 tiles; the spawn is skipped if there is none. `SetSpawnTime(200)` then the minimum 10 ms SpawnIdle make the ghost inactive and untargetable for 210 ms.
- **Stealth.** The ability is read as active from the spawn for 10 s (trap spawns have no place command; uncertain). [Fandom](https://clashofclans.fandom.com/wiki/Royal_Ghost) describes stealth after deployment (12 s in an older version) that ignores walls, and [Fandom's Skeleton Trap page](https://clashofclans.fandom.com/wiki/Skeleton_Trap) lists Royal Ghost traps in some campaign levels.
- **Bookkeeping.** `battle.late.ghostTrap.traps[id]` stores the activation time and spawned defender IDs. The trap never blocks the battle result; the ghost is an ordinary garrison defender afterwards.

## Presentation

The three exports the row names are already captured losslessly by the Skeleton Trap native import (`reference/skeleton-trap/native.json`, tiers 3 and 1): the armed tier-3 setup coffin, the tier-1 43-frame trigger clip at 24 fps, and the tier-1 unarmed coffin. `GhostTrapPresentation` draws them from state: the armed frame while visible at home, the trigger clip from the recorded activation clamped to its last frame, and the broken coffin under reduced motion. Previews and portraits use the armed coffin. Registration is the Skeleton Trap's local calibration. Sounds (`AppearEffect` "Skeleton Trap") are not wired.

## Verification

`tests/ghost-trap.test.ts` covers the source row, trap counts in both villages, coffin frame selection, ground-only triggering at 5 tiles, the source spawn offset and timing, stealth and idle windows, frost on hit, and a portable Go to Bat recording with backward seeks and version-43 rejection. `tests/browser/defending-troops-live.spec.ts` deploys at a Go to Bat Ghost Trap and captures the triggered coffin, the translucent concealed ghost and its attack (`output/playtest/defending-troops/live-75-*`). Limits: the exact modern trigger cadence, spawn-time/ActionFrame alignment and whether the invisibility ability activates for trap spawns remain unverified.
