# Native chief experience table

Pinned public client 18.400.21, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, downloaded from `https://game-assets.clashofclans.com/`. This reference holds the XP each chief level needs to reach the next.

- `catalog.json`: 500 levels. `points` is the XP needed to advance from that level; the last level is the cap.

| Source | SHA-256 |
| --- | --- |
| [experience_levels.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/experience_levels.csv) | `a705a7a77abd23faf3c7397a41ae6b539c04e547f74c290d390d6c22f936c31f` |

The curve starts at 30 XP, adds 50 per level to level 200, 500 per level to 300 and 1,000 per level after that, as community wikis also describe. Reproduce with any Python 3.11+ interpreter; the importer needs no third-party packages:

```sh
python3 scripts/import-native-experience.py --check
```

See [chief experience](../../docs/CHIEF-EXPERIENCE.md) for how the game awards XP.
