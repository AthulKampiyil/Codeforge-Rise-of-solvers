# Golemite

- Source: [Golem/Golemite](https://clashofclans.fandom.com/wiki/Golem/Golemite)
- Wiki revision id: `623847` - retrieved 2026-09-15
- Client row: `characters.Golemite` (pinned client 18.400.21)
- Secondary unit of [Golem](golem.md)

## Mechanics

- Not trainable: produced by the [Golem](golem.md) (client IsSecondaryTroop=TRUE, no ProductionBuilding).
- Housing space (used for Spring/Tornado Trap, Clone and Recall weight): 6.
- Movement speed: 12 in-game (wiki) = internal Speed 150 (12 before rounding) = 1.5 tiles/s.
- Attack: every 3 s; range 0.5 tiles.
- Damage type (wiki): Melee (Ground Only); client targets ground only.
- Favorite target: Defenses - Defense-first: ignores every other building and all defending units (even while being attacked) as long as any defensive building stands. The Clan Castle is never a defense; an activated Town Hall weapon is. Once no defenses remain it behaves like a no-preference troop, but only switches to enemy units after its current target is destroyed.
- Ground unit.
- Death damage: 70-210 by level in a 1.2-tile radius (client DieDamageRadius), delay 0 ms (client DieDamageDelay; 0/absent = immediate).
- Interactions (client flags): Healer target weight 1 (HealerWeight).
- Appears when a Golem dies (2, 3 or 4 depending on the Golem's level) with the golem's level.
- Roughly a fifth of the Golem: defense-targeting melee unit (0.5 tile, 3 s, slower attacks than the golem).
- Explodes on death for area damage within 1.2 tiles.
- Counts as 6 housing for Spring Trap, Tornado Trap, Clone and Recall (a max-level Spring Trap ejects three).

## Level table (wiki)

| Level | Damage per Second | Damage per Hit | Damage Upon Death | Hitpoints |
|---|---|---|---|---|
| 1 | 7 | 21 | 70 | 1,020 |
| 2 | 8 | 24 | 80 | 1,080 |
| 3 | 9 | 27 | 90 | 1,140 |
| 4 | 10 | 30 | 100 | 1,200 |
| 5 | 11 | 33 | 110 | 1,260 |
| 6 | 12 | 36 | 120 | 1,320 |
| 7 | 13 | 39 | 130 | 1,380 |
| 8 | 14 | 42 | 140 | 1,440 |
| 9 | 15 | 45 | 150 | 1,500 |
| 10 | 16 | 48 | 160 | 1,600 |
| 11 | 17 | 51 | 170 | 1,680 |
| 12 | 18 | 54 | 180 | 1,760 |
| 13 | 19 | 57 | 190 | 1,840 |
| 14 | 20 | 60 | 200 | 1,920 |
| 15 | 22 | 66 | 210 | 2,040 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Range | Death Damage Radius |
|---|---|---|---|---|---|---|
| Defenses | Melee (Ground Only) | 6 | 12 | 3s | 0.5 tiles | 1.2 tiles |

## Client comparison

Checked 68 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 68 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 6 = client 6 - characters.HousingSpace
- `attackSeconds`: wiki 3 = client 3 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 0.5 = client 0.5 - characters.AttackRange/100
- `deathDamageRadiusTiles`: wiki 1.2 = client 1.2 - characters.DieDamageRadius/100
- `movementSpeedWiki`: wiki 12 = client 12 - characters.Speed=150 -> /12.5 = 12
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki Defense = client Defense - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 15 = client 15 - number of characters rows
- `dps`: 15 values match (levels 1-15) - characters.DPS
- `damagePerHit`: 15 values match (levels 1-15) - characters.DPS x AttackSpeed/1000
- `deathDamage`: 15 values match (levels 1-15) - characters.DieDamage
- `hitpoints`: 15 values match (levels 1-15) - characters.Hitpoints

### Client columns that encode the mechanics

- DieDamage per level, DieDamageRadius=120, PreferedTargetBuildingClass=Defense, HealerWeight=1, IsSecondaryTroop=TRUE.
- Stats per level come from the parent's spawn level (secondary rows have no research columns).
