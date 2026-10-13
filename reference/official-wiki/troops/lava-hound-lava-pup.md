# Lava Pup

- Source: [Lava Hound/Lava Pup](https://clashofclans.fandom.com/wiki/Lava_Hound/Lava_Pup)
- Wiki revision id: `620375` - retrieved 2026-09-15
- Client row: `characters.Lava Pup` (pinned client 18.400.21)
- Secondary unit of [Lava Hound](lava-hound.md)

## Mechanics

- Not trainable: produced by the [Lava Hound](lava-hound.md) (client IsSecondaryTroop=TRUE, no ProductionBuilding).
- Housing space (used for Spring/Tornado Trap, Clone and Recall weight): 1.
- Movement speed: 32 in-game (wiki) = internal Speed 400 (32 before rounding) = 4 tiles/s.
- Attack: every 1 s; range 2 tiles (client AttackRange/100 = 2.25).
- Damage type (wiki): Ranged (Ground & Air); client targets ground and air.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Flying (only air-targeting defenses can hit it; ignores walls).
- Released in a spread when a Lava Hound dies: fast, weak flying ranged units that hit ground and air.
- Stats are fixed (35 DPS, 50 HP); upgrading the hound increases their number, not their strength.
- Cannot be targeted by Seeking Air Mines but do trigger Air Bombs.
- Counts as 1 housing for Tornado Trap, Clone and Recall (history: reduced from 2 to 1 on 2025-03-24).

## Level table (wiki)

| Damage per Second | Damage per Attack | Hitpoints |
|---|---|---|
| 35 | 35 | 50 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Range |
|---|---|---|---|---|---|
| None | Ranged (Ground & Air) | 1 | 32 | 1s | 2 tiles |

## Client comparison

Checked 10 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 9 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| attackRangeTiles | - | 2 | 2.25 | characters.AttackRange/100 | wiki - client = -0.25 tiles; flying unit (most wiki flyer ranges are client range + 0.5 tiles); client Lava Pup and Minion both use AttackRange=225; wiki gives 2 and 2.75 |

### Ambiguities

- Range: wiki 2 tiles (its trivia contrasts Minion 2.75 vs Pup 2) but client AttackRange is 225 for both Lava Pup and Minion.

### Matches

- `housingSpace`: wiki 1 = client 1 - characters.HousingSpace
- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `movementSpeedWiki`: wiki 32 = client 32 - characters.Speed=400 -> /12.5 = 32
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 1 = client 1 - number of characters rows
- `dps`: 1 values match (level 1) - characters.DPS
- `damagePerHit`: 1 values match (level 1) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 1 values match (level 1) - characters.Hitpoints

### Client columns that encode the mechanics

- IsFlying=TRUE, AttackRange=225, PushbackSpeed=4, PickNewTargetAfterPushback=TRUE, IsSecondaryTroop=TRUE.
- Stats per level come from the parent's spawn level (secondary rows have no research columns).
