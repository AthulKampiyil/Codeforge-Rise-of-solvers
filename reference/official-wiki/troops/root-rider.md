# Root Rider

- Source: [Root Rider](https://clashofclans.fandom.com/wiki/Root_Rider)
- Wiki revision id: `625331` - retrieved 2026-09-15
- Client row: `characters.Root Rider` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 17, Town Hall 15 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 20.
- Movement speed: 12 in-game (wiki) = internal Speed 150 (12 before rounding) = 1.5 tiles/s.
- Attack: every 2.2 s; range 1 tile.
- Damage type (wiki): Single Target (Ground only); client targets ground only.
- Favorite target: Defenses - Defense-first: ignores every other building and all defending units (even while being attacked) as long as any defensive building stands. The Clan Castle is never a defense; an activated Town Hall weapon is. Once no defenses remain it behaves like a no-preference troop, but only switches to enemy units after its current target is destroyed.
- Ground unit. Jumps/passes over walls (IsJumper=TRUE).
- Interactions (client flags): cannot be ejected by Spring Traps (CantBeEjected=TRUE).
- Slow, very durable defense-targeting ground unit (single target, 1 tile, 2.2 s).
- Walls do not block her path: she rides straight over them while a wall-only aura (0.75-tile radius, 4,000 damage every 0.4 s = 10,000 wall DPS at every level) wrecks the walls she crosses. She is normally slow enough to break them; under Rage/Haste she may pass before they fall. Defensive Root Riders do not damage their own village's walls.
- Cannot be ejected by Spring Traps (client CantBeEjected=TRUE).

## Level table (wiki)

| Level | Damage per Second | Damage per Hit | Wall Damage per Second | Wall Damage per Hit | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 95 | 209 | 10,000 | 4,000 | 6,200 | N/A | N/A | N/A |
| 2 | 105 | 231 | 10,000 | 4,000 | 6,350 | 15,000,000 | 8d | 13 |
| 3 | 115 | 253 | 10,000 | 4,000 | 6,500 | 17,600,000 | 10d | 14 |
| 4 | 125 | 275 | 10,000 | 4,000 | 6,700 | 30,000,000 | 16d | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Attack Speed vs. Walls | Range | Barracks Level Required |
|---|---|---|---|---|---|---|---|
| Defenses | Single Target (Ground only) | 20 | 12 | 2.2s | 0.4s | 1 tile | 17 |

## Client comparison

Checked 38 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 38 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 20 = client 20 - characters.HousingSpace
- `attackSeconds`: wiki 2.2 = client 2.2 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 1 = client 1 - characters.AttackRange/100
- `barracksLevel`: wiki 17 = client 17 - characters.BarrackLevel
- `wallAttackSeconds`: wiki 0.4 = client 0.4 - spells.TreantWallDamageAura.TimeBetweenHitsMS/1000
- `movementSpeedWiki`: wiki 12 = client 12 - characters.Speed=150 -> /12.5 = 12
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki Defense = client Defense - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 4 = client 4 - number of characters rows
- `dps`: 4 values match (levels 1-4) - characters.DPS
- `damagePerHit`: 4 values match (levels 1-4) - characters.DPS x AttackSpeed/1000
- `wallDps`: 4 values match (levels 1-4) - TreantWallDamageAura Damage x 1000/TimeBetweenHitsMS
- `wallDamagePerHit`: 4 values match (levels 1-4) - TreantWallDamageAura Damage
- `hitpoints`: 4 values match (levels 1-4) - characters.Hitpoints
- `researchCost`: 3 values match (levels 2-4) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 3 values match (levels 2-4) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 3 values match (levels 2-4) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- IsJumper=TRUE with JumpHeightPercent=1 and SmoothJump=TRUE (walks over walls); AuraSpell=TreantWallDamageAura (Damage=4000, Radius=75, TimeBetweenHitsMS=400, immune: everything except walls); CantBeEjected=TRUE; SpecialAbilities=RootRiderPlaceholderAbility (placeholder only).
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
