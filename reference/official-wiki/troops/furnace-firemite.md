# Firemite

- Source: [Furnace/Firemite](https://clashofclans.fandom.com/wiki/Furnace/Firemite)
- Wiki revision id: `625356` - retrieved 2026-09-15
- Client row: `characters.Firemite Spawn` (pinned client 18.400.21)
- Secondary unit of [Furnace](furnace.md)

## Mechanics

- Not trainable: produced by the [Furnace](furnace.md) (client IsSecondaryTroop=TRUE, no ProductionBuilding).
- Housing space (used for Spring/Tornado Trap, Clone and Recall weight): 1 (from the wiki summary text; no info-box column).
- Movement speed: 32 in-game (wiki) = internal Speed 400 (32 before rounding) = 4 tiles/s.
- Attack: one leap (AttackCount=1) from 2.5 tiles (client AttackRange/100 = 2).
- Damage type (wiki): Area Splash (0.8 Tile Radius; Ground & Air); client targets ground and air; client splash radius 0.1 tiles.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit. Jumps/passes over walls (IsJumper=TRUE).
- Interactions (client flags): does not trigger traps (TriggersTraps=FALSE); does not draw out Clan Castle troops (DoesNotOpenCC=TRUE); Healer target weight 0 (HealerWeight).
- Spawned over time by a Furnace; has the Furnace's level. Fast ground unit that hops walls.
- Approaches a building, pauses, then leaps into it (invulnerable and untargetable during the leap): the impact deals a small hit (50-80) and leaves a burning pool (0.8-tile radius, 10 s) whose damage ramps up to 100-150 DPS on offense (100-145 for defending Furnaces). The Firemite is consumed. Damage hits ground and air.
- Does not trigger traps and does not draw out Clan Castle troops.
- Counts as 1 housing for Spring Trap, Clone and Recall.

## Level table (wiki)

| Level | Damage | Flame Maximum DPS - On Offense | Flame Maximum DPS - On Defense | Hitpoints |
|---|---|---|---|---|
| 1 | 50 | 100 | 100 | 250 |
| 2 | 60 | 120 | 115 | 275 |
| 3 | 70 | 135 | 130 | 300 |
| 4 | 80 | 150 | 145 | 325 |

### Wiki info box

| Preferred Target | Attack Type | Movement Speed | Range | Flame Duration |
|---|---|---|---|---|
| None | Area Splash (0.8 Tile Radius; Ground & Air) | 32 | 2.5 tiles | 10s |

## Client comparison

Checked 23 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 20 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| attackRangeTiles | - | 2.5 | 2 | characters.AttackRange/100 | wiki - client = +0.5 tiles |
| splashTiles | - | 0.8 | 0.1 | characters.DamageRadius/100 | client character DamageRadius/100=0.1; burn pool spells.FireSpiritBurn.Radius/100=0.8 |
| maxLevel | - | 4 | 5 | number of characters rows | client Firemite Spawn row 5 (350 HP, 90 damage) looks like unreleased Furnace level 5 data |

### Ambiguities

- Range: wiki 2.5 tiles vs client AttackRange=200 (2 tiles).
- Splash: wiki "0.8 Tile Radius" matches the burn pool (FireSpiritBurn Radius=80); the character's own DamageRadius is 10 (0.1 tile).
- Targets: template says no preferred target, while Furnace descriptions say Firemites go after buildings; no PreferedTargetBuildingClass column is set in the client.
- Client has a fifth level (unreleased; see furnace).

### Matches

- `flameSeconds`: wiki 10 = client 10 - spells.FireSpiritBurn NumberOfHits x TimeBetweenHitsMS/1000
- `movementSpeedWiki`: wiki 32 = client 32 - characters.Speed=400 -> /12.5 = 32
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `damagePerHit`: 4 values match (levels 1-4) - characters.DPS x AttackSpeed/1000
- `flameMaxDps`: 4 values match (levels 1-4) - spells.FireSpiritBurn.PoisonDPS via projectile HitSpellLevel
- `flameMaxDpsDefense`: 4 values match (levels 1-4) - spells.FireSpiritBurn_DEF.PoisonDPS via Firemite Spawn_DEF projectile
- `hitpoints`: 4 values match (levels 1-4) - characters.Hitpoints

### Client columns that encode the mechanics

- AttackCount=1, AttackRange=200, DamageRadius=10, IsJumper=TRUE, TriggersTraps=FALSE, DoesNotOpenCC=TRUE, NewTargetAttackDelay=500, projectile FireSpiritJumpN -> HitSpell FireSpiritBurn level N (PoisonDPS, Radius=80, NumberOfHits=25 x 400 ms, PoisonIncreaseSlowly=FALSE, ImmunityWalls=TRUE); Firemite Spawn_DEF -> FireSpiritBurn_DEF.
- Stats per level come from the parent's spawn level (secondary rows have no research columns).
