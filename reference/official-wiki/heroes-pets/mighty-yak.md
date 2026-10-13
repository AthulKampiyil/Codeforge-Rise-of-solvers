# Mighty Yak

- **Source:** https://clashofclans.fandom.com/wiki/Mighty_Yak
- **Wiki revision:** 620660 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** pet
- **Client record:** `pets.csv` → `Mighty Yak`

> Pet House 3 high-HP ground pet dealing 20× damage to Walls; rages for 8 s when its hero is knocked out.

## Mechanics

- Levels 1–15 (wiki). Pet House level required by pet level: 1–10 → 3; 11–15 → 7.
- Per-level stats (level 1 → max): Damage per Second 60 → 116; Damage per Hit 126 → 243.6; Damage vs. Walls 2,520 → 4,872; Hitpoints 3,750 → 6,300.
- Upgrades use Dark Elixir in the Pet House: 1,470,000 DE and 59.5 days in total from level 1 to 15 (level 2: 40,000 DE).
- Behaviour: stays within about 7 tiles of its hero; melee (1.2 tiles), ground only; deals 20× damage to Walls ('Wall Buster').
- Attack timing: after moving it rams its target as soon as it stops, the second hit follows 1.6 s later, then it attacks every 2.1 s.
- When its hero is knocked out it rages for 8 s: +70% damage and +16 wiki speed. No rage if the hero is merely recalled, and none again if a revived hero is knocked out a second time.

## Level caps (client `LaboratoryLevel` = Pet House level)

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Pet House 3 | 1–10 | 10 |
| Pet House 7 | 11–15 | 15 |

## Level table

Upgrade cost/time on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Damage per Second | Damage per Hit | Damage vs. Walls | Hitpoints | Upgrade Cost | Upgrade Time | Pet House Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 60 | 126 | 2,520 | 3,750 | N/A | N/A | 3 |
| 2 | 64 | 134.4 | 2,688 | 4,000 | 40,000 | 1d | 3 |
| 3 | 68 | 142.8 | 2,856 | 4,250 | 50,000 | 1d 12h | 3 |
| 4 | 72 | 151.2 | 3,024 | 4,500 | 60,000 | 2d | 3 |
| 5 | 76 | 159.6 | 3,192 | 4,750 | 70,000 | 2d 12h | 3 |
| 6 | 80 | 168 | 3,360 | 4,950 | 80,000 | 3d | 3 |
| 7 | 84 | 176.4 | 3,528 | 5,100 | 90,000 | 3d 12h | 3 |
| 8 | 88 | 184.8 | 3,696 | 5,250 | 100,000 | 4d | 3 |
| 9 | 92 | 193.2 | 3,864 | 5,400 | 110,000 | 4d 12h | 3 |
| 10 | 96 | 201.6 | 4,032 | 5,550 | 120,000 | 5d | 3 |
| 11 | 100 | 210 | 4,200 | 5,700 | 130,000 | 5d 12h | 7 |
| 12 | 104 | 218.4 | 4,368 | 5,850 | 140,000 | 6d | 7 |
| 13 | 108 | 226.8 | 4,536 | 6,000 | 150,000 | 6d 12h | 7 |
| 14 | 112 | 235.2 | 4,704 | 6,150 | 160,000 | 7d | 7 |
| 15 | 116 | 243.6 | 4,872 | 6,300 | 170,000 | 7d 12h | 7 |

### Wiki constants (first statistics table)

| Field | Value |
|---|---|
| Preferred Target | Within 7 tiles of Hero |
| Targets | Ground |
| Attack Type | Single Target |
| Attack Range | 1.2 tiles |
| Movement Speed | 20 |
| Attack Speed | Varies* |
| Special Ability | Wall Buster |
| Rage Duration | 8s |
| Rage Speed Increase | 16 |
| Rage Damage Increase | 70% |
| Pet House Level Required | 3 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Attack Range `1.2 tiles` = client `AttackRange 120 (= 1.2 tiles)`
- Pet House Level Required `3` = client `LaboratoryLevel 3`
- `damagePerSecond` = `pets.DPS` (same value) (all 15 wiki rows)
- `damagePerHit` = client `DPS × AttackSpeed / 1000` (all 15 wiki rows)
- `hitpoints` = `pets.Hitpoints` (same value) (all 15 wiki rows)
- `upgradeCost` = client row N−1 `UpgradeCost` (the client stores the next upgrade on the current row) (all 15 wiki rows)
- `upgradeTimeSeconds` = client row N−1 `UpgradeTimeD/H/M` converted to seconds (next-upgrade convention) (all 15 wiki rows)
- `petHouseLevelRequired` = `pets.LaboratoryLevel` (same value) (all 15 wiki rows)
- `damageVsWalls`: = damage per hit × `DamageMultiplierPercent` 2000 ÷ 100 (126 × 20 = 2,520 … 243.6 × 20 = 4,872) — all 15 levels match
- `Rage Duration 8s / Rage Speed Increase 16 / Rage Damage Increase 70%`: `spells[TroopRage]` level 2 `BoostTimeMS` 8000, `SpeedBoost` 16, `DamageBoostPercent` 70

**Client columns and interpretation notes**

- `pets.csv` stores the next upgrade on each level row (`UpgradeCost`, `UpgradeTimeH`), exactly like heroes; `LaboratoryLevel` on row N is the Pet House level needed for level N; `HousingSpace` 20 for every pet.
- Following: the wiki's 'within X tiles of Hero' equals (`LeashLength` + `AttackRange`) ÷ 100 for the pets that list it (L.A.S.S.I 200+60 → 2.6 ≈ 2.5, Mighty Yak 581+120 → 7, Frosty 100+350 → 4.5, Spirit Fox 200+250 → 4.5) — an interpretation, not a documented formula.
- `Mighty Yak`: `Speed` 300, `AttackRange` 120, `AttackSpeed` 2100, `NewTargetAttackDelay` 100, `WallMovementCost` 64, `DamageMultiplierTarget=Wall` with `DamageMultiplierPercent` 2000, `LeashLength` 581.
- Hero-death rage: `HeroDeathAbilityType=BoostSelf`, `HeroDeathAbilitySpell=TroopRage` at `HeroDeathAbilityLevel` 2 → spells `TroopRage` level 2: `BoostTimeMS` 8000, `SpeedBoost` 16, `DamageBoostPercent` 70.

**Mismatches / ambiguities**

- `Movement Speed`: wiki **20** vs client **Speed 300 (÷12.5 = 24)** — constant from the wiki's first statistics table
- `attackTiming`: wiki **first ram on stop, second after 1.6 s, then every 2.1 s** vs client **AttackSpeed 2100, NewTargetAttackDelay 100** — the 1.6 s second hit is not directly encoded
