# Laboratory research for troops (mechanic)

- Source: [Laboratory](https://clashofclans.fandom.com/wiki/Laboratory) - revision `625132` - retrieved 2026-09-15
- Source: [Laboratory/Upgrade Chart](https://clashofclans.fandom.com/wiki/Laboratory/Upgrade_Chart) - revision `623672` - retrieved 2026-09-15
- Compared with pinned client 18.400.21 logic tables

## Mechanics

- One research at a time (a second slot via the Goblin Researcher); research cannot be cancelled; completing it applies immediately to all troops of that type. Upgrading the Laboratory does not pause research.
- Elixir troops cost Elixir, Dark Elixir troops cost Dark Elixir. A troop level becomes available at a given Laboratory level; the chart shows several levels in one cell when more than one unlocks at that Laboratory level.
- Research semantics in the client: level N costs `UpgradeCost` of row N-1, takes `UpgradeTimeH`*3600 + `UpgradeTimeM`*60 of row N-1 (blank minute = 0, see Barbarian), and needs `LaboratoryLevel` of row N.

## Laboratory level -> Town Hall

| Laboratory level | Town Hall (wiki) | Client TownHallLevel |
|---|---|---|
| 1 | 3 | 3 |
| 2 | 4 | 4 |
| 3 | 5 | 5 |
| 4 | 6 | 6 |
| 5 | 7 | 7 |
| 6 | 8 | 8 |
| 7 | 9 | 9 |
| 8 | 10 | 10 |
| 9 | 11 | 11 |
| 10 | 12 | 12 |
| 11 | 13 | 13 |
| 12 | 14 | 14 |
| 13 | 15 | 15 |
| 14 | 16 | 16 |
| 15 | 17 | 17 |
| 16 | 18 | 18 |

## Client comparison

- Upgrade chart: 818/819 (laboratory level, cost, time) values for the 32 troops equal the client-derived research values.
- Laboratory Town Hall requirement: 16/16 match `buildings.Laboratory.TownHallLevel`.

### Mismatches

| Field | Level | Wiki | Client | Note |
|---|---|---|---|---|
| researchSeconds | 13 | 1,080,000 | 907,200 | wizard (chart cell ('13', '16M', '12d 12h')) |
| intro text | 3 | chart intro: Archer level 3 at Laboratory 3 costs 80,000 and takes 6 hours | chart cell and client: 80,000 / 2h | stale example text |

Per-troop research rows are in `laboratory-upgrade-chart.json` (`researchByTroop`) and in each troop file.
