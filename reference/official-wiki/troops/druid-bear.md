# Bear (Druid form)

- Source: [Druid/Bear](https://clashofclans.fandom.com/wiki/Druid/Bear)
- Wiki revision id: `623243` - retrieved 2026-09-15
- Client row: `characters.Bear` (pinned client 18.400.21)
- Secondary unit of [Druid](druid.md)

## Mechanics

- Not trainable: produced by the [Druid](druid.md) (client IsSecondaryTroop=TRUE, no ProductionBuilding).
- Housing space (used for Spring/Tornado Trap, Clone and Recall weight): 10 (client HousingSpace=16).
- Movement speed: 20 in-game (wiki) = internal Speed 250 (20 before rounding) = 2.5 tiles/s.
- Attack: every 1 s; range 0.2 tiles (client AttackRange/100 = 0.6).
- Damage type (wiki): Melee (Ground Only); client targets ground only.
- Favorite target: Defenses - Defense-first: ignores every other building and all defending units (even while being attacked) as long as any defensive building stands. The Clan Castle is never a defense; an activated Town Hall weapon is. Once no defenses remain it behaves like a no-preference troop, but only switches to enemy units after its current target is destroyed.
- Ground unit.
- Interactions (client flags): Healer target weight 5 (HealerWeight).
- The Druid's transformed form: a defense-targeting melee ground unit (1 s) with the Druid's level.
- Unlike the human form it cannot jump walls. It is very vulnerable to Spring Traps.
- Cannot be trained or donated directly.

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Hitpoints |
|---|---|---|---|
| 1 | 150 | 150 | 1,900 |
| 2 | 160 | 160 | 2,000 |
| 3 | 170 | 170 | 2,100 |
| 4 | 185 | 185 | 2,300 |
| 5 | 205 | 205 | 2,500 |
| 6 | 225 | 225 | 2,750 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Range |
|---|---|---|---|---|---|
| Defenses | Melee (Ground Only) | 10 | 20 | 1s | 0.2 tiles |

## Client comparison

Checked 26 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 23 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| housingSpace | - | 10 | 16 | characters.HousingSpace | wiki history: 16 -> 10 on 2025-03-24; client Bear row still 16 |
| attackRangeTiles | - | 0.2 | 0.6 | characters.AttackRange/100 | wiki - client = -0.4 tiles; no history entry explains the difference |
| evolveSeconds (Bear page summary) | - | 25 | 30 | characters.Druid.EvolveTime=30000 | Druid page says 30 s |

### Ambiguities

- Housing (Spring/Tornado/Clone/Recall weight): wiki 10 (history says reduced from 16 to 10 on 2025-03-24), client Bear HousingSpace=16; the commented-out Healer weight table in the Healer page source also lists 16.
- Transformation time: Bear page says 25 s; the Druid page (30 s, restored 2026-01-12) and client EvolveTime=30000 agree on 30 s.
- Range: wiki 0.2 tile vs client AttackRange=60 (0.6 tile).

### Matches

- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `movementSpeedWiki`: wiki 20 = client 20 - characters.Speed=250 -> /12.5 = 20
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki Defense = client Defense - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 6 = client 6 - number of characters rows
- `dps`: 6 values match (levels 1-6) - characters.DPS
- `damagePerHit`: 6 values match (levels 1-6) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 6 values match (levels 1-6) - characters.Hitpoints

### Client columns that encode the mechanics

- PreferedTargetBuildingClass=Defense, HousingSpace=16, DisableDonate=TRUE, HealerWeight=5, IsSecondaryTroop=TRUE (no IsJumper).
- Stats per level come from the parent's spawn level (secondary rows have no research columns).
