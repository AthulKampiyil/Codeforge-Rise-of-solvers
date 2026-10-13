# Late Goblin campaign buildings

Pinned client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`. [`scripts/import-native-late-goblin-buildings.py`](../../scripts/import-native-late-goblin-buildings.py) verifies each of its **27 SHA-256 input pins** and each input's SHA-1 membership in the original [fingerprint.json](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/fingerprint.json). The same importer also produces the [armed Builder's Hut reference](../builder-hut/README.md). `--check` regenerates every record, texel, preview, sound and reference byte and compares the shipped file set. Original artwork and audio belong to Supercell.

This family covers the Communications Mast, Goblin Hall levels 1–2 with the `GoblinTh02` weapon, the Goblin Castle and Foreboding Cave bodies, and the Goblin Boss Town Hall with the `GoblinBossTH` weapon. Castle and Cave troop releases belong to the garrison family. Combat exists only in version-44 `goblin-v1` battles (`battle.late.goblinBuildings`); version 43 and earlier recordings reject these identities. `LATE_GOBLIN_BUILDINGS_READY` is true, and with every other late family complete all affected villages are playable.

## Source records

[buildings.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/buildings.csv) supplies these rows. Blank level-2 fields inherit from level 1.

| Identity | GlobalID | Footprint | HP | BuildingClass | Displayed body | Base | Ruin |
| --- | ---: | --- | ---: | --- | --- | --- | --- |
| Communications mast | 1000016 | 2×2 | 250 | Npc | `comm_mast_lvl1` | `comm_mast_base` | `destroyedBuilding_2s_pit_wood` |
| Goblin Hall 1 | 1000017 | 4×4 | 750 | Npc Town Hall | `goblin_townhall_lvl1` | `goblin_townhall_base` | `destroyedBuilding_4m_base_woodpanel_yellow` |
| Goblin Hall 2 | 1000017 | 4×4 | 7,500 | Npc Town Hall | `goblin_th02` | `goblin_townhall_base` | same |
| Goblin Castle | 1000061 | 3×3 | 4,000 | Npc | `goblin_clancastle_01` | `alliance_castle_base` | `alliance_castle_lvl1_broken` |
| Foreboding Cave | 1000062 | 4×4 | 25,000 | Npc | `deco_dragoncave_01` | `alliance_castle_base` | `alliance_castle_lvl1_broken` |
| Goblin Boss TH | 1000069 | 4×4 | 50,000 | Npc Town Hall | `goblin_th02` (row: `goblin_clancastle_01`) | `goblin_townhall_base` | `destroyedBuilding_4m_base_woodpanel_yellow` |

All identities use `Building Destroyed`. The Goblin Hall and Boss rows carry `ActivatedCombatAddBuildingClass=Defense`; Goblin Hall 2 adds `ActivateCombatOnDamageTaken=1`, `CombatActivationDelay=500` and `Weapon=GoblinTh02`. The Boss row adds `CombatActivationDelay=500`, `DamageRadius=100`, `AnimationActionFrame=15` and `Weapon=GoblinBossTH`, without `ActivateCombatOnDamageTaken` or `ActivateAfterSeconds`. The Communications mast has no weapon or DPS. The `comm_mast_lvl1_broken` exports reuse the intact shapes, so `ExportNameDamaged` supplies its ruin. [globals.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/globals.csv) sets `HIDDEN_BUILDING_APPEAR_DESTRUCTION_PERCENTAGE=50`.

[weapons.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/weapons.csv) and [projectiles.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/projectiles.csv):

| Weapon | Range | AttackSpeed | DPS → per hit | Targets | Projectile | Effects |
| --- | ---: | ---: | --- | --- | --- | --- |
| `GoblinTh02` | 1000 | 200 ms | 150 → 30 | ground and air, `NumMultiTargets=3` | `Goblin Townhall Arrow`: `arrow_ammo_small` from `sc/characters.sc`, speed 1800, StartHeight 190, StartOffset 50, tracking, rotating | attack `Goblin Townhall Attack`, hit `Generic Hit`, activation `Goblin Townhall Activate` |
| `GoblinBossTH` | 1100 | 1100 ms | 300 → 330 | ground only, `MultiTargets=TRUE` without `NumMultiTargets` | `Bomb Tower Ammo1`: `bomb_projectile_lvl1`, speed 800, StartHeight 200, StartOffset 10, not tracking, `mortar_trail`, `simple_shadow_small` | attack `Bomb Tower Throw Start`, hit `Bomb Tower Hit` |

`goblin_th02` has 68 frames at 24 fps with labels `deactive_idle=0`, `active_start=2` and `active_idle=35`; its eight barrels rise at frame 14, exactly 500 ms after `active_start`. `deco_dragoncave_01` loops 60 frames.

## Interpretations

**Weapon record.** Goblin Hall 2 also retains older inline fields: `DPS=120`, `AttackSpeed=500`, `AttackRange=1000`, `Tesla Attack_4` and `Tesla Hit`. Combat uses the referenced `GoblinTh02` record; the importer requires both sets and keeps the inline fields as evidence. Public descriptions of a Giga-Tesla-like hall weapon ([Fandom Single Player Campaign](https://clashofclans.fandom.com/wiki/Single_Player_Campaign), excerpt only) do not decide between the two. The weapon record matches the displayed arrow launcher.

**Boss body.** The Boss row names `goblin_clancastle_01`, but its weapon names `goblin_th02`. Town Hall 12–17 weapon rows in the same table name the complete weapon-bearing hall exports (`town_hall_lvl17_t1`–`t5`), so the live scene displays the weapon export for both armed halls. Public guides describe a level-7 Goblin throwing bombs from the Madhouse roof ([Fandom](https://clashofclans.fandom.com/wiki/Single_Player_Campaign)); no pinned export or animation row for that rooftop character was found, so none is drawn.

**Activation.** Goblin Hall 2 activates on the first 50-ms simulation step on which it has lost hitpoints or battle destruction exceeds 50%. The destruction clause combines the global with the documented Giga Tesla behaviour of appearing when damaged or at 51% ([Fandom Town Hall/Giga Tesla](https://clashofclans.fandom.com/wiki/Town_Hall/Giga_Tesla), excerpt) and the older engine's strict `>` test in [LogicBuilding.UpdateHidden at 52c5953](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/LogicBuilding.cs). That older engine polls hidden buildings every 512 ms; this local rule checks every step. Combat starts after `CombatActivationDelay`. The Boss has no activation fields, so it activates at combat start and fires from 0.5 s. Both halls gain the Defense target class at that ready time; whether the class is added at activation or after the delay is unverified.

**Timing and targeting.** Weapons run on integer 64-ms combat ticks, the first 64 ms after combat starts. Each slot adds 64 ms per tick, fires when it reaches `AttackSpeed` and keeps `min(timer − AttackSpeed, AttackSpeed)`; acquiring a target resets it. This follows the hit timer in the older [LogicCombatComponent at 52c5953](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/Component/LogicCombatComponent.cs), a 9.256.x reconstruction rather than proof of 18.400.21 behaviour. Candidates are living, spawned, non-ejected attackers on permitted layers within `AttackRange/100` tiles of the footprint centre, without an added margin. They are ordered by distance, then ID. Slots keep eligible targets, never share one and fill in slot order. `GoblinTh02` uses three slots; the Boss's absent `NumMultiTargets` is read as one. `spellTowerDefenseBoost`, evaluated at each tick time, scales both the tick increment and damage. Native multi-target selection is not reproduced.

**Projectiles.** Speeds are source units divided by 100: 18 and 8 tiles/s. Damage per hit is `DPS × AttackSpeed / 1000`. Arrows track their target like the X-Bow bolts; one that loses its target lands without damage or hit effect. Bombs land at the target's launch-time position and damage every ground attacker within `DamageRadius/100 = 1` tile. Air attackers are never hit. Projectiles in flight resolve even after their hall falls, and battles wait for them before finishing.

## Artwork and live presentation

The building graph keeps **46 exports, 56 clips and 103 shapes** from `sc/buildings.sc`, sampled from eight losslessly cropped textures (`buildings_2`, `_5`, `_8`, `_13`, `_14`, `_25`, `_37`, `_39`). The arrow graph keeps one export, two clips and two shapes from `characters_7`. Normal and additive blends are retained. The closure contains six effects, eight emitters and six unchanged Ogg files with their volume, delay and pitch ranges. **20 shipped files total 1,201,021 bytes**: nine texture crops, five transparent previews at two pixels per native unit and six sounds.

The scene uses the existing local registration: body scale 1.2 with native ground anchors `(0, 40)` for 2×2 and `(0, 80)` for 3×3 and 4×4. `goblin_townhall_base` is fitted to the four-tile diamond using bounds `[-112.5, -15.85, 111.25, 178.95]`. `alliance_castle_base` contains only an empty clip and the edit-mode shadow, which is hidden as in the Clan Castle presentation. These are local projection choices, not native camera parity.

Everything is derived from battle state and `context.elapsed`, so replay seeks reconstruct identical views. Armed halls hold `deactive_idle` until activation, then play `active_start` and loop `active_idle`; their nested flag keeps an absolute 24-frame phase. The Cave and Goblin Hall 1 run on the battle clock. Activation plays its sound-only effect. Attacks play their original sounds, with Bomb Tower trail particles for Boss bombs. Hits use their original effects, lifted for airborne targets. Ruins play once from the recorded destruction time and then hold. Arrows use `StartOffset` and `StartHeight × 0.6`, the Archer Tower altitude convention, and rotate their +Y tip toward the target. Bomb spin and a 42-pixel arc are local presentation because the row is non-ballistic. Reduced motion suppresses projectiles and particles, except a faint static `bomb_tower_area_edge` landing marker, and shows active halls at `active_idle`.

Late campaign buildings skip the generic ruin-ground ellipse because their original ruins include scorched ground. The generic destruction sparks, smoke puff, synthesized sound and camera shake still play beside the original `Building Destroyed` effect. The ruin collapse also stops advancing when the battle finishes on that destruction, because presentation follows the battle clock.

## Reproduction and checks

```sh
PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-late-goblin-buildings.py --check
npx vitest run tests/late-goblin-buildings.test.ts tests/late-goblin-buildings-replay.test.ts tests/late-goblin-buildings-boost.test.ts tests/late-goblin-buildings-art.test.ts tests/builder-hut.test.ts
npx vite --host 127.0.0.1 --port 5314 --strictPort &
npx playwright test tests/browser/late-goblin-buildings-live.spec.ts
```

Unit tests cover source values and campaign placements, the label timeline, and the passive Goblin Hall 1. They also cover activation by damage and by destruction, Boss start-of-combat readiness, three distinct tracked arrows, ground-only Boss splash, and pending in-flight projectiles. Target-class tests show Defense preference starting only at `readyAt` and the Goblin Castle leaving resource preference. Version-43 rejection, texture/preview/sound integrity and the activation geometry are checked as well. Spell Tower boosts share the scheduler and are tested on the hut turret. Replay tests record real deployments in Besieged (73), Builderopolis (84) and M.O.M.M.A's Madhouse (89). Each round-trips through a portable file, then checks backward and forward seeks against live snapshots. The browser spec renders all five verification villages (67, 73, 74, 84, 89), then checks activation, arrows, bombs, ruins and backward-seek presentation. Screenshots are written under `output/playtest/late-goblin-buildings/`.

## Remaining limits

- Native activation timing, target-class timing, multi-target selection, range margin and projectile launch handoff are local interpretations.
- The Madhouse rooftop bomb-throwing Goblin has no identified pinned art; bombs launch from the hall centre.
- Arrow and bomb heights use the local 0.6 altitude scale; bomb spin, arc and the arrow's hit offset are presentation choices.
- `PitchIncrease=2` on `Goblin Townhall Attack` and effect `IsoLayer` values are retained but not interpreted.
- Goblin Castle and Foreboding Cave releases, the Madhouse Mega P.E.K.K.A and all defending troops belong to other families.
- Generic destruction feedback overlaps the original effect, and native particle projection remains unverified.
- Opening these buildings also opens Flagged for Traps (71), whose Dark Elixir and Elixir Storages are ringed by other buildings. The shared pathfinder blocks whole-tile building footprints, whereas source `BuildingW`/`BuildingH` values are one tile smaller and leave lanes. Resource-first Goblins can therefore stand idle there; the native combat robustness test names this case.
