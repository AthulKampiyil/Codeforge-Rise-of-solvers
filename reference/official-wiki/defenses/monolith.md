# Monolith

- Source: [Monolith](https://clashofclans.fandom.com/wiki/Monolith) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `625148`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Monolith` (5 levels)

## Mechanics

- Unlocked at Town Hall 15. Count (wiki): TH15 1. Footprint 3x3. Built and upgraded with **Dark Elixir**.
- Range 11 tiles, one shot every 1.5 s, single target, ground and air.
- Damage per shot = base damage (DPS x 1.5; level 5: 337.5) **plus a bonus equal to a percentage of the target's maximum hitpoints** (level 1 11% ... level 5 15%). It is therefore strongest against Heroes and tanks ('Hero Killer').
- The projectile color shows the target's max-HP band (teal = low, indigo = middle, purple = high).
- The Rage Spell Tower does not boost the percentage bonus (per the Spell Tower page).
- Supercharge (TH18 at level 5, added August 31, 2026): charge 1 +10 base DPS (235 / 352.5; bonus stays 15%), charge 2 +202 HP (6,161).

### Recent balance notes (from the page's History table)

- August 31, 2026: 2 Supercharge levels added (not in client 18.400.21).
- June 16, 2026: level 5 added (supercharges on level 4 removed).
- November 17, 2025: level 4 time 15d18h -> 12d.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH15: 1

Size: 3x3

**Statistics**

| Level | Base Damage per Second | Base Damage per Shot | Bonus Damage per Shot | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 150 | 225 | 11% | 4,747 | 200,000 | 7d | 777 | 15 |
| 2 | 175 | 262.5 | 12% | 5,050 | 250,000 | 8d | 831 | 15 |
| 3 | 193 | 289.5 | 13% | 5,353 | 260,000 | 9d | 881 | 16 |
| 4 | 209 | 313.5 | 14% | 5,656 | 300,000 | 11d | 974 | 17 |
| 5 | 225 | 337.5 | 15% | 5,959 | 470,000 | 15d | 1,138 | 18 |

**Supercharges**

| Level | Base Damage per Second | Base Damage per Shot | Bonus Damage per Shot | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 235 | 352.5 | 15% | 5,959 | 220,000 | 5d | 657 | 18 |
| 2 | 235 | 352.5 | 15% | 6,161 | 200,000 | 7d | 777 | 18 |

**Supercharges**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 11 | 1.5s | Single Target | Ground & Air |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 5 | 0 |
| Statistics | cost | 5 | 0 |
| Statistics | buildSeconds | 5 | 0 |
| Statistics | townHall | 5 | 0 |
| Statistics | xp | 5 | 0 |
| Statistics | bonusDamagePerShot | 5 | 0 |
| Statistics | baseDamagePerSecond | 5 | 0 |
| Statistics | baseDamagePerShot | 5 | 0 |
| Supercharges | cost | 0 | 2 |
| Supercharges | buildSeconds | 2 | 0 |
| Supercharges | townHall | 0 | 2 |
| Supercharges | hitpoints | 2 | 0 |
| Supercharges | baseDamagePerSecond | 2 | 0 |
| Supercharges | supercharge link | - | client Monolith max level has no MiniLevels link; values below compare against the unlinked row 'Monolith Mini Levels' |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Monolith`): 4/4 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| supercharge | all | available at max level | not linked from building row | Aug 31, 2026 charges are newer than the client snapshot |
| cost | C1, C2 | C1: 220000; C2: 200000 | C1: 150000; C2: 130000 | unlinked client mini row (older TH17 supercharge) costs 150k / 130k DE; live charges cost 220k / 200k |
| townHall | C1, C2 | C1: 18; C2: 18 | C1: 17; C2: 17 | unlinked client mini row says TH17 |
| projectileColorBands | all | thresholds vary by level | 800;3500 max HP for every level | ProjectileVariantByTargetMaxHP is only set on level 1 and inherited; cosmetic only |

**Game table check** (`reference/full-client/progression.json` -> `monolith` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `DPS` 150..225 = base DPS; base per shot = `DPS` x `AttackSpeed` 1500/1000. `CoolDownOverride` 750.
- `DamagePermilHp` 110..150 = the %-of-max-HP bonus in permil (11-15%) - matches every level. progression.json exposes it as `hpDamage` 0.15.
- `Projectile` = `MonolithProjectileMin;MonolithProjectileMed;MonolithProjectileMax` selected by `ProjectileVariantByTargetMaxHP` 800;3500 (`DefaultProjectileVariant` 3).
- `BuildResource` DarkElixir.
- Supercharge: the building rows have no `MiniLevels` link; the unlinked `Monolith Mini Levels` row (TH17, DPS +10, HP +202, DE 150k/130k, discounts) predates the August 2026 re-add.
