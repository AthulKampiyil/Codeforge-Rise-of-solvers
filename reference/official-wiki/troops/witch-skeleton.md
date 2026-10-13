# Skeleton (Witch)

- Source: [Witch/Skeleton](https://clashofclans.fandom.com/wiki/Witch/Skeleton)
- Wiki revision id: `624632` - retrieved 2026-09-15
- Client row: `characters.Skeleton` (pinned client 18.400.21)
- Secondary unit of [Witch](witch.md)

## Mechanics

- Not trainable: produced by the [Witch](witch.md) (client IsSecondaryTroop=TRUE, no ProductionBuilding).
- Housing space (used for Spring/Tornado Trap, Clone and Recall weight): 1.
- Movement speed: 24 in-game (wiki) = internal Speed 300 (24 before rounding) = 3 tiles/s.
- Attack: every 1 s; range 0.4 tiles.
- Damage type (wiki): Melee (Ground Only); client targets ground only.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit.
- Interactions (client flags): does not trigger traps (TriggersTraps=FALSE); does not draw out Clan Castle troops (DoesNotOpenCC=TRUE); Healer target weight 0 (HealerWeight).
- Summoned by Witches: weak, fast melee unit (0.4 tile, 1 s, ground only).
- Skeletons do not trigger traps and do not draw out Clan Castle troops, but traps set off by other troops still hurt them; the wiki says they can still reveal Hidden Teslas.
- Counts as 1 housing for Spring Trap, Tornado Trap, Clone and Recall (wiki "Spring Weight" 1).
- Level 1 for Witch levels 1-7, level 2 at Witch level 8.

## Level table (wiki)

| Level | Damage per Second | Damage per Hit | Hitpoints |
|---|---|---|---|
| 1 | 25 | 25 | 30 |
| 2 | 30 | 30 | 45 |

### Wiki info box

| Spring Weight | Preferred Target | Attack Type | Movement Speed | Attack Speed | Range |
|---|---|---|---|---|---|
| 1 | None | Melee (Ground Only) | 24 | 1s | 0.4 tiles |

## Client comparison

Checked 13 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 13 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 0.4 = client 0.4 - characters.AttackRange/100
- `springWeight`: wiki 1 = client 1 - characters.HousingSpace
- `movementSpeedWiki`: wiki 24 = client 24 - characters.Speed=300 -> /12.5 = 24
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 2 = client 2 - number of characters rows
- `dps`: 2 values match (levels 1-2) - characters.DPS
- `damagePerHit`: 2 values match (levels 1-2) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 2 values match (levels 1-2) - characters.Hitpoints

### Client columns that encode the mechanics

- TriggersTraps=FALSE, DoesNotOpenCC=TRUE, SpawnIdle=500 ms, HealerWeight=0, IsSecondaryTroop=TRUE.
- Stats per level come from the parent's spawn level (secondary rows have no research columns).
