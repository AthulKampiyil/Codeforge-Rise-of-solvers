# Native Helper Hut helpers

Pinned public client 18.400.21, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, downloaded from `https://game-assets.clashofclans.com/`. This reference holds every level of the four Helper Hut helpers and their shared rest time. It contains no artwork.

- `catalog.json`: the Builder's Apprentice (8 levels), Lab Assistant (12), Alchemist (7) and Prospector (7), each level with its Town Hall requirement, work multiplier, work seconds and gem cost, and the converters' caps and rates; and `cooldownSeconds`, the rest after every assignment.

| Source | SHA-256 |
| --- | --- |
| [villager_apprentices.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/villager_apprentices.csv) | `eb955bf0a5d0a7ecd6535d746d99111ae77b4ffc8536bea0a17c7855b925cff8` |
| [globals.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/globals.csv) | `16210fc28bfb86d00ea04d581a99fe98e128172017b2d4f637b8848c0cf20087` |
| [texts.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/localization/texts.csv) | `affdf43926df044cb3c09d833b07365aa01ea99985771afa5fa0dd926f36c569` |

## Reading conventions

- `villager_apprentices.csv` has one block of rows per helper; a blank cell inherits from the row above. A row's `Cost` (in `CostResource`, always `Diamonds`, the client's name for gems) buys that level, and `RequiredTownHallLevel` gates it.
- `BoostTimeSeconds` is how long one assignment works and `BoostMultiplier` how many extra seconds of progress each working second adds: a Level 4 Builder's Apprentice working its 3,600 seconds takes four hours off an upgrade.
- The Alchemist and Prospector convert instead (`BoostMultiplier` 0, `BoostTimeSeconds` 4). Their first row names the resources (`SourceResource`, `TargetResource`, always the same list) and base caps (`MaxSourceResource`, `MaxTargetResource`, always equal), recorded once per helper as `conversion`. Each level's `MaxSourceResourceMultiplier` (`capPercent`) scales the caps and `ResourceConvertionMultiplier` (`ratePercent`) is the output rate, both in percent.
- `VILLAGERS_COOLDOWN_TIME` in `globals.csv` is 82,800 seconds: a helper sent to work is ready again 24 hours later.

Reproduce with any Python 3.11+ interpreter; this importer needs no third-party packages:

```sh
python3 scripts/import-native-helpers.py --check
```

This re-downloads the pinned tables, verifies their SHA-256 values and requires the committed JSON to match byte for byte.
