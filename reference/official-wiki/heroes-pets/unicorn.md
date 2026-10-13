# Unicorn

- **Source:** https://clashofclans.fandom.com/wiki/Unicorn
- **Wiki revision:** 619842 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** pet
- **Client record:** `pets.csv` → `Unicorn`

> Pet House 4 healer pet that heals its hero (ground or air) every second at full rate.

## Mechanics

- Levels 1–15 (wiki). Pet House level required by pet level: 1–10 → 4; 11–15 → 11.
- Per-level stats (level 1 → max): Healing per Second 50 → 75; Healing per Pulse 50 → 75; Hitpoints 1,400 → 2,325.
- Upgrades use Dark Elixir in the Pet House: 2,290,000 DE and 77 days in total from level 1 to 15 (level 2: 50,000 DE).
- Behaviour: follows and heals its hero like a Healer, one target at a time, 2.5-tile range, a pulse every second; can heal both ground and air units.
- Heroes and non-heroes are healed at the same rate (no hero healing reduction).
- Unlike Healers, a battle does not end automatically when only the Unicorn remains.

## Level caps (client `LaboratoryLevel` = Pet House level)

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Pet House 4 | 1–10 | 10 |
| Pet House 11 | 11–15 | 15 |

## Level table

Upgrade cost/time on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Healing per Second | Healing per Pulse | Hitpoints | Upgrade Cost | Upgrade Time | Pet House Level Required |
|---|---|---|---|---|---|---|
| 1 | 50 | 50 | 1,400 | N/A | N/A | 4 |
| 2 | 53 | 53 | 1,450 | 50,000 | 1d 12h | 4 |
| 3 | 56 | 56 | 1,500 | 65,000 | 2d | 4 |
| 4 | 58 | 58 | 1,550 | 80,000 | 3d | 4 |
| 5 | 60 | 60 | 1,600 | 95,000 | 4d | 4 |
| 6 | 62 | 62 | 1,675 | 110,000 | 4d 12h | 4 |
| 7 | 64 | 64 | 1,725 | 125,000 | 5d | 4 |
| 8 | 66 | 66 | 1,800 | 140,000 | 5d 12h | 4 |
| 9 | 68 | 68 | 1,875 | 155,000 | 6d | 4 |
| 10 | 70 | 70 | 1,950 | 170,000 | 6d 12h | 4 |
| 11 | 71 | 71 | 2,025 | 200,000 | 7d | 11 |
| 12 | 72 | 72 | 2,100 | 230,000 | 8d | 11 |
| 13 | 73 | 73 | 2,175 | 260,000 | 8d | 11 |
| 14 | 74 | 74 | 2,250 | 290,000 | 8d | 11 |
| 15 | 75 | 75 | 2,325 | 320,000 | 8d | 11 |

### Wiki constants (first statistics table)

| Field | Value |
|---|---|
| Preferred Healing Target | Hero |
| Healing Targets | Ground and Air |
| Effect Type | Single Target |
| Movement Speed | 16 |
| Healing Speed | 1s |
| Pet House Level Required | 4 |
| Healing Range | 2.5 tiles |
| Special Ability | Personal Healer |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Movement Speed `16` = client `Speed 200 (÷12.5 = 16)`
- Healing Speed `1s` = client `AttackSpeed 1000 ms`
- Pet House Level Required `4` = client `LaboratoryLevel 4`
- Healing Range `2.5 tiles` = client `AttackRange 250 (= 2.5 tiles)`
- `healingPerSecond` = `pets.DPS` (negated client value) (all 15 wiki rows)
- `healingPerPulse` = client `DPS × AttackSpeed / 1000` (all 15 wiki rows)
- `hitpoints` = `pets.Hitpoints` (same value) (all 15 wiki rows)
- `upgradeCost` = client row N−1 `UpgradeCost` (the client stores the next upgrade on the current row) (all 15 wiki rows)
- `upgradeTimeSeconds` = client row N−1 `UpgradeTimeD/H/M` converted to seconds (next-upgrade convention) (all 15 wiki rows)
- `petHouseLevelRequired` = `pets.LaboratoryLevel` (same value) (all 15 wiki rows)

**Client columns and interpretation notes**

- `pets.csv` stores the next upgrade on each level row (`UpgradeCost`, `UpgradeTimeH`), exactly like heroes; `LaboratoryLevel` on row N is the Pet House level needed for level N; `HousingSpace` 20 for every pet.
- Following: the wiki's 'within X tiles of Hero' equals (`LeashLength` + `AttackRange`) ÷ 100 for the pets that list it (L.A.S.S.I 200+60 → 2.6 ≈ 2.5, Mighty Yak 581+120 → 7, Frosty 100+350 → 4.5, Spirit Fox 200+250 → 4.5) — an interpretation, not a documented formula.
- `Unicorn`: negative `DPS` −50 → −75 encodes healing, `AttackSpeed` 1000, `AttackRange` 250, `Projectile=UnicornHealEnergy`, `HeroDamageMultiplier` 100 (full effect on heroes), ground and air targets, `IsJumper=TRUE`, `LeashLength` 0, placeholder ability `UniponyPlaceholderAbility`.

**Mismatches / ambiguities**

- None found in the compared fields.
