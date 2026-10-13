# Native Home Village achievements

Pinned public client 18.400.21, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, downloaded from `https://game-assets.clashofclans.com/`. This reference holds every current Home Village achievement with its tiers, targets, gem and XP prizes, and English text.

- `catalog.json`: 51 achievements. Each has an `action` (what counts), optional `data` and `dataLevel` (which building, resource or unit, and the lowest level that counts), and one to three `tiers` with a target `count`, `xp`, `gems` and the tier's `info` line. Unit unlock tiers each name their own `unit`.

| Source | SHA-256 |
| --- | --- |
| [achievements.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/achievements.csv) | `491aba6ac0995d8c42ff826feff9a56df648a4b6cf28e24526e0e48140bef240` |
| [texts.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/localization/texts.csv) | `affdf43926df044cb3c09d833b07365aa01ea99985771afa5fa0dd926f36c569` |
| [texts_patch.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/localization/texts_patch.csv) | `41630dc201c25e41048e8f7a2ca2051d9724186d6e0882f61cfbd8aa3960622e` |

## Reading conventions

- Rows sharing a title TID and action form one achievement; `Level` orders its tiers. The two account-binding rows share a title, so their ids carry the action.
- `UIGroup` 0 is the Home Village. Builder Base (1) and Clan Capital (2) rows are left out, as are rows marked `Deprecated` (the old League All-Star).
- `<number>` in a tier's text is its target; `<name>` is its `ActionData`.

Reproduce with any Python 3.11+ interpreter; the importer needs no third-party packages:

```sh
python3 scripts/import-native-achievements.py --check
```

See [achievements](../../docs/ACHIEVEMENTS.md) for what this village counts.
