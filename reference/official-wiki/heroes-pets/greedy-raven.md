# Greedy Raven

- **Source:** https://clashofclans.fandom.com/wiki/Greedy_Raven
- **Wiki revision:** 624123 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** pet
- **Client record:** `pets.csv` → `Crow`

> Pet House 12 flying pet that pelts resource buildings near its hero with rapid feathers for 5× damage.

## Mechanics

- Levels 1–10 (wiki). Pet House level required by pet level: 1–10 → 12.
- Per-level stats (level 1 → max): Damage per Second 110 → 155; Damage per Hit 46.2 → 65.1; DPS on Resource Buildings 550 → 775; Hitpoints 2,150 → 3,500.
- Upgrades use Dark Elixir in the Pet House: 3,060,000 DE and 72 days in total from level 1 to 10 (level 2: 260,000 DE).
- Behaviour: flies at a distance from its hero and throws feathers every 0.42 s from about 8 tiles, preferring Resource Buildings near the hero and dealing 5× damage to them (DPS on resources 550 → 775); hits ground and air; wiki speed 28.
- If its hero is knocked out or recalled it behaves like a normal troop that prioritises Resource Buildings.
- Client name `Crow`.

## Level caps (client `LaboratoryLevel` = Pet House level)

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Pet House 12 | 1–10 | 10 |

## Level table

Upgrade cost/time on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Damage per Second | Damage per Hit | DPS on Resource Buildings | Hitpoints | Upgrade Cost | Upgrade Time | Pet House Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 110 | 46.2 | 550 | 2,150 | N/A | N/A | 12 |
| 2 | 115 | 48.3 | 575 | 2,300 | 260,000 | 8d | 12 |
| 3 | 120 | 50.4 | 600 | 2,450 | 280,000 | 8d | 12 |
| 4 | 125 | 52.5 | 625 | 2,600 | 300,000 | 8d | 12 |
| 5 | 130 | 54.6 | 650 | 2,750 | 320,000 | 8d | 12 |
| 6 | 135 | 56.7 | 675 | 2,900 | 340,000 | 8d | 12 |
| 7 | 140 | 58.8 | 700 | 3,050 | 360,000 | 8d | 12 |
| 8 | 145 | 60.9 | 725 | 3,200 | 380,000 | 8d | 12 |
| 9 | 150 | 63 | 750 | 3,350 | 400,000 | 8d | 12 |
| 10 | 155 | 65.1 | 775 | 3,500 | 420,000 | 8d | 12 |

### Wiki constants (first statistics table)

| Field | Value |
|---|---|
| Preferred Target | Resources (Damage x5) |
| Targets | Ground & Air |
| Attack Type | Single Target |
| Movement Speed | 28 |
| Attack Speed | 0.42s |
| Pet House Level Required | 12 |
| Range | 8 tiles |
| Special Ability | Shine Sweep |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Movement Speed `28` = client `Speed 350 (÷12.5 = 28)`
- Attack Speed `0.42s` = client `AttackSpeed 420 ms`
- Pet House Level Required `12` = client `LaboratoryLevel 12`
- Range `8 tiles` = client `AttackRange 800 (= 8 tiles)`
- `damagePerSecond` = `pets.DPS` (same value) (all 10 wiki rows)
- `damagePerHit` = client `DPS × AttackSpeed / 1000` (all 10 wiki rows)
- `hitpoints` = `pets.Hitpoints` (same value) (all 10 wiki rows)
- `upgradeCost` = client row N−1 `UpgradeCost` (the client stores the next upgrade on the current row) (all 10 wiki rows)
- `upgradeTimeSeconds` = client row N−1 `UpgradeTimeD/H/M` converted to seconds (next-upgrade convention) (all 10 wiki rows)
- `petHouseLevelRequired` = `pets.LaboratoryLevel` (same value) (all 10 wiki rows)
- `dpsOnResourceBuildings`: = `DPS` × `PreferedTargetDamageMod` 5 (110 × 5 = 550 … 155 × 5 = 775) — all 10 levels match

**Client columns and interpretation notes**

- `pets.csv` stores the next upgrade on each level row (`UpgradeCost`, `UpgradeTimeH`), exactly like heroes; `LaboratoryLevel` on row N is the Pet House level needed for level N; `HousingSpace` 20 for every pet.
- Following: the wiki's 'within X tiles of Hero' equals (`LeashLength` + `AttackRange`) ÷ 100 for the pets that list it (L.A.S.S.I 200+60 → 2.6 ≈ 2.5, Mighty Yak 581+120 → 7, Frosty 100+350 → 4.5, Spirit Fox 200+250 → 4.5) — an interpretation, not a documented formula.
- `Crow`: `PreferedTargetBuildingClass=Resource`, `PreferedTargetDamageMod` 5, `AttackRange` 800, `AttackSpeed` 420, `Speed` 350, `IsFlying=TRUE`, `LeashLength` −100 (negative leash — keeps distance), `SpecialAbilities=CrowAbility` (placeholder).

**Mismatches / ambiguities**

- None found in the compared fields.
