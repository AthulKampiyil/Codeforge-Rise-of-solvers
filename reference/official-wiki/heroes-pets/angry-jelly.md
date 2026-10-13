# Angry Jelly

- **Source:** https://clashofclans.fandom.com/wiki/Angry_Jelly
- **Wiki revision:** 623397 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** pet
- **Client record:** `pets.csv` → `Angry Jelly`

> Pet House 10 flying pet that brainwashes its hero into defense-targeting for 25 → 35 s while riding above it untargetable.

## Mechanics

- Levels 1–10 (wiki). Pet House level required by pet level: 1–10 → 10.
- Per-level stats (level 1 → max): Damage per Second 112 → 193; Damage per Hit 84 → 144.75; Brainwash Duration 25 s → 35 s; Hitpoints 1,450 → 2,125.
- Upgrades use Dark Elixir in the Pet House: 1,710,000 DE and 57 days in total from level 1 to 10 (level 2: 150,000 DE).
- Special ability 'Brainwash': on deployment its hero is brainwashed for 25 s (levels 1–4), 30 s (5–9) or 35 s (10), or until the hero dies. The hero then prioritises defenses and counter-attacks defending troops/heroes that hit it (Royal Champion-style targeting). Magic Mirror clones are not affected.
- While brainwashing, the Jelly floats attached above the hero (keeping pace even with fast heroes), is untargetable by defenses and traps, and shoots defenses in range.
- Afterwards it detaches and behaves as a normal ranged air unit (vulnerable to Seeking Air Mines), but still targets defenses that are attacking its hero.
- Combat: single target ground and air, attack every 0.75 s, wiki range 1.5 tiles, wiki speed 16. Its flying does not cancel the Dragon Duke's Royal Rampage when paired with him.

## Level caps (client `LaboratoryLevel` = Pet House level)

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Pet House 10 | 1–10 | 10 |

## Level table

Upgrade cost/time on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Damage per Second | Damage per Hit | Brainwash Duration | Hitpoints | Upgrade Cost | Upgrade Time | Pet House Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 112 | 84 | 25s | 1,450 | N/A | N/A | 10 |
| 2 | 121 | 90.75 | 25s | 1,525 | 150,000 | 3d | 10 |
| 3 | 130 | 97.5 | 25s | 1,600 | 160,000 | 4d | 10 |
| 4 | 139 | 104.25 | 25s | 1,675 | 170,000 | 5d | 10 |
| 5 | 148 | 111 | 30s | 1,750 | 180,000 | 6d | 10 |
| 6 | 157 | 117.75 | 30s | 1,825 | 190,000 | 7d | 10 |
| 7 | 166 | 124.5 | 30s | 1,900 | 200,000 | 8d | 10 |
| 8 | 175 | 131.25 | 30s | 1,975 | 210,000 | 8d | 10 |
| 9 | 184 | 138 | 30s | 2,050 | 220,000 | 8d | 10 |
| 10 | 193 | 144.75 | 35s | 2,125 | 230,000 | 8d | 10 |

### Wiki constants (first statistics table)

| Field | Value |
|---|---|
| Preferred Target | Hero's Target |
| Targets | Ground & Air |
| Attack Type | Single Target |
| Movement Speed | 16 |
| Attack Speed | 0.75s |
| Pet House Level Required | 10 |
| Range | 1.5 tiles |
| Special Ability | Brainwash |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Movement Speed `16` = client `Speed 200 (÷12.5 = 16)`
- Attack Speed `0.75s` = client `AttackSpeed 750 ms`
- Pet House Level Required `10` = client `LaboratoryLevel 10`
- `damagePerSecond` = `pets.DPS` (same value) (all 10 wiki rows)
- `damagePerHit` = client `DPS × AttackSpeed / 1000` (all 10 wiki rows)
- `brainwashDurationSeconds` = `SpecialAbilities:special_abilities[AngryJellyAbility].DeactivateAfterTime` (client milliseconds ÷ 1000) (all 10 wiki rows)
- `hitpoints` = `pets.Hitpoints` (same value) (all 10 wiki rows)
- `upgradeCost` = client row N−1 `UpgradeCost` (the client stores the next upgrade on the current row) (all 10 wiki rows)
- `upgradeTimeSeconds` = client row N−1 `UpgradeTimeD/H/M` converted to seconds (next-upgrade convention) (all 10 wiki rows)
- `petHouseLevelRequired` = `pets.LaboratoryLevel` (same value) (all 10 wiki rows)

**Client columns and interpretation notes**

- `pets.csv` stores the next upgrade on each level row (`UpgradeCost`, `UpgradeTimeH`), exactly like heroes; `LaboratoryLevel` on row N is the Pet House level needed for level N; `HousingSpace` 20 for every pet.
- Following: the wiki's 'within X tiles of Hero' equals (`LeashLength` + `AttackRange`) ÷ 100 for the pets that list it (L.A.S.S.I 200+60 → 2.6 ≈ 2.5, Mighty Yak 581+120 → 7, Frosty 100+350 → 4.5, Spirit Fox 200+250 → 4.5) — an interpretation, not a documented formula.
- `special_abilities[AngryJellyAbility]`: `AttachToMaster`, `Untargetable`, `ShieldProtectionPercent` 100, `AttackRange` 700 during the ability, `DeactivateAfterTime` 25000/30000/35000, `DeactivateAfterMasterDies`, `GiveAbilityToMaster=TRUE` → `AngryJellyGivenMaster` (`PreferedTargetBuildingClass=Defense`, `FightWithGroups=FALSE`, same durations).
- `Angry Jelly`: `IsFlying=TRUE`, `AttackRange` 500, `AttackSpeed` 750, `PreferedTargetBuildingClass=Defense`, `LeashLength` 400, `Speed` 200.

**Mismatches / ambiguities**

- `Range`: wiki **1.5 tiles** vs client **AttackRange 500 (= 5 tiles)** — constant from the wiki's first statistics table
