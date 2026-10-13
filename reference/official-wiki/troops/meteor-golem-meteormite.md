# Meteormite

- Source: [Meteor Golem/Meteormite](https://clashofclans.fandom.com/wiki/Meteor_Golem/Meteormite)
- Wiki revision id: `625266` - retrieved 2026-09-15
- Client row: `characters.Meteormite` (pinned client 18.400.21)
- Secondary unit of [Meteor Golem](meteor-golem.md)

## Mechanics

- Not trainable: produced by the [Meteor Golem](meteor-golem.md) (client IsSecondaryTroop=TRUE, no ProductionBuilding).
- Housing space (used for Spring/Tornado Trap, Clone and Recall weight): 20.
- Movement speed: 16 in-game (wiki) = internal Speed 200 (16 before rounding) = 2 tiles/s.
- Attack: every 1.5 s; range 0.8 tiles.
- Damage type (wiki): Single Target (Ground only); client targets ground only.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit. Jumps/passes over walls (IsJumper=TRUE).
- Half of a Meteor Golem: a single-target melee ground unit (0.8 tile, 1.5 s), a bit faster than the golem.
- Jumps walls. When not fighting it looks for another Meteormite within reach and merges into a Meteor Golem (merged health = sum of both, rounded down to a 0.5% step of golem health, minimum 1; briefly invulnerable).
- Cloned Meteormites and defending Clan Castle ones never merge; temporary-event and permanent Meteormites only merge with their own kind.
- Counts as 20 housing for Spring Trap, Tornado Trap, Clone and Recall.

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Hitpoints |
|---|---|---|---|
| 1 | 190 | 285 | 7,250 |
| 2 | 210 | 315 | 8,000 |
| 3 | 230 | 345 | 8,750 |

### Archived temporary-troop table (wiki "As Temporary Troop")

| Level | Damage per Second | Damage per Attack | Hitpoints |
|---|---|---|---|
| 1 | 68 | 102 | 2,000 |
| 2 | 79 | 118.5 | 2,500 |
| 3 | 90 | 135 | 3,000 |
| 4 | 101 | 151.5 | 3,500 |
| 5 | 112 | 168 | 4,000 |
| 6 | 123 | 184.5 | 4,250 |
| 7 | 134 | 201 | 4,500 |
| 8 | 145 | 217.5 | 5,000 |
| 9 | 156 | 234 | 5,500 |
| 10 | 172 | 258 | 6,000 |
| 11 | 180 | 270 | 6,500 |
| 12 | 200 | 300 | 7,250 |
| 13 | 220 | 330 | 8,000 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Range |
|---|---|---|---|---|---|
| None | Single Target (Ground only) | 20 | 16 | 1.5s | 0.8 tiles |

## Client comparison

Checked 16 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 16 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 20 = client 20 - characters.HousingSpace
- `attackSeconds`: wiki 1.5 = client 1.5 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 0.8 = client 0.8 - characters.AttackRange/100
- `movementSpeedWiki`: wiki 16 = client 16 - characters.Speed=200 -> /12.5 = 16
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 3 = client 3 - number of characters rows
- `dps`: 3 values match (levels 1-3) - characters.DPS
- `damagePerHit`: 3 values match (levels 1-3) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 3 values match (levels 1-3) - characters.Hitpoints

### Client columns that encode the mechanics

- IsJumper=TRUE, MergeToCharacter=Meteor Golem, MergeSearchRadius=500, InheritHealthPercentage=TRUE, IsSecondaryTroop=TRUE, DisableProduction=TRUE; Defensive Meteormite has no merge columns.
- Stats per level come from the parent's spawn level (secondary rows have no research columns).
