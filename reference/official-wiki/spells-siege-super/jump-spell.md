# Jump Spell

- **Source:** https://clashofclans.fandom.com/wiki/Jump_Spell/Home_Village (transcluded into https://clashofclans.fandom.com/wiki/Jump_Spell)
- **Wiki revision:** 623002 (parent page `Jump Spell` rev 588156); retrieved 2026-09-15
- **Category:** `elixir-spell`
- **Client row:** `spells.json` -> `Jump` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Spell Factory level 4 together with Freeze (Town Hall 9). Housing space 2.
- Inside a 3.5-tile radius, ground troops and Heroes treat affected Wall segments as passable and hop over them; since July 2014 it influences pathing of all troops in the battle, not only those standing in it.
- Duration grows 20 s per level: 20 / 40 / 60 / 80 / 100 s.
- No effect on units that already ignore Walls (air units, Hog Riders, Miners, Headhunters, Grand Warden, Royal Champion) and it does not change ground Siege Machine behaviour (e.g. Wall Wrecker).
- Wall Breakers and Super Wall Breakers use Jump Spells (Oct 2020). Troops do not retarget when they leave the jump area, which prevents endless jump loops.
- Stacking: the wiki documents no additive effect from overlapping Jump Spells (overlap only widens/extends the passable area).

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 3.5 |
| boostTimeSeconds | 1 |
| housingSpace | 2 |
| spellFactoryLevel | 4 |

## Level table

| Level | Duration (s) | Research cost | Research time | Lab level |
|---|---|---|---|---|
| 1 | 20 | N/A | N/A | N/A |
| 2 | 40 | 1,000,000 | 1d | 5 |
| 3 | 60 | 2,000,000 | 2d | 8 |
| 4 | 80 | 5,000,000 | 4d | 11 |
| 5 | 100 | 8,000,000 | 5d | 13 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- duration -> `NumberOfHits` x `TimeBetweenHitsMS` (81..401 x 250 ms = 20.25..100.25 s)
- per-pulse grant -> `JumpBoostMS` = 400
- radius -> `Radius` 350
- globals -> `USE_WALL_WEIGHTS_FOR_JUMP_SPELL` = TRUE, `RETARGET_WHEN_EXITING_JUMP_SPELL` = FALSE
- immunities -> `ImmunitySiegeMachines`, `ImmunityTotems`

**Automatic wiki-vs-client check**

- MATCH `radiusTiles`: wiki 3.5 vs client 3.5 (`Radius/100`)
- MATCH `housingSpace`: wiki 2 vs client 2 (`HousingSpace`)
- MATCH `spellFactoryLevel`: wiki 4 vs client 4 (`SpellForgeLevel`)
- MATCH `durationSeconds` at levels 1-5 (`NumberOfHits*TimeBetweenHitsMS/1000`)
- MATCH `researchCost` at levels 2-5 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-5 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-5 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- The wiki constants table lists a 1 s 'Boost Time'; the client's per-pulse grant is `JumpBoostMS` = 400 ms with pulses every 250 ms. Treat 400 ms as the linger after the last pulse.
- Client duration is 0.25 s longer than the wiki's round numbers because of the extra pulse (N x 20 s + 250 ms).
