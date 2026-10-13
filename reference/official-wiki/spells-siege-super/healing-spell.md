# Healing Spell

- **Source:** https://clashofclans.fandom.com/wiki/Healing_Spell/Home_Village (transcluded into https://clashofclans.fandom.com/wiki/Healing_Spell)
- **Wiki revision:** 620308 (parent page `Healing Spell` rev 588153); retrieved 2026-09-15
- **Category:** `elixir-spell`
- **Client row:** `spells.json` -> `Healing` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Spell Factory level 2 (Town Hall 6). Housing space 2.
- Creates a stationary ring (5-tile radius) that heals every friendly troop and Hero inside, ground or air, including Healers and Druids.
- Healing arrives in 41 pulses spaced 0.3 s apart (about 12.3 s total; the page summary still says 40 pulses/12 s but its table and the TH18 history entry say 41).
- Heroes receive only 55% of each pulse. Siege Machines are never healed by it.
- Healing Spells can be stacked on one spot to heal faster (wiki strategy text). The client applies a per-stack falloff (see notes).
- Healing per pulse: 15 (L1) up to 75 (L12); total = pulses x per-pulse value (615 to 3,075).

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 5 |
| pulses | 41 |
| pulseIntervalSeconds | 0.3 |
| housingSpace | 2 |
| spellFactoryLevel | 2 |

## Level table

| Level | Total healing | Healing / pulse | Total healing on Heroes | Research cost | Research time | Lab level |
|---|---|---|---|---|---|---|
| 1 | 615 | 15 | 338.25 | N/A | N/A | N/A |
| 2 | 820 | 20 | 451 | 75,000 | 3h | 2 |
| 3 | 1,025 | 25 | 563.75 | 150,000 | 6h | 4 |
| 4 | 1,230 | 30 | 676.5 | 300,000 | 12h | 5 |
| 5 | 1,435 | 35 | 789.25 | 900,000 | 1d | 6 |
| 6 | 1,640 | 40 | 902 | 1,800,000 | 1d 12h | 7 |
| 7 | 1,845 | 45 | 1014.75 | 3,000,000 | 3d | 8 |
| 8 | 2,050 | 50 | 1127.5 | 6,000,000 | 5d | 11 |
| 9 | 2,255 | 55 | 1240.25 | 11,000,000 | 6d 12h | 13 |
| 10 | 2,460 | 60 | 1,353 | 14,000,000 | 7d | 14 |
| 11 | 2,747 | 67 | 1510.85 | 19,000,000 | 10d 12h | 15 |
| 12 | 3,075 | 75 | 1691.25 | 29,000,000 | 15d | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- heal per pulse -> `Damage` (negative = heal; -15 ... -75)
- pulse count -> `NumberOfHits` = 41
- pulse interval -> `TimeBetweenHitsMS` = 300
- radius -> `Radius` = 500 (5 tiles)
- hero scaling -> `HeroDamageMultiplier` = 55 (%)
- siege immunity -> `ImmunitySiegeMachines` = TRUE
- stacking -> globals `HEAL_STACK_PERCENT` = [100,100,90,90,70,40,10,0]

**Automatic wiki-vs-client check**

- MATCH `radiusTiles`: wiki 5 vs client 5 (`Radius/100`)
- MATCH `pulses`: wiki 41 vs client 41 (`NumberOfHits`)
- MATCH `pulseIntervalSeconds`: wiki 0.3 vs client 0.3 (`TimeBetweenHitsMS/1000`)
- MATCH `housingSpace`: wiki 2 vs client 2 (`HousingSpace`)
- MATCH `spellFactoryLevel`: wiki 2 vs client 2 (`SpellForgeLevel`)
- MATCH `healingPerPulse` at levels 1-12 (`-Damage`)
- MATCH `totalHealing` at levels 1-12 (`-Damage*NumberOfHits`)
- MATCH `totalHealingHeroes` at levels 1-12 (`total*HeroDamageMultiplier/100`)
- MATCH `researchCost` at levels 2-12 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-12 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-12 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Stacking: the wiki only says Healing Spells stack; the client global `HEAL_STACK_PERCENT` implies the 1st and 2nd overlapping heals apply at 100%, the 3rd/4th at 90%, then 70/40/10/0%. Parity code should use the client falloff.
- Wiki summary text (40 pulses, 12 s) is stale versus its own statistics table and history (41 pulses since Nov 2025); client agrees with 41.
