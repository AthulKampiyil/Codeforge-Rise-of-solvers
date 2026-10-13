# Clan Castle

- **Source:** https://clashofclans.fandom.com/wiki/Clan_Castle
- **Wiki revision:** 623293; retrieved 2026-09-15
- **Also used:** https://clashofclans.fandom.com/wiki/Template:Siege_Donations (rev 623292)
- **Category:** `building`
- **Client row:** `buildings.json` -> `Clan Castle` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Scope here: reinforcement capacity and how Siege Machines carry Clan Castle troops (treasury/defense details omitted).
- Troop capacity 10 (L1) to 55 (L13-14). Spell capacity starts at L4 with 1 housing and grows by one at L7, L10 and L14 (max 4). Siege capacity: 1 machine from L6, 2 from L12 (only one can be deployed per battle).
- Donated units are capped at the level a given Laboratory level allows (cap 5 at CC1 rising to 16 at CC12+); Super Troops additionally need that lab cap to reach the base troop's boost level. Siege Machines use a separate per-CC-level cap table (below).
- Clan Castle troops ride inside the deployed Siege Machine and are released at the machine's position when it is destroyed - by defenses, by completing its objective (e.g. reaching the Town Hall), by lifetime expiry, by running out of barrels, or by the player's manual release. A machine deployed with an empty Clan Castle releases nothing.
- Whichever of two held Siege Machines is used, the same Clan Castle troops are inside it.
- Release/deployment order from a Clan Castle (and from Troop Launcher / Sky Wagon barrels): lowest housing space first; equal housing is ordered by internal troop ID (older troops first, e.g. Barbarian > Archer > Goblin; Giant > Balloon > Hog Rider > Super Barbarian); same troop type leaves lowest level first.
- Donation bookkeeping: 1 XP per troop housing, 5 XP per spell housing, 30 XP per Siege Machine (a siege counts as 30 donated units). Self-reinforcement with Raid Medals costs 1 per 2 troop housing, 3 per spell housing, 15 per Siege Machine. A clan must be level 6+ to donate two sieges to one request.
- Defensive trigger radius: 13 tiles.

## Constants (wiki)

| Field | Value |
|---|---|
| triggerRadiusTiles | 13 |
| footprint | 3x3 |

## Level table

| Level | HP | Troop capacity | Spell capacity | Siege capacity | Donation lab cap | Build cost | Build time | XP | TH req. |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 600 | 10 | N/A | N/A | 5 | 10,000 | N/A | N/A | 2 |
| 2 | 1,200 | 15 | N/A | N/A | 6 | 50,000 | 2h | 84 | 4 |
| 3 | 1,800 | 20 | N/A | N/A | 7 | 600,000 | 12h | 207 | 6 |
| 4 | 2,600 | 25 | 1 | N/A | 8 | 1,200,000 | 1d | 293 | 8 |
| 5 | 3,000 | 30 | 1 | N/A | 9 | 2,000,000 | 1d 12h | 360 | 9 |
| 6 | 3,400 | 35 | 1 | 1 | 10 | 3,000,000 | 2d | 415 | 10 |
| 7 | 4,000 | 35 | 2 | 1 | 11 | 5,000,000 | 3d | 509 | 11 |
| 8 | 4,400 | 40 | 2 | 1 | 12 | 5,000,000 | 4d | 587 | 12 |
| 9 | 4,800 | 45 | 2 | 1 | 13 | 8,000,000 | 6d | 720 | 13 |
| 10 | 5,200 | 45 | 3 | 1 | 14 | 10,000,000 | 7d | 777 | 14 |
| 11 | 5,400 | 50 | 3 | 1 | 15 | 12,000,000 | 8d | 831 | 15 |
| 12 | 5,600 | 50 | 3 | 2 | 16 | 14,500,000 | 9d | 881 | 16 |
| 13 | 5,800 | 55 | 3 | 2 | 16 | 19,000,000 | 10d | 929 | 17 |
| 14 | 6,000 | 55 | 4 | 2 | 16 | 28,000,000 | 14d | 1,099 | 18 |

Cells shown as `wiki (client X)` differ from the pinned client.

### Siege Machine level cap by Clan Castle level (wiki Template:Siege Donations)

| Siege machine | CC 6 | CC 7 | CC 8 | CC 9 | CC 10 | CC 11 | CC 12 | CC 13+ |
|---|---|---|---|---|---|---|---|---|
| Wall Wrecker | 2 | 3 | 4 | 5 | 6 | 6 | 6 | 6 |
| Battle Blimp | 2 | 3 | 4 | 5 | 6 | 6 | 6 | 6 |
| Stone Slammer | 2 | 3 | 4 | 5 | 6 | 6 | 6 | 6 |
| Siege Barracks | N/A | 2 | 3 | 4 | 5 | 6 | 6 | 6 |
| Log Launcher | N/A | 2 | 3 | 4 | 5 | 6 | 6 | 6 |
| Flame Flinger | N/A | N/A | 2 | 3 | 4 | 5 | 5 | 5 |
| Battle Drill | N/A | N/A | N/A | 2 | 3 | 4 | 5 | 6 |
| Troop Launcher | N/A | N/A | N/A | N/A | 2 | 3 | 4 | 4 |
| Sky Wagon | N/A | N/A | N/A | N/A | N/A | 2 | 3 | 4 |

A dash (N/A) means the machine cannot be received at that Clan Castle level. Rule of thumb from the template: a CC accepts machines obtainable up to two Town Hall levels above that CC's own TH requirement.

## Client comparison

**Which client columns encode each mechanic**

- troop capacity -> `HousingSpace`
- spell capacity -> `HousingSpaceAlt`
- siege capacity -> `HousingSpaceSiege`
- HP / cost / time / TH -> `Hitpoints`, `BuildCost`, `BuildTimeD/H/M/S`, `TownHallLevel`
- trigger radius -> globals `CLAN_CASTLE_RADIUS` = 13
- donation XP -> globals `SIEGE_DONATE_XP_MULTIPLIER` = 30, `SPELL_DONATE_XP_MULTIPLIER` = 5, `SIEGE_DONATE_COUNT_MULTIPLIER` = 30
- Raid Medal reinforcement -> globals `SIEGE_DONATE_COST_MULTIPLIER` = 15, `SPELL_DONATE_COST_MULTIPLIER` = 3
- per-request limits -> globals `MAX_SIEGE_DONATION_COUNT` = 1, `MAX_SPELL_DONATION_COUNT` = 1 (base values before clan perks)
- siege release -> globals `SIEGE_MACHINE_SELF_DESTRUCT_ON_REACHING_TARGET` = TRUE; every siege row has a `...SelfDestruct` special ability with `ActiveAfterPlayerInput` = TRUE (manual release)
- request cooldown -> globals `ALLIANCE_TROOP_REQUEST_COOLDOWN` = 1200

**Automatic wiki-vs-client check**

- MATCH `hitpoints` at levels 1-14 (`Hitpoints`)
- MATCH `buildCost` at levels 1-14 (`BuildCost`)
- MATCH `troopCapacity` at levels 1-14 (`HousingSpace`)
- MATCH `spellCapacity` at levels 1-14 (`HousingSpaceAlt`)
- MATCH `siegeCapacity` at levels 1-14 (`HousingSpaceSiege`)
- MATCH `buildTimeHours` at levels 2-14 (`BuildTimeD/H/M/S`)
- MATCH `experience` at levels 2-14 (`floor(sqrt(build seconds))`)
- MATCH `townHallLevel` at levels 2-14 (`TownHallLevel`)

**Notes, ambiguities and manual checks**

- Town Hall for level 1: wiki shows '2*' (footnote: normally TH3, TH2 only with purchased resources); client `TownHallLevel` = 3.
- Request cooldown: wiki says a request every 10 minutes; client `ALLIANCE_TROOP_REQUEST_COOLDOWN` = 1200 (20 min if seconds). Possibly reduced by clan perks/Gold Pass; not verified.
- The Laboratory level cap per CC level and the Siege Machine level-cap table were not found as client columns in buildings.json/characters.json/globals.json; they are likely server-side or in another table.
- The deployment-order tie-break by 'internal ID' matches ascending client `GlobalID` in characters.json for all 11 tie groups the wiki lists (e.g. Barbarian 4000000 < Archer 4000001 < Goblin 4000002; Giant 4000003 < Balloon 4000005 < Hog Rider 4000011 < Super Barbarian 4000026; Yeti 4000053 < Furnace 4000150).
