# Yetimite

- Source: [Yeti/Yetimite](https://clashofclans.fandom.com/wiki/Yeti/Yetimite)
- Wiki revision id: `623075` - retrieved 2026-09-15
- Client row: `characters.Yetimite` (pinned client 18.400.21)
- Secondary unit of [Yeti](yeti.md)

## Mechanics

- Not trainable: produced by the [Yeti](yeti.md) (client IsSecondaryTroop=TRUE, no ProductionBuilding).
- Housing space (used for Spring/Tornado Trap, Clone and Recall weight): 2.
- Movement speed: 24 in-game (wiki) = internal Speed 300 (24 before rounding) = 3 tiles/s.
- Attack: one leap (AttackCount=1) from 2 tiles.
- Damage type (wiki): Area Splash (0.8 Tile Radius; Air & Ground); client targets ground and air; client splash radius 0.8 tiles.
- Favorite target: Defenses (Damage x4) - Defense-first: ignores every other building and all defending units (even while being attacked) as long as any defensive building stands. The Clan Castle is never a defense; an activated Town Hall weapon is. Once no defenses remain it behaves like a no-preference troop, but only switches to enemy units after its current target is destroyed. Damage multiplier vs preferred target: x4.
- Ground unit. Jumps/passes over walls (IsJumper=TRUE).
- Interactions (client flags): does not trigger traps (TriggersTraps=FALSE); does not draw out Clan Castle troops (DoesNotOpenCC=TRUE); Healer target weight 0 (HealerWeight).
- Released by a damaged or destroyed Yeti; has the Yeti's level.
- Defense-targeting: walks up to a building, pauses, then leaps into it. The leap makes it invulnerable and untargetable and ends in a single explosion (0.8-tile splash, hits ground and air) that destroys the Yetimite: 4x damage to defenses, 0.5x to resource buildings (the Town Hall with an active weapon is both, so 2x).
- Jumps over walls. Does not trigger traps (since January 2020) and does not open the Clan Castle; the Eagle Artillery does not target it and the Grand Warden does not follow it.
- Counts as 2 housing for Spring Trap, Clone and Recall (history: 3 -> 1 on 2025-03-24, 1 -> 2 on 2025-04-14).

## Level table (wiki)

| Level | Damage | Damage vs. Defenses | Damage vs. Resource Building | Damage vs. Town Hall* | Hitpoints |
|---|---|---|---|---|---|
| 1 | 56 | 224 | 28 | 112 | 300 |
| 2 | 64 | 256 | 32 | 128 | 350 |
| 3 | 72 | 288 | 36 | 144 | 400 |
| 4 | 78 | 312 | 39 | 156 | 450 |
| 5 | 84 | 336 | 42 | 168 | 500 |
| 6 | 88 | 352 | 44 | 176 | 550 |
| 7 | 90 | 360 | 45 | 180 | 575 |
| 8 | 92 | 368 | 46 | 184 | 590 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Range |
|---|---|---|---|---|
| Defenses (Damage x4) | Area Splash (0.8 Tile Radius; Air & Ground) | 2 | 24 | 2 tiles |

## Client comparison

Checked 48 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 48 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 2 = client 2 - characters.HousingSpace
- `attackRangeTiles`: wiki 2 = client 2 - characters.AttackRange/100
- `movementSpeedWiki`: wiki 24 = client 24 - characters.Speed=300 -> /12.5 = 24
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `splashTiles`: wiki 0.8 = client 0.8 - characters.DamageRadius/100
- `favoriteTarget`: wiki Defense = client Defense - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `favoriteMultiplier`: wiki 4 = client 4 - characters.PreferedTargetDamageMod (Headhunter: HeroDamageMultiplier/100)
- `maxLevel`: wiki 8 = client 8 - number of characters rows
- `damagePerHit`: 8 values match (levels 1-8) - characters.DPS x AttackSpeed/1000
- `damageVsFavorite`: 8 values match (levels 1-8) - damagePerHit x PreferedTargetDamageMod
- `damageVsResources`: 8 values match (levels 1-8) - damagePerHit x (100-DamageReductionToStorages)/100
- `damageVsTownHall`: 8 values match (levels 1-8) - damagePerHit x PreferedTargetDamageMod x (100-DamageReductionToStorages)/100
- `hitpoints`: 8 values match (levels 1-8) - characters.Hitpoints

### Client columns that encode the mechanics

- AttackCount=1, AttackRange=200, DamageRadius=80, PreferedTargetBuildingClass=Defense, PreferedTargetDamageMod=4, DamageReductionToStorages=50, IsJumper=TRUE, TriggersTraps=FALSE, DoesNotOpenCC=TRUE, NewTargetAttackDelay=500, HealerWeight=0, projectile YetimiteJumpN (ballistic).
- Stats per level come from the parent's spawn level (secondary rows have no research columns).
