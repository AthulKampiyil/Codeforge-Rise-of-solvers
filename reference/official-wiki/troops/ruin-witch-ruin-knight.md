# Ruin Knight

- Source: [Ruin Witch/Ruin Knight](https://clashofclans.fandom.com/wiki/Ruin_Witch/Ruin_Knight)
- Wiki revision id: `625189` - retrieved 2026-09-15
- Client row: `characters.Ruin Knight` (pinned client 18.400.21)
- Secondary unit of [Ruin Witch](ruin-witch.md)

## Mechanics

- Not trainable: produced by the [Ruin Witch](ruin-witch.md) (client IsSecondaryTroop=TRUE, no ProductionBuilding).
- Housing space (used for Spring/Tornado Trap, Clone and Recall weight): 20.
- Movement speed: 16 in-game (wiki) = internal Speed 200 (16 before rounding) = 2 tiles/s.
- Attack: every 1 s; range 0.6 tiles.
- Damage type (wiki): Single Target; client targets ground only.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure. Bonus: x3 vs Wall without targeting preference.
- Ground unit.
- Interactions (client flags): Healer target weight 1 (HealerWeight).
- Summoned by the Ruin Witch from rubble; level equals the witch's level.
- Single-target melee ground unit (0.6 tile, 1 s) with high damage and hitpoints; triple damage to walls.
- Hitpoint decay: the wiki history says the decay was removed on 2026-08-31 (a hidden note on the page gave 80 HP/s).

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Damage vs Walls | Hitpoints |
|---|---|---|---|---|
| 1 | 255 | 255 | 765 | 3,100 |
| 2 | 285 | 285 | 855 | 3,400 |
| 3 | 315 | 315 | 945 | 3,700 |
| 4 | 345 | 345 | 1,035 | 4,000 |

### Wiki info box

| Preferred Target | Damage Multiplier | Attack Type | Housing Space | Movement Speed | Attack Speed | Range |
|---|---|---|---|---|---|---|
| None | Walls (Damage x3) | Single Target | 20 | 16 | 1s | 0.6 tiles |

## Client comparison

Checked 24 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 23 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| hpDecayPerSecond | - | removed 2026-08-31 | 80 | characters.LoseHpPerTick=40 / LoseHpInterval=500 | client predates the removal |

### Ambiguities

- Client 18.400.21 still drains 40 HP every 500 ms (LoseHpPerTick=40, LoseHpInterval=500 = 80 HP/s), i.e. pre-2026-08-31 behaviour.

### Matches

- `housingSpace`: wiki 20 = client 20 - characters.HousingSpace
- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 0.6 = client 0.6 - characters.AttackRange/100
- `movementSpeedWiki`: wiki 16 = client 16 - characters.Speed=200 -> /12.5 = 16
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `bonusMultiplier`: wiki Wall x3 = client Wall x3 - characters.DamageMultiplierTarget + DamageMultiplierPercent/100
- `maxLevel`: wiki 4 = client 4 - number of characters rows
- `dps`: 4 values match (levels 1-4) - characters.DPS
- `damagePerHit`: 4 values match (levels 1-4) - characters.DPS x AttackSpeed/1000
- `damageVsWalls`: 4 values match (levels 1-4) - damagePerHit x PreferedTargetDamageMod / DamageMultiplierPercent
- `hitpoints`: 4 values match (levels 1-4) - characters.Hitpoints

### Client columns that encode the mechanics

- DamageMultiplierTarget=Wall, DamageMultiplierPercent=300, LoseHpPerTick=40, LoseHpInterval=500, HealerWeight=1, IsSecondaryTroop=TRUE.
- Stats per level come from the parent's spawn level (secondary rows have no research columns).
