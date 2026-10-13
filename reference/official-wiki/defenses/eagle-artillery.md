# Eagle Artillery

- Source: [Eagle Artillery](https://clashofclans.fandom.com/wiki/Eagle_Artillery) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `625122`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Eagle Artillery` (7 levels)

## Mechanics

- Unlocked at Town Hall 11; one per base (TH11-16). At TH17 the level 7 Eagle Artillery must be merged into the Town Hall (forming the Inferno Artillery) before the TH17 upgrade, and it is then removed permanently. Footprint 4x4.
- Range 7-50 tiles: covers almost the whole map but has a **7-tile blind spot**. Targets ground and air; no favorite target.
- Activation: dormant at battle start; wakes after **200 housing space** of attacking units has been deployed (with warnings every 50). What counts: troops by housing space; each Hero counts 25; each spell housing space counts 5 (Clone = 15, Recall and Revive = 10, summoning spells = 5 with no extra for the summons); each Siege Machine counts 1; reinforcement spells count normally. What does not count: Clan Castle troops, pets, units summoned by hero equipment, spawned sub-troops (Golemites, Skeletons from Witches), clones, Recall re-deploys, revived Heroes.
- Attack: volleys of 3 shells fired 0.75 s apart with a 10 s cooldown between volleys (11.5 s per full volley cycle). DPS on the wiki = 3 x damage / 10 s (level 7: 157.5).
- Each shell: main damage (level 1: 225 -> level 7: 525) in a 0.75-tile radius around the impact, plus a weak shockwave (20 -> 50) from 0.75 to 3 tiles that knocks back small troops.
- Targeting: picks the area with the highest concentration of troop hitpoints (a 'heat map'), re-evaluated every volley so it can switch targets. A yellow reticle tracks the chosen unit; if the unit leaves range or enters the blind spot, the shells land at the edge of the range. It is less likely to target Healers (2023) and Giant Giants (Jan 28, 2026).
- Ammunition: 90 shells (30 volleys, about 5 minutes of fire); free automatic reload on login; always loaded in war. Volleys can be cut to 1-2 shells when ammo runs out.
- No Supercharge: the page marks it disabled because the Eagle Artillery is merged into the Inferno Artillery.

### Recent balance notes (from the page's History table)

- January 28, 2026: less likely to target Giant Giants.
- November 25, 2024 (TH17 update): level 7 becomes a merge requirement for the Town Hall 17; costs/times reduced.
- June 3, 2024: main-shell damage reduced at levels 1-6 (shockwave unchanged).

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH11: 1, TH17: 0

Size: 4x4

**Statistics**

| Level | Damage per Hit | Damage per Second | Shockwave Damage | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 225 | 67.5 | 20 | 4,000 | 5,000,000 | 4d | 587 | 11 |
| 2 | 250 | 75 | 25 | 4,400 | 6,000,000 | 5d | 657 | 11 |
| 3 | 275 | 82.5 | 30 | 4,800 | 9,000,000 | 7d | 777 | 12 |
| 4 | 350 | 105 | 35 | 5,200 | 10,000,000 | 7d 12h | 804 | 13 |
| 5 | 425 | 127.5 | 40 | 5,600 | 12,000,000 | 8d | 831 | 14 |
| 6 | 475 | 142.5 | 45 | 5,900 | 13,000,000 | 9d | 881 | 15 |
| 7 | 525 | 157.5 | 50 | 6,200 | 14,000,000 | 9d 12h | 905 | 16 |

**Statistics**

| Range | Activation Housing Space | Attack Speed | Time Between Bursts | Shots Per Burst | Damage Type | Unit Type Targeted | Favorite Target | Number of Rounds |
|---|---|---|---|---|---|---|---|---|
| 7-50 | 200 | 0.75s | 10s | 3 shots | Splash - 0.75 tiles for main shot; 0.75 to 3 tiles for shockwave | Ground & Air | Any | 90* |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 7 | 0 |
| Statistics | cost | 7 | 0 |
| Statistics | buildSeconds | 7 | 0 |
| Statistics | townHall | 7 | 0 |
| Statistics | xp | 7 | 0 |
| Statistics | damagePerHit | 7 | 0 |
| Statistics | shockwaveDamage | 7 | 0 |
| Statistics | dps | 7 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Eagle Artillery`): 6/8 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| countPerTownHall | TH17, TH18 | TH17: 0; TH18: 0 | TH17: 1; TH18: 1 | the Eagle Artillery disappears when merged into the TH17 Town Hall; client townhall_levels still carries the TH11 count of 1 forward |

**Game table check** (`reference/full-client/progression.json` -> `eagle` vs wiki): 16 discrepancies.

| Field | Level | Wiki | progression.json | Note |
|---|---|---|---|---|
| dps | 1, 2, 3, 4, 5, 6, 7 | 1: 67.5; 2: 75; 3: 82.5; 4: 105; 5: 127.5; 6: 142.5; 7: 157.5 | 1: 2; 2: 2.5; 3: 3; 4: 3.5; 5: 4; 6: 4.5; 7: 5 | progression.json dps = shockwave/10 s; wiki DPS = 3 x main shell / 10 s |
| damage | 1, 2, 3, 4, 5, 6, 7 | 1: 225; 2: 250; 3: 275; 4: 350; 5: 425; 6: 475; 7: 525 | 1: 20; 2: 25; 3: 30; 4: 35; 5: 40; 6: 45; 7: 50 | progression.json uses buildings.csv Damage (the shockwave, 20-50) as damage per hit; the main shell damage is in spells.csv 'Eagle Artillery Hit Spell' (225-525) |
| splash | all | 0.75 main / 3.0 shockwave | 3 | progression.json splash 3 = shockwave radius only; main shell radius is 0.75 tiles (Hit Spell Radius 75) |
| rate | all | 3 shells, 0.75 s apart, every 10 s (11.5 s cycle) | 10 | burst of 3 not represented |

**Interpretation of client columns**

- Main shell damage is **not** on the building row: `Projectile` Artillery AmmoN carries `HitSpell` = `Eagle Artillery Hit Spell` with `HitSpellLevel` = building level; that spell's `Damage` (225, 250, 275, 350, 425, 475, 525) and `Radius` 75 (0.75 tiles) match the wiki exactly.
- `Damage` on the building row (20-50) is the shockwave damage, applied in `DamageRadius` 300 (3 tiles) with `Pushback` 50 / `PushbackHousingLimit` 3 (small troops only). `DPS` is 0.
- Timing: `BurstCount` 3, `BurstDelay` 750 ms, `AttackSpeed` 10000 (+ 2 x 750 = the wiki's 11.5 s cycle), `CoolDownOverride` 6992.
- Activation: `WakeUpSpace` 200 (housing space) and `WakeUpSpeed` 1125 (likely the wake-up animation in ms). The per-unit counting rules (heroes 25, spells x5, sieges 1, CC/pets excluded) are engine rules, not columns here.
- Targeting: `TargetGroups` TRUE with `TargetGroupsRadius` 500 is the hitpoint-cluster targeting; `MinAttackRange` 700 / `AttackRange` 5000 = 7-50 tiles.
- `AmmoCount` 30 counts volleys (30 x 3 = the wiki's 90 shells); `AmmoCost` 35,000-65,000 Elixir is a legacy reload price.
- The merge into the Town Hall is encoded on `Town Hall` level 17: `MergeRequirement` = `Eagle Artillery:7:0`.
- **progression.json mis-derives this defense**: it reports damage 20-50 and dps 2-5 (from the shockwave column), splash 3 and rate 10 - see the table above.
