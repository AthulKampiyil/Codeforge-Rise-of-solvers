# Earthquake Spell

- **Source:** https://clashofclans.fandom.com/wiki/Earthquake_Spell
- **Wiki revision:** 622962; retrieved 2026-09-15
- **Category:** `dark-spell`
- **Client row:** `spells.json` -> `Earthquake` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Dark Spell Factory level 2 (Town Hall 8). Housing space 1. Radius grows 3.5 -> 4.7 tiles through L5.
- Damage is a percentage of each target's MAXIMUM hitpoints: 14.5% (L1), 17, 21, 25, 29% (L5+). Resource storages are immune; the Town Hall, Clan Castle and collectors can be damaged.
- Repeated quakes on the same building deal diminishing damage: the n-th quake does 1/(2n-1) of its value (1, 1/3, 1/5, 1/7...) regardless of level, so casting order matters with mixed levels and buildings cannot be finished by quakes alone.
- Walls use a different rule: the n-th quake deals 1/n of the value plus an extra 5 x (n-1)^2 % of the Wall's max HP (5%, 20%, 45% extra for quakes 2-4). Four quakes always destroy any Wall; three never do.
- Levels 6-8 (February 2026) add damage to ground troops only (Heroes, CC troops, trap Skeletons): 5%, 10%, 14.5% of max HP; lower-level quakes do not count toward a unit's diminishing sequence.
- Earthquake Boots count as one quake in the diminishing sequence and vice versa.

## Constants (wiki)

| Field | Value |
|---|---|
| damageType | Area Splash |
| housingSpace | 1 |
| targets | Buildings & Walls |
| favoriteTarget | Walls |
| darkSpellFactoryLevel | 2 |

## Level table

| Level | Building dmg % max HP | Troop dmg % max HP | Radius (tiles) | Research cost | Research time | Lab level |
|---|---|---|---|---|---|---|
| 1 | 14.5 | N/A | 3.5 | N/A | N/A | N/A |
| 2 | 17 | N/A | 3.8 | 6,000 | 12h | 6 |
| 3 | 21 | N/A | 4.1 | 12,000 | 1d | 7 |
| 4 | 25 | N/A | 4.4 | 25,500 | 3d | 8 |
| 5 | 29 | N/A | 4.7 | 42,000 | 3d 12h | 9 |
| 6 | 29 | 5 | 4.7 | 120,000 | 8d | 12 |
| 7 | 29 | 10 | 4.7 | 200,000 | 9d | 14 |
| 8 | 29 | 14.5 | 4.7 | 330,000 | 13d 12h | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- building damage -> `BuildingDamagePermil` per hit x `NumberOfHits` 5 (29,34,42,50,58 permil -> 14.5..29%)
- troop damage -> `TroopDamagePermil` x 5 (0,0,0,0,0,10,20,29 -> 5/10/14.5%)
- radius -> `Radius` 350..470
- wall rule -> `PreferredTarget` 'Wall', `PreferredTargetDamageMod` = 5 (matches the 5x(n-1)^2 % wall term)
- storage immunity -> `ImmunityStorages` = TRUE (no TH/CC immunity flag)
- timing -> 5 hits x `TimeBetweenHitsMS` 400

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `darkSpellFactoryLevel`: wiki 2 vs client 2 (`SpellForgeLevel`)
- MATCH `buildingDamagePercent` at levels 1-8 (`BuildingDamagePermil*NumberOfHits/10`)
- MATCH `troopDamagePercent` at levels 1-8 (`TroopDamagePermil*NumberOfHits/10`)
- MATCH `radiusTiles` at levels 1-8 (`Radius/100`)
- MATCH `researchCost` at levels 2-8 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-8 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-8 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Client stores the percentage split into 5 hits of per-mille damage; the wiki's L1 '14.5%*' (displayed in-game as 14%) is exactly 5 x 2.9%.
- `PreferredTargetDamageMod` = 5 is the only wall-specific number on the row; the exact 1/n + 5(n-1)^2% formula comes from the wiki and must be implemented in code.
