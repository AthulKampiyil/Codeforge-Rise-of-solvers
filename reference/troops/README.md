# Native troop and spell roster

Pinned public client 18.400.21, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, downloaded from `https://game-assets.clashofclans.com/`. This reference holds every original level of every troop and spell the home village can produce — not only the ones this game trains. It contains no artwork; troop artwork is per kind, not per level.

- `catalog.json`: `roster` carries 931 levels across 90 producible troops and `spellRoster` 161 levels across 23 spells, each level with its hitpoints, damage, housing space, Laboratory requirement and the price and duration of reaching it. Each record also carries the building that produces it, its unlock gate, and whether it is a Super troop. `troops` and `spells` map this game's local keys onto the original records they name.

| Source | SHA-256 |
| --- | --- |
| [characters.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/characters.csv) | `5c3acc5b46ff9e7978f406b540264e65c93a846b69d03cd43326a9853703cb89` |
| [spells.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/spells.csv) | `385159e00327e6a1567cd91f1585b4ed0717d3f4475f0823398243482598289d` |

The signed files have a 68-byte signature header followed by the client LZMA payload, as recorded in [KING-COMBAT.md](../../docs/KING-COMBAT.md). Downloads use normal HTTPS certificate verification.

## Reading conventions

- A blank cell inherits from the previous row of the same named record.
- A row's own cells describe that level: `Hitpoints`, `DPS`, `HousingSpace` and the `LaboratoryLevel` it needs. Its `UpgradeCost` and `UpgradeTime` buy the level **above** it, exactly as the hero table does, so prices are shifted down one row here. Level one costs nothing and needs no Laboratory, so its requirement is recorded as zero rather than the source's own row value.
- The Healer and the Healing spell carry their healing as a **negative** damage rate. Both are recorded here as a zero `damage` and a positive `heal`.
- `P.E.K.K.A` is the record `PEKKA`; the Barbarian is this game's `swordsman`.

Reproduce with any Python 3.11+ interpreter; this importer needs no third-party packages:

```sh
python3 scripts/import-native-troops.py --check
```

This re-downloads the pinned tables, verifies their SHA-256 values and requires the committed JSON to match byte for byte. Every value it produces for the levels this game already shipped reproduces the previous hand-transcribed tables exactly, so extending the roster changes no existing level.

## Scope

The roster is everything the home village can actually produce: a record whose `VillageType` is the home village and whose `DisableProduction` is unset. That is 61 Barracks troops (17 of them Super troops, which are paid temporary upgrades of ordinary ones), 19 Dark Barracks troops and 10 siege machines; and 15 Spell Factory spells with 8 dark ones.

Summoned units, defensive variants and internal spell effects are excluded — a player never trains a Golemite, a Defensive Ice Hound or an `ElectroDragonDie`, so they are not part of the roster. The Builder Base is excluded because that village is not modelled.

Pinning a record is not implementing it. Which of these this game actually trains is counted in [CONTENT-INVENTORY.md](../../docs/CONTENT-INVENTORY.md), and is at the time of writing ten troops and three spells.
