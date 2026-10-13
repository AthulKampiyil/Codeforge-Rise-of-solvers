# Native music

Pinned public client 18.400.21, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, downloaded from `https://game-assets.clashofclans.com/`. These are the original files, copied byte for byte to `public/assets/audio/music/`; `catalog.json` lists each with its source path, size and SHA-256.

| Scene | Files | Length |
| --- | --- | --- |
| Home | `home_music_part_1.ogg`, `home_music_part_2.ogg`, `home_music_part_3.ogg` | 2:46, 2:06, 1:58 |
| Battle planning | `combat_planning_music.mp3` | 0:30 loop |
| Battle | `combat_music.ogg` | 2:55 loop |
| Battle intro sting | `new_battle_intro_01.mp3` | 2.5 s |
| Victory sting | `winwinwin.mp3` | 4.2 s |
| Defeat sting | `battle_lost_02.mp3` | 3.5 s |

## Why these files

- `logic/village_backgrounds.csv` gives each Home scenery a `Music` file. `HomeDefault`, the default and free scenery this village uses, names none, so the client falls back to its classic Home theme: the three `home_music_part_*` files.
- `csv/assets.csv` preloads the Home theme with the battle files above, alongside Builder Base (`v2_*`), Clan Capital, war map and Clash Cave music that this village has no screen for.
- The `v2` files are the Builder Base ("village 2") theme and are not used.

How the client sequences the three Home parts is not in the data; this build plays them in order and starts over. The intro sting's role is read from its name.

Reproduce with any Python 3.11+ interpreter:

```sh
python3 scripts/import-native-music.py --check
```

See [music](../../docs/MUSIC.md) for playback.
