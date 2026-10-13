# Revenge Tower

- Source: [Revenge Tower](https://clashofclans.fandom.com/wiki/Revenge_Tower) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624636`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Revenge Tower` (2 levels)

## Mechanics

- Unlocked at Town Hall 18; one per base; footprint 3x3; built and upgraded with **Dark Elixir**. Level 1 build time is 13 days 5 seconds.
- Starts every battle **dormant** (does not attack) but is still a defensive building: defense-targeting troops (Giants, Balloons) go for it and it absorbs Seeking Shields and Fireballs.
- Stage progression counts **destroyed buildings of the defender**: stage 1 after 5, stage 2 after 25, stage 3 after 50 (raised from 20/40 on Jan 28, 2026). Its model grows (more barrels) each stage. Stages advance even while it is disabled (e.g. by Overgrowth).
- **Stage 1**: range 11 tiles, one shot every 1.2 s, single target, ground & air (level 2: 500 per shot, 416 DPS).
- **Stage 2**: fires twice as fast (0.6 s) for half damage (level 2: 250) and each shot ricochets once to a unit within ~2 tiles of the first for 60% (150); reach up to ~13 tiles.
- **Stage 3**: 0.35 s per shot (slowed from 0.3 s on Jan 28, 2026), same per-shot damage, and shots bounce up to twice (secondary 60%, tertiary 36%; each bounce needs a different unit within ~2 tiles). Reach up to ~15 tiles. Level 2 displayed max DPS 714 (primary only).
- Special ability name on the info screen: 'Tower Tantrum'.
- Supercharge (TH18 at level 2): charge 1 raises every stage's damage (stage 1 510, stages 2-3 260), charge 2 +100 HP (6,300); costs 220,000 / 200,000 DE.

### Recent balance notes (from the page's History table)

- January 28, 2026: stage thresholds 20/40 -> 25/50 destroyed buildings; stage 3 fire interval 0.3 s -> 0.35 s.
- November 17, 2025: added with the TH18 update.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH18: 1

Size: 3x3

**Statistics - Dormant**

| Level | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|
| 1 | 5,800 | 430,000 | 13d 5s | 1,059 | 18 |
| 2 | 6,200 | 460,000 | 14d | 1,099 | 18 |

**Statistics**

| Special Ability |
|---|
| Tower Tantrum |

**Statistics - Stage 1**

| Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 375 | 450 | 5,800 | 430,000 | 13d 5s | 1,059 | 18 |
| 2 | 416 | 500 | 6,200 | 460,000 | 14d | 1,099 | 18 |

**Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted | Special Ability |
|---|---|---|---|---|
| 11 | 1.2s | Single Target | Ground & Air | Tower Tantrum |

**Statistics - Stage 2**

| Level | Maximum Damage per Second | Damage per Shot (Primary) | Damage per Shot (Secondary) | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 375 | 225 | 135 | 5,800 | 430,000 | 13d 5s | 1,059 | 18 |
| 2 | 416 | 250 | 150 | 6,200 | 460,000 | 14d | 1,099 | 18 |

**Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted | Special Ability |
|---|---|---|---|---|
| 11 | 0.6s | Ricochet Shot | Ground & Air | Tower Tantrum |

**Statistics - Stage 3**

| Level | Maximum Damage per Second | Damage per Shot (Primary) | Damage per Shot (Secondary) | Damage per Shot (Tertiary) | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 642 | 225 | 135 | 81 | 5,800 | 430,000 | 13d 5s | 1,059 | 18 |
| 2 | 714 | 250 | 150 | 90 | 6,200 | 460,000 | 14d | 1,099 | 18 |

**Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted | Special Ability |
|---|---|---|---|---|
| 11 | 0.35s | Ricochet Shot | Ground & Air | Tower Tantrum |

**Supercharges - Dormant**

| Charge | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|
| 1 | 6,200 | 220,000 | 7d | 777 | 18 |
| 2 | 6,300 | 200,000 | 8d | 831 | 18 |

**Supercharges - stage 1**

| Charge | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 425 | 510 | 6,200 | 220,000 | 7d | 777 | 18 |
| 2 | 425 | 510 | 6,300 | 200,000 | 8d | 831 | 18 |

**Supercharges - Stage 2**

| Charge | Maximum Damage per Second | Damage per Shot (Primary) | Damage per Shot (Secondary) | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 433 | 260 | 156 | 6,200 | 220,000 | 7d | 777 | 18 |
| 2 | 433 | 260 | 156 | 6,300 | 200,000 | 8d | 831 | 18 |

**Supercharges - Stage 3**

| Charge | Maximum Damage per Second | Damage per Shot (Primary) | Damage per Shot (Secondary) | Damage per Shot (Tertiary) | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 742 | 260 | 156 | 93.6 | 6,200 | 220,000 | 7d | 777 | 18 |
| 2 | 742 | 260 | 156 | 93.6 | 6,300 | 200,000 | 8d | 831 | 18 |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics / Dormant | hitpoints | 2 | 0 |
| Statistics / Dormant | cost | 2 | 0 |
| Statistics / Dormant | buildSeconds | 2 | 0 |
| Statistics / Dormant | townHall | 2 | 0 |
| Statistics / Dormant | xp | 2 | 0 |
| Statistics / Stage 1 | hitpoints | 2 | 0 |
| Statistics / Stage 1 | cost | 2 | 0 |
| Statistics / Stage 1 | buildSeconds | 2 | 0 |
| Statistics / Stage 1 | townHall | 2 | 0 |
| Statistics / Stage 1 | xp | 2 | 0 |
| Statistics / Stage 1 | damagePerHit | 2 | 0 |
| Statistics / Stage 1 | dps | 2 | 0 |
| Statistics / Stage 2 | hitpoints | 2 | 0 |
| Statistics / Stage 2 | cost | 2 | 0 |
| Statistics / Stage 2 | buildSeconds | 2 | 0 |
| Statistics / Stage 2 | townHall | 2 | 0 |
| Statistics / Stage 2 | xp | 2 | 0 |
| Statistics / Stage 2 | damagePerHitPrimary | 2 | 0 |
| Statistics / Stage 2 | damagePerHitSecondary | 2 | 0 |
| Statistics / Stage 2 | maximumDamagePerSecond | 2 | 0 |
| Statistics / Stage 3 | hitpoints | 2 | 0 |
| Statistics / Stage 3 | cost | 2 | 0 |
| Statistics / Stage 3 | buildSeconds | 2 | 0 |
| Statistics / Stage 3 | townHall | 2 | 0 |
| Statistics / Stage 3 | xp | 2 | 0 |
| Statistics / Stage 3 | damagePerHitPrimary | 2 | 0 |
| Statistics / Stage 3 | damagePerHitSecondary | 2 | 0 |
| Statistics / Stage 3 | damagePerHitTertiary | 2 | 0 |
| Statistics / Stage 3 | maximumDamagePerSecond | 2 | 0 |
| Supercharges / Dormant | cost | 2 | 0 |
| Supercharges / Dormant | buildSeconds | 2 | 0 |
| Supercharges / Dormant | townHall | 2 | 0 |
| Supercharges / Dormant | hitpoints | 2 | 0 |
| Supercharges / stage 1 | cost | 2 | 0 |
| Supercharges / stage 1 | buildSeconds | 2 | 0 |
| Supercharges / stage 1 | townHall | 2 | 0 |
| Supercharges / stage 1 | hitpoints | 2 | 0 |
| Supercharges / stage 1 | damagePerHit | 2 | 0 |
| Supercharges / stage 1 | dps | 2 | 0 |
| Supercharges / Stage 2 | cost | 2 | 0 |
| Supercharges / Stage 2 | buildSeconds | 2 | 0 |
| Supercharges / Stage 2 | townHall | 2 | 0 |
| Supercharges / Stage 2 | hitpoints | 2 | 0 |
| Supercharges / Stage 2 | damagePerHitPrimary | 2 | 0 |
| Supercharges / Stage 2 | damagePerHitSecondary | 2 | 0 |
| Supercharges / Stage 2 | maximumDamagePerSecond | 2 | 0 |
| Supercharges / Stage 3 | cost | 2 | 0 |
| Supercharges / Stage 3 | buildSeconds | 2 | 0 |
| Supercharges / Stage 3 | townHall | 2 | 0 |
| Supercharges / Stage 3 | hitpoints | 2 | 0 |
| Supercharges / Stage 3 | damagePerHitPrimary | 2 | 0 |
| Supercharges / Stage 3 | damagePerHitSecondary | 2 | 0 |
| Supercharges / Stage 3 | damagePerHitTertiary | 2 | 0 |
| Supercharges / Stage 3 | maximumDamagePerSecond | 2 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Revenge Tower`): 1/1 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| bounceRangeTiles | stages 2-3 | ~2 tiles from the previous target | RevengeTowerProjectile2/3 MaxBounceDistance 450 (4.5 tiles) | the wiki's '~2 tiles' is an observation; the client bounce search distance is 4.5 tiles |
| damage (building row) | 1-2 | not listed | Damage 50/60 | unused/placeholder on the building row; the stage abilities carry the real damage |

**Game table check** (`reference/full-client/progression.json` -> `revengetower` vs wiki): 1 discrepancies.

| Field | Level | Wiki | progression.json | Note |
|---|---|---|---|---|
| damage/dps | 1-2 | stage 1: 450/500 per shot (375/416 DPS); stages 2-3: 225/250 | damage 50/60, dps 41.7/50, rate 1.2 | progression.json uses the building row's Damage column (50/60), which is not the stage damage; real values are in special_abilities DebrisTowerTier2-4 |

**Interpretation of client columns**

- Stages are **special abilities** (`SpecialAbilities` = `DebrisTowerTier1;...Tier4`, `SpecialAbilitiesLevel` 1 or 2 per building level):
  - `DebrisTowerTier1`: `DisableAttacking` TRUE, `DeactivateAfterNumBuildingsDestroyed` 5 (dormant).
  - `DebrisTowerTier2`: `ActiveAfterNumBuildingsDestroyed` 5, `Damage` 450/500 (510 at level 3 = supercharged), no bounce, building `AttackSpeed` 1200.
  - `DebrisTowerTier3`: active after 25, `AttackSpeed` 600, `Damage` 225/250/260, `ProjectileBounces` 1.
  - `DebrisTowerTier4`: active after 50, `AttackSpeed` 350, `Damage` 225/250/260, `ProjectileBounces` 2.
- Projectiles `RevengeTowerProjectile1-3`: `MaxBounceDistance` 450, `BounceDamageReductionPercent` 40 (secondary 60%, tertiary 36%).
- The client already has the Jan 2026 values (25/50 thresholds, 350 ms).
- Supercharge `Revenge Tower Mini Levels`: `SpecialAbilityLevelBuff` 1;1;1;1 (every stage ability +1 level -> the level-3 rows), charge 2 `Hitpoints` +100; DE 220,000 / 200,000; 7d / 8d - matches.
