# Native Blacksmith and King equipment

Pinned public client 18.400.21, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, downloaded from `https://game-assets.clashofclans.com/`. This reference holds every Blacksmith level, every level of the three King items this game implements, and the seven tiers of the abilities they carry. It contains no artwork.

- `catalog.json`: 10 Blacksmith levels with their Town Hall, price, duration, hitpoints and the Shiny, Glowy and Starry Ore each stores; 54 item levels across the Barbarian Puppet, Rage Vial and Earthquake Boots; and the seven tiers of the summon, rage and earthquake abilities.

| Source | SHA-256 |
| --- | --- |
| [buildings.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/buildings.csv) | `9aed5fed876e2914a22fa7fed688a651c691ab06170d60e2bda8dc9262fbccb1` |
| [character_items.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/character_items.csv) | `66e644c62331a026aec3795980d9a37af95e2120d67dfbad380c729f3645ebad` |
| [special_abilities.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/special_abilities.csv) | `c978dd90ff2335e60d988f3476d78bec72672e8c074344d149096e89951181eb` |
| [spells.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/spells.csv) | `385159e00327e6a1567cd91f1585b4ed0717d3f4475f0823398243482598289d` |

## Reading conventions

- A blank cell inherits from the previous row of the same named record.
- An item row's own cells describe that level — `HitPoints`, `DPS`, `HealOnActivation`, the `RequiredBlacksmithLevel` and the `MainAbilityLevels` tier it carries. Its `UpgradeResources`/`UpgradeCosts` pair buys the level **above** it, so prices are shifted down one row here. Both are semicolon-separated lists; `CommonOre` is Shiny, `RareOre` is Glowy and `EpicOre` is Starry. These three items never charge Starry Ore.
- Abilities live in two files. The Puppet's summon and the Vial's rage are `special_abilities.csv` records; the summoned Barbarians carry their own separately tiered `BoostBarbarian`. The Boots' earthquake is a `spells.csv` record, `Earthquake Boots Spell`, reached through the ability's `SelfSpellLevel`. All four tables have exactly seven tiers, and an item level names its tier directly.
- Boost percentages are recorded as multipliers (`120` becomes `2.2`), speeds and radii as tiles (`225` becomes `2.25`), permil damage as fractions (`20` becomes `0.02`) and durations as seconds.

Reproduce with any Python 3.11+ interpreter; this importer needs no third-party packages:

```sh
python3 scripts/import-native-equipment.py --check
```

This re-downloads the pinned tables, verifies their SHA-256 values and requires the committed JSON to match byte for byte. Every value it produces for the levels and tiers this game already shipped reproduces the previous hand-transcribed constants exactly.

## Scope

`roster` carries every equipment record the source defines: 1,032 levels across 61 items, each with the heroes allowed to carry it, its rarity, and per level the Blacksmith it needs, the ability tier it carries, its hitpoint and damage bonuses and its ore price. Rarity sets the ceiling — common items reach level 18, Epic ones 27. The `UNUSED*` records are one-row placeholders the client ships but never offers; they are marked `unused` rather than dropped, so the roster stays countable against the source.

`items` maps this game's three local keys onto the records they name. Only those three have their ability tiers resolved here, because only they have an implemented ability; the other 58 records carry their stats and prices but not the behaviour behind them. Pinning a record is not implementing it — what the home village actually offers is recorded in [BLACKSMITH.md](../../docs/BLACKSMITH.md) and counted in [CONTENT-INVENTORY.md](../../docs/CONTENT-INVENTORY.md).
