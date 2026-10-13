# Ruin Witch

- Source: [Ruin Witch](https://clashofclans.fandom.com/wiki/Ruin_Witch)
- Wiki revision id: `625328` - retrieved 2026-09-15
- Client row: `characters.Ruin Witch` (pinned client 18.400.21)
- Spawns: [Ruin Knight](ruin-witch-ruin-knight.md)

## Mechanics

- Unlock: Dark Barracks level 13, Town Hall 16 (client buildings.TownHallLevel). Researched in the Laboratory with Dark Elixir.
- Housing space: 26.
- Movement speed: 12 in-game (wiki) = internal Speed 150 (12 before rounding) = 1.5 tiles/s.
- Attack: none on offense; on defense a single-target ground hit every 2 s, range 0.8 tiles.
- Favorite target: Rubble - Rubble-seeker: does nothing until a building is destroyed, then walks to the debris and ignores everything else (see Mechanics).
- Ground unit.
- Interactions (client flags): Healer target weight 0 (HealerWeight).
- Cannot attack while attacking a village. She stands still until a building is destroyed, then walks to its rubble, ignoring everything else; rubble sealed inside a closed wall compartment, or invisible/overgrown rubble, is ignored.
- At the rubble she vacuums debris for 4 s (the rubble disappears), winds up for 2 s, then summons one Ruin Knight in front of her whose level equals her own. The knight still appears if she dies or is recalled after the debris was cleared. She pauses briefly and repeats.
- After summoning her maximum number of knights the vacuum self-destructs and she dies once the summon animation ends.
- On defense she does not vacuum; she makes a weak single-target ground attack (25-28 DPS, 2 s, 0.8 tile).

## Level table (wiki)

| Level | Ruin Knight Level | Maximum Ruin Knights Summoned | Hitpoints | Damage per Second* | Damage per Hit* | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 10 | 2,300 | 25 | 50 | N/A | N/A | 14 |
| 2 | 2 | 10 | 2,550 | 26 | 52 | 220,000 | 11d | 14 |
| 3 | 3 | 10 | 2,800 | 27 | 54 | 300,000 | 12d | 15 |
| 4 | 4 | 10 | 3,050 | 28 | 56 | 380,000 | 15d 12h | 16 |

### Wiki info box

| Preferred Target | Housing Space | Movement Speed | Dark Barracks Level Required | Range |
|---|---|---|---|---|
| Rubble | 26 | 12 | 13 | 0.8 tiles |

### Client-only per-level values (not on the wiki table)

| Level | summonLifetimeLimit |
|---|---|
| 1 | 8 |
| 2 | 8 |
| 3 | 8 |
| 4 | 8 |

## Client comparison

Checked 36 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 31 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| summonLimit | 1 | 10 | 8 | characters.SummonLimit | wiki history: raised from 8 to 10 on 2026-08-31; the pinned client predates it |
| laboratoryLevel | 1 | 14 | - | characters.LaboratoryLevel row 1 is a placeholder (research starts at level 2) | wiki lists a laboratory requirement for level 1, which is not a research step |
| summonLimit | 2 | 10 | 8 | characters.SummonLimit | wiki history: raised from 8 to 10 on 2026-08-31; the pinned client predates it |
| summonLimit | 3 | 10 | 8 | characters.SummonLimit | wiki history: raised from 8 to 10 on 2026-08-31; the pinned client predates it |
| summonLimit | 4 | 10 | 8 | characters.SummonLimit | wiki history: raised from 8 to 10 on 2026-08-31; the pinned client predates it |

### Ambiguities

- Maximum knights: wiki 10 (history: raised from 8 to 10 on 2026-08-31); client 18.400.21 SummonLimit=8 and SummonLifetimeLimit=8, i.e. the pinned client predates that balance change.
- Wiki statistics list "Laboratory Level Required 14" for level 1, which is not a research step (client row 1 LaboratoryLevel=1).

### Matches

- `housingSpace`: wiki 26 = client 26 - characters.HousingSpace
- `attackRangeTiles`: wiki 0.8 = client 0.8 - characters.AttackRange/100
- `barracksLevel`: wiki 13 = client 13 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 12 = client 12 - characters.Speed=150 -> /12.5 = 12
- `favoriteTarget`: wiki Rubble = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 4 = client 4 - number of characters rows
- `summonLevel`: 4 values match (levels 1-4) - characters.SummonLevel
- `hitpoints`: 4 values match (levels 1-4) - characters.Hitpoints
- `dps`: 4 values match (levels 1-4) - characters.DPS
- `damagePerHit`: 4 values match (levels 1-4) - characters.DPS x AttackSpeed/1000
- `researchCost`: 3 values match (levels 2-4) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 3 values match (levels 2-4) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 3 values match (levels 2-4) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- SummonTroop=Ruin Knight, SummonTroopCount=1, SummonTime=4000, DebrisSummonCompletionTime=4000, SummonDelay=2000, SummonCooldown=200, SummonLimit=8, SummonLifetimeLimit=8, SummonLevel per level, ConsumeDebrisOnSummon=TRUE, SummonPattern=InFront, DiesWhenSpawnLimitReached=TRUE, HealerWeight=0, DefensiveTroop=Ruin Witch_DEF (plain attacker, DisableProduction).
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
