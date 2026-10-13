# Electro Owl

- **Source:** https://clashofclans.fandom.com/wiki/Electro_Owl
- **Wiki revision:** 620659 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** pet
- **Client record:** `pets.csv` → `Electro Owl`

> Pet House 2 flying pet that shoots chain lightning (two targets, −20% on the second) at its hero's target.

## Mechanics

- Levels 1–15 (wiki). Pet House level required by pet level: 1–10 → 2; 11–15 → 9.
- Per-level stats (level 1 → max): Damage per Second (Primary Target) 100 → 170; Damage per Hit (Primary Target) 140 → 238; Hitpoints 1,600 → 3,000.
- Upgrades use Dark Elixir in the Pet House: 1,785,000 DE and 77 days in total from level 1 to 15 (level 2: 30,000 DE).
- Behaviour: flies with its hero and attacks the hero's target at range (wiki 6 tiles) every 1.4 s, hitting ground and air; wiki speed 20.
- Special ability 'High Voltage': the lightning chains to one additional target, which takes 80% of the primary damage.
- Cannot trigger traps itself but is damaged if another unit triggers them.

## Level caps (client `LaboratoryLevel` = Pet House level)

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Pet House 2 | 1–10 | 10 |
| Pet House 9 | 11–15 | 15 |

## Level table

Upgrade cost/time on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Damage per Second (Primary Target) | Damage per Hit (Primary Target) | Hitpoints | Upgrade Cost | Upgrade Time | Pet House Level Required |
|---|---|---|---|---|---|---|
| 1 | 100 | 140 | 1,600 | N/A | N/A | 2 |
| 2 | 105 | 147 | 1,700 | 30,000 | 1d 12h | 2 |
| 3 | 110 | 154 | 1,800 | 45,000 | 2d | 2 |
| 4 | 115 | 161 | 1,900 | 60,000 | 3d | 2 |
| 5 | 120 | 168 | 2,000 | 75,000 | 4d | 2 |
| 6 | 125 | 175 | 2,100 | 90,000 | 4d 12h | 2 |
| 7 | 130 | 182 | 2,200 | 105,000 | 5d | 2 |
| 8 | 135 | 189 | 2,300 | 120,000 | 5d 12h | 2 |
| 9 | 140 | 196 | 2,400 | 135,000 | 6d | 2 |
| 10 | 145 | 203 | 2,500 | 150,000 | 6d 12h | 2 |
| 11 | 150 | 210 | 2,600 | 165,000 | 7d | 9 |
| 12 | 155 | 217 | 2,700 | 180,000 | 8d | 9 |
| 13 | 160 | 224 | 2,800 | 195,000 | 8d | 9 |
| 14 | 165 | 231 | 2,900 | 210,000 | 8d | 9 |
| 15 | 170 | 238 | 3,000 | 225,000 | 8d | 9 |

### Wiki constants (first statistics table)

| Field | Value |
|---|---|
| Preferred Target | Hero's Target |
| Attack Type | Ranged (Ground and Air); Chain Lightning |
| Number of Targets | 2 |
| Chain Damage Decay | -20% |
| Movement Speed | 20 |
| Attack Speed | 1.4s |
| Pet House Level Required | 2 |
| Range | 6 tiles |
| Special Ability | High Voltage |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Movement Speed `20` = client `Speed 250 (÷12.5 = 20)`
- Attack Speed `1.4s` = client `AttackSpeed 1400 ms`
- Pet House Level Required `2` = client `LaboratoryLevel 2`
- `damagePerSecondPrimaryTarget` = `pets.DPS` (same value) (all 15 wiki rows)
- `damagePerHitPrimaryTarget` = client `DPS × AttackSpeed / 1000` (all 15 wiki rows)
- `hitpoints` = `pets.Hitpoints` (same value) (all 15 wiki rows)
- `upgradeCost` = client row N−1 `UpgradeCost` (the client stores the next upgrade on the current row) (all 15 wiki rows)
- `upgradeTimeSeconds` = client row N−1 `UpgradeTimeD/H/M` converted to seconds (next-upgrade convention) (all 15 wiki rows)
- `petHouseLevelRequired` = `pets.LaboratoryLevel` (same value) (all 15 wiki rows)

**Client columns and interpretation notes**

- `pets.csv` stores the next upgrade on each level row (`UpgradeCost`, `UpgradeTimeH`), exactly like heroes; `LaboratoryLevel` on row N is the Pet House level needed for level N; `HousingSpace` 20 for every pet.
- Following: the wiki's 'within X tiles of Hero' equals (`LeashLength` + `AttackRange`) ÷ 100 for the pets that list it (L.A.S.S.I 200+60 → 2.6 ≈ 2.5, Mighty Yak 581+120 → 7, Frosty 100+350 → 4.5, Spirit Fox 200+250 → 4.5) — an interpretation, not a documented formula.
- `Electro Owl`: `IsFlying=TRUE`, `TriggersTraps=FALSE`, `AttackRange` 550, `AttackSpeed` 1400, `Speed` 250, `ChainAttackDepth` 2, `ChainAttackDistance` 300, `ChainAttackDamageReductionPercent` 20, `ChainAttackDelay` 128, `LeashLength` 0, `MovementOffsetSpeed` 30.

**Mismatches / ambiguities**

- `Range`: wiki **6 tiles** vs client **AttackRange 550 (= 5.5 tiles)** — constant from the wiki's first statistics table
