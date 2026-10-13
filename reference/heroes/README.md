# Native hero roster

Pinned public client 18.400.21, bundle `7f04bdfdc4124b1f49308423bb8f4aa8b137aae3`, downloaded from `https://game-assets.clashofclans.com/`. This reference holds every original level of all six home-village heroes, the ability tiers each one activates, and the equipment records the source allows each. It contains no artwork; hero artwork is a 3D model set, recorded separately.

- `catalog.json`: 480 hero levels across six heroes, 102 ability tiers and 61 equipment records. Each level carries its hitpoints, damage, ability recovery and tier, the Town Hall and Hero Hall it requires, and the price and duration of reaching it. Each hero also carries its fixed columns: housing space, speed, attack range and interval, whether it flies and what it can target, its upgrade resource, its equipment slot count and default items.

| Source | SHA-256 |
| --- | --- |
| [heroes.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/heroes.csv) | `658c9721fb0fd5488b69ca3555ef5597d521f28dde95af051a2a98ccbdd65197` |
| [special_abilities.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/special_abilities.csv) | `c978dd90ff2335e60d988f3476d78bec72672e8c074344d149096e89951181eb` |
| [character_items.csv](https://game-assets.clashofclans.com/7f04bdfdc4124b1f49308423bb8f4aa8b137aae3/logic/character_items.csv) | `66e644c62331a026aec3795980d9a37af95e2120d67dfbad380c729f3645ebad` |

The signed files have a 68-byte signature header followed by the client LZMA payload, as recorded in [KING-COMBAT.md](../../docs/KING-COMBAT.md). Downloads use normal HTTPS certificate verification.

## Reading conventions

- A blank cell inherits from the previous row of the same named record, so each hero's fixed columns are read from its first row.
- A row's own cells describe that level: `Hitpoints`, `DPS`, the `RequiredTownHallLevel` and `RequiredHeroTavernLevel` that permit it, and the `SpecialAbilitiesLevel` it activates. Its `UpgradeCost` and `UpgradeTimeH` buy the level **above** it, exactly as the troop and spell tables do, so prices are shifted down one row here. Level one costs nothing.
- `RequiredHeroTavernLevel` is the Hero Hall requirement. The building was renamed; the column was not.
- Every hero activates exactly one `<Hero>AbilityHeal` record in `special_abilities.csv`, whose `HealOnActivation`, `DeactivateAfterTime` and `MaxActivations` are tabled here as `recovery`, `seconds` and `activations`. A hero may carry further **passive** records that need no activation — only the Dragon Duke does, with `DragonDukeRageWhenAlone` — and those are named in `passives` rather than tabled.
- The Royal Champion's skin and animation records still carry her development name, **Warrior Princess**; her logic record does not. The Minion Prince's skin is likewise `MinionHeroDefault`.
- The Grand Warden's `IsFlying` is false: that is his ground stance, which the original lets the player toggle. His flying stance is a separate animation block, not a separate logic record.
- `UNUSED*` equipment records are one-row placeholders the client never offers. They are listed with `unused: true` rather than silently dropped, so the roster stays countable against the source.

Reproduce with any Python 3.11+ interpreter; this importer needs no third-party packages:

```sh
python3 scripts/import-native-heroes.py --check
```

This re-downloads the pinned tables, verifies their SHA-256 values and requires the committed JSON to match byte for byte. The Barbarian King's 110 levels are also derived independently by [the Town Hall importer](../townhall/README.md); `tests/heroes.test.ts` requires the two to agree cell for cell, so neither can drift alone.

## Scope

All six home-village heroes are recorded: Barbarian King, Archer Queen, Grand Warden, Royal Champion, Minion Prince and Dragon Duke. The two Builder Base heroes in the same table — Battle Machine and Battle Copter — are deliberately absent, as the Builder Base is not modelled. Which of the recorded heroes the village actually offers is a separate decision recorded in [HERO-PROGRESSION.md](../../docs/HERO-PROGRESSION.md).
