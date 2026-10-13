# Native Town Hall catalog

Pinned public client 18.400.21, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, downloaded from `https://game-assets.clashofclans.com/`. This reference holds the tier tables the Home Village progression is built from. It contains no artwork; the buildings it gates own their own art and combat references.

- `catalog.json`: 18 Town Hall tiers with their original hitpoints, gold price, build duration and permitted count of every entity this game implements; the Town Hall each individual building and trap level requires; the complete per-level rows of the entities no other reference owns; all 110 Barbarian King records; the gem price of each Builder's Hut; and what a new village is granted.

| Source | SHA-256 |
| --- | --- |
| [townhall_levels.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/townhall_levels.csv) | `2d596bcd08433924c3e566f79f380eb2260076f87c5b5dd30c9ab6f2c3f41472` |
| [buildings.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/buildings.csv) | `9aed5fed876e2914a22fa7fed688a651c691ab06170d60e2bda8dc9262fbccb1` |
| [traps.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/traps.csv) | `757ca07de02b26b2071b52bb3cb495df2f0ae879731a859d3102ca3552dd528c` |
| [heroes.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/heroes.csv) | `658c9721fb0fd5488b69ca3555ef5597d521f28dde95af051a2a98ccbdd65197` |
| [special_abilities.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/special_abilities.csv) | `c978dd90ff2335e60d988f3476d78bec72672e8c074344d149096e89951181eb` |
| [globals.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/globals.csv) | `16210fc28bfb86d00ea04d581a99fe98e128172017b2d4f637b8848c0cf20087` |

The signed files have a 68-byte signature header followed by the client LZMA payload, as recorded in [KING-COMBAT.md](../../docs/KING-COMBAT.md). Downloads use normal HTTPS certificate verification.

## Reading conventions

Three different inheritance rules apply and are expanded before anything is written.

- In `townhall_levels.csv` each tier is its own single-row record. A blank count means *unchanged from the tier below*, so counts carry forward across records, not within one. The importer additionally requires every count to be monotonic.
- In `buildings.csv` and `traps.csv` a blank cell inherits from the previous row of the same named record. `TownHallLevel` is the Town Hall that permits that level, so `X-Bow` levels 1–3 reading `9` is the complete Town Hall 9 ceiling.
- The Town Hall's own rows are offset: row 9 carries `TownHallLevel` 8, because Town Hall 9 is what a Town Hall 8 village builds. The importer asserts that offset rather than assuming it.
- `globals.csv` is a flat `Name`/`NumberValue` sheet with no continuation rows at all, so none of the three rules apply to it. `WORKER_COST_2ND` through `WORKER_COST_5TH` give the gem price of each Builder's Hut after the first — 0, 500, 1,000 and 2,000 — and `STARTING_GOLD`, `STARTING_ELIXIR` and `STARTING_DIAMONDS` what a new village is granted.
- `heroes.csv` stores the *next* upgrade's price and duration on the current-level row, so `catalog.json` converts them into destination-level records. `RequiredHeroTavernLevel` is the Hero Hall. Activation recovery is joined from `special_abilities.csv` through each row's `SpecialAbilitiesLevel`; the King's `BarbarianKingAbilityHeal` levels 5, 6 and 7 heal 450, 525 and 625.

Reproduce with any Python 3.11+ interpreter; this importer needs no third-party packages:

```sh
python3 scripts/import-native-townhall.py --check
```

This re-downloads the pinned tables, verifies their SHA-256 values and requires the committed JSON to match byte for byte.

## Scope

Counted and gated names cover every entity a home village can own — 44 buildings and 13 traps — whether or not this game builds them, so the tier ladder is complete and the gap is measurable rather than invisible. What a village can own is settled by the tier table itself: it carries one count column per ownable entity, so `buildings.csv` records with no such column (hero altars, troop and spell cages, the goblin campaign's own buildings, tutorial props, Town Hall teasers and explicit placeholders) are not buildings a player builds and are absent here. The Town Hall is the one exception in the other direction: a village always has exactly one, so it is gated but never counted.

Per-level rows are tabled only for the entities this game builds, plus those with no family reference of their own. The fourteen ownable buildings and six traps this game does not build carry their counts and gates but not their level rows: nothing reads them yet, and this catalog is parsed by every module that reads a building. The catalog records what the original client permits; which of it the home village actually offers is a separate decision recorded in [TOWNHALL-TIERS.md](../../docs/TOWNHALL-TIERS.md) and `src/game/progression.ts`. The counts this game hands out differently below Town Hall 9 are listed in that document. Hitpoints, prices, durations, storage capacities and every per-level row here drive the running game.
