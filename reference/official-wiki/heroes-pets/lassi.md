# L.A.S.S.I

- **Source:** https://clashofclans.fandom.com/wiki/L.A.S.S.I
- **Wiki revision:** 622251 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** pet
- **Client record:** `pets.csv` → `LASSI`

> Pet House 1 ground melee pet that stays close to its hero and jumps over Walls (High Jumper).

## Mechanics

- Levels 1–15 (wiki). Pet House level required by pet level: 1–10 → 1; 11–15 → 5.
- Per-level stats (level 1 → max): Damage per Second 160 → 400; Damage per Hit 144 → 360; Hitpoints 2,800 → 4,500.
- Upgrades use Dark Elixir in the Pet House: 1,190,000 DE and 59.5 days in total from level 1 to 15 (level 2: 20,000 DE).
- Behaviour: stays within about 2.5 tiles of its hero and attacks ground targets near the hero; melee single-target (0.6-tile range) every 0.9 s; wiki speed 32 (4 tiles/s).
- Special ability 'High Jumper': leaps over Walls to reach buildings and ground troops behind them.
- Available as soon as the Pet House finishes building; levels 11–15 need Pet House 5.

## Level caps (client `LaboratoryLevel` = Pet House level)

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Pet House 1 | 1–10 | 10 |
| Pet House 5 | 11–15 | 15 |

## Level table

Upgrade cost/time on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Damage per Second | Damage per Hit | Hitpoints | Upgrade Cost | Upgrade Time | Pet House Level Required |
|---|---|---|---|---|---|---|
| 1 | 160 | 144 | 2,800 | N/A | N/A | 1 |
| 2 | 170 | 153 | 2,900 | 20,000 | 1d | 1 |
| 3 | 180 | 162 | 3,000 | 30,000 | 1d 12h | 1 |
| 4 | 190 | 171 | 3,100 | 40,000 | 2d | 1 |
| 5 | 200 | 180 | 3,200 | 50,000 | 2d 12h | 1 |
| 6 | 210 | 189 | 3,300 | 60,000 | 3d | 1 |
| 7 | 220 | 198 | 3,400 | 70,000 | 3d 12h | 1 |
| 8 | 230 | 207 | 3,500 | 80,000 | 4d | 1 |
| 9 | 240 | 216 | 3,600 | 90,000 | 4d 12h | 1 |
| 10 | 260 | 234 | 3,700 | 100,000 | 5d | 1 |
| 11 | 290 | 261 | 3,850 | 110,000 | 5d 12h | 5 |
| 12 | 310 | 279 | 3,950 | 120,000 | 6d | 5 |
| 13 | 330 | 297 | 4,100 | 130,000 | 6d 12h | 5 |
| 14 | 360 | 324 | 4,300 | 140,000 | 7d | 5 |
| 15 | 400 | 360 | 4,500 | 150,000 | 7d 12h | 5 |

### Wiki constants (first statistics table)

| Field | Value |
|---|---|
| Preferred Target | Within 2.5 tiles of Hero |
| Targets | Ground |
| Attack Type | Single Target |
| Movement Speed | 32 |
| Attack Speed | 0.9s |
| Pet House Level Required | 1 |
| Range | 0.6 tiles |
| Special Ability | High Jumper |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Movement Speed `32` = client `Speed 400 (÷12.5 = 32)`
- Attack Speed `0.9s` = client `AttackSpeed 900 ms`
- Pet House Level Required `1` = client `LaboratoryLevel 1`
- Range `0.6 tiles` = client `AttackRange 60 (= 0.6 tiles)`
- `damagePerSecond` = `pets.DPS` (same value) (all 15 wiki rows)
- `damagePerHit` = client `DPS × AttackSpeed / 1000` (all 15 wiki rows)
- `hitpoints` = `pets.Hitpoints` (same value) (all 15 wiki rows)
- `upgradeCost` = client row N−1 `UpgradeCost` (the client stores the next upgrade on the current row) (all 15 wiki rows)
- `upgradeTimeSeconds` = client row N−1 `UpgradeTimeD/H/M` converted to seconds (next-upgrade convention) (all 15 wiki rows)
- `petHouseLevelRequired` = `pets.LaboratoryLevel` (same value) (all 15 wiki rows)

**Client columns and interpretation notes**

- `pets.csv` stores the next upgrade on each level row (`UpgradeCost`, `UpgradeTimeH`), exactly like heroes; `LaboratoryLevel` on row N is the Pet House level needed for level N; `HousingSpace` 20 for every pet.
- Following: the wiki's 'within X tiles of Hero' equals (`LeashLength` + `AttackRange`) ÷ 100 for the pets that list it (L.A.S.S.I 200+60 → 2.6 ≈ 2.5, Mighty Yak 581+120 → 7, Frosty 100+350 → 4.5, Spirit Fox 200+250 → 4.5) — an interpretation, not a documented formula.
- `LASSI`: `Speed` 400, `AttackRange` 60, `AttackSpeed` 900, `IsJumper=TRUE`, `LeashLength` 200, ground-only. `SpecialAbilities=BarkyPlaceholderAbility` is an info-screen placeholder (`IsPlaceholder=TRUE`).

**Mismatches / ambiguities**

- None found in the compared fields.
