# Hero Hall

- **Source:** https://clashofclans.fandom.com/wiki/Hero_Hall
- **Wiki revision:** 623819 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** building
- **Client record:** `buildings.csv` → `Hero Hall`

> 4x4 army building (TH4+) that unlocks heroes, sets hero level caps and hero slots (1/2/3/4 at levels 1/3/5/7), hosts hero upgrades, skins and Hero's Journey.

## Mechanics

- Construction: level 1 at Town Hall 4 for 30,000 Elixir / 1 h; every level costs Elixir (up to 26,000,000 / 13 d 12 h at level 12, TH18). One per village, 4x4 tiles.
- Unlocks: level 1 Barbarian King, 2 Archer Queen (TH8), 3 Minion Prince (TH9), 5 Grand Warden (TH11), 7 Royal Champion (TH13), 9 Dragon Duke (TH15). Levels 4, 6, 8, 10–12 only raise caps.
- Hero slots: 1 at level 1, 2 at level 3 (TH9), 3 at level 5 (TH11), 4 at level 7 (TH13).
  - On attack a slot is one hero (plus that hero's pet); on defense a slot is one Hero Banner holding one hero.
  - Attack and defense assignments are independent (e.g. TH8: King attacks while the Queen defends).
  - TH4–6: the single slot is attack-only (no banner).
- Level caps per hero are listed in the Hero Hall Level Caps table below (e.g. level 12: King/Queen 110, Prince 95, Warden 85, Champion 55, Duke 25).
- Hero management: upgrades require a free Builder each (up to six builders can upgrade different heroes at once); an upgrade can be finished with Gems, Book of Heroes or Book of Everything, or helped by the Builder's Apprentice.
  - Cancelling a hero upgrade refunds 50% of the resource.
  - Heroes under upgrade cannot attack or defend normal multiplayer, but still defend in Ranked Battles, Legend League, Clan Wars and Friendly Challenges.
- Town Hall progression: reaching the Hero Hall levels that unlock heroes available at the current TH, and placing all available Hero Banners, are prerequisites for the next Town Hall upgrade (e.g. Hero Hall 7 before TH14).
- The interface also changes skins and links to the Blacksmith (equipment) and Pet House (pet assignment); TH7+ adds the Hero's Journey tab.
- Migration (TH17 update, Nov 2024): existing players were given the lowest Hero Hall level that permits their current hero levels (in-progress hero upgrades were completed first).
  - Until the Hall is placed, heroes cannot be used in attacks.

## Level table

| Level | Unlocked Hero | Hero Slots | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | Barbarian King | 1* | 800 | 30,000 | 1h | 60 | 4 |
| 2 | Archer Queen | 1 | 1,600 | 1,600,000 | 2d | 415 | 8 |
| 3 | Minion Prince | 2 | 2,400 | 2,300,000 | 3d | 509 | 9 |
| 4 | - | 2 | 3,200 | 2,500,000 | 4d | 587 | 10 |
| 5 | Grand Warden | 3 | 3,600 | 4,500,000 | 4d 12h | 623 | 11 |
| 6 | - | 3 | 3,800 | 5,500,000 | 5d | 720 | 12 |
| 7 | Royal Champion | 4 | 4,200 | 8,500,000 | 6d | 777 | 13 |
| 8 | - | 4 | 4,600 | 9,500,000 | 6d 12h | 749 | 14 |
| 9 | Dragon Duke | 4 | 5,000 | 11,000,000 | 7d | 777 | 15 |
| 10 | - | 4 | 5,400 | 13,000,000 | 8d | 831 | 16 |
| 11 | - | 4 | 5,800 | 17,000,000 | 9d | 881 | 17 |
| 12 | - | 4 | 6,000 | 26,000,000 | 13d 12h | 1,080 | 18 |

### Wiki table(s): Hero Hall Level Caps

| Hero Hall Level | Barbarian King | Archer Queen | Minion Prince | Grand Warden | Royal Champion | Dragon Duke | Total Levels |
|---|---|---|---|---|---|---|---|
| 1 | 10 | - | - | - | - | - | 10 |
| 2 | 20 | 10 | - | - | - | - | 30 |
| 3 | 30 | 30 | 10 | - | - | - | 70 |
| 4 | 40 | 40 | 20 | - | - | - | 100 |
| 5 | 50 | 50 | 30 | 20 | - | - | 150 |
| 6 | 65 | 65 | 40 | 40 | - | - | 210 |
| 7 | 75 | 75 | 50 | 50 | 25 | - | 275 |
| 8 | 85 | 85 | 60 | 60 | 30 | - | 320 |
| 9 | 90 | 90 | 70 | 65 | 40 | 10 | 365 |
| 10 | 95 | 95 | 80 | 70 | 45 | 15 | 400 |
| 11 | 100 | 100 | 90 | 75 | 50 | 20 | 435 |
| 12 | 110 | 110 | 95 | 85 | 55 | 25 | 480 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpoints` = `buildings[Hero Hall]` `Hitpoints` (12 levels)
- `buildCost` = `buildings[Hero Hall]` `BuildCost` (+`BuildResource`) (12 levels)
- `buildTimeSeconds` = `buildings[Hero Hall]` `BuildTimeD/H/M/S` (12 levels)
- `townHallLevelRequired` = `buildings[Hero Hall]` `TownHallLevel` (12 levels)
- `heroSlots` = `globals.TAVERN_LEVEL_TO_HERO_SLOT_COUNT` (Hero Hall gates [1, 3, 5, 7] → slots [1, 2, 3, 4])
- `unlockedHero` = the Hero Hall level in `heroes.csv` `RequiredHeroTavernLevel` on each hero's level-1 row (all six)
- Hero Hall level caps table: every cap equals the highest `heroes.csv` level whose `RequiredHeroTavernLevel` ≤ that Hero Hall level (all 12 × 6 cells)

**Client columns and interpretation notes**

- `buildings.csv` → `Hero Hall`: `HeroTavern=TRUE`, `BuildingClass=Army`, `Width/Height` 4, `BuildResource=Elixir`; townhall_levels `Hero Hall` count 1 from TH4.
- Hero slots: `globals.csv` `TAVERN_LEVEL_TO_HERO_SLOT_COUNT` rows `(NumberArray, AltNumberArray)` = (1,1), (3,2), (5,3), (7,4) — Hero Hall level gate → slot count.
- Hero level caps: `heroes.csv` `RequiredHeroTavernLevel` per level row; hero unlock = the value on level 1.
- Cancel refund: `globals` `HERO_UPGRADE_CANCEL_MULTIPLIER` 50.
- Experience: no XP column; the wiki values follow floor(√build seconds) except levels 6 and 7 (see mismatches).

**Mismatches / ambiguities**

- `experienceGained` (level 6): wiki **720** vs client **657** — `buildings[Hero Hall]` floor(√(build seconds)) — derived, no XP column
- `experienceGained` (level 7): wiki **777** vs client **720** — `buildings[Hero Hall]` floor(√(build seconds)) — derived, no XP column
