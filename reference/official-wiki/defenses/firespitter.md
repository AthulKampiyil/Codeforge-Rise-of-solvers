# Firespitter

- Source: [Firespitter](https://clashofclans.fandom.com/wiki/Firespitter) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624733`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Firespitter` (3 levels)

## Mechanics

- Unlocked at Town Hall 17. Count (wiki): TH17 2. Footprint 3x3.
- Range 16 tiles (the longest of any regular defense except the Eagle Artillery) but only inside an arc of roughly 150 degrees in front of it. It can be rotated in 90-degree steps (facing along tile edges, not corners).
- Attack: bursts of **20** molten fireballs, 0.064 s apart, with ~1.0167 s between bursts (frame counts: 1.216 s of firing + 1.016 s pause = 2.232 s cycle). Each ball deals level 1 46.03 ... level 3 51.07 damage (displayed truncated) - the wiki's DPS (410/437/455) corresponds to a 2.24 s cycle.
- Piercing: balls fly in a straight line past the target and can hit **two units each**, ground and air alike, regardless of which layer was hit first; after two hits a ball disappears. Shots scatter over a narrow angle, so accuracy drops with distance.
- It briefly pauses after killing its target to waste less of a burst.
- Supercharge (TH18 at level 3): charge 1 +18 DPS (473 displayed / 53.08 per ball), charge 2 +250 HP (5,550).

### Recent balance notes (from the page's History table)

- February 23, 2026: level 3 added; displayed DPS updated (level 1 399 -> 410, level 2 425 -> 437).
- November 17, 2025: cost/time reductions.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH17: 2

Size: 3x3

**Statistics**

| Level | Damage per Second* | Damage per Hit** | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 410 | 46.03 | 4,500 | 17,000,000 | 8d 12h | 856 | 17 |
| 2 | 437 | 49.05 | 5,000 | 18,000,000 | 10d | 929 | 17 |
| 3 | 455 | 51.07 | 5,300 | 29,000,000 | 15d | 1,138 | 18 |

**Supercharges**

| Charge Level | Damage per Second* | Damage per Hit** | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 473 | 53.08 | 5,300 | 14,000,000 | 6d 12h | 749 | 18 |
| 2 | 473 | 53.08 | 5,550 | 12,000,000 | 7d 12h | 804 | 18 |

**Supercharges**

| Range | Attack Speed | Time Between Bursts | Shots Per Burst | Damage Type | Unit Type Targeted | Favorite Target |
|---|---|---|---|---|---|---|
| 16 tiles | 0.064s | 1.0167s | 20 shots | Multiple Targets | Ground & Air | Any |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 3 | 0 |
| Statistics | cost | 3 | 0 |
| Statistics | buildSeconds | 3 | 0 |
| Statistics | townHall | 3 | 0 |
| Statistics | xp | 3 | 0 |
| Statistics | dps | 0 | 3 |
| Statistics | damagePerHit | 3 | 0 |
| Supercharges | cost | 2 | 0 |
| Supercharges | buildSeconds | 2 | 0 |
| Supercharges | townHall | 2 | 0 |
| Supercharges | hitpoints | 2 | 0 |
| Supercharges | dps | 0 | 2 |
| Supercharges | damagePerHit | 2 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Firespitter`): 2/2 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| dps | 1, 2, 3 | 1: 410; 2: 437; 3: 455 | 1: 411; 2: 438; 3: 456 | display rounding: client DPS is 1 higher than the wiki's displayed DPS |
| dps | C1, C2 | C1: 473; C2: 473 | C1: 474; C2: 474 | display rounding: client DPS is 1 higher than the wiki's displayed DPS |
| damagePerHit (formula) | all | DPS x 2.24/20 (46.03 at L1) | DPS x (1000 + 19 x 64)/20 = 45.54 at L1 | the client's AttackSpeed 1000 + 19 x BurstDelay 64 = 2.216 s cycle is ~1% shorter than the cycle the wiki/in-game numbers imply |

**Game table check** (`reference/full-client/progression.json` -> `firespitter` vs wiki): 4 discrepancies.

| Field | Level | Wiki | progression.json | Note |
|---|---|---|---|---|
| dps | 1, 2, 3 | 1: 410; 2: 437; 3: 455 | 1: 411; 2: 438; 3: 456 | display rounding (progression.json uses client DPS) |
| rate | all | 20-shot bursts, 0.064 s apart, ~2.24 s cycle | 1 | progression.json rate 1.0 = AttackSpeed only; burst/pierce/arc not represented |

**Interpretation of client columns**

- `DPS` 411/438/456 (the wiki shows 410/437/455), `AttackSpeed` 1000, `BurstCount` 20, `BurstDelay` 64 ms, `AttackRange` 1600.
- Arc and facing: `TargetingConeAngle` 150, `AimRotateStep` 90.
- Piercing: `PenetratingProjectile` TRUE, `PenetratingRadius` 50, `PenetratingExtraRange` 100 (flies 1 tile past the target); projectile `GatlingGunAmmo`: `MaxHitObjects` 2, `HitsGroundAndAir` TRUE, `PenetratingHitBoxWidth` 40, `TargetPosRandomRadius` 768 (spread), `DontTrackTarget` TRUE.
- Supercharge `Firespitter Mini Levels`: DPS +18, charge 2 HP +250; 14M / 12M; 6d12h / 7d12h - matches.
- progression.json keeps dps 456 / rate 1.0 / range 16 without burst, arc or pierce data.
