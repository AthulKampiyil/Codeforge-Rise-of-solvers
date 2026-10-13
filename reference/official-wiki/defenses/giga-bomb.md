# Giga Bomb

- Source: [Giga Bomb](https://clashofclans.fandom.com/wiki/Giga_Bomb) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `622995`; retrieved 2026-09-15
- Category: trap
- Client reference (18.400.21): `traps.csv` -> `Giga Bomb` (4 levels)

## Mechanics

- Unlocked at Town Hall 17 (split off from the TH16 Giga Inferno's death bomb when the Inferno Artillery was introduced). One per base; footprint 2x2; levels 1-4.
- **Visible** to attackers, unlike other traps.
- Trigger: the **total housing space** of units inside its 3.5-tile trigger radius must reach **18**. Units that cannot trigger traps (Skeletons, Bats...) add nothing. Lightning/Earthquake cannot trigger it; Freeze and Overgrowth do not stop the explosion.
- Explosion: 1,100 / 1,200 / 1,300 / 1,400 damage to ground and air units within 4.5 tiles, forcing them to re-target. Strong knockback that can fling units (including Dragons, Heroes, Root Riders, Golems); further-away ground units are pushed further; Siege Machines are not knocked back.
- No poison or slow (the TH14-16 death bomb had them).

### Recent balance notes (from the page's History table)

- February 23, 2026: level 4 added.
- November 17, 2025: costs and level 2-3 times reduced.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH17: 1

Size: 2x2

**Statistics**

| Level | Damage | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|
| 1 | 1,100 | 4,500,000 | N/A | N/A | 17 |
| 2 | 1,200 | 8,500,000 | 4d | 587 | 17 |
| 3 | 1,300 | 12,500,000 | 5d | 657 | 17 |
| 4 | 1,400 | 20,000,000 | 13d | 1,059 | 18 |

**Statistics**

| Trigger Housing Space | Trigger Radius | Damage Radius | Damage Type | Unit Type Targeted | Favorite Target |
|---|---|---|---|---|---|
| 18 | 3.5 tiles | 4.5 tiles | Area Splash | Ground & Air | None |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | cost | 4 | 0 |
| Statistics | townHall | 4 | 0 |
| Statistics | damagePerHit | 4 | 0 |
| Statistics | buildSeconds | 3 | 0 |
| Statistics | xp | 3 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Giga Bomb`): 2/2 TH levels match.

No mismatches found in the compared fields.

**Interpretation of client columns**

- Constants verified equal (wiki vs client): `triggerHousingSpace`, `triggerRadius`, `damageRadius`.
- `Damage` 1,100..1,400, costs, times and TH (levels 1-4) match.
- `Visible` TRUE, `MinTriggerHousingLimit` 18 (summed), `AirTrigger`/`GroundTrigger` TRUE; knockback via `RadialThrowDistance` 200 and `RadialThrowRadius` 450; `FadeTimeMS` 200; `ActionFrame` 38.
