# Preferred (favorite) target rules (mechanic)

- Source: [Template:PreferredTarget](https://clashofclans.fandom.com/wiki/Template:PreferredTarget) - revision `619579` - retrieved 2026-09-15
- Compared with pinned client 18.400.21 logic tables

## Mechanics (template rules, paraphrased)

- **None** - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure. Client encoding: no PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes.
- **Defenses** - Defense-first: ignores every other building and all defending units (even while being attacked) as long as any defensive building stands. The Clan Castle is never a defense; an activated Town Hall weapon is. Once no defenses remain it behaves like a no-preference troop, but only switches to enemy units after its current target is destroyed. Client encoding: PreferedTargetBuildingClass=Defense.
- **Resources** - Resource-first: ignores other buildings and defending units while any resource building stands. The Town Hall and Clan Castle always count as resource buildings (with or without loot, weapon active or not) and receive the resource damage bonus. Afterwards it behaves like a no-preference troop. Client encoding: PreferedTargetBuildingClass=Resource.
- **Walls** - Wall-first: while even one wall segment exists it ignores buildings and enemy units entirely. With no walls left it behaves like a no-preference troop. Client encoding: PreferedTargetBuildingClass=Wall.
- **Specific Defense** - Air-Defense-first: bypasses all other buildings and units while any Air Defense stands, then targets any remaining defenses, then behaves like a no-preference troop. The Clan Castle is not a defense; an activated Town Hall weapon is. Client encoding: PreferedTargetBuilding=Air Defense.
- **Healing** - Cannot attack: ignores enemy buildings and troops, even ones attacking it, and idles in place when nothing needs healing. Client encoding: DPS < 0 (heal), no attack.
- **HealTransitionToAttack** - Cannot attack in its initial form (heals instead, ignores enemies, idles when there is nothing to heal) but later transforms into a unit that fights. Client encoding: DPS < 0 plus EvolveToCharacter (Bear).
- **Heroes** - Hero-first: bypasses all buildings and defending troops while any enemy Hero is on the battlefield, even when attacked by Clan Castle troops or Skeleton Trap skeletons. Guardians are not Heroes. Once all Heroes are knocked out it behaves like a no-preference troop. Client encoding: PreferHeroes=TRUE (+HeroDamageMultiplier).
- **Rubble** - Rubble-seeker: does nothing until a building is destroyed, then walks to the debris and ignores everything else (see Mechanics). Client encoding: SummonTroop + ConsumeDebrisOnSummon.
- **Stationary** - Stationary spawner; has no target of its own (its Firemites do the attacking). Client encoding: Speed=0 + BunkerTroops.

## Troops by rule

| Rule | Troops (client column value, multiplier) |
|---|---|
| None | barbarian (-, x1); archer (-, x1); wizard (-, x1); dragon (-, x1); pekka (-, x1); baby-dragon (-, x1); miner (-, x1); electro-dragon (-, x1); yeti (-, x1); electro-titan (-, x1); thrower (-, x1); meteor-golem (-, x1); minion (-, x1); valkyrie (-, x1); witch (-, x1); bowler (-, x1); apprentice-warden (-, x1); meteor-golem-meteormite (-, x1); witch-skeleton (-, x1); lava-hound-lava-pup (-, x1); furnace-firemite (-, x1); ruin-witch-ruin-knight (-, x1) |
| Defenses | giant (Defense, x1); balloon (Defense, x1); dragon-rider (Defense, x1); root-rider (Defense, x1); hog-rider (Defense, x1); golem (Defense, x1); ice-golem (Defense, x1); yeti-yetimite (Defense, x4); golem-golemite (Defense, x1); druid-bear (Defense, x1) |
| Resources | goblin (Resource, x2) |
| Walls | wall-breaker (Wall, x40) |
| Healing | healer (-, x1) |
| Specific Defense | lava-hound (Air Defense, x1) |
| Heroes | headhunter (Heroes, x4) |
| HealTransitionToAttack | druid (-, x1) |
| Stationary | furnace (-, x1) |
| Rubble | ruin-witch (-, x1) |

## Damage multipliers

| Unit | Versus | Multiplier | Client column |
|---|---|---|---|
| goblin | resource buildings incl. Town Hall and Clan Castle | 2 | PreferedTargetDamageMod |
| wall-breaker | walls | 40 | PreferedTargetDamageMod |
| yeti-yetimite | defenses (x0.5 vs resource buildings) | 4 | PreferedTargetDamageMod + DamageReductionToStorages |
| headhunter | Heroes | 4 | HeroDamageMultiplier=400 |
| meteor-golem | walls (no targeting preference) | 5 | DamageMultiplierTarget/DamageMultiplierPercent |
| ruin-witch-ruin-knight | walls (no targeting preference) | 3 | DamageMultiplierTarget/DamageMultiplierPercent |

## Client comparison

- 40/40 units: the template rule used on the wiki page matches the client preference columns.
- `src/game/extra-troops.ts` sets `prefersDefenses` from `PreferedTargetBuilding === "Defense"`; no client row uses that value (defense preference is `PreferedTargetBuildingClass=Defense`; `PreferedTargetBuilding` is only `Air Defense` for Lava Hound), so none of the generic extra troops currently prefer defenses.

### Mismatches / ambiguities

| Field | Wiki | Client | Note |
|---|---|---|---|
| favoriteTarget text | Yeti and Apprentice Warden info boxes say "Any"; template says None | no preference column | "Any" and "None" describe the same behaviour |
| favoriteTarget | Firemite template None; Furnace description says Firemites target buildings | Firemite Spawn has no PreferedTargetBuildingClass | unresolved |
| page | No "Favorite Target"/"Preferred Target" article exists; the rules live in this template | - | search API checked |
