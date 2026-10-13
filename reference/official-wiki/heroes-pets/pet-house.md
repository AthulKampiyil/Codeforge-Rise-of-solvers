# Pet House

- **Source:** https://clashofclans.fandom.com/wiki/Pet_House
- **Wiki revision:** 625146 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** building
- **Client record:** `buildings.csv` → `Pet House`

> 3x3 army building (TH14+) that unlocks one new pet per level (12 levels) and researches pet upgrades with Dark Elixir, one at a time.

## Mechanics

- Construction: level 1 at TH14 for 3,000,000 Elixir / 1 d; level 12 (TH18) costs 25,500,000 / 13 d 12 h. Levels 1–4 need TH14, 5–8 TH15, 9–10 TH16, 11 TH17, 12 TH18.
- Each level unlocks one pet: L.A.S.S.I (1), Electro Owl (2), Mighty Yak (3), Unicorn (4), Frosty (5), Diggy (6), Poison Lizard (7), Phoenix (8), Spirit Fox (9), Angry Jelly (10), Sneezy (11), Greedy Raven (12).
- Pet rules:
  - each pet can be assigned to one hero and each hero carries at most one pet; assignment is changed in the Pet House or the army screen;
  - a pet is deployed only together with its hero (never alone); if the hero is unavailable the pet can only be used by reassigning it;
  - pets stay near their hero while it lives and keep fighting (with changed behaviour) after it is knocked out;
  - pets never defend the village.
- Upgrades: Dark Elixir, performed in the Pet House — only one pet at a time; the pet sleeps outside and cannot battle while upgrading.
  - Book of Heroes / Book of Everything finish the timer; Hammer of Heroes completes an upgrade for free.
- Max pet levels by Pet House level are in the chart below (first ten pets start at cap 10; several rise to 15 at Pet House 5/7/9/11/12).

## Level table

| Level | Unlocked Pet | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|
| 1 | L.A.S.S.I | 700 | 3,000,000 | 1d | 293 | 14 |
| 2 | Electro Owl | 800 | 4,000,000 | 2d | 415 | 14 |
| 3 | Mighty Yak | 900 | 5,000,000 | 3d | 509 | 14 |
| 4 | Unicorn | 1,000 | 6,000,000 | 3d 12h | 549 | 14 |
| 5 | Frosty | 1,050 | 7,000,000 | 4d | 587 | 15 |
| 6 | Diggy | 1,100 | 8,000,000 | 4d 12h | 623 | 15 |
| 7 | Poison Lizard | 1,150 | 9,000,000 | 5d | 657 | 15 |
| 8 | Phoenix | 1,200 | 10,000,000 | 5d 12h | 689 | 15 |
| 9 | Spirit Fox | 1,250 | 11,000,000 | 6d | 720 | 16 |
| 10 | Angry Jelly | 1,300 | 12,000,000 | 7d | 777 | 16 |
| 11 | Sneezy | 1,350 | 16,500,000 | 8d | 831 | 17 |
| 12 | Greedy Raven | 1,400 | 25,500,000 | 13d 12h | 1,080 | 18 |

### Wiki table(s): Max Level Chart

| Pet House Level | Max level / L.A.S.S.I | Max level / Electro Owl | Max level / Mighty Yak | Max level / Unicorn | Max level / Frosty | Max level / Diggy | Max level / Poison Lizard | Max level / Phoenix | Max level / Spirit Fox | Max level / Angry Jelly | Max level / Sneezy | Max level / Greedy Raven |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 10 | - | - | - | - | - | - | - | - | - | - | - |
| 2 | 10 | 10 | - | - | - | - | - | - | - | - | - | - |
| 3 | 10 | 10 | 10 | - | - | - | - | - | - | - | - | - |
| 4 | 10 | 10 | 10 | 10 | - | - | - | - | - | - | - | - |
| 5 | 15 | 10 | 10 | 10 | 10 | - | - | - | - | - | - | - |
| 6 | 15 | 10 | 10 | 10 | 10 | 10 | - | - | - | - | - | - |
| 7 | 15 | 10 | 15 | 10 | 10 | 10 | 10 | - | - | - | - | - |
| 8 | 15 | 10 | 15 | 10 | 10 | 10 | 10 | 10 | - | - | - | - |
| 9 | 15 | 15 | 15 | 10 | 10 | 10 | 10 | 10 | 10 | - | - | - |
| 10 | 15 | 15 | 15 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | - | - |
| 11 | 15 | 15 | 15 | 15 | 15 | 10 | 15 | 10 | 10 | 10 | 10 | - |
| 12 | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 10 | 10 | 10 | 10 | 10 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpoints` = `buildings[Pet House]` `Hitpoints` (12 levels)
- `buildCost` = `buildings[Pet House]` `BuildCost` (+`BuildResource`) (12 levels)
- `buildTimeSeconds` = `buildings[Pet House]` `BuildTimeD/H/M/S` (12 levels)
- `experienceGained` = `buildings[Pet House]` floor(√(build seconds)) — derived, no XP column (12 levels)
- `townHallLevelRequired` = `buildings[Pet House]` `TownHallLevel` (12 levels)
- `unlockedPet` = Pet House level in `pets.csv` `LaboratoryLevel` on each pet's level-1 row (all twelve)
- Max level chart equals client `LaboratoryLevel` gates except the cells listed under mismatches

**Client columns and interpretation notes**

- `buildings.csv` → `Pet House`: `UpgradesUnitType=PET`, 3x3 footprint, Elixir construction.
- Pet unlock and caps come from `pets.csv` `LaboratoryLevel` (= required Pet House level) on each pet level row.
- `globals` `BOOSTER_PET_SHOP_SPEEDUP` 24 / `BOOSTER_PET_SHOP_DURATION` 3600 (research potion effect), `PET_HOUSING_COST_MULTIPLIER` 0.

**Mismatches / ambiguities**

- `maxLevel.Diggy` (level 12): wiki **15** vs client **10** — max pet level with LaboratoryLevel ≤ Pet House level; client has only 10 Diggy rows
