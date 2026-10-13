# Scattershot

- Source: [Scattershot](https://clashofclans.fandom.com/wiki/Scattershot) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624490`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Scattershot` (7 levels)

## Mechanics

- Unlocked at Town Hall 13. Count (wiki): TH13 2. Footprint 3x3.
- Range 3-10 tiles (3-tile blind spot); one boulder every 3.2 s; targets ground and air, but each shot only damages the layer of the unit it targeted (no ground+air splash).
- Damage model (level 7): the initial target takes the full hit (608 = DPS x 3.2). The rock then breaks into fragments that hit units **behind** the impact point inside a **90-degree cone** - nothing beside or in front of the target is hurt. Two falloff zones: within 1 tile behind the impact damage falls from 608 to 450; from 1 to 5 tiles it falls from 450 to 160.
- Shells are ballistic (they can still hit air troops, unlike the Mortar).
- Ammunition: 90 shots (about 4 min 33 s of fire); free automatic reload on login; always loaded in war.
- Supercharge (TH18 at level 7, added June 16, 2026): charge 1 +3 DPS (193; direct hit 617.6, splash values unchanged on the wiki), charge 2 +150 HP (5,950).
- Page trivia: patch notes quote a 3.228 s attack speed, but the observed rate is 3.2 s.

### Recent balance notes (from the page's History table)

- June 16, 2026: 2 Supercharge levels added.
- April 27, 2026: level 7 added (supercharges on level 6 removed); build time cuts at levels 1 and 6; description changed.
- February 23, 2026: charge costs/times reduced.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH13: 2

Size: 3x3

**Statistics**

| Level | Damage per Second | Damage per Shot* | Splash Damage** | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 125 | 300-400 | 100-300 | 3,600 | 8,000,000 | 5d | 657 | 13 |
| 2 | 150 | 360-480 | 120-360 | 4,200 | 9,000,000 | 7d | 777 | 13 |
| 3 | 170 | 380-544 | 130-380 | 4,800 | 11,000,000 | 7d 12h | 804 | 14 |
| 4 | 175 | 400-560 | 140-400 | 5,100 | 11,500,000 | 8d | 831 | 15 |
| 5 | 180 | 420-576 | 150-420 | 5,410 | 12,000,000 | 8d 12h | 856 | 16 |
| 6 | 185 | 440-592 | 155-440 | 5,600 | 16,500,000 | 9d | 881 | 17 |
| 7 | 190 | 450-608 | 160-450 | 5,800 | 26,500,000 | 15d | 1,138 | 18 |

**Supercharges**

| Charge | Damage per Second | Damage per Shot* | Splash Damage** | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 193 | 450-617.6 | 160-450 | 5,800 | 14,500,000 | 5d | 657 | 18 |
| 2 | 193 | 450-617.6 | 160-450 | 5,950 | 9,500,000 | 7d | 777 | 18 |

**Supercharges**

| Range | Attack Speed | Damage Type | Unit Type Targeted | Number of Rounds |
|---|---|---|---|---|
| 3-10 | 3.2s | Area Splash | Ground & Air | 90 |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 7 | 0 |
| Statistics | cost | 7 | 0 |
| Statistics | buildSeconds | 7 | 0 |
| Statistics | townHall | 7 | 0 |
| Statistics | xp | 7 | 0 |
| Statistics | dps | 7 | 0 |
| Statistics | damagePerHitMax | 7 | 0 |
| Statistics | damagePerHitMin | 7 | 0 |
| Statistics | splashDamageMax | 7 | 0 |
| Statistics | splashDamageMin | 7 | 0 |
| Supercharges | cost | 2 | 0 |
| Supercharges | buildSeconds | 2 | 0 |
| Supercharges | townHall | 2 | 0 |
| Supercharges | hitpoints | 2 | 0 |
| Supercharges | dps | 2 | 0 |
| Supercharges | damagePerHitMax | 2 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Scattershot`): 6/6 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| attackSeconds | all | 3.2 | 3.228 | client AttackSpeed 3228 ms (with CoolDownOverride 1500); wiki trivia says patch notes quote 3.228 s but the real rate is 3.2 s, and wiki per-hit values use 3.2 |
| supercharge ProjectileSpellDamageBoost | C1 | splash unchanged (160-450) | 3 | Scattershot Mini Levels charge 1 also has ProjectileSpellDamageBoost 3; the wiki lists no splash change - unit (flat vs %) unknown |

**Game table check** (`reference/full-client/progression.json` -> `scattershot` vs wiki): 2 discrepancies.

| Field | Level | Wiki | progression.json | Note |
|---|---|---|---|---|
| rate | all | 3.2 | 3.228 | progression.json uses client AttackSpeed 3228 ms; the wiki says the real cadence is 3.2 s |
| splash | all | 90-degree cone, 1 tile + 1-5 tiles falloff | 1 | cone shape, 5-tile reach and falloff are not represented |

**Interpretation of client columns**

- `AttackRange` 1000 / `MinAttackRange` 300 = 3-10 tiles; `AttackSpeed` 3228 ms, `CoolDownOverride` 1500; `DPS` 125..190 is the direct-hit DPS; `NewTargetAttackDelay` 2200 ms delays the first shot after re-targeting (not on the wiki).
- Splash is a hit spell: `Projectile` Scattershot Projectile N -> `HitSpell` `Scattershot Hit Spell` level N with `Damage` (300..450, the value at 1 tile), `MinDamage` (100..160, the value at 5 tiles), `Radius` 500, `MinRadius` 100, `ConeAngle` 90; `SmoothDamage` TRUE gives the linear falloff and `HitSpellInheritAffectType` TRUE limits the splash to the target's layer. All values match the wiki.
- `DamageRadius` 100 on the building is the 1-tile inner zone.
- `AmmoCount` 90 matches; `AmmoCost` 40,000 Elixir is a legacy reload price.
- Supercharge `Scattershot Mini Levels`: charge 1 DPS +3 (and ProjectileSpellDamageBoost 3), charge 2 Hitpoints +150; 14.5M / 9.5M Gold, 5d / 7d - costs, times and HP match the wiki.
