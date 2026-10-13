# Angry Spell

- **Source:** https://clashofclans.fandom.com/wiki/Angry_Spell
- **Wiki revision:** 625021; retrieved 2026-09-15
- **Category:** `dark-spell`
- **Client row:** `spells.json` -> `AngrySpell` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Not in the original task list; included because the wiki's Dark Spell Factory table and the client both have it. Unlock: Dark Spell Factory level 8 (Town Hall 15). Housing space 1. Added June 16, 2026.
- For 5 s, units inside the 6-tile radius (including units deployed into it during that time) become 'angry' and switch to targeting defenses for 7 s (L1), 8, 10 or 12 s (L4), then revert to normal targeting.
- Units that already target defenses (Balloons, Giants, Golems, Hog Riders, Root Riders, Dragon Riders, Ice Golems, Bears, Royal Champion) are unaffected; Lava/Ice Hounds switch from Air Defenses to any defense. Healers, Druids and Ruin Witch ignore it.
- Angry units generally ignore defending troops and Heroes (no counter-attack), unlike Heroes affected by Angry Jelly.
- Stacking: not documented on the wiki.

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 6 |
| effectType | Area Splash |
| targets | Ground & Air |
| housingSpace | 1 |
| darkSpellFactoryLevel | 8 |

## Level table

| Level | Anger duration (s) | Spell duration (s) | Research cost | Research time | Lab level |
|---|---|---|---|---|---|
| 1 | 7 | 5 | N/A | N/A | N/A |
| 2 | 8 | 5 | 150,000 | 9d 8h | 14 |
| 3 | 10 | 5 | 250,000 | 12d | 15 |
| 4 | 12 | 5 | 400,000 | 15d | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- field duration -> `NumberOfHits` 50 x `TimeBetweenHitsMS` 100 = 5 s
- anger duration -> `GiveSpecialAbility` 'AngrySpellAnger' -> `DeactivateAfterTime` 7000/8000/10000/12000
- retarget -> ability `PreferedTargetBuildingClass` Defense, `ForceRetargetOnActivation` TRUE, `FightWithGroups` FALSE, `DeactivateOnDeath` TRUE
- radius -> `Radius` 600
- unexplained -> `BoostTimeMS` = 25000

**Automatic wiki-vs-client check**

- MATCH `radiusTiles`: wiki 6 vs client 6 (`Radius/100`)
- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `darkSpellFactoryLevel`: wiki 8 vs client 8 (`SpellForgeLevel`)
- MATCH `angerDurationSeconds` at levels 1-4 (`AngrySpellAnger.DeactivateAfterTime/1000`)
- MATCH `spellDurationSeconds` at levels 1-4 (`NumberOfHits*TimeBetweenHitsMS/1000`)
- MATCH `researchCost` at levels 2-4 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-4 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-4 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- `BoostTimeMS` = 25000 on the spell row has no wiki counterpart; the effective anger time comes from the ability rows.
- Client row 1 `LaboratoryLevel` = 13 (unlock gate) while the wiki lists N/A for level 1.
