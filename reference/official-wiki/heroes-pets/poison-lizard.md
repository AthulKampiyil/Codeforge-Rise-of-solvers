# Poison Lizard

- **Source:** https://clashofclans.fandom.com/wiki/Poison_Lizard
- **Wiki revision:** 621535 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** pet
- **Client record:** `pets.csv` → `Poison Lizard`

> Pet House 7 fast-spitting ranged pet that prefers heroes/troops and poisons them (slow, attack-rate cut, damage over time).

## Mechanics

- Levels 1–15 (wiki). Pet House level required by pet level: 1–10 → 7; 11–15 → 11.
- Per-level stats (level 1 → max): Damage per Second 181 → 335; Damage per Hit 63.35 → 117.25; Poison Max Damage per Second 80 → 140; Poison Speed Decrease 26% → 42%; Poison Attack Rate Decrease 35% → 55%; Hitpoints 1,400 → 2,300.
- Upgrades use Dark Elixir in the Pet House: 2,075,000 DE and 64 days in total from level 1 to 15 (level 2: 60,000 DE).
- Behaviour: ranged (4.5 tiles) single-target spit every 0.35 s at ground and air, preferring enemy heroes and troops; wiki speed 36; stays near its hero.
- Special ability 'Bad Breath': hits on heroes/troops poison them like a Poison Spell — movement −26% → −42%, attack rate −35% → −55% and poison damage up to 80 → 140 per second. Spitting at buildings applies neither slow nor poison.

## Level caps (client `LaboratoryLevel` = Pet House level)

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Pet House 7 | 1–10 | 10 |
| Pet House 11 | 11–15 | 15 |

## Level table

Upgrade cost/time on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Damage per Second | Damage per Hit | Poison Max Damage per Second | Poison Speed Decrease | Poison Attack Rate Decrease | Hitpoints | Upgrade Cost | Upgrade Time | Pet House Level Required |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 181 | 63.35 | 80 | 26% | 35% | 1,400 | N/A | N/A | 7 |
| 2 | 192 | 67.2 | 80 | 26% | 35% | 1,450 | 60,000 | 1d | 7 |
| 3 | 203 | 71.05 | 80 | 26% | 35% | 1,500 | 75,000 | 1d 12h | 7 |
| 4 | 214 | 74.9 | 80 | 26% | 35% | 1,550 | 90,000 | 2d | 7 |
| 5 | 225 | 78.75 | 100 | 34% | 45% | 1,600 | 100,000 | 2d 12h | 7 |
| 6 | 236 | 82.6 | 100 | 34% | 45% | 1,650 | 110,000 | 3d | 7 |
| 7 | 247 | 86.45 | 100 | 34% | 45% | 1,700 | 120,000 | 3d 12h | 7 |
| 8 | 258 | 90.3 | 100 | 34% | 45% | 1,800 | 130,000 | 4d | 7 |
| 9 | 269 | 94.15 | 100 | 34% | 45% | 1,900 | 140,000 | 4d 12h | 7 |
| 10 | 280 | 98 | 120 | 38% | 50% | 2,050 | 150,000 | 5d | 7 |
| 11 | 291 | 101.85 | 120 | 38% | 50% | 2,100 | 180,000 | 6d | 11 |
| 12 | 302 | 105.7 | 120 | 38% | 50% | 2,150 | 200,000 | 7d | 11 |
| 13 | 313 | 109.55 | 120 | 38% | 50% | 2,200 | 220,000 | 8d | 11 |
| 14 | 324 | 113.4 | 120 | 38% | 50% | 2,250 | 240,000 | 8d | 11 |
| 15 | 335 | 117.25 | 140 | 42% | 55% | 2,300 | 260,000 | 8d | 11 |

### Wiki constants (first statistics table)

| Field | Value |
|---|---|
| Preferred Target | Heroes and Troops |
| Targets | Ground & Air |
| Attack Type | Single Target |
| Movement Speed | 36 |
| Attack Speed | 0.35s |
| Pet House Level Required | 7 |
| Range | 4.5 tiles |
| Special Ability | Bad Breath |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Movement Speed `36` = client `Speed 450 (÷12.5 = 36)`
- Attack Speed `0.35s` = client `AttackSpeed 350 ms`
- Pet House Level Required `7` = client `LaboratoryLevel 7`
- Range `4.5 tiles` = client `AttackRange 450 (= 4.5 tiles)`
- `damagePerSecond` = `pets.DPS` (same value) (all 15 wiki rows)
- `damagePerHit` = client `DPS × AttackSpeed / 1000` (all 15 wiki rows)
- `poisonMaxDamagePerSecond` = `SpecialAbilities:special_abilities[LizardPetPoison] → PoisonOnHitSpell:spells[PoisonLizardAttack].PoisonDPS` (same value) (all 15 wiki rows)
- `poisonSpeedDecreasePercent` = `SpecialAbilities:special_abilities[LizardPetPoison] → PoisonOnHitSpell:spells[PoisonLizardAttack].SpeedBoost` (negated client value) (all 15 wiki rows)
- `poisonAttackRateDecreasePercent` = `SpecialAbilities:special_abilities[LizardPetPoison] → PoisonOnHitSpell:spells[PoisonLizardAttack].AttackSpeedBoost` (negated client value) (all 15 wiki rows)
- `hitpoints` = `pets.Hitpoints` (same value) (all 15 wiki rows)
- `upgradeCost` = client row N−1 `UpgradeCost` (the client stores the next upgrade on the current row) (all 15 wiki rows)
- `upgradeTimeSeconds` = client row N−1 `UpgradeTimeD/H/M` converted to seconds (next-upgrade convention) (all 15 wiki rows)
- `petHouseLevelRequired` = `pets.LaboratoryLevel` (same value) (all 15 wiki rows)

**Client columns and interpretation notes**

- `pets.csv` stores the next upgrade on each level row (`UpgradeCost`, `UpgradeTimeH`), exactly like heroes; `LaboratoryLevel` on row N is the Pet House level needed for level N; `HousingSpace` 20 for every pet.
- Following: the wiki's 'within X tiles of Hero' equals (`LeashLength` + `AttackRange`) ÷ 100 for the pets that list it (L.A.S.S.I 200+60 → 2.6 ≈ 2.5, Mighty Yak 581+120 → 7, Frosty 100+350 → 4.5, Spirit Fox 200+250 → 4.5) — an interpretation, not a documented formula.
- `Poison Lizard`: `Speed` 450, `AttackRange` 450, `AttackSpeed` 350, `PreferHeroes=TRUE`, `PreferMasterTarget=TRUE`, `TriggersTraps=FALSE`, `LeashLength` 400, `HeroDamageMultiplier` 100.
- `special_abilities[LizardPetPoison]` (`PoisonOnHitDuration` 3000) → `spells[PoisonLizardAttack]` levels 1–4 (pet levels 1–4/5–9/10–14/15): `PoisonDPS` 80/100/120/140, `SpeedBoost` −26/−34/−38/−42, `AttackSpeedBoost` −35/−45/−50/−55, `BoostTimeMS` 500, `TimeBetweenHitsMS` 400, `PoisonIncreaseSlowly=FALSE`, `BoostLinkedToPoison`, building immunities.

**Mismatches / ambiguities**

- `trapTrigger`: wiki **not stated** vs client **TriggersTraps FALSE** — client: the Lizard does not trigger traps
