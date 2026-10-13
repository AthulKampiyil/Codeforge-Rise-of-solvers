# Poison Spell

- **Source:** https://clashofclans.fandom.com/wiki/Poison_Spell
- **Wiki revision:** 624974; retrieved 2026-09-15
- **Category:** `dark-spell`
- **Client row:** `spells.json` -> `Poison` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: first Dark spell, Dark Spell Factory level 1 (Town Hall 8). Housing space 1. Hits ground and air.
- A 4-tile radius cloud lasting 16 s that affects defending units only (Clan Castle troops, defending Heroes, Skeleton-trap Skeletons); buildings are untouched.
- Damage ramps up the longer a unit stays poisoned, up to the per-level maximum DPS (90 to 380). Affected units also move slower (26% to 52%) and attack slower (35% to 74%).
- The wiki summary says the poison persists for another 6 s after a unit leaves the cloud (see notes for the client value).
- Overlapping Poison Spells ramp faster but never exceed the max DPS.
- Heroes take far less poison damage (balance); Guardians receive 30% of the effects (April 2026); defending Miners underground are unaffected (Oct 2022). Idle defenders try to walk out of the cloud.

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 4 |
| durationSeconds | 16 |
| damageType | Area Splash |
| housingSpace | 1 |
| targets | Ground & Air |
| darkSpellFactoryLevel | 1 |

## Level table

| Level | Max DPS | Speed decrease % | Attack-rate decrease % | Research cost | Research time | Lab level |
|---|---|---|---|---|---|---|
| 1 | 90 | 26 | 35 | N/A | N/A | N/A |
| 2 | 115 | 30 | 40 | 5,000 | 6h | 6 |
| 3 | 145 | 34 | 45 | 10,000 | 18h | 7 |
| 4 | 180 | 38 | 50 | 21,500 | 2d | 8 |
| 5 | 220 | 40 | 55 | 35,000 | 3d | 9 |
| 6 | 260 | 42 | 60 | 55,000 | 4d | 10 |
| 7 | 280 | 44 | 65 | 77,500 | 5d | 11 |
| 8 | 300 | 46 | 68 | 100,000 | 6d 12h | 12 |
| 9 | 320 | 48 | 70 | 135,000 | 7d | 13 |
| 10 | 340 | 50 | 72 | 175,000 | 8d | 14 |
| 11 | 360 | 51 | 73 | 230,000 | 9d 16h | 15 |
| 12 | 380 | 52 | 74 | 350,000 | 14d 12h | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- max DPS -> `PoisonDPS` (90..380), ramp flag `PoisonIncreaseSlowly` = TRUE
- speed slow -> `SpeedBoost` / `SpeedBoost2` (-26..-52, used as percent with `BoostLinkedToPoison` = TRUE)
- attack-rate slow -> `AttackSpeedBoost` (-35..-74)
- duration -> `NumberOfHits` 40 x `TimeBetweenHitsMS` 400 = 16 s
- radius -> `Radius` 400
- linger -> `BoostTimeMS` = 500
- Heroes -> `HeroDamageMultiplier` = 5
- Guardians -> `GuardianDamageMultiplier` = 30; globals `GUARDIAN_POISON_SPEED_MULTIPLIER` = 30, `GUARDIAN_POISON_ATTACK_SPEED_MULTIPLIER` = 30
- targets -> `BoostDefenders` TRUE, `PoisonAffectAir` TRUE, immunities TH/CC, storages, walls, other buildings, siege
- AI -> globals `USE_POISON_AVOIDANCE` = TRUE

**Automatic wiki-vs-client check**

- MATCH `radiusTiles`: wiki 4 vs client 4 (`Radius/100`)
- MATCH `durationSeconds`: wiki 16 vs client 16 (`NumberOfHits*TimeBetweenHitsMS/1000`)
- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `darkSpellFactoryLevel`: wiki 1 vs client 1 (`SpellForgeLevel`)
- MATCH `maxDps` at levels 1-12 (`PoisonDPS`)
- MATCH `speedDecreasePercent` at levels 1-12 (`-SpeedBoost`)
- MATCH `attackRateDecreasePercent` at levels 1-12 (`-AttackSpeedBoost`)
- MATCH `researchCost` at levels 2-12 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-12 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-12 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Linger ambiguity: wiki says the effect lasts 6 s after leaving the cloud; the client row only has `BoostTimeMS` = 500 ms. The 6 s may be an emergent decay of the ramp rather than a timer. Needs engine verification.
- Hero reduction: wiki only says Heroes take 'much less' damage; client `HeroDamageMultiplier` = 5 implies 5% damage to Heroes.
