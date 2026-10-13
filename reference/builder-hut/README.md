# Armed campaign Builder's Hut

Pinned client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`. The [late Goblin building importer](../late-goblin-buildings/README.md) also captures this family from the same 27 SHA-256 pins, each checked for SHA-1 membership in the original [fingerprint.json](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/fingerprint.json). Original artwork and audio belong to Supercell.

The nail turret is complete for campaign Builder's Huts in version-44 `goblin-v1` battles (`battle.late.builderHut`). Home huts, practice battles and every version-43 or older recording stay passive and keep their ordinary sprite. Each armed hut also sends out a `Defending Builder`, implemented in `src/game/defending-builder.ts` (see `reference/garrison/README.md`). With both halves in place `BUILDER_HUT_READY` is **true**, so levels 2–4 no longer gate villages 80–85 and 87–89.

## Source records

[buildings.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/buildings.csv) row `Builders Hut`, GlobalID `1000015`, 2×2. Campaign villages use levels 1–4; Builderopolis (84) contains all four.

| Level | HP | DPS → per 400-ms hit | Body | Ruin | Projectile | Defending Builder level |
| ---: | ---: | --- | --- | --- | --- | ---: |
| 1 | 250 | — | `worker_building` | `destroyedBuilding_2s_pit_wood_darkbrown` | — | — |
| 2 | 1,000 | 80 → 32 | `worker_building_armed_lvl1` | `rockWood_destructed_tiles2_battlebuilder` | `Nail Ammo` | 1 |
| 3 | 1,300 | 100 → 40 | `worker_building_armed_lvl2` | same | `Nail Ammo` | 2 |
| 4 | 1,600 | 120 → 48 | `worker_building_armed_lvl3` | same | `Nail Ammo 2` | 3 |

Armed levels share `AttackRange=700`, `AttackSpeed=400`, ground and air targets, `AnimateTurret=TRUE`, `WakeUpSpace=1`, `WakeUpSpeed=1600`, `ActivatedCombatAddBuildingClass=Defense`, `worker_building_base`, `Nailgun Attack FX`, `Generic Hit`, `DefenceTroopCharacter=Defending Builder` and `DefenceTroopCount=1`. [projectiles.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/projectiles.csv) gives both nails speed 1800, StartHeight 160, StartOffset 100, BallisticHeight 50 and tracking. [globals.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/globals.csv) sets unit, spell, hero and Clan Castle housing multipliers to 100, 500, 100 and 0. [heroes.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/heroes.csv) gives the Barbarian King 25 housing.

Supercell's [Battle Builders announcement](https://supercell.com/en/games/clashofclans/blog/game-updates/battle-builders-2/) (April 2021) corroborates the DPS and HP of levels 2–4. It also says the huts become defenses targeted by troops that prefer defenses. It gives a 6-tile range; the pinned row's 700 is used.

## Interpretations

**Wake-up.** The older [LogicCombatComponent at 52c5953](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/Component/LogicCombatComponent.cs) keeps a building idle until the battle log's deployed housing reaches `WakeUpSpace`. It then lowers `WakeUpSpeed` by 64 ms per tick and continues combat on the tick the countdown reaches zero. Its [LogicBattleLog](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Battle/LogicBattleLog.cs) adds `multiplier × HousingSpace × count / 100` for each deployment. Locally, deployed troops, spells and the King are counted with the pinned multipliers; garrison defenders never count. The first 64-ms combat tick observing at least one housing space records `wakeAt`. `readyAt` is the tick on which 1,600 ms have been subtracted, so a hut that wakes on tick 1 fires from tick 25 (1.6 s). This 9.256.x reconstruction is supporting evidence, not proof of 18.400.21 timing.

**Combat.** The turret uses the shared late Goblin weapon scheduler: one slot, 64-ms ticks, a 400-ms hit timer reset on acquisition, nearest eligible attacker within 7 tiles of the footprint centre with ID ties, and `spellTowerDefenseBoost` at each tick time on rate and damage. Nails travel 18 tiles/s, track their target and do nothing if it is gone on arrival. From `readyAt`, active huts count as Defense targets for Giants, Balloons and other defense-preferring troops, in both the ordinary attacker loop and the garrison-aware target check. Level 1 never wakes. Destroyed huts clear their slot, but nails already in flight still resolve.

**Defending Builder hook.** `builderHutActivation(battle, hut)` returns the armed level, `wakeAt`, `readyAt` and `destroyedAt` in battle seconds. Every value is reconstructed identically by replay seeks. The Defending Builder family consumes it for spawning, repairs and hiding when the hut falls.

## Artwork and live presentation

The graph keeps **38 exports, 47 clips and 180 shapes** from `sc/buildings.sc`, sampled from lossless crops of `buildings_7`, `_8`, `_25` and `_39`. Normal and screen blends are retained. Three effects, five emitters and three unchanged Ogg files keep their original rows. **11 shipped files total 2,041,554 bytes**: four texture crops, four transparent previews at two pixels per native unit and three sounds. Bodies use scale 1.2 and the native ground anchor `(0, 40)`; this is local registration, not native camera parity.

Each armed export has 94 root frames at 24 fps, plus named `turret_load`, `turret` and `builder_out` children. Only three staggered sleep markers move on the root, on frames 2–73; frame 0 is awake. `turret_load` has `idle=0`, `activating_start=1`, `activating_end=37` and `battleidle=38`. `turret` has 360 frames in 36 ten-frame direction bands.

Presentation follows battle state and `context.elapsed`:

- **Dormant:** the sleep-marker loop plays on the battle clock, with `turret_load` idle. [Fandom's Builder's Hut page](https://clashofclans.fandom.com/wiki/Builder%27s_Hut) (search excerpt) associates these markers with an idle Builder at home. Showing them before wake-up is a local interpretation.
- **Waking:** the root stays awake and `turret_load` plays frames 1–37 from `wakeAt`.
- **Active:** the aimed `turret` child replaces `turret_load`. Its `battleidle` frame repeats the root body and spring with a rest-direction roof, so drawing both doubled the roof. Facing is `floor(map angle° + 5) mod 360`, with frame 0 along +map X and each band centred on its angle. This registration was checked visually against Giants placed along the four map axes and is not a native mapping.
- **Ruin:** the ruin plays once from the recorded destruction and then holds; no base is drawn.

`builder_out` is hidden because campaign Builders are at home. Original nail meshes launch `StartOffset` toward the target at `StartHeight × 0.6` and add a `BallisticHeight × 0.6` sine arc. They rotate toward the projected target and draw above world objects. `Nailgun Attack FX` plays at the muzzle, `Generic Hit` plays on struck attackers with air lift, and `Building Destroyed` plays at the hut. Reduced motion suppresses nails and particles and shows the awake root.

## Checks and limits

`tests/builder-hut.test.ts` covers source tiers and references, battle-log housing, the wake tick and first shot, ground and air hits, the Defense class timing and activation hook, passive level-1, home and version-43 huts, and pose reconstruction. `tests/late-goblin-buildings-boost.test.ts` checks Spell Tower rate and damage boosts on the turret. `tests/late-goblin-buildings-art.test.ts` checks texture, preview and sound integrity and the exclusive `turret_load`/`turret` slots. The Builderopolis replay test and `tests/browser/late-goblin-buildings-live.spec.ts` check waking, aimed nails, ruins and backward seeks live.

- Wake-up and first-shot timing, target selection, range measurement, facing registration, launch height and nail arc are local interpretations.
- Dormant sleep markers in campaign battles are an interpretation of home idle art.
- Generic destruction sparks and sound still overlap the original `Building Destroyed` effect.
