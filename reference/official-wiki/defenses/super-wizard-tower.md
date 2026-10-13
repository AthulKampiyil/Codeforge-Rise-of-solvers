# Super Wizard Tower

- Source: [Super Wizard Tower/Home Village](https://clashofclans.fandom.com/wiki/Super_Wizard_Tower/Home_Village) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624749`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Super Wizard Tower` (2 levels)

## Mechanics

- Unlocked at Town Hall 18 by merging **two level 17 Wizard Towers**; permanent. Count (wiki): TH18 2 (2 Wizard Towers remain). All merges must be done before a later Town Hall upgrade. Footprint 3x3.
- Range 8 tiles, attack every 1.3 s, ground and air.
- The bolt hits the primary target (level 2: 416 = DPS 320 x 1.3) and then **chains to up to 15 other units within 4 tiles of the primary target** for 40% damage (chain decay -60%; level 2: 166.4). Chained units can be outside the tower's range (effective reach ~12 tiles). There is no splash radius any more.
- Supercharge (TH18 at level 2): charge 1 +7 DPS (327 / 425.1, chain 170.04), charge 2 +150 HP (6,450).

### Recent balance notes (from the page's History table)

- November 17, 2025: added with two levels and two supercharges.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH18: 2

Size: 3x3

**Statistics**

| Level | Damage per Second | Damage per Hit (Primary) | Damage per Hit (Secondary) | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 290 | 377 | 150.8 | 6,000 | 29,000,000 | 13d | 1,059 | 18 |
| 2 | 320 | 416 | 166.4 | 6,300 | 30,000,000 | 14d | 1,099 | 18 |

**Supercharges**

| Charge Level | Damage per Second | Damage per Hit (Primary) | Damage per Hit (Secondary) | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 327 | 425.1 | 170.04 | 6,300 | 12,000,000 | 6d | 720 | 18 |
| 2 | 327 | 425.1 | 170.04 | 6,450 | 14,000,000 | 7d | 777 | 18 |

**Supercharges**

| Range | Attack Speed | Damage Type | Chain Damage Decay | Chain Distance | Unit Type Targeted |
|---|---|---|---|---|---|
| 8 tiles | 1.3s | Single Target (Chain Lightning; up to 15 other targets) | 60% | 4 tiles | Ground & Air |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 2 | 0 |
| Statistics | cost | 2 | 0 |
| Statistics | buildSeconds | 2 | 0 |
| Statistics | townHall | 2 | 0 |
| Statistics | xp | 2 | 0 |
| Statistics | dps | 2 | 0 |
| Statistics | damagePerHitPrimary | 2 | 0 |
| Statistics | damagePerHitSecondary | 2 | 0 |
| Supercharges | cost | 2 | 0 |
| Supercharges | buildSeconds | 2 | 0 |
| Supercharges | townHall | 2 | 0 |
| Supercharges | hitpoints | 2 | 0 |
| Supercharges | dps | 2 | 0 |
| Supercharges | damagePerHitPrimary | 2 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Super Wizard Tower`): 1/1 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| AltDPS | 1-2 | not listed | 250 / 280 | unexplained second DPS column on the Super Wizard Tower rows (not equal to the chain damage); possibly a display/stat-bar value |

**Game table check** (`reference/full-client/progression.json` -> `superwizardtower` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `DPS` 290/320, `AttackSpeed` 1300 (`CoolDownOverride` 700), `AttackRange` 800, air+ground; primary = DPS x 1.3.
- Chain: `ChainAttackFactor` 15 (targets), `ChainAttackDistance` 400 (4 tiles), `ChainAttackDamageReductionPercent` 60, `ChainAttackDepth` 1 (all chains originate from the primary target), `ChainAttackDelay` 128 ms between chain hits (not on the wiki). `RandomizeTarget` TRUE.
- `MergeRequirement` = `Wizard Tower:17:0;Wizard Tower:17:0`; `DefenderCharacter` SuperWizard.
- Supercharge `Super Wizard Tower Mini Levels`: DPS +7, HP +150; 12M / 14M Gold; 6d / 7d - matches.
- progression.json has dps 320 / rate 1.3 / range 8 but no chain data.
