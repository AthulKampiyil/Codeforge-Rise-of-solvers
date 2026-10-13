# Apprentice Warden

- Source: [Apprentice Warden](https://clashofclans.fandom.com/wiki/Apprentice_Warden)
- Wiki revision id: `624360` - retrieved 2026-09-15
- Client row: `characters.Apprentice Warden` (pinned client 18.400.21)

## Mechanics

- Unlock: Dark Barracks level 10, Town Hall 13 (client buildings.TownHallLevel). Researched in the Laboratory with Dark Elixir.
- Housing space: 20.
- Movement speed: 20 in-game (wiki) = internal Speed 250 (20 before rounding) = 2.5 tiles/s.
- Attack: every 0.9 s; range 5 tiles.
- Damage type (wiki): Single Target (Ground & Air); client targets ground and air.
- Favorite target: Any (wiki info box); template rule "None" - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit. Jumps/passes over walls (IsJumper=TRUE).
- Interactions (client flags): Healer target weight 10 (HealerWeight).
- Ground support unit with a long-range slingshot (5 tiles, 0.9 s, ground and air) that hops over walls.
- Life Aura: allies within 7 tiles (ground and air troops and Heroes; not himself, not siege machines, not buildings) gain +20% max HP at level 1 up to +26% at level 4, with no hitpoint cap. Per the wiki it does not stack with the Grand Warden's Life Gem or other Apprentice Warden auras: the strongest applies.
- Grand-Warden-style AI: although he has no preferred target, he follows a sufficiently large nearby group and attacks what they attack.

## Level table (wiki)

| Level | Damage per Second | Damage per Hit | Aura HP Increase | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 170 | 153 | 20% | 1,500 | N/A | N/A | N/A |
| 2 | 185 | 166.5 | 22% | 1,650 | 90,000 | 6d | 11 |
| 3 | 200 | 180 | 24% | 1,800 | 135,000 | 7d 12h | 12 |
| 4 | 215 | 193.5 | 26% | 1,950 | 160,000 | 8d | 13 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Dark Barracks Level Required | Range | Aura Range |
|---|---|---|---|---|---|---|---|
| Any | Single Target (Ground & Air) | 20 | 20 | 0.9s | 10 | 5 tiles | 7 tiles |

## Client comparison

Checked 34 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 34 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 20 = client 20 - characters.HousingSpace
- `attackSeconds`: wiki 0.9 = client 0.9 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 5 = client 5 - characters.AttackRange/100
- `barracksLevel`: wiki 10 = client 10 - characters.BarrackLevel
- `auraRadiusTiles`: wiki 7 = client 7 - aura spell Radius/100
- `movementSpeedWiki`: wiki 20 = client 20 - characters.Speed=250 -> /12.5 = 20
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 4 = client 4 - number of characters rows
- `dps`: 4 values match (levels 1-4) - characters.DPS
- `damagePerHit`: 4 values match (levels 1-4) - characters.DPS x AttackSpeed/1000
- `auraHpPercent`: 4 values match (levels 1-4) - spells.Apprentice Aura.ExtraHealthPermil/10
- `hitpoints`: 4 values match (levels 1-4) - characters.Hitpoints
- `researchCost`: 3 values match (levels 2-4) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 3 values match (levels 2-4) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 3 values match (levels 2-4) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- AuraSpell=Apprentice Aura (Radius=700, ExtraHealthPermil 200/220/240/260, TimeBetweenHitsMS=300, DoesNotAffectOwner=TRUE, ImmunitySiegeMachines=TRUE); FightWithGroups=TRUE, TargetGroupsRadius=500, TargetGroupsRange=1300, TargetGroupsMinWeight=1000; IsJumper=TRUE; HealerWeight=10.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
