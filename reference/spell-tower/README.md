# Native Spell Tower reconstruction

Level-3 Spell Towers appear in **Raging Headache** (index 86, eight Rage), **Toxic Town Square**
(87, four Poison), **Disappearing Dilemma** (88, seven Invisibility) and **M.O.M.M.A's Madhouse**
(89, one Rage, two Invisibility, four Poison). Each placement's `attack_mode_weapon` (49000007
Invisibility, 49000008 Poison, 49000009 Rage) becomes `Building.spellTowerWeapon`. Values come from
Supercell's public client **18.400.21**, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`; original
artwork and audio belong to Supercell. Everything is version-44 `goblin-v1` campaign behavior.

- `catalog.json`: pinned inputs and SHA-256 hashes, raw `Spell Tower` building rows, the three weapon
  records (all four weapon levels), bottle projectiles, the three hit spells, hero globals, every
  referenced effect/particle row, sounds, texture-region evidence, graph digest and previews.
- `runtime.json`: the compact scene graph (UVs remapped to shipped textures) with per-weapon state
  labels, bottles, spells, effects, particles and sounds.
- `combat.json`: the numeric table imported by the simulation.

Reproduce with `PYTHONPATH=scripts output/native-art-venv/bin/python scripts/import-native-spell-tower.py`
(`--check` for byte comparison). `sc/buildings_17.sctx` (190,320 bytes) and five sounds were added
to the approved cache; every input is checked against `fingerprint.json` SHA-1 and a pinned SHA-256.

## Source facts (verified by the importer)

- [buildings.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/buildings.csv)
  `Spell Tower`, GlobalID 1000072, 2×2, Defense, 2500/2800/3100/3200 HP, `AttackRange` 800,
  exports `spell_tower_lvl1`, `_lvl2_rage`, `_lvl3_rage`, `_lvl4_earthquake`, `dark_tower_base`,
  `destroyedBuilding_2l_pit_rockwood`, `UnlockWeaponMode` `SpellTowerRage`/`SpellTowerPoison`/
  `SpellTowerInvisibility`/`SpellTowerEarthquake` (level 4 at Town Hall 17), `TargetingImmunityTotems`.
- [weapons.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/weapons.csv)
  (GlobalID = 49000000 + record index): `SpellTowerRage` range 900, `AttackSpeed` 70000,
  `CoolDownOverride` 68800, `SelfAsAoeCenter`, `CopyOwnerUpgradeLevel`, `AttackCenterOnDeath`;
  `SpellTowerPoison` 900/70000/68800, `AttackCenterOnDeath`; `SpellTowerInvisibility` 450/50000/48800,
  `SelfAsAoeCenter`, `CustomTargetHitBuildingInRange`, `AttackCenterOnDeath`. Weapon exports
  `spell_tower_lvlN_<weapon>` follow the tower level (`CopyOwnerUpgradeLevel`).
- [projectiles.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/projectiles.csv):
  `spell_bottle_<weapon>`, ballistic, `BallisticHeight` 300, `FixedTravelTime` 800, `TrajectoryStyle`
  4, `DontTrackTarget`, `HitSpell` + `HitSpellLevel` 1, `DestroyedEffect` Elixir Storage Destroyed;
  `ParticleEmitter` `rage_smokeRing5` (Rage) and `Toxic_skull` (Poison), none for Invisibility.
- [spells.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/spells.csv)
  (each has one level, so the tower level selects the art, not the spell values):
  **Spell Tower Rage** radius 500, 60 hits every 300 ms from `HitTimeMS` 400, `BoostTimeMS` 1000,
  `DamageBoostPercent` 60, `BuildingDamageBoostPercent` 60, `SpeedBoost` 30, `SpeedBoost2` 15, no
  `AttackSpeedBoost`. **Spell Tower Poison** radius 500, 30 hits every 400 ms from 0 ms,
  `PoisonDPS` 60, `PoisonIncreaseSlowly` FALSE, `SpeedBoost` −35, `AttackSpeedBoost` −25,
  `BoostTimeMS` 500, `BoostLinkedToPoison`, `PoisonAffectAir`, `BoostDefenders`,
  `HeroDamageMultiplier` 20, `ImmunitySiegeMachines`, `ImmunityTH_CC`, `ImmunityStorages`,
  `ImmunityWalls`, `ImmunityOtherBuildings`. **Spell Tower
  Invisibility** radius 450, 18 hits every 250 ms from 400 ms, `InvisibilityTime` 600, wall and
  siege immunity. [globals.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/globals.csv):
  `HERO_RAGE_MULTIPLIER` 50, `HERO_RAGE_SPEED_MULTIPLIER` 50.
- Art: texture 17 (bodies, bottles), 39 (spell rings, symbols, smoke, sparks), 8, 25, 1. Each weapon
  body has a `turret_load` state clip labelled `activating_start` 0, `idle` 2, `attack_start` 3,
  `attack_end` 32, `load_start` 33 and `load_end` 1235 (Rage) / 1473 (Poison) / 993 (Invisibility).

## Mechanics and interpretations

| Behavior | Implementation | Evidence / status |
| --- | --- | --- |
| Engagement | Rage/Poison engage the closest active attacker (ground or air) within 9 tiles and keep it while in range; Invisibility engages an attacker whose current attack is landing on a damaged non-wall building whose center lies inside its 4.5-tile area, and keeps that attacker while it lives, so spell-only damage never triggers it. | Weapon flags; [Fandom Spell Tower](https://clashofclans.fandom.com/wiki/Spell_Tower) (activation vs area radius, Invisibility trigger rules and its "infinite activation radius" note). The "attack is landing" test (attacking flag, attack reach, damaged building) is a local proxy for the client's hit record. |
| Windup and reload | The hit timer runs `AttackSpeed − CoolDownOverride` = 1.2 s of continuous engagement, then the bottle is released and the `CoolDownOverride` reload (68.8/68.8/48.8 s) starts. No engagement clears the timer; a lightning stun clears it and pauses the reload. | Same reconstruction rule as the Monolith ([LogicAttackerItemData](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Data/LogicAttackerItemData.cs)); Fandom: a unit must remain in range for 1.2 s, recharge 70/70/50 s. |
| Bottle and spell | Rage and Invisibility land on the tower (`SelfAsAoeCenter`); Poison lands where its target stood at release. The spell starts at impact (0.8 s) and pulses at `HitTimeMS + n × TimeBetweenHitsMS`. | Source rows; pulse scheduling per the reconstruction's [LogicSpell](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/LogicSpell.cs) (SHA-256 `9dd6493f…6bb3`). |
| Rage | A defense whose center is strictly inside the radius deals `1 + BuildingDamageBoostPercent` (×1.6) primary damage from the first pulse until 1 s after the last; firing rate is unchanged. Defending units inside at a pulse get ×1.6 damage and +30 speed points (`SpeedBoost2` +15 for characters with a preferred target class, such as Balloons), lingering `BoostTimeMS`; speed points use the project's 8-per-tile/s convention. Threaded through the ordinary defense loop (Cannon, Mortar, Wizard/Bomb Tower, Air Defense, Hidden Tesla), X-Bow, Archer Tower, Inferno pulses, skeletons and garrison defenders; the Monolith bonus, trap damage, death damage and Air Sweeper pushes are not boosted. | Source rows; [LogicLevel](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Level/LogicLevel.cs) `AreaBoost` (SHA-256 `485ce9b2…2c6`); Fandom (no attack-speed change; secondary damage not buffed; defenders also move faster); Supercell's [December 2022 notes](https://supercell.com/en/games/clashofclans/blog/release-notes/december-update-2022/) mention enraged Scattershots. The reconstruction passes buildings the undivided `60 × BoostTimeMS / 1000` (units receive a quarter), which at 64-ms combat ticks would keep a defense enraged 3.84 s after a pulse; the source 1 s is used for both (local). |
| Poison | Each pulse on an active attacker strictly inside the radius (air included) sets poison to full intensity (`PoisonIncreaseSlowly` FALSE, strongest DPS kept) with a 640 ms hold; every 64 ms source tick deals DPS × intensity × 0.064, and after the hold intensity falls 10/1000 per tick. The slow lasts the complete remaining poison (7.04 s after the last pulse): attack timers progress 75% (`AttackSpeedBoost`), movement 65% (`SpeedBoost`; `SpeedBoost2` is also −35). Heroes take 20% poison (`HeroDamageMultiplier`) and move at 83% (`SpeedBoost × HERO_RAGE_SPEED_MULTIPLIER`, integer-truncated); their attack slow is unchanged. | Reconstruction [LogicHitpointComponent](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/Component/LogicHitpointComponent.cs) `SetPoisonDamage`/`Tick` (SHA-256 `d2352f2a…32ed4`), `AreaPoison`/`BoostGameObject`, [LogicMovementSystem](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/Component/LogicMovementSystem.cs) slow (SHA-256 `1c0c3d94…e0589d`); [Fandom Poison Spell](https://clashofclans.fandom.com/wiki/Poison_Spell) (lingering effect, stacking caps). One slow end drives both movement (engine sub-ticks) and attack timers (engine ticks) — local simplification. |
| Invisibility | Non-wall buildings whose center is strictly inside 4.5 tiles are concealed from the first pulse until 600 ms after the last (static buildings); defending units inside at a pulse are concealed for 600 ms. Concealed buildings cannot be targeted or chosen as destinations, so attackers retarget and repath deterministically; they remain route and crowd obstacles, still fire, and still receive splash and area pulses (King quake). Attackers are not concealed. | Supercell [TH15 notes](https://supercell.com/en/games/clashofclans/blog/release-notes/full-release-notes-2/) ("defensive units and buildings"); [Fandom Invisibility Spell](https://clashofclans.fandom.com/wiki/Invisibility_Spell) (concealed buildings are skipped, indirect damage still lands, concealed defenses keep firing, 0.25 s repeated effects); Fandom Spell Tower: troops retarget. Fandom's Spell Tower page also names attacking units; that conflicts with Supercell's wording and is not implemented. |
| Death cast | `AttackCenterOnDeath`: a destroyed tower whose reload has finished releases its spell at the destruction time — Rage/Invisibility on itself, Poison at its engaged (else nearest in-range) attacker, otherwise on itself. A reloading tower releases nothing. | Fandom Spell Tower (a loaded spell activates on destruction, including a spell still atop a frozen tower; Poison with no troop nearby lands on itself). The loaded-only rule is an interpretation. |
| Results | Battles wait only for bottles in flight; active pulses cannot change destruction. | Mirrors the ordinary projectile rule. |

Community numbers conflict (durations, recharges, Rage +60% vs +100%); the pinned spell rows win.

## Presentation

`SpellTowerPresentation` draws `dark_tower_base` plus `spell_tower_lvl3_<weapon>` with `turret_load`
at `idle` when loaded, the 30-frame attack segment ending at each release (from the current hit
timer), and the load segment proportionally mapped over the pinned reload. The load clips span
40.1/48.0/32.0 s — 80% of the 50/60/40 s reloads before Fandom's June 2023 history entry — so a
native 30 fps playback would look loaded long before the tower is ready; Fandom describes the potion
rising until the spell is ready, and proportional mapping is the local interpretation of that. Bottles use the
source exports and a local parabola of `BallisticHeight` over `FixedTravelTime`; a bottle
`ParticleEmitter` (Rage, Poison) plays one emission cycle along the flight. At impact the bottle `DestroyedEffect`
and the spell's `DeployEffect`/`DeployEffect2` play from source rows (Rage purple, Poison orange,
Invisibility turquoise rings, symbols, clouds and sounds). Effect `Scale` scales particle art and
`LifeTimeScale` scales particle life/emission/fade timings (a local reading of the field name; the
resulting Poison and Invisibility decals last 12 s and 4.5 s, matching the spells). One-frame
particle exports whose animation lives in a descendant clip use that descendant's duration for
`ScaleTimeline`. Single-leaf additive groups are drawn as additive leaves (identical composition,
no intermediate buffer). Destruction plays `Building Destroyed` over the native rubble. Previews
(280×320, density 2, idle) exist for all four levels and three weapons. Registration reuses the
Inferno's local 2×2 `dark_tower_base` convention.

## Verification

`tests/spell-tower.test.ts` (source values, previews, Rage/Poison/Invisibility schedules, Hero
multipliers, poison ticks, triggers, death casts), `tests/spell-tower-integration.test.ts` (Rage
through Cannon, X-Bow, Archer Tower, Mortar, Wizard Tower, Inferno and skeletons; poisoned movement
and attack timers in the live model; retargeting around concealed buildings that keep firing;
no late state before version 44), `tests/monolith-spell-tower-replay.test.ts` (campaign gate and
per-village weapons, portable files and backward seeks in villages 85–89, version-43 and
weapon-field rejection) and
`tests/browser/monolith-spell-tower-live.spec.ts` (real deployments; screenshots under
`output/playtest/monolith-spell-tower/86-*`, `87-*`, `88-*`, `89-*`).

## Remaining fidelity limits

- The client's hit-record trigger for Invisibility, spell subtick rounding (60 Hz) versus 50 ms
  sampling of unit positions, and separate movement/attack slow clocks are approximated.
- Concealed buildings are not drawn translucent; the Invisibility symbol ring follows the shared
  sampler's `StartRadius` offset; bottle arcs, altitude projection and particle physics are local.
- Defending Heroes, Totems, siege machines and the Earthquake weapon (level 4, absent from campaign
  placements) are not modelled; the unreferenced `spell_tower_<color>` exports are not imported.
- The battle range ring and tooltip show the weapon activation range (4.5 or 9 tiles), not the
  spell radius.
