# Spirit Fox

- **Source:** https://clashofclans.fandom.com/wiki/Spirit_Fox
- **Wiki revision:** 620669 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** pet
- **Client record:** `pets.csv` → `Spirit Fox`

> Pet House 9 ground pet that repeatedly turns itself and its hero invisible (3 → 4 s, then a 6 s gap).

## Mechanics

- Levels 1–10 (wiki). Pet House level required by pet level: 1–10 → 9.
- Per-level stats (level 1 → max): Damage per Second 108 → 180; Damage per Hit 172.8 → 288; Invisibility Duration 3 s → 4 s; Hitpoints 1,900 → 2,800.
- Upgrades use Dark Elixir in the Pet House: 1,710,000 DE and 52.5 days in total from level 1 to 10 (level 2: 150,000 DE).
- Special ability 'Spirit Walk': on deployment the Spirit Fox and its hero become invisible for 3 s (levels 1–4), 3.5 s (5–9) or 4 s (10); after a 6-second cooldown the invisibility is applied again, for the rest of the battle.
- Invisibility is only granted while the fox is on the field (not while recalled); if its hero is knocked out or recalled, only the fox turns invisible. Attack-speed effects do not change the cooldown.
- Combat: ground only, 2.5-tile range, attacks every 1.6 s, stays within about 4.5 tiles of its hero; wiki speed 24.

## Level caps (client `LaboratoryLevel` = Pet House level)

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Pet House 9 | 1–10 | 10 |

## Level table

Upgrade cost/time on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Damage per Second | Damage per Hit | Invisibility Duration | Hitpoints | Upgrade Cost | Upgrade Time | Pet House Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 108 | 172.8 | 3s | 1,900 | N/A | N/A | 9 |
| 2 | 116 | 185.6 | 3s | 2,000 | 150,000 | 3d | 9 |
| 3 | 124 | 198.4 | 3s | 2,100 | 160,000 | 4d | 9 |
| 4 | 132 | 211.2 | 3s | 2,200 | 170,000 | 5d | 9 |
| 5 | 140 | 224 | 3.5s | 2,300 | 180,000 | 5d 12h | 9 |
| 6 | 148 | 236.8 | 3.5s | 2,400 | 190,000 | 6d | 9 |
| 7 | 156 | 249.6 | 3.5s | 2,500 | 200,000 | 6d 12h | 9 |
| 8 | 164 | 262.4 | 3.5s | 2,600 | 210,000 | 7d | 9 |
| 9 | 172 | 275.6 | 3.5s | 2,700 | 220,000 | 7d 12h | 9 |
| 10 | 180 | 288 | 4s | 2,800 | 230,000 | 8d | 9 |

### Wiki constants (first statistics table)

| Field | Value |
|---|---|
| Preferred Target | Within 4.5 tiles of Hero |
| Targets | Ground |
| Attack Type | Single Target |
| Movement Speed | 24 |
| Attack Speed | 1.6s |
| Pet House Level Required | 9 |
| Range | 2.5 tiles |
| Special Ability | Spirit Walk |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Movement Speed `24` = client `Speed 300 (÷12.5 = 24)`
- Attack Speed `1.6s` = client `AttackSpeed 1600 ms`
- Pet House Level Required `9` = client `LaboratoryLevel 9`
- Range `2.5 tiles` = client `AttackRange 250 (= 2.5 tiles)`
- `damagePerSecond` = `pets.DPS` (same value) (all 10 wiki rows)
- `damagePerHit` = client `DPS × AttackSpeed / 1000` (all 10 wiki rows)
- `invisibilityDurationSeconds` = `SpecialAbilities:special_abilities[PhaseFennecInvis].DeactivateAfterTime` (client milliseconds ÷ 1000) (all 10 wiki rows)
- `hitpoints` = `pets.Hitpoints` (same value) (all 10 wiki rows)
- `upgradeCost` = client row N−1 `UpgradeCost` (the client stores the next upgrade on the current row) (all 10 wiki rows)
- `upgradeTimeSeconds` = client row N−1 `UpgradeTimeD/H/M` converted to seconds (next-upgrade convention) (all 10 wiki rows)
- `petHouseLevelRequired` = `pets.LaboratoryLevel` (same value) (all 10 wiki rows)
- `cooldown (6 s)`: `ActivationCooldown` − `DeactivateAfterTime` = 6000 ms at every tier

**Client columns and interpretation notes**

- `pets.csv` stores the next upgrade on each level row (`UpgradeCost`, `UpgradeTimeH`), exactly like heroes; `LaboratoryLevel` on row N is the Pet House level needed for level N; `HousingSpace` 20 for every pet.
- Following: the wiki's 'within X tiles of Hero' equals (`LeashLength` + `AttackRange`) ÷ 100 for the pets that list it (L.A.S.S.I 200+60 → 2.6 ≈ 2.5, Mighty Yak 581+120 → 7, Frosty 100+350 → 4.5, Spirit Fox 200+250 → 4.5) — an interpretation, not a documented formula.
- `special_abilities[PhaseFennecInvis]`: `IsInvisible=TRUE`, `DeactivateAfterTime` 3000/3500/4000, `ActivationCooldown` 9000/9500/10000 (measured from activation start, giving the 6 s gap), `GiveAbilityToMaster=TRUE` → `PhaseFennecInvisGivenMaster` (`IsInvisible`, same durations).
- `Spirit Fox`: `AttackRange` 250, `AttackSpeed` 1600, `Speed` 300, `LeashLength` 200, ground only, `IsJumper=TRUE`.

**Mismatches / ambiguities**

- None found in the compared fields.
