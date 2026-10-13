# Phoenix

- **Source:** https://clashofclans.fandom.com/wiki/Phoenix
- **Wiki revision:** 625128 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** pet
- **Client record:** `pets.csv` → `Phoenix`

> Pet House 8 pet that waits as an invulnerable egg, revives its hero once with 6.5 → 8.5 s of invincibility, then fights as a splash-damage air unit.

## Mechanics

- Levels 1–10 (wiki). Pet House level required by pet level: 1–10 → 8.
- Per-level stats (level 1 → max): Damage per Second 178 → 250; Damage per Hit 178 → 250; Revive Duration 6.5 s → 8.5 s; Hitpoints 3,120 → 4,200.
- Upgrades use Dark Elixir in the Pet House: 1,245,000 DE and 38 days in total from level 1 to 10 (level 2: 80,000 DE).
- Deployment: begins as an egg that cannot be targeted or damaged and does nothing (the wiki says it can still trigger air traps).
- Special ability 'Fiery Finale': the first time its hero is knocked out the egg hatches and revives the hero; hero and Phoenix are invincible for 6.5 s (levels 1–4), 7.5 s (5–9) or 8.5 s (10). When the period ends the hero falls again even if undamaged, and the hero cannot be healed meanwhile.
- An unused hero ability can be activated during the revival but gives no recovery then; an ability already running continues. With auto-ability on KO enabled, the ability fires before the revival.
- After hatching she attacks her hero's target as an air unit with small area splash, 2.5-tile range, 1 attack per second, wiki speed 16.

## Level caps (client `LaboratoryLevel` = Pet House level)

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Pet House 8 | 1–10 | 10 |

## Level table

Upgrade cost/time on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Damage per Second | Damage per Hit | Revive Duration | Hitpoints | Upgrade Cost | Upgrade Time | Pet House Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 178 | 178 | 6.5s | 3,120 | N/A | N/A | 8 |
| 2 | 186 | 186 | 6.5s | 3,240 | 80,000 | 1d 12h | 8 |
| 3 | 194 | 194 | 6.5s | 3,360 | 95,000 | 2d | 8 |
| 4 | 202 | 202 | 6.5s | 3,480 | 110,000 | 3d | 8 |
| 5 | 210 | 210 | 7.5s | 3,600 | 125,000 | 4d | 8 |
| 6 | 218 | 218 | 7.5s | 3,720 | 140,000 | 4d 12h | 8 |
| 7 | 226 | 226 | 7.5s | 3,840 | 155,000 | 5d | 8 |
| 8 | 234 | 234 | 7.5s | 3,960 | 170,000 | 5d 12h | 8 |
| 9 | 242 | 242 | 7.5s | 4,080 | 180,000 | 6d | 8 |
| 10 | 250 | 250 | 8.5s | 4,200 | 190,000 | 6d 12h | 8 |

### Wiki constants (first statistics table)

| Field | Value |
|---|---|
| Preferred Target | Hero's Target |
| Targets | Ground & Air |
| Attack Type | Area Splash |
| Movement Speed | 16 |
| Attack Speed | 1s |
| Pet House Level Required | 8 |
| Range | 2.5 tiles |
| Special Ability | Fiery Finale |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Movement Speed `16` = client `Speed 200 (÷12.5 = 16)`
- Attack Speed `1s` = client `AttackSpeed 1000 ms`
- Pet House Level Required `8` = client `LaboratoryLevel 8`
- Range `2.5 tiles` = client `AttackRange 250 (= 2.5 tiles)`
- `damagePerSecond` = `pets.DPS` (same value) (all 10 wiki rows)
- `damagePerHit` = client `DPS × AttackSpeed / 1000` (all 10 wiki rows)
- `reviveDurationSeconds` = `SpecialAbilities:special_abilities[PhoenixSpawnAbility].DeactivateAfterTime` (client milliseconds ÷ 1000) (all 10 wiki rows)
- `hitpoints` = `pets.Hitpoints` (same value) (all 10 wiki rows)
- `upgradeCost` = client row N−1 `UpgradeCost` (the client stores the next upgrade on the current row) (all 10 wiki rows)
- `upgradeTimeSeconds` = client row N−1 `UpgradeTimeD/H/M` converted to seconds (next-upgrade convention) (all 10 wiki rows)
- `petHouseLevelRequired` = `pets.LaboratoryLevel` (same value) (all 10 wiki rows)

**Client columns and interpretation notes**

- `pets.csv` stores the next upgrade on each level row (`UpgradeCost`, `UpgradeTimeH`), exactly like heroes; `LaboratoryLevel` on row N is the Pet House level needed for level N; `HousingSpace` 20 for every pet.
- Following: the wiki's 'within X tiles of Hero' equals (`LeashLength` + `AttackRange`) ÷ 100 for the pets that list it (L.A.S.S.I 200+60 → 2.6 ≈ 2.5, Mighty Yak 581+120 → 7, Frosty 100+350 → 4.5, Spirit Fox 200+250 → 4.5) — an interpretation, not a documented formula.
- `Phoenix`: `SpecialAbilities` `PhoenixSpawnAbility;SpawnPhoenixEggAbility`. `SpawnPhoenixEggAbility` spawns troop `Phoenix Egg` on placement; `PhoenixSpawnAbility` has `ActiveOnMasterDeath=TRUE`, `ShieldProtectionPercent` 100, `DeactivateAfterTime` 6500/7500/8500. `DamageRadius` 30, `PreferMasterTarget`, `SummonsInheritMaster`, `SpawnDelay` 400000.
- `pets[Phoenix Egg]`: `HeroDeathAbilityType=ResurrectHero`, `HeroDeathAbilitySpell=TroopImmortality`, `SpecialAbilities=PhoenixEggInvulnerableAbility`, `Hitpoints` 8000, `IsFlying=FALSE`, `TriggersTraps=FALSE`, `RecallWithMaster=TRUE`.

**Mismatches / ambiguities**

- `eggTriggersTraps`: wiki **egg can trigger aerial traps** vs client **Phoenix Egg TriggersTraps FALSE, IsFlying FALSE** — trap trigger may come from another rule; verify
