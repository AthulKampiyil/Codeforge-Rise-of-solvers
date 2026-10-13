# Army Camp / housing space (mechanic)

- Source: [Army Camp/Home Village](https://clashofclans.fandom.com/wiki/Army_Camp/Home_Village) - revision `624555` - retrieved 2026-09-15
- Compared with pinned client 18.400.21 logic tables

## Mechanics

- No standalone "Housing Space" article exists; housing is documented on the Army Camp page and each troop info box.
- Maximum army capacity 352 (4 camps x 88), plus Clan Castle space (wiki).
- Heroes, Pets and Siege Machines use no Army Camp space; Clan Castle troops do not occupy Army Camps.
- Secondary units list a housing value used only for Spring/Tornado Trap, Clone and Recall weight.
- Army Camps keep working while upgrading; their hitbox is smaller than their 4x4 footprint (matters for Valkyrie spins and Bowler/Super Archer lines).

## Capacity table (wiki) vs client

| Level | Capacity | Town Hall | Client HousingSpace | Client TownHallLevel |
|---|---|---|---|---|
| 1 | 20 | 1 | 20 | 1 |
| 2 | 30 | 2 | 30 | 2 |
| 3 | 35 | 3 | 35 | 3 |
| 4 | 40 | 4 | 40 | 4 |
| 5 | 45 | 5 | 45 | 5 |
| 6 | 50 | 6 | 50 | 6 |
| 7 | 55 | 9 | 55 | 9 |
| 8 | 60 | 10 | 60 | 10 |
| 9 | 65 | 11 | 65 | 11 |
| 10 | 70 | 12 | 70 | 12 |
| 11 | 75 | 13 | 75 | 13 |
| 12 | 80 | 15 | 80 | 15 |
| 13 | 85 | 17 | 85 | 17 |
| 14 | 88 | 18 | 88 | 18 |

## Client comparison

- 28/28 values match `buildings.Army Camp` (HousingSpace, TownHallLevel).
- Troop housing columns: `characters.HousingSpace` (checked on every troop page in this folder; only the Bear differs).
