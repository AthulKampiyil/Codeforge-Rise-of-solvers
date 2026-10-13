# Diggy

- **Source:** https://clashofclans.fandom.com/wiki/Diggy
- **Wiki revision:** 625147 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** pet
- **Client record:** `pets.csv` → `Diggy`

> Pet House 6 burrowing pet that bypasses Walls and stuns defenses when it surfaces next to them.

## Mechanics

- Levels 1–15 (wiki). Pet House level required by pet level: 1–10 → 6; 11–15 → 12.
- Per-level stats (level 1 → max): Damage per Second 105 → 175; Damage per Hit 115.5 → 192.5; Stun Duration 2 s → 3.5 s; Hitpoints 3,650 → 5,750.
- Upgrades use Dark Elixir in the Pet House: 2,655,000 DE and 76.5 days in total from level 1 to 15 (level 2: 90,000 DE).
- Behaviour: travels underground like a Miner (bypasses Walls, but attacks a Wall if its hero does), attacks its hero's target, ground only, melee 0.8 tiles every 1.1 s; wiki speed 32.
- Special ability 'Stunning Surprise': when it surfaces at a defensive building (including an activated Town Hall weapon) it stuns that defense for 2 s at level 1 up to 3.5 s at level 15; defending troops and heroes are not stunned.
- The wiki lists 15 levels (levels 11–15 at Pet House 12); the decoded client has only 10.

## Level caps (client `LaboratoryLevel` = Pet House level)

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Pet House 6 | 1–10 | 10 |

## Level table

Upgrade cost/time on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Damage per Second | Damage per Hit | Stun Duration | Hitpoints | Upgrade Cost | Upgrade Time | Pet House Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 105 | 115.5 | 2s | 3,650 | N/A | N/A | 6 |
| 2 | 110 | 121 | 2s | 3,800 | 90,000 | 1d 12h | 6 |
| 3 | 115 | 126.5 | 2s | 3,950 | 105,000 | 2d | 6 |
| 4 | 120 | 132 | 2s | 4,100 | 120,000 | 3d | 6 |
| 5 | 125 | 137.5 | 2.5s | 4,250 | 130,000 | 4d | 6 |
| 6 | 130 | 143 | 2.5s | 4,400 | 140,000 | 4d 12h | 6 |
| 7 | 135 | 148.5 | 2.5s | 4,550 | 150,000 | 5d | 6 |
| 8 | 140 | 154 | 2.5s | 4,700 | 160,000 | 5d 12h | 6 |
| 9 | 145 | 159.5 | 2.5s | 4,850 | 170,000 | 6d | 6 |
| 10 | 150 | 165 | 3s | 5,000 | 180,000 | 6d 12h | 6 |
| 11 | 155 | 170.5 | 3s | 5,150 | 220,000 | 7d | 12 |
| 12 | 160 | 176 | 3s | 5,300 | 250,000 | 7d 12h | 12 |
| 13 | 165 | 181.5 | 3s | 5,450 | 280,000 | 8d | 12 |
| 14 | 170 | 187 | 3s | 5,600 | 310,000 | 8d | 12 |
| 15 | 175 | 192.5 | 3.5s | 5,750 | 350,000 | 8d | 12 |

### Wiki constants (first statistics table)

| Field | Value |
|---|---|
| Preferred Target | Hero's Target |
| Targets | Ground |
| Attack Type | Single Target |
| Movement Speed | 32 |
| Attack Speed | 1.1s |
| Pet House Level Required | 6 |
| Range | 0.8 tiles |
| Special Ability | Stunning Surprise |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Movement Speed `32` = client `Speed 400 (÷12.5 = 32)`
- Attack Speed `1.1s` = client `AttackSpeed 1100 ms`
- Pet House Level Required `6` = client `LaboratoryLevel 6`
- Range `0.8 tiles` = client `AttackRange 80 (= 0.8 tiles)`
- `damagePerSecond` = `pets.DPS` (same value) (all 15 wiki rows)
- `damagePerHit` = client `DPS × AttackSpeed / 1000` (all 15 wiki rows)
- `stunDurationSeconds` = `SpecialAbilities:special_abilities[DiggyStunOnSurface].StunTargetOnActivateTime` (client milliseconds ÷ 1000) (all 15 wiki rows)
- `hitpoints` = `pets.Hitpoints` (same value) (all 15 wiki rows)
- `upgradeCost` = client row N−1 `UpgradeCost` (the client stores the next upgrade on the current row) (all 15 wiki rows)
- `upgradeTimeSeconds` = client row N−1 `UpgradeTimeD/H/M` converted to seconds (next-upgrade convention) (all 15 wiki rows)
- `petHouseLevelRequired` = `pets.LaboratoryLevel` (same value) (all 15 wiki rows)

**Client columns and interpretation notes**

- `pets.csv` stores the next upgrade on each level row (`UpgradeCost`, `UpgradeTimeH`), exactly like heroes; `LaboratoryLevel` on row N is the Pet House level needed for level N; `HousingSpace` 20 for every pet.
- Following: the wiki's 'within X tiles of Hero' equals (`LeashLength` + `AttackRange`) ÷ 100 for the pets that list it (L.A.S.S.I 200+60 → 2.6 ≈ 2.5, Mighty Yak 581+120 → 7, Frosty 100+350 → 4.5, Spirit Fox 200+250 → 4.5) — an interpretation, not a documented formula.
- `Diggy`: `IsUnderground=TRUE`, `PreferMasterTarget=TRUE`, `AttackRange` 80, `AttackSpeed` 1100, `Speed` 400, `LeashLength` 0, `SpecialAbilities=DiggyStunOnSurface` (`ActiveOnBecomingTargetable=TRUE`, `StunTargetOnActivateTime` 2000/2500/3000 at `SpecialAbilitiesLevel` 1–4/5–9/10, `MaxActivations` 9999).
- `HeroDeathAbilityType=SwitchHero` (after its hero falls it presumably follows another hero) — not described on the wiki.

**Mismatches / ambiguities**

- `levels 11–15` (level 11–15): wiki **DPS 155 → 175, HP 5,150 → 5,750, stun 3 s (11–14) / 3.5 s (15), costs 220,000 → 350,000 DE, Pet House 12** vs client **absent (10 rows; max stun tier 3 s)** — wiki reflects a newer balance update than client 18.400.21
