# Super Yeti

- **Source:** https://clashofclans.fandom.com/wiki/Super_Yeti
- **Wiki revision:** 623186; retrieved 2026-09-15
- **Also used:** https://clashofclans.fandom.com/wiki/Super_Yeti/Electromite (rev 624751)
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Super Yeti` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Yeti. Melee ground brawler, no preferred target; housing 35, speed 12, 1 s attacks, 0.8-tile range. Wiki levels 3-8 (1-2 only in its Mini Spotlight). Accidentally released March 24, 2025, removed, then re-added May 2025.
- Boosting: needs Town Hall 13 in practice (global minimum TH11 plus the base Yeti at level 3+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once.
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Yeti.
- Stat change vs the base Yeti at level 3 (client rows): housing 18 -> 35, HP 3500 -> 5400, DPS 270 -> 415, speed 12 -> 12.
- Special ability Shock and Awe: while taking damage it releases Electromites (7 at L1 up to 14 at L8 in total); any not yet released spawn when it dies. The Super Yeti page says the first spawns after 400 damage and then every 800; the Electromite page says every 400 damage.
- Electromites jump Walls, prefer buildings (4x damage to all buildings including resource buildings and the Town Hall), attack from 2 tiles with a chain lightning hitting up to 3 targets (-20% per hop, 3-tile hops), then dissipate. Each counts as 3 housing for traps/Clone/Recall.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | Any |
| attackType | Melee (Ground Only) |
| housingSpace | 35 |
| movementSpeed | 12 |
| attackSpeedSeconds | 1 |
| barracksLevel | 14 |
| rangeTiles | 0.8 |
| specialAbility | Shock and Awe |

## Level table

| Level | DPS | Damage / attack | HP | Electromites |
|---|---|---|---|---|
| 1* | 360 | 360 | 4,600 | 7 |
| 2* | 390 | 390 | 5,000 | 8 |
| 3 | 415 | 415 | 5,400 | 9 |
| 4 | 440 | 440 | 5,800 | 10 |
| 5 | 465 | 465 | 6,200 | 11 |
| 6 | 495 | 495 | 6,600 | 12 |
| 7 | 525 | 525 | 7,000 | 13 |
| 8 | 550 | 550 | 7,400 | 14 |

`*` = level only reachable in a wiki-documented event/spotlight (not through normal boosting).

Cells shown as `wiki (client X)` differ from the pinned client.

### Electromite (client rows; identical to wiki Super Yeti/Electromite table)

| Level | Damage | Damage vs buildings | HP |
|---|---|---|---|
| 1 | 56 | 224 | 300 |
| 2 | 64 | 256 | 350 |
| 3 | 72 | 288 | 400 |
| 4 | 78 | 312 | 450 |
| 5 | 84 | 336 | 500 |
| 6 | 88 | 352 | 550 |
| 7 | 90 | 360 | 575 |
| 8 | 92 | 368 | 590 |

## Client comparison

**Which client columns encode each mechanic**

- electromites -> `SpecialAbilities` SuperYetiSpawnYetiMites (level = `SpecialAbilitiesLevel`): `TroopCount` 7..14, `SpawnnedTroopsPerDamage` 400, `SpawnRemainingTroopsOnDeath` TRUE, `TroopLevel` 1..8
- Electromite -> characters `Electromite`: `Hitpoints` 300..590, `DPS` 56..92, `AttackRange` 200, `Speed` 300, `IsJumper` TRUE, ability ElectromiteStunAbility (`ExtraDamagePercentageAgainstTarget` 400, `ChainAttackDepth` 3, `ChainAttackDistance` 300, `ChainAttackDamageReductionPercent` 20, 0.1 s stun)
- stats -> `DPS`, `Hitpoints`, `Speed` 150, `AttackRange` 80, `BarrackLevel` 14

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 35 vs client 35 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 12 vs client 12 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 1 vs client 1 (`AttackSpeed/1000`)
- MATCH `rangeTiles`: wiki 0.8 vs client 0.8 (`AttackRange/100`)
- MATCH `barracksLevel`: wiki 14 vs client 14 (`BarrackLevel`)
- MATCH `hitpoints` at levels 1-8 (`Hitpoints`)
- MATCH `dps` at levels 1-8 (`DPS`)
- MATCH `damagePerAttack` at levels 1-8 (`DPS*AttackSpeed/1000`)
- MATCH `electromites` at levels 1-8 (`SuperYetiSpawnYetiMites.TroopCount`)

**Notes, ambiguities and manual checks**

- Spawn interval ambiguity inside the wiki (400-then-800 vs every 400); client `SpawnnedTroopsPerDamage` = 400 supports 'every 400 damage'.
- No `SuperTroopOverview`/`DonatingSuperTroop` templates on this page; TH requirement derived from client data is TH13 (Yeti level 3 needs Laboratory 11).
- Electromite per-level stats on the wiki (56-92 damage, 300-590 HP, x4 vs buildings) all match the client `Electromite` rows.
- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
