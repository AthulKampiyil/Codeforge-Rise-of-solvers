# Starter Challenges

Pinned public client 18.400.21, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`. `catalog.json` holds the 26 reward tiers and the 60 challenges of the free track Town Halls 2 to 6 play through: their titles, descriptions, types, points, targets, subjects and the Town Hall that reveals each. It is read from `logic/starter_pass.csv`, `logic/starter_pass_tasks.csv`, `logic/buildings.csv` and `localization/texts.csv`, whose SHA-256 sums it records.

```sh
python3 scripts/import-native-starter-challenges.py --check
```

See [docs/STARTER-CHALLENGES.md](../../docs/STARTER-CHALLENGES.md).
