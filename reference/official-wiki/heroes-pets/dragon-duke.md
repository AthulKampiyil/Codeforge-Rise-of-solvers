# Dragon Duke

- **Source:** https://clashofclans.fandom.com/wiki/Dragon_Duke
- **Wiki revision:** 625035 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** hero
- **Client record:** `heroes.csv` → `Dragon Duke`

> Flying melee hero unlocked at Hero Hall 9 (TH15) with the Royal Rampage passive (double damage, +50% attack speed when no other air units are within 6 tiles); upgrades to level 25.

## Mechanics

- Unlock: Hero Hall 9 (TH15). Level caps: HH9/TH15 → 10, HH10/TH16 → 15, HH11/TH17 → 20, HH12/TH18 → 25. Dark Elixir upgrades with a Builder.
- Combat: air unit attacking any target at melee range every 1.2 s; wiki speed 20 (2.5 tiles/s); search radius 10 tiles; very high base hitpoints (9,100 → 10,900) and recovery (3,500 → 4,750 in five-level tiers).
- Royal Rampage (innate passive, attack only):
  - while no other air unit is within 6 tiles he deals +100% damage and attacks 50% faster (3× DPS overall) and takes 20% less damage from traps; he breathes fire while rampaging and claws otherwise;
  - his own pet never cancels it, even a flying one; other heroes' flying pets and units summoned by any pet (e.g. Boogers) do;
  - if he dies while his pet survives the pet stops counting as his for this check; a Phoenix revive only disables the rampage while her ability is active.
- Ability: once per battle, restores his recovery amount plus equipment recovery; auto-activates on KO (setting).
- Equipment: starts with Fire Heart and Flame Blower; Common unlocks Stun Blaster (Blacksmith 9) and Electro Fangs (Blacksmith 10); Epic: Rocket Backpack, Revenge Deck. He has no summoning equipment.
- Defense: flies around his Hero Banner; neither Royal Rampage nor equipment works on defense.

## Level caps (client gates, identical to the wiki table)

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Hero Hall 9 | 1–10 | 10 |
| Hero Hall 10 | 11–15 | 15 |
| Hero Hall 11 | 16–20 | 20 |
| Hero Hall 12 | 21–25 | 25 |

| Gate | Levels unlocked at this gate | Max level |
|---|---|---|
| Town Hall 15 | 1–10 | 10 |
| Town Hall 16 | 11–15 | 15 |
| Town Hall 17 | 16–20 | 20 |
| Town Hall 18 | 21–25 | 25 |

## Level table

Upgrade cost/time on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Damage per Second | Damage per Hit | Hitpoints | Health Recovery | Upgrade Cost | Upgrade Time | Hero Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 304 | 364.8 | 9,100 | 3,500 | N/A | N/A | 9 |
| 2 | 308 | 369.6 | 9,175 | 3,500 | 50,000 | 6h | 9 |
| 3 | 312 | 374.4 | 9,250 | 3,500 | 60,000 | 12h | 9 |
| 4 | 316 | 379.2 | 9,325 | 3,500 | 70,000 | 1d | 9 |
| 5 | 320 | 384 | 9,400 | 3,750 | 80,000 | 1d | 9 |
| 6 | 324 | 388.8 | 9,475 | 3,750 | 90,000 | 2d | 9 |
| 7 | 328 | 393.6 | 9,550 | 3,750 | 100,000 | 2d | 9 |
| 8 | 332 | 398.4 | 9,625 | 3,750 | 110,000 | 2d | 9 |
| 9 | 336 | 403.2 | 9,700 | 3,750 | 120,000 | 3d | 9 |
| 10 | 340 | 408 | 9,775 | 4,000 | 130,000 | 3d | 9 |
| 11 | 344 | 412.8 | 9,850 | 4,000 | 150,000 | 4d | 10 |
| 12 | 348 | 417.6 | 9,925 | 4,000 | 175,000 | 5d | 10 |
| 13 | 352 | 422.4 | 10,000 | 4,000 | 200,000 | 5d | 10 |
| 14 | 356 | 427.2 | 10,075 | 4,000 | 225,000 | 6d | 10 |
| 15 | 360 | 432 | 10,150 | 4,250 | 250,000 | 6d | 10 |
| 16 | 364 | 436.8 | 10,225 | 4,250 | 275,000 | 7d | 11 |
| 17 | 368 | 441.6 | 10,300 | 4,250 | 300,000 | 7d | 11 |
| 18 | 372 | 446.4 | 10,375 | 4,250 | 325,000 | 8d | 11 |
| 19 | 376 | 451.2 | 10,450 | 4,250 | 350,000 | 8d | 11 |
| 20 | 380 | 456 | 10,525 | 4,500 | 375,000 | 8d | 11 |
| 21 | 384 | 460.8 | 10,600 | 4,500 | 400,000 | 8d | 12 |
| 22 | 388 | 465.6 | 10,675 | 4,500 | 420,000 | 8d | 12 |
| 23 | 392 | 470.4 | 10,750 | 4,500 | 440,000 | 8d | 12 |
| 24 | 396 | 475.2 | 10,825 | 4,500 | 460,000 | 8d | 12 |
| 25 | 400 | 480 | 10,900 | 4,750 | 480,000 | 8d | 12 |

### Wiki constants (first statistics table)

| Field | Value |
|---|---|
| Preferred Target | None |
| Attack Type | Single Target |
| Movement Speed | 20 |
| Attack Speed | 1.2s |
| Range | 0.3 tiles |
| Search Radius | 10 tiles |
| Passive Ability | Royal Rampage |
| Ability Damage Increase | 100% |
| Ability Attack Speed Increase | 50% |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Movement Speed `20` = client `Speed 250 (÷12.5 = 20)`
- Attack Speed `1.2s` = client `AttackSpeed 1200 ms`
- `damagePerSecond` = `heroes.DPS` (same value) (all 25 wiki rows)
- `damagePerHit` = client `DPS × AttackSpeed / 1000` (all 25 wiki rows)
- `hitpoints` = `heroes.Hitpoints` (same value) (all 25 wiki rows)
- `healthRecovery` = `SpecialAbilities:special_abilities[DragonDukeAbilityHeal].HealOnActivation` (same value) (all 25 wiki rows)
- `upgradeCost` = client row N−1 `UpgradeCost` (the client stores the next upgrade on the current row) (all 25 wiki rows)
- `upgradeTimeSeconds` = client row N−1 `UpgradeTimeD/H/M` converted to seconds (next-upgrade convention) (all 25 wiki rows)
- `heroHallLevelRequired` = `heroes.RequiredHeroTavernLevel` (same value) (all 25 wiki rows)

**Client columns and interpretation notes**

- `heroes.csv` stores the *next* upgrade on each level row (`UpgradeCost`, `UpgradeResource`, `UpgradeTimeH`); the wiki lists the same price on the destination level. `RequiredTownHallLevel` and `RequiredHeroTavernLevel` on row N gate owning level N.
- Intrinsic activation recovery lives in `special_abilities.csv` (`<Hero>AbilityHeal`, column `HealOnActivation`) selected by the hero row's `SpecialAbilitiesLevel`; that ability has `ActiveAfterPlayerInput=TRUE`, `MaxActivations=1` (once per battle) and `SimulatePlayerInputOnDeath=TRUE` (the auto-use-on-KO behaviour). Equipment `HealOnActivation` is added on top.
- Units: `Speed` is internal speed (tiles/s × 100; wiki speed = Speed ÷ 12.5), `AttackRange` is 1/100 tile, `AttackSpeed` is milliseconds between attacks; damage per hit = `DPS × AttackSpeed / 1000`.
- `ItemSlotCount=2` and `DefaultItems` define the two equipment slots and the starting loadout; `MigrationGearLevel` is the equipment level granted by the December 2023 equipment migration (see hero-equipment.md).
- The wiki's 'Search Radius' has no one-to-one client column. Candidate defensive columns are `AlertRadius`, `MaxSearchRadiusForDefender` and `PatrolRadius` (all 1/100 tile); they are recorded under constants.client for implementers.
- Royal Rampage = `special_abilities[DragonDukeRageWhenAlone]`: `BoostDamagePercentage` 100, `BoostAttackSpeedPercentage` 50, `TrapShieldProtectionPercent` 20, `ActiveWhileAloneRadius`/`DeactivateWhileNotAloneRadius` 600 (6 tiles), `GrowthScale` 20, `TargetKilledCooldownTimer` 200, `MaxActivations` 9999; hero row sets `OnlyShowRageBoost=TRUE`.
- `SpecialAbilities` lists `DragonDukeRageWhenAlone;DragonDukeAbilityHeal`; the heal record differs from other heroes (`DeactivateAfterTime` 1000 instead of 10000, `AbilityEffect` DDFireHeartRegen).
- `CoolDownOverride` 700 ms is present (attack-cycle override not described on the wiki).

**Mismatches / ambiguities**

- `Range`: wiki **0.3 tiles** vs client **AttackRange 125 (= 1.25 tiles)** — constant from the wiki's first statistics table
- `Search Radius`: wiki **10 tiles** vs client **AlertRadius 1200 / MaxSearchRadiusForDefender 1000 / PatrolRadius 300** — no direct client equivalent
