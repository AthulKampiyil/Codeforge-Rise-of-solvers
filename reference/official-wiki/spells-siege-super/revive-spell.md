# Revive Spell

- **Source:** https://clashofclans.fandom.com/wiki/Revive_Spell
- **Wiki revision:** 625258; retrieved 2026-09-15
- **Category:** `elixir-spell`
- **Client row:** `spells.json` -> `Revive` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Spell Factory level 8 (Town Hall 15). Housing space 2.
- Only affects knocked-out Heroes: it revives the KO'd Hero closest to the drop point within 8 tiles, restoring 60% (L1) to 80% (L5) of max HP. With no eligible Hero in range the spell is wasted.
- While a Revive Spell is available, a winged golden heart marks each revivable Hero; tapping the heart revives that Hero. Since August 31, 2026 the player can also select the spell and tap the Hero's icon in the deployment bar.
- A Hero may be revived repeatedly if more spells are available.
- Timed abilities keep ticking during the KO and continue if the Hero returns in time; a Pet decouples permanently at the KO. With 'Activate Hero Abilities on KO' enabled, the ability fires before the KO.

## Constants (wiki)

| Field | Value |
|---|---|
| triggerRadiusTiles | 8 |
| targets | Heroes (Single Target) |
| housingSpace | 2 |
| spellFactoryLevel | 8 |

## Level table

| Level | Hero heal % | Research cost | Research time | Lab level |
|---|---|---|---|---|
| 1 | 60 | N/A | N/A | N/A |
| 2 | 65 | 18,000,000 | 7d | 13 |
| 3 | 70 | 19,000,000 | 8d | 14 |
| 4 | 75 | 20,000,000 | 11d 12h | 15 |
| 5 | 80 | 29,500,000 | 16d | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- heal on revive -> `ResurrectHitpointPercentage` (60..80)
- search radius -> `TargetingRadius` = 800 (8 tiles); `Radius` = 0
- targets -> `ImmunityOtherBuildings`/`ImmunityWalls`/`ImmunityTH_CC`/`ImmunitySiegeMachines`/`ImmunityTotems` = TRUE; `TargetedProjectile` 'Hero Revive Projectile'
- globals -> `REVIVE_MAX_HITPOINTS` = 0 (no absolute cap)

**Automatic wiki-vs-client check**

- MATCH `triggerRadiusTiles`: wiki 8 vs client 8 (`TargetingRadius/100`)
- MATCH `housingSpace`: wiki 2 vs client 2 (`HousingSpace`)
- MATCH `spellFactoryLevel`: wiki 8 vs client 8 (`SpellForgeLevel`)
- MATCH `heroHealPercent` at levels 1-5 (`ResurrectHitpointPercentage`)
- MATCH `researchCost` at levels 2-5 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-5 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-5 (`row[N].LaboratoryLevel`)
