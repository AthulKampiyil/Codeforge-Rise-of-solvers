# Sneezy

- **Source:** https://clashofclans.fandom.com/wiki/Sneezy
- **Wiki revision:** 622902 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** pet
- **Client record:** `pets.csv` → `Sneezy`
- **Also used:** [Sneezy/Booger](https://clashofclans.fandom.com/wiki/Sneezy/Booger) (revision 621747)

> Pet House 11 flying pet that keeps its distance and sneezes out Boogers (max 2), turning into an enraged short-range defense attacker when its hero falls.

## Mechanics

- Levels 1–10 (wiki). Pet House level required by pet level: 1–10 → 11.
- Per-level stats (level 1 → max): Damage per Second 270 → 450; Damage per Hit 216 → 360; Hitpoints 3,300 → 4,650.
- Upgrades use Dark Elixir in the Pet House: 2,520,000 DE and 72 days in total from level 1 to 10 (level 2: 200,000 DE).
- Behaviour: flies at a distance from its hero and does not attack while the hero is alive; every 10 s it sneezes out a Booger (at most two alive), which attacks buildings, usually within 5.5 tiles of Sneezy.
- Booger (pet level = Booger level): 1,100 → 2,000 HP, 105 → 150 DPS, 1 s attacks against any target, wiki speed 16, counts as 4 housing; cannot trigger traps or pull Clan Castle troops but does reveal Hidden Teslas.
- When its hero is knocked out, Sneezy becomes enraged: a short-range (wiki 1.5 tiles) defense-targeting attacker with high DPS (270 → 450) and a token +1% damage for 30 s; it keeps spawning Boogers, briefly pausing attacks to sneeze.
- A Recall Spell recalls Sneezy with its hero without using extra capacity while the hero is alive; afterwards it is recalled like other pets.

## Level caps (client `LaboratoryLevel` = Pet House level)

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Pet House 11 | 1–10 | 10 |

## Level table

Upgrade cost/time on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Damage per Second | Damage per Hit | Hitpoints | Upgrade Cost | Upgrade Time | Pet House Level Required |
|---|---|---|---|---|---|---|
| 1 | 270 | 216 | 3,300 | N/A | N/A | 11 |
| 2 | 290 | 232 | 3,450 | 200,000 | 8d | 11 |
| 3 | 310 | 248 | 3,600 | 220,000 | 8d | 11 |
| 4 | 330 | 264 | 3,750 | 240,000 | 8d | 11 |
| 5 | 350 | 280 | 3,900 | 260,000 | 8d | 11 |
| 6 | 370 | 296 | 4,050 | 280,000 | 8d | 11 |
| 7 | 390 | 312 | 4,200 | 300,000 | 8d | 11 |
| 8 | 410 | 328 | 4,350 | 320,000 | 8d | 11 |
| 9 | 430 | 344 | 4,500 | 340,000 | 8d | 11 |
| 10 | 450 | 360 | 4,650 | 360,000 | 8d | 11 |

### Wiki constants (first statistics table)

| Field | Value |
|---|---|
| Preferred Target | Defenses |
| Targets | Ground & Air |
| Attack Type | Single Target |
| Movement Speed | 24 |
| Attack Speed | 0.8s |
| Maximum Boogers Summoned | 2 |
| Rage Duration | 30s |
| Rage Damage Increase | 1% |
| Pet House Level Required | 11 |
| Range | 5.5 or 1.5 tiles |
| Special Ability | ACHOO! |


### Related page: [Sneezy/Booger](https://clashofclans.fandom.com/wiki/Sneezy/Booger) (revision 621747; client `characters.csv` → `Booger`)

| Preferred Target | Targets | Attack Type | Movement Speed | Attack Speed |
|---|---|---|---|---|
| Any | Ground & Air | Single Target | 16 | 1s |

| Level | Damage per Second | Damage per Hit | Hitpoints |
|---|---|---|---|
| 1 | 105 | 105 | 1,100 |
| 2 | 110 | 110 | 1,200 |
| 3 | 115 | 115 | 1,300 |
| 4 | 120 | 120 | 1,400 |
| 5 | 125 | 125 | 1,500 |
| 6 | 130 | 130 | 1,600 |
| 7 | 135 | 135 | 1,700 |
| 8 | 140 | 140 | 1,800 |
| 9 | 145 | 145 | 1,900 |
| 10 | 150 | 150 | 2,000 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Movement Speed `24` = client `Speed 300 (÷12.5 = 24)`
- Attack Speed `0.8s` = client `AttackSpeed 800 ms`
- Pet House Level Required `11` = client `LaboratoryLevel 11`
- `damagePerSecond` = `pets.DPS` (same value) (all 10 wiki rows)
- `damagePerHit` = client `DPS × AttackSpeed / 1000` (all 10 wiki rows)
- `hitpoints` = `pets.Hitpoints` (same value) (all 10 wiki rows)
- `upgradeCost` = client row N−1 `UpgradeCost` (the client stores the next upgrade on the current row) (all 10 wiki rows)
- `upgradeTimeSeconds` = client row N−1 `UpgradeTimeD/H/M` converted to seconds (next-upgrade convention) (all 10 wiki rows)
- `petHouseLevelRequired` = `pets.LaboratoryLevel` (same value) (all 10 wiki rows)

- Sneezy/Booger: `hitpoints` vs `characters[Booger].Hitpoints`: all levels match
- Sneezy/Booger: `damagePerSecond` vs `characters[Booger].DPS`: all levels match

**Client columns and interpretation notes**

- `pets.csv` stores the next upgrade on each level row (`UpgradeCost`, `UpgradeTimeH`), exactly like heroes; `LaboratoryLevel` on row N is the Pet House level needed for level N; `HousingSpace` 20 for every pet.
- Following: the wiki's 'within X tiles of Hero' equals (`LeashLength` + `AttackRange`) ÷ 100 for the pets that list it (L.A.S.S.I 200+60 → 2.6 ≈ 2.5, Mighty Yak 581+120 → 7, Frosty 100+350 → 4.5, Spirit Fox 200+250 → 4.5) — an interpretation, not a documented formula.
- `Sneezy`: `SummonTroop=Booger`, `SummonTroopCount` 1, `SummonCooldown` 10000, `SummonLimit` 2, `SummonTime` 1500, `SummonDelay` 1000, `SummonLevel` = pet level, `RecallWithMaster=TRUE`, base `AttackRange` 250 / `AttackSpeed` 800 / `PreferedTargetBuildingClass=Defense`.
- While the hero lives `FlyingSpawnerTransformAbility` overrides `AttackRange` 500 and `DPS` 0 (distance-keeping spawner); it deactivates when the master dies.
- Hero-death rage: `HeroDeathAbilityType=BoostSelf`, `HeroDeathAbilitySpell=VisualRage` (`DamageBoostPercent` 1, `BoostTimeMS` 300000).
- `characters[Booger]`: `Speed` 200, `AttackRange` 90, `AttackSpeed` 1000, flying, `TriggersTraps=FALSE`, `HousingSpace` 4.

**Mismatches / ambiguities**

- `Range`: wiki **5.5 or 1.5 tiles** vs client **FlyingSpawnerTransformAbility AttackRange 500 (5 tiles) / base AttackRange 250 (2.5 tiles)** —
- `Rage Duration`: wiki **30s** vs client **VisualRage BoostTimeMS 300000 (300 s)** — factor-of-ten difference
