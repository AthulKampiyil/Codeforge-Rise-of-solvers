# Spell Tower

- Source: [Spell Tower](https://clashofclans.fandom.com/wiki/Spell_Tower) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624787`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Spell Tower` (4 levels)

## Mechanics

- Unlocked at Town Hall 15. Count (wiki): TH15 2. Footprint 2x2. Upgrades only unlock additional spell modes (level 1 Rage, 2 Poison, 3 Invisibility, 4 Earthquake at TH17); they never strengthen a spell.
- Activation radius vs area of effect: Rage has both; Poison and Earthquake only an activation radius (the spell lands on the triggering unit); Invisibility only an area of effect. Rage, Poison and Earthquake fire after a unit has stayed inside the activation radius for **1.2 s** (the deploy time). If the triggering unit dies first the cast is cancelled.
- After casting, the tower reloads and can cast again after its recharge time while it survives. When destroyed, the loaded spell is released immediately regardless of triggers (Poison/Earthquake land on the tower itself if no enemy is near).
- **Rage mode**: 9-tile activation, 5-tile radius centered on the tower, lasts 18 s, +60% damage to defenses and defending units and faster defending units; defending Heroes get half (+30% damage, +15 speed). Recharge 70 s. Targets ground & air. Does not boost Air Sweeper pushback, death damage (Bomb Tower/Giga weapons), poison DPS, the Monolith's %-HP bonus or trap damage (Skeleton Trap skeletons are boosted).
- **Poison mode**: 9-tile activation, 5-tile poison cloud on the target for 12 s, up to 60 DPS (ramping), -35% movement speed and -25% attack rate on attackers; ground & air. Recharge 70 s.
- **Invisibility mode**: triggers when attackers damage a building inside its 4.5-tile radius; makes buildings, defending units and attackers within 4.5 tiles invisible for 4.5 s. Recharge 50 s. It does not trigger on spell damage (unless the spell destroys the tower), when only defending units are hit, or if every attacker hitting those buildings dies within 1.2 s.
- **Earthquake mode** (added Feb 23, 2026): 9-tile activation against ground units; 4.7-tile quake on the target dealing 30% of maximum HP to ground troops. Repeated quakes on the same unit deal 1/(2n-1) of the damage (1/3, 1/5, ...). Recharge 50 s; ground only.

### Recent balance notes (from the page's History table)

- February 23, 2026: level 4 (Earthquake Spell Tower) added at TH17.
- December 12, 2023: Rage radius 6 -> 5 tiles and buff 90% -> 60%.
- June 12, 2023: recharge times increased (Rage +20 s, Poison/Invisibility +10 s).
- December 12, 2022: Poison attack-rate reduction 35% -> 25%.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH15: 2

Size: 2x2

**Statistics**

| Level | Unlocks | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|
| 1 | Rage Spell | 2,500 | 9,000,000 | 7d | 777 | 15 |
| 2 | Poison Spell | 2,800 | 11,000,000 | 8d | 831 | 15 |
| 3 | Invisibility Spell | 3,100 | 12,000,000 | 8d 12h | 856 | 15 |
| 4 | Earthquake Spell | 3,200 | 27,000,000 | 10d | 929 | 17 |

**Statistics - Rage Spell Tower Statistics**

| Range | Spell Radius | Spell Duration | Damage Increase | Recharge Time | Trigger | Targets | Deploy Position |
|---|---|---|---|---|---|---|---|
| 9 tiles | 5 tiles | 18s | 60% | 70s | Target in range | Ground & Air | Spell Tower |

**Statistics - Poison Spell Tower Statistics**

| Range | Spell Radius | Spell Duration | Max Damage per Second | Speed Decrease | Attack Rate Decrease | Recharge Time | Trigger | Targets | Deploy Position |
|---|---|---|---|---|---|---|---|---|---|
| 9 tiles | 5 tiles | 12s | 60 | 35% | 25% | 70s | Target in range | Ground & Air | Target |

**Statistics - Invisibility Spell Tower Statistics**

| Range | Spell Radius | Spell Duration | Recharge Time | Trigger | Targets | Deploy Position |
|---|---|---|---|---|---|---|
| 4.5 tiles | 4.5 tiles | 4.5s | 50s | Building in range is hit | Ground & Air | Spell Tower |

**Statistics - Earthquake Spell Tower Statistics**

| Range | Spell Radius | Troop Damage % | Recharge Time | Trigger | Targets | Deploy Position |
|---|---|---|---|---|---|---|
| 9 tiles | 4.7 tiles | 30% | 50s | Target in range | Ground | Target |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 4 | 0 |
| Statistics | cost | 4 | 0 |
| Statistics | buildSeconds | 4 | 0 |
| Statistics | townHall | 4 | 0 |
| Statistics | xp | 4 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Spell Tower`): 4/4 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| range | all | 9 | building AttackRange 800; weapon AttackRange 900 (Invisibility 450) | the wiki's 9 tiles matches the weapons.csv rows, not the building row |

**Game table check** (`reference/full-client/progression.json` -> `spelltower` vs wiki): 2 discrepancies.

| Field | Level | Wiki | progression.json | Note |
|---|---|---|---|---|
| range | all | 9 (Rage/Poison/Earthquake activation), 4.5 (Invisibility) | 8 | progression.json uses the building's AttackRange 800; the spell weapons use 900 / 450 |
| spells | all | 4 spell modes | none | no spell/recharge data derived |

**Interpretation of client columns**

- Building row: `UnlockWeaponMode` per level = `SpellTowerRage`, `SpellTowerPoison`, `SpellTowerInvisibility`, `SpellTowerEarthquake` (weapons.csv); `TargetingImmunityTotems` TRUE; no DPS.
- weapons.csv: Rage/Poison `AttackSpeed` 70000 (70 s recharge), Invisibility/Earthquake 50000; `CoolDownOverride` 68800 / 48800, so wind-up = 1.2 s (the wiki's deploy dwell). `AttackRange` 900 (Invisibility 450). `SelfAsAoeCenter` TRUE for Rage and Invisibility; `CustomTargetHitBuildingInRange` TRUE for Invisibility (trigger = building hit); `AttackCenterOnDeath` TRUE for all (cast on destruction); Earthquake `AirTargets` FALSE. Each weapon's `Projectile` carries the spell.
- spells.csv `Spell Tower Rage`: `Radius` 500, `NumberOfHits` 60 x `TimeBetweenHitsMS` 300 = 18 s, `DamageBoostPercent`/`BuildingDamageBoostPercent` 60, `SpeedBoost` 30 / `SpeedBoost2` 15.
- `Spell Tower Poison`: `Radius` 500, 30 x 400 ms = 12 s, `PoisonDPS` 60, `SpeedBoost` -35, `AttackSpeedBoost` -25, `HeroDamageMultiplier` 20, `PoisonAffectAir` TRUE, immunities for buildings/walls/siege.
- `Spell Tower Invisibility`: `Radius` 450, 18 x 250 ms = 4.5 s, `InvisibilityTime` 600.
- `Spell Tower Earthquake`: `Radius` 470, `TroopDamagePermil` 60 x `NumberOfHits` 5 = 30% (`BuildingDamagePermil` 60 too), ground only. All spell numbers match the wiki's mode tables.
- The 1/(2n-1) repeated-earthquake falloff and the hero half-effect of Rage are engine rules, not columns in these rows (except `SpeedBoost2`).
