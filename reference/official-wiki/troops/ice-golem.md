# Ice Golem

- Source: [Ice Golem](https://clashofclans.fandom.com/wiki/Ice_Golem)
- Wiki revision id: `624194` - retrieved 2026-09-15
- Client row: `characters.Ice Golem` (pinned client 18.400.21)

## Mechanics

- Unlock: Dark Barracks level 8, Town Hall 11 (client buildings.TownHallLevel). Researched in the Laboratory with Dark Elixir.
- Housing space: 15.
- Movement speed: 12 in-game (wiki) = internal Speed 150 (12 before rounding) = 1.5 tiles/s.
- Attack: every 2 s; range 1 tile.
- Damage type (wiki): Melee (Ground Only); client targets ground only.
- Favorite target: Defenses - Defense-first: ignores every other building and all defending units (even while being attacked) as long as any defensive building stands. The Clan Castle is never a defense; an activated Town Hall weapon is. Once no defenses remain it behaves like a no-preference troop, but only switches to enemy units after its current target is destroyed.
- Ground unit.
- Interactions (client flags): Healer target weight 1 (HealerWeight).
- Defense-targeting melee tank (1 tile, 2 s). Each hit chills the target: defenses and units it strikes attack 50% slower for 2 s.
- On death it deals no damage but freezes enemy defenses and units in a large radius: 7.5 tiles for 4 s (level 1) up to 9 s (level 9) on offense; 5.5 tiles for 2-3.5 s when defending.
- The freeze neither prevents traps from triggering nor stops a trap already going off. If the Ice Golem is the last unit defeated, no freeze happens.
- A level 4+ Spring Trap can eject it (15 housing).

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Freeze Time After Death - On Offense | Freeze Time After Death - On Defense | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 24 | 48 | 4.0s | 2.0s | 2,600 | N/A | N/A | N/A |
| 2 | 28 | 56 | 4.75s | 2.25s | 2,800 | 27,500 | 2d | 9 |
| 3 | 32 | 64 | 5.5s | 2.5s | 3,000 | 42,500 | 2d 12h | 9 |
| 4 | 36 | 72 | 6.25s | 2.75s | 3,200 | 50,000 | 3d 6h | 10 |
| 5 | 40 | 80 | 7.0s | 3.0s | 3,400 | 62,500 | 4d | 10 |
| 6 | 44 | 88 | 7.5s | 3.25s | 3,600 | 110,000 | 6d 12h | 12 |
| 7 | 48 | 96 | 8s | 3.5s | 3,900 | 140,000 | 7d 12h | 13 |
| 8 | 52 | 104 | 8.5s | 3.5s | 4,200 | 180,000 | 8d | 14 |
| 9 | 56 | 112 | 9s | 3.5s | 4,350 | 280,000 | 10d 14h | 15 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Dark Barracks Level Required | Range | Freeze Radius - On Offense | Freeze Radius - On Defense |
|---|---|---|---|---|---|---|---|---|
| Defenses | Melee (Ground Only) | 15 | 12 | 2s | 8 | 1 tile | 7.5 tiles | 5.5 tiles |

### Client-only per-level values (not on the wiki table)

| Level | freezeOuterSeconds | freezeOuterSecondsDefense |
|---|---|---|
| 1 | 3 | 1.65 |
| 2 | 3.563 | 1.856 |
| 3 | 4.125 | 2.063 |
| 4 | 4.688 | 2.269 |
| 5 | 5.25 | 2.475 |
| 6 | 5.625 | 2.681 |
| 7 | 5.95 | 2.681 |
| 8 | 6.275 | 2.681 |
| 9 | 6.5 | 2.681 |

## Client comparison

Checked 79 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 76 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| freezeSecondsDefense | 7 | 3.5 | 3.25 | spells.IceGolemFreeze_DEF.FreezeTimeMS/1000 | client Defensive Ice Golem SpecialAbilitiesLevel stays 6 (3,250 ms) for levels 7-9 |
| freezeSecondsDefense | 8 | 3.5 | 3.25 | spells.IceGolemFreeze_DEF.FreezeTimeMS/1000 | client Defensive Ice Golem SpecialAbilitiesLevel stays 6 (3,250 ms) for levels 7-9 |
| freezeSecondsDefense | 9 | 3.5 | 3.25 | spells.IceGolemFreeze_DEF.FreezeTimeMS/1000 | client Defensive Ice Golem SpecialAbilitiesLevel stays 6 (3,250 ms) for levels 7-9 |

### Ambiguities

- Defensive freeze duration: wiki 3.5 s at levels 7-9; client Defensive Ice Golem keeps SpecialAbilitiesLevel=6 (IceGolemFreeze_DEF FreezeTimeMS=3250 -> 3.25 s) at levels 7-9.
- Client freeze spells also define FreezeOuterTimeMS (e.g. 3,000 ms at level 1 offense, 1,650 ms defense), a shorter duration for part of the area; the wiki does not describe an outer zone.

### Matches

- `housingSpace`: wiki 15 = client 15 - characters.HousingSpace
- `attackSeconds`: wiki 2 = client 2 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 1 = client 1 - characters.AttackRange/100
- `barracksLevel`: wiki 8 = client 8 - characters.BarrackLevel
- `freezeRadiusTiles`: wiki 7.5 = client 7.5 - spells.IceGolemFreeze.Radius/100
- `freezeRadiusTilesDefense`: wiki 5.5 = client 5.5 - spells.IceGolemFreeze_DEF.Radius/100
- `movementSpeedWiki`: wiki 12 = client 12 - characters.Speed=150 -> /12.5 = 12
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki Defense = client Defense - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 9 = client 9 - number of characters rows
- `dps`: 9 values match (levels 1-9) - characters.DPS
- `damagePerHit`: 9 values match (levels 1-9) - characters.DPS x AttackSpeed/1000
- `freezeSeconds`: 9 values match (levels 1-9) - spells.IceGolemFreeze.FreezeTimeMS/1000
- `freezeSecondsDefense`: 6 values match (levels 1-6) - spells.IceGolemFreeze_DEF.FreezeTimeMS/1000
- `hitpoints`: 9 values match (levels 1-9) - characters.Hitpoints
- `researchCost`: 8 values match (levels 2-9) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 8 values match (levels 2-9) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 8 values match (levels 2-9) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- FrostOnHitTime=2000, FrostOnHitPercent=50; SpecialAbilities=IceGolemOnDeath -> SelfSpell IceGolemFreeze (Radius=750, FreezeTimeMS, FreezeOuterTimeMS, ChargingTimeMS=300, HitTimeMS=400); Defensive Ice Golem -> IceGolemOnDeathDEF -> IceGolemFreeze_DEF (Radius=550).
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
