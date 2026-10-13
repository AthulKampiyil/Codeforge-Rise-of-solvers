# Furnace

- Source: [Furnace](https://clashofclans.fandom.com/wiki/Furnace)
- Wiki revision id: `625281` - retrieved 2026-09-15
- Client row: `characters.Furnace` (pinned client 18.400.21)
- Spawns: [Firemite](furnace-firemite.md)

## Mechanics

- Unlock: Dark Barracks level 12, Town Hall 15 (client buildings.TownHallLevel). Researched in the Laboratory with Dark Elixir.
- Housing space: 18.
- Movement speed: 0 in-game (wiki) = internal Speed 0 (0 before rounding) = 0 tiles/s.
- Attack: none (the Furnace never attacks; its client DPS/AttackRange values are placeholders).
- Favorite target: Stationary - Stationary spawner; has no target of its own (its Firemites do the attacking).
- Ground unit.
- Interactions (client flags): Healer target weight 0 (HealerWeight).
- Stationary Dark troop (movement 0) that lasts 60 s. Its hitpoints drain over that lifetime and it releases Firemites on a fixed time schedule (19 total at level 1 up to 22 at level 4), not based on damage taken.
- Damage from defenses or traps shortens its life, so it can die before releasing every Firemite; an untouched Furnace releases all of them with a little under 10% of its hitpoints left.
- It can be healed by spells, but Healers, the Unicorn and Troop Launcher healer AI never target it. HP boosts such as the Life Gem lengthen its lifetime because the drain rate is fixed.
- With no targets it keeps spawning (the Firemites wait). On defense it pauses spawning while no attacking troops are on the field, but keeps decaying. Freeze and Ice Block do not stop spawning.

## Level table (wiki)

| Level | Firemites Spawned | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|
| 1 | 19 | 1,530 | N/A | N/A | N/A |
| 2 | 20 | 1,620 | 200,000 | 9d | 13 |
| 3 | 21 | 1,710 | 260,000 | 11d | 14 |
| 4 | 22 | 1,800 | 320,000 | 15d | 15 |

### Wiki info box

| Housing Space | Movement Speed | Lifetime | Dark Barracks Level Required |
|---|---|---|---|
| 18 | 0 / (Cannot move) | 60s | 12 |

## Client comparison

Checked 23 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 22 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| maxLevel (unreleased data) | 5 | 4 | row 4 UpgradeCost=380000, UpgradeTimeH=384; Firemite Spawn L5 | characters.Furnace row 4 / Firemite Spawn row 5 | probable future level |

### Ambiguities

- The exact spawn interval is not published by the wiki and has no column in the client; it is presumably derived from BunkerDegenerationTime and BunkerTroopCount1.
- Client row 4 already carries UpgradeCost=380,000 and UpgradeTimeH=384, and Firemite Spawn has a fifth level (350 HP, 90 damage, FireSpiritBurn level 5 = 165 DPS): unreleased level-5 data, not on the wiki.
- Client DPS 1-4 and AttackRange=1 on the Furnace are placeholders; it never attacks.

### Matches

- `housingSpace`: wiki 18 = client 18 - characters.HousingSpace
- `barracksLevel`: wiki 12 = client 12 - characters.BarrackLevel
- `lifetimeSeconds`: wiki 60 = client 60 - characters.BunkerDegenerationTime/1000
- `movementSpeedWiki`: wiki 0 = client 0 - characters.Speed=0 -> /12.5 = 0
- `maxLevel`: wiki 4 = client 4 - number of characters rows
- `spawnCount`: 4 values match (levels 1-4) - spawn count column (see Client columns)
- `hitpoints`: 4 values match (levels 1-4) - characters.Hitpoints
- `researchCost`: 3 values match (levels 2-4) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 3 values match (levels 2-4) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 3 values match (levels 2-4) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- Speed=0, BunkerTroops=Firemite Spawn, BunkerTroopCount1 per level, BunkerDegenerationTime=60000, BunkerSpawnDist=100, SecondarySpawnDist=200, HealerWeight=0, DefensiveTroop=Furnace_DEF (BunkerTroops=Firemite Spawn_DEF).
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
