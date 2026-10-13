# Skeleton Spell

- **Source:** https://clashofclans.fandom.com/wiki/Skeleton_Spell
- **Wiki revision:** 623005; retrieved 2026-09-15
- **Category:** `dark-spell`
- **Client row:** `spells.json` -> `Skeleton Spell` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Dark Spell Factory level 4 (Town Hall 9). Housing space 1.
- Summons Skeletons at the drop point: 12 at L1 up to 19 at L8. A first group appears at once and the rest trickle in at about one per second (spawning rules changed Dec 2019).
- Each Skeleton: melee ground attacker, no preferred target, speed 24, 1 s attack, 0.4-tile range, 25 DPS, 30 HP behind 30 armor HP (armor soaks overkill so one hit cannot kill it outright).
- Spell Skeletons do not trigger Traps or the Clan Castle and deal much less damage to resource buildings (including the Town Hall).
- Stacking: casts are independent summons (the wiki strategy text stacks several Skeleton Spells for backdoor attacks).

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 3.5 |
| housingSpace | 1 |
| targets | Ground |
| darkSpellFactoryLevel | 4 |

## Level table

| Level | Skeletons | Research cost | Research time | Lab level |
|---|---|---|---|---|
| 1 | 12 | N/A | N/A | N/A |
| 2 | 13 | 11,000 | 12h | 8 |
| 3 | 14 | 17,000 | 1d | 8 |
| 4 | 15 | 25,000 | 2d | 9 |
| 5 | 16 | 40,000 | 2d 12h | 10 |
| 6 | 17 | 50,000 | 3d | 10 |
| 7 | 18 | 75,000 | 4d | 11 |
| 8 | 19 | 135,000 | 6d | 13 |

Cells shown as `wiki (client X)` differ from the pinned client.

### Skeleton unit (wiki)

| Preferred target | Attack type | Movement speed | Attack speed seconds | Range tiles | DPS | HP | Armor hitpoints |
|---|---|---|---|---|---|---|---|
| None | Melee (Ground Only) | 24 | 1 | 0.4 | 25 | 30 | 30 |

## Client comparison

**Which client columns encode each mechanic**

- count -> `UnitsToSpawn` (12..19)
- spawn schedule -> `SpawnFirstGroupSize` = 4 immediately, remaining over `SpawnDuration` (8000..15000 ms)
- unit -> `SummonTroop` 'Spell Shielded Skeleton' (armor layer) -> `SecondaryTroop` 'Spell Unshielded Skeleton'
- resource damage -> `DamageReductionToStorages` = 85 on both skeleton rows (15% damage)
- CC trigger -> `DoesNotOpenCC` TRUE; globals `SKELETON_OPEN_CC` = FALSE
- area -> `Radius` = 225, `RandomRadius` = 200

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `darkSpellFactoryLevel`: wiki 4 vs client 4 (`SpellForgeLevel`)
- MATCH `skeletonsGenerated` at levels 1-8 (`UnitsToSpawn`)
- MATCH `researchCost` at levels 2-8 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-8 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-8 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Radius mismatch: wiki constants say 3.5 tiles, client `Radius` = 225 (2.25 tiles) with `RandomRadius` 200; the wiki number may describe the visual ring rather than the spawn area.
- Skeleton unit check (client): speed 24.0, attack 1.0s, range 0.4, DPS 25, shielded HP 30 + unshielded HP 30 - all match the wiki's 24 / 1s / 0.4 / 25 / 30 armor + 30.
- Spawn pacing: (UnitsToSpawn - 4) / (SpawnDuration s) = 1.0 skeleton/s at every level, matching the wiki's history note.
