# Rage Spell

- **Source:** https://clashofclans.fandom.com/wiki/Rage_Spell/Home_Village (transcluded into https://clashofclans.fandom.com/wiki/Rage_Spell)
- **Wiki revision:** 623256 (parent page `Rage Spell` rev 587899); retrieved 2026-09-15
- **Category:** `elixir-spell`
- **Client row:** `spells.json` -> `Rage` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Spell Factory level 3 (Town Hall 7). Housing space 2.
- Creates a 5-tile radius ring that pulses 60 times every 0.3 s (18 s). Each pulse grants a boost that lasts 1 s, so the effect fades about 1 s after a unit leaves or the spell ends.
- Boosted friendly troops and Heroes gain movement speed (+20 at L1 to +32 at L7, in in-game speed units) and damage (+130% to +190%). Healers and Druids get their healing raised the same way.
- The damage bonus is additive: enraged damage = base x (1 + bonus), e.g. x2.3 at L1 (confirmed by independent tests cited on the wiki).
- Heroes receive 50% of both the damage and the speed bonus. Siege Machines are unaffected (client also excludes Totems).
- Stacking: overlapping Rage Spells do not add up; the highest-level one applies. Against other damage boosts (e.g. Rage Vial) or speed boosts (Haste), only the stronger boost is used.
- A Furnace can be enraged, but the Firemites it summons are not.

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 5 |
| pulses | 60 |
| pulseIntervalSeconds | 0.3 |
| boostTimeSeconds | 1 |
| housingSpace | 2 |
| spellFactoryLevel | 3 |

## Level table

| Level | Damage increase % | Speed increase | Research cost | Research time | Lab level |
|---|---|---|---|---|---|
| 1 | 130 | 20 | N/A | N/A | N/A |
| 2 | 140 | 22 | 400,000 | 6h | 3 |
| 3 | 150 | 24 | 800,000 | 12h | 4 |
| 4 | 160 | 26 | 1,000,000 | 1d | 5 |
| 5 | 170 | 28 | 2,000,000 | 2d | 6 |
| 6 | 180 | 30 | 5,000,000 | 4d | 10 |
| 7 | 190 | 32 | 26,000,000 | 14d | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- damage bonus -> `DamageBoostPercent` (130..190)
- speed bonus (troops) -> `SpeedBoost` (20..32, in-game speed units; x12.5 for internal units)
- speed bonus (Heroes) -> `SpeedBoost2` (10..16) plus globals `HERO_RAGE_MULTIPLIER` = 50 / `HERO_RAGE_SPEED_MULTIPLIER` = 50
- pulses / interval -> `NumberOfHits` 60 x `TimeBetweenHitsMS` 300 = 18 s
- linger -> `BoostTimeMS` = 1000
- radius -> `Radius` 500
- immunities -> `ImmunitySiegeMachines`, `ImmunityTotems`

**Automatic wiki-vs-client check**

- MATCH `radiusTiles`: wiki 5 vs client 5 (`Radius/100`)
- MATCH `pulses`: wiki 60 vs client 60 (`NumberOfHits`)
- MATCH `pulseIntervalSeconds`: wiki 0.3 vs client 0.3 (`TimeBetweenHitsMS/1000`)
- MATCH `boostTimeSeconds`: wiki 1 vs client 1 (`BoostTimeMS/1000`)
- MATCH `housingSpace`: wiki 2 vs client 2 (`HousingSpace`)
- MATCH `spellFactoryLevel`: wiki 3 vs client 3 (`SpellForgeLevel`)
- MATCH `damageIncreasePercent` at levels 1-7 (`DamageBoostPercent`)
- MATCH `speedIncrease` at levels 1-7 (`SpeedBoost`)
- MATCH `researchCost` at levels 2-7 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-7 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-7 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Level 7 (added April 27, 2026) is present in the pinned client with identical numbers, so the client post-dates that update.
- Speed units: the wiki's Troop Movement Speed page states spell speed increases add to the in-game speed (internal speed / 12.5), so +20 = +250 internal units = +2.5 tiles/s.
