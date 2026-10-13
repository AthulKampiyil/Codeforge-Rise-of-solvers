# Frosty

- **Source:** https://clashofclans.fandom.com/wiki/Frosty
- **Wiki revision:** 625102 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** pet
- **Client record:** `pets.csv` → `Frosty`
- **Also used:** [Frosty/Frostmite](https://clashofclans.fandom.com/wiki/Frosty/Frostmite) (revision 616110)

> Pet House 5 ranged pet whose hits chill targets and who spawns wall-jumping, defense-hunting Frostmites every 8 s.

## Mechanics

- Levels 1–15 (wiki). Pet House level required by pet level: 1–10 → 5; 11–15 → 11.
- Per-level stats (level 1 → max): Damage per Second 94 → 150; Damage per Hit 112.8 → 180; Frostmites per Summon 1 → 3; Maximum Frostmites Summoned 4 → 12; Hitpoints 2,350 → 3,800.
- Upgrades use Dark Elixir in the Pet House: 2,455,000 DE and 77 days in total from level 1 to 15 (level 2: 70,000 DE).
- Behaviour: stays within about 4.5 tiles of its hero; ranged single target (3.5 tiles) every 1.2 s against ground and air; wiki speed 24. His own hits inflict frost (slow) on defenses and troops.
- Special ability 'Freezy Friends': every 8 s he summons Frostmites — 1 per summon at levels 1–4, 2 at 5–14, 3 at 15 — up to a maximum of 4 (levels 1–4), 8 (5–9), 10 (10–14) or 12 (15).
- Frostmites: head for the nearest defense and ignore everything else while defenses remain (Clan Castle is not a defense; defending Grand Warden and an active Town Hall weapon are); jump Walls; melt into the target dealing 15 area damage that chills; 450 HP; wiki speed 24; 1 housing space.
  - They do half damage to resource storages (including a weaponised TH12+ Town Hall).

## Level caps (client `LaboratoryLevel` = Pet House level)

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Pet House 5 | 1–10 | 10 |
| Pet House 11 | 11–15 | 15 |

## Level table

Upgrade cost/time on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Damage per Second | Damage per Hit | Frostmites per Summon | Maximum Frostmites Summoned | Hitpoints | Upgrade Cost | Upgrade Time | Pet House Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 94 | 112.8 | 1 | 4 | 2,350 | N/A | N/A | 5 |
| 2 | 98 | 117.6 | 1 | 4 | 2,450 | 70,000 | 1d 12h | 5 |
| 3 | 102 | 122.4 | 1 | 4 | 2,550 | 85,000 | 2d | 5 |
| 4 | 106 | 127.2 | 1 | 4 | 2,650 | 100,000 | 3d | 5 |
| 5 | 110 | 132 | 2 | 8 | 2,800 | 115,000 | 4d | 5 |
| 6 | 114 | 136.8 | 2 | 8 | 2,900 | 130,000 | 4d 12h | 5 |
| 7 | 118 | 141.6 | 2 | 8 | 3,000 | 145,000 | 5d | 5 |
| 8 | 122 | 146.4 | 2 | 8 | 3,100 | 160,000 | 5d 12h | 5 |
| 9 | 126 | 151.2 | 2 | 8 | 3,200 | 170,000 | 6d | 5 |
| 10 | 130 | 156 | 2 | 10 | 3,300 | 180,000 | 6d 12h | 5 |
| 11 | 134 | 160.8 | 2 | 10 | 3,400 | 200,000 | 7d | 11 |
| 12 | 138 | 165.6 | 2 | 10 | 3,500 | 230,000 | 8d | 11 |
| 13 | 142 | 170.4 | 2 | 10 | 3,600 | 260,000 | 8d | 11 |
| 14 | 146 | 175.2 | 2 | 10 | 3,700 | 290,000 | 8d | 11 |
| 15 | 150 | 180 | 3 | 12 | 3,800 | 320,000 | 8d | 11 |

### Wiki constants (first statistics table)

| Field | Value |
|---|---|
| Preferred Target | Within 4.5 tiles of Hero |
| Targets | Ground & Air |
| Attack Type | Single Target |
| Movement Speed | 24 |
| Attack Speed | 1.2s |
| Summon Cooldown | 8s |
| Pet House Level Required | 5 |
| Range | 3.5 tiles |
| Special Ability | Freezy Friends |


### Related page: [Frosty/Frostmite](https://clashofclans.fandom.com/wiki/Frosty/Frostmite) (revision 616110; client `characters.csv` → `Icemite`)

| Preferred Target | Attack Type | Movement Speed | Range |
|---|---|---|---|
| Defenses | Area Splash (Ground & Air) | 24 | 2 tiles |

| Damage | Hitpoints |
|---|---|
| 15 | 450 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Movement Speed `24` = client `Speed 300 (÷12.5 = 24)`
- Attack Speed `1.2s` = client `AttackSpeed 1200 ms`
- Pet House Level Required `5` = client `LaboratoryLevel 5`
- Range `3.5 tiles` = client `AttackRange 350 (= 3.5 tiles)`
- `damagePerSecond` = `pets.DPS` (same value) (all 15 wiki rows)
- `damagePerHit` = client `DPS × AttackSpeed / 1000` (all 15 wiki rows)
- `frostmitesPerSummon` = `pets.SummonTroopCount` (same value) (all 15 wiki rows)
- `maximumFrostmitesSummoned` = `pets.SummonLimit` (same value) (all 15 wiki rows)
- `hitpoints` = `pets.Hitpoints` (same value) (all 15 wiki rows)
- `upgradeCost` = client row N−1 `UpgradeCost` (the client stores the next upgrade on the current row) (all 15 wiki rows)
- `upgradeTimeSeconds` = client row N−1 `UpgradeTimeD/H/M` converted to seconds (next-upgrade convention) (all 15 wiki rows)
- `petHouseLevelRequired` = `pets.LaboratoryLevel` (same value) (all 15 wiki rows)

**Client columns and interpretation notes**

- `pets.csv` stores the next upgrade on each level row (`UpgradeCost`, `UpgradeTimeH`), exactly like heroes; `LaboratoryLevel` on row N is the Pet House level needed for level N; `HousingSpace` 20 for every pet.
- Following: the wiki's 'within X tiles of Hero' equals (`LeashLength` + `AttackRange`) ÷ 100 for the pets that list it (L.A.S.S.I 200+60 → 2.6 ≈ 2.5, Mighty Yak 581+120 → 7, Frosty 100+350 → 4.5, Spirit Fox 200+250 → 4.5) — an interpretation, not a documented formula.
- `Frosty`: `SummonTroop=Icemite`, `SummonCooldown` 8000, `SummonTroopCount` 1/2/3, `SummonLimit` 4/8/10/12, `SummonLevel` 1, `SecondarySpawnDist` 150, `FrostOnHitTime` 4000 and `FrostOnHitPercent` 50 on his attacks, `AttackRange` 350, `LeashLength` 100.
- `characters[Icemite]` (Frostmite): `Hitpoints` 450, `DPS` 15, `AttackRange` 200, `DamageRadius` 80, `PreferedTargetBuildingClass=Defense`, `IsJumper`, `FrostOnHitTime` 4000 / `FrostOnHitPercent` 50, `DamageReductionToStorages` 50, `TriggersTraps=FALSE`, `DoesNotOpenCC=TRUE`, `NewTargetAttackDelay` 500.
- `SummonLimit` 4/8/10/12 is the wiki's 'Maximum Frostmites Summoned'; the wiki does not say whether it caps Frostmites alive at once or per battle (Sneezy's `SummonLimit` 2 is described as a concurrent cap).

**Mismatches / ambiguities**

- `frostValues`: wiki **slow amount/duration not listed** vs client **FrostOnHitPercent 50 for FrostOnHitTime 4000 ms (Frosty and Frostmites)** — wiki omits
