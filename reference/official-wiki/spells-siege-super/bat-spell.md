# Bat Spell

- **Source:** https://clashofclans.fandom.com/wiki/Bat_Spell
- **Wiki revision:** 623006; retrieved 2026-09-15
- **Category:** `dark-spell`
- **Client row:** `spells.json` -> `Bat Spell` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Dark Spell Factory level 5 (Town Hall 10). Housing space 1.
- Summons Bats over a short period (like the Skeleton Spell): 7 at L1 up to 25 at L8.
- Bats are air units that prefer defenses: speed 56, 2 s attack, 30 DPS, 20 HP.
- Bats do not trigger Traps or the Clan Castle and deal reduced damage to resource storages - including the Town Hall, which counts as both a defense and a storage.
- Stacking: casts are independent summons (the wiki suggests massing several Bat Spells with Rage/Freeze).

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 3.5 |
| housingSpace | 1 |
| targets | Defenses |
| darkSpellFactoryLevel | 5 |

## Level table

| Level | Bats | Research cost | Research time | Lab level |
|---|---|---|---|---|
| 1 | 7 | N/A | N/A | N/A |
| 2 | 9 | 13,000 | 18h | 8 |
| 3 | 11 | 25,500 | 1d 12h | 8 |
| 4 | 16 | 35,000 | 2d 6h | 9 |
| 5 | 21 | 47,500 | 4d | 10 |
| 6 | 22 | 140,000 | 7d | 13 |
| 7 | 23 | 220,000 | 8d 12h | 15 |
| 8 | 25 | 300,000 | 13d | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

### Bat unit (wiki)

| Preferred target | Attack type | Movement speed | Attack speed seconds | Range tiles | DPS | Damage vs resources multiplier | HP |
|---|---|---|---|---|---|---|---|
| Defenses | Air | 56 | 2 | 0.8 | 30 | 0.4 | 20 |

## Client comparison

**Which client columns encode each mechanic**

- count -> `UnitsToSpawn` (7..25)
- spawn schedule -> `SpawnFirstGroupSize` = 2 immediately, remaining over `SpawnDuration` (3000..13800 ms)
- unit -> `SummonTroop` 'Spell Bat' (`Speed` 700, `AttackSpeed` 2000, `DPS` 30, `Hitpoints` 20, `AttackRange` 30, `PreferedTargetBuildingClass` Defense)
- resource damage -> 'Spell Bat'.`DamageReductionToStorages` = 85 (x0.15)
- area -> `Radius` 225, `RandomRadius` 200

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `darkSpellFactoryLevel`: wiki 5 vs client 5 (`SpellForgeLevel`)
- MATCH `batsGenerated` at levels 1-8 (`UnitsToSpawn`)
- MATCH `researchCost` at levels 2-8 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-8 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-8 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Radius mismatch: wiki 3.5 tiles vs client `Radius` 225 (same as Skeleton Spell).
- Resource multiplier mismatch: wiki Bat table says x0.4 damage vs resources, but the same page's defensive-strategy text says Bats deal 15% to storages; client `DamageReductionToStorages` = 85 agrees with 15% (x0.15).
- Range mismatch: wiki 0.8 tiles vs client `AttackRange` 30 (0.3 tiles). Several air units on the wiki show client range + 0.5 tile.
- Unit matches: speed 56.0 = 56, attack 2.0s, DPS 30, HP 20.
