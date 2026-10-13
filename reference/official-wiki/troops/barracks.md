# Barracks / Dark Barracks unlocks (mechanic)

- Source: [Barracks](https://clashofclans.fandom.com/wiki/Barracks) - revision `625112` - retrieved 2026-09-15
- Source: [Dark Barracks](https://clashofclans.fandom.com/wiki/Dark_Barracks) - revision `623607` - retrieved 2026-09-15
- Compared with pinned client 18.400.21 logic tables

## Mechanics

- Each Barracks / Dark Barracks level unlocks exactly one troop; the unlocked troop is trainable once that level is built.

### Barracks

| Level | Unlocked unit | Town Hall (wiki) | Client TownHallLevel |
|---|---|---|---|
| 1 | Barbarian | 1 | 1 |
| 2 | Archer | 1* | 2 |
| 3 | Giant | 1* | 2 |
| 4 | Goblin | 2 | 2 |
| 5 | Wall Breaker | 3 | 3 |
| 6 | Balloon | 4 | 4 |
| 7 | Wizard | 5 | 5 |
| 8 | Healer | 6 | 6 |
| 9 | Dragon | 7 | 7 |
| 10 | P.E.K.K.A | 8 | 8 |
| 11 | Baby Dragon | 9 | 9 |
| 12 | Miner | 10 | 10 |
| 13 | Electro Dragon | 11 | 11 |
| 14 | Yeti | 12 | 12 |
| 15 | Dragon Rider | 13 | 13 |
| 16 | Electro Titan | 14 | 14 |
| 17 | Root Rider | 15 | 15 |
| 18 | Thrower | 16 | 16 |
| 19 | Meteor Golem | 17 | 17 |

### Dark Barracks

| Level | Unlocked unit | Town Hall (wiki) | Client TownHallLevel |
|---|---|---|---|
| 1 | Minion | 7 | 7 |
| 2 | Hog Rider | 7 | 7 |
| 3 | Valkyrie | 8 | 8 |
| 4 | Golem | 8 | 8 |
| 5 | Witch | 9 | 9 |
| 6 | Lava Hound | 9 | 9 |
| 7 | Bowler | 10 | 10 |
| 8 | Ice Golem | 11 | 11 |
| 9 | Headhunter | 12 | 12 |
| 10 | Apprentice Warden | 13 | 13 |
| 11 | Druid | 14 | 14 |
| 12 | Furnace | 15 | 15 |
| 13 | Ruin Witch | 16 | 16 |

## Client comparison

- 62/64 unlock values (unit and Town Hall) match `buildings.*.TownHallLevel` and `characters.BarrackLevel`.

| Field | Level | Wiki | Client | Note |
|---|---|---|---|---|
| Barracks townHall | 2 | 1* | 2 | wiki footnote: files allow it at TH1 but not possible before TH2 |
| Barracks townHall | 3 | 1* | 2 | wiki footnote: files allow it at TH1 but not possible before TH2 |
| troop page text | 7 | Wizard page: Barracks 7 requires Town Hall 6 | 5 | Barracks page agrees with the client (5) |
