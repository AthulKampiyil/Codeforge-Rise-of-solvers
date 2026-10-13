# Native Monolith reconstruction

The late Goblin Map villages **Monolithic** (index 85, seven level-2 Monoliths) and **M.O.M.M.A's
Madhouse** (index 89, two) use the original Monolith from Supercell's public client **18.400.21**,
bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`. Original artwork and audio belong to Supercell.
Everything here is version-44 `goblin-v1` campaign behavior; no earlier combat version changes.

- `catalog.json`: pinned inputs and SHA-256 hashes, the raw `Monolith` building rows (all five
  levels), the three projectile rows, every referenced effect and particle-emitter row, sounds,
  texture-region evidence, the evidence scene-graph digest and preview records.
- `runtime.json`: the captured scene graph (compact) with UVs remapped to the shipped cropped
  textures, plus the level exports, projectile tiers, turret views, effects, particles and sounds
  used by the renderer.
- `combat.json`: the small numeric table imported by the simulation.

Reproduce with `PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-monolith.py`;
`--check` rebuilds every pixel, sound byte and reference and compares them byte for byte. The
importer verifies each input's SHA-1 against `fingerprint.json` membership and its pinned SHA-256.
`sc/buildings_35.sctx` (522,464 bytes) and five Monolith sounds were added to the approved cache.

## Source facts (verified by the importer)

[buildings.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/buildings.csv)
`Monolith`, GlobalID 1000077, 3×3, Defense, air and ground: level 1 `Hitpoints` 4747, `AttackRange`
1100, `AttackSpeed` 1500, `CoolDownOverride` 750, `DPS` 150, `DamagePermilHp` 110,
`ProjectileVariantByTargetMaxHP` 600;2500, `DefaultProjectileVariant` 3, `HitEffect` Explosive
Arrow, `AttackEffect` Monolith Attack, `DefenderCount` 1, `DefenderZ` 155, `AnimationActionFrame` 5,
exports `monolith_lvl_N` (+`_upgrade`), `dark_tower_base`, `destroyedBuilding_3l_base_rockwood`.
Level 2: 5050 HP, 175 DPS, 120‰, 650;2750. Levels 3–5 are retained (5353/5656/5959 HP).
[projectiles.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/projectiles.csv):
`MonolithProjectileMin/Med/Max`, `Speed` 2200, `StartHeight` 220, `StartOffset` 60, tracking,
`Scale` 100/150/200, `ScaleTimeline`, trail `Effect`, `SpawnEffect` (attack sound) and
`DestroyedEffect` (impact particles) per tier. Textures: 35 (bodies), 39 (orbs, trails,
particles), 8 (base), 25 (rubble), 18 (scaffold). Eight sounds are copied unchanged.

The graph keeps 16 directional attack views under the named `turret` control (360 frames) and three
orb tiers (`projectile_0..2`) inside each 25-frame attack clip.

## Mechanics and interpretations

| Behavior | Implementation | Evidence / status |
| --- | --- | --- |
| Hit cycle | After a target is engaged the hit timer runs `AttackSpeed − CoolDownOverride` = 0.75 s, the orb is released, then a 0.75 s `CoolDownOverride` lockout runs; a retained target is hit every 1.5 s. Losing every target clears the hit timer; switching without an idle sample keeps it. | Older public engine reconstruction ([LogicAttackerItemData](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Data/LogicAttackerItemData.cs), SHA-256 `9c078566…eddb71`: `m_attackSpeed = AttackSpeed − CoolDownOverride`; [LogicCombatComponent](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/Component/LogicCombatComponent.cs), SHA-256 `5a2e1f66…48a09f`). Continuous battle time replaces the reconstruction's 64-ms tick quantization (which would shorten the average period slightly). Local interpretation. |
| Damage | `DPS × AttackSpeed / 1000` (262.5 at level 2) plus `DamagePermilHp` of the target's **maximum** hitpoints (12% at level 2), fixed at release, applied on impact. | Supercell [TH15 release notes](https://supercell.com/en/games/clashofclans/blog/release-notes/full-release-notes-2/) ("a percentage of its target's max hit points") and the [French announcement](https://supercell.com/en/games/clashofclans/fr/blog/news/le-monolithe-et-la-tour-runique/); DPS-over-full-cycle per `DPSToSingleHit(dps, attackSpeed + cooldown)` in the reconstruction; [Fandom Monolith](https://clashofclans.fandom.com/wiki/Monolith). Native hitpoint rounding is not reproduced (floats). |
| Rage | A defensive Rage multiplies only the base share. | Fandom Monolith and Spell Tower pages: the percentage bonus is secondary damage that Rage does not buff. |
| Orb tier | Tier 1 below the first threshold, tier 2 from it, tier 3 from the second; no target shows tier 3. | Source thresholds and `DefaultProjectileVariant`; the `>=` boundary is a local interpretation. Fandom: colour follows target max HP; the idle orb defaults to dark purple. |
| Targeting | Closest active attacker within 11 tiles (ground and air), retained while in range; ties by id. A lightning stun drops the target and hit timer and pauses the lockout. | Common defense convention in this engine; stun pausing follows the reconstruction's frozen branch. Local. |
| Flight | Tracking orb at 22 tiles/s from the tower center toward the target's current position; an orb whose target died resolves without damage. | Source speed/tracking flags; hundredths-of-a-tile convention used by other native projectiles. |

## Presentation

`MonolithPresentation` renders base + body with `turret` = map angle of the aim vector (frame 0 along
+map X, 90 along +map Y, the X-Bow convention; its symmetry was checked against the source views:
views d1/d5 and d9/d13 are mirror pairs about the screen-vertical d3/d11 views), `d1..d16` = attack
phase and only the targeted orb tier visible, animating at the source 30 fps. The attack clip is
aligned so `AnimationActionFrame` 5 coincides with each recorded release (a pre-roll reads the
current hit timer). Orbs use the source projectile exports, rotation and `ScaleTimeline`; trails
play the looping trail emitters with one birth per 1/30 s (the source `EmissionTime` 1 ms cannot be
honored literally — local); impacts play the tier's `DestroyedEffect` and, on a struck target, the
building `HitEffect`; destruction plays `Building Destroyed` and the native rubble clip. Sounds:
the looping `laser_loop_02` while engaged, tier attack sounds at release, the hit sound at impact.
Everything derives from battle state and histories, so replay seeks reproduce it; reduced motion
freezes clips and hides flights and trails. Previews (360×460, density 2, bounds
`[-90,-100,90,130]`, turret frame 45, tier 3) are used as fallback sprites, placement ghosts and
HUD portraits. Registration (scale 1.2, source root 80 units above the 3×3 center) is the local
convention shared with other native 3×3 defenses.

## Verification

`tests/monolith.test.ts` (source values, graph/texture/preview integrity, damage/tier rules, cycle,
targeting, Rage, stun, destruction), `tests/monolith-spell-tower-replay.test.ts` (campaign gate and
placements, portable replay, backward seeks in villages 85 and 89 among others, version-43
rejection) and
`tests/browser/monolith-spell-tower-live.spec.ts` (real troop deployments in Monolithic; screenshots
under `output/playtest/monolith-spell-tower/85-*`).

## Remaining fidelity limits

- Native tick quantization, hitpoint integer rounding and the exact release frame relative to the
  hit timer are unverified; `DefenderCount`/`DefenderZ` are retained but not interpreted.
- The direction-to-view mapping, projectile start/height projection, trail emission rate and world
  registration are local calibrations, not native projection proof.
- Construction/upgrade states render but are never reachable in campaign battles; home placement is
  not offered. No per-frame pixel witness suite exists; particle physics follow the shared sampler.
