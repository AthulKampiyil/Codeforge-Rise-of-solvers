# Lightning Spell

- **Source:** https://clashofclans.fandom.com/wiki/Lightning_Spell/Home_Village (transcluded into https://clashofclans.fandom.com/wiki/Lightning_Spell)
- **Wiki revision:** 620698 (parent page `Lightning Spell` rev 588160); retrieved 2026-09-15
- **Category:** `elixir-spell`
- **Client row:** `spells.json` -> `Lightning` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: first Elixir spell, available as soon as Spell Factory level 1 exists (Town Hall 5). Housing space 1.
- One bolt strikes the target point and damages every building and enemy unit (ground or air) inside a 2-tile radius.
- Resource storages, the Town Hall (since June 2020) and the Clan Castle (since December 2020) take no damage.
- Anything struck is stunned for 0.1 s and must re-acquire a target; this resets single-target Inferno Tower ramp-up and restarts the Eagle Artillery wind-up.
- Can be used on Heroes, Clan Castle troops and weakened Walls (strategy text); damage per level rises from 150 (L1) to 720 (L13).
- Legacy behaviour (pre June 2020): 2 housing, six random weaker bolts, no stun. Brewing is instant since March 2025.
- Stacking: every bolt is independent, so several Lightning Spells simply add their damage (the wiki pairs them with Earthquakes against high-HP buildings).

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 2 |
| stunSeconds | 0.1 |
| housingSpace | 1 |
| spellFactoryLevel | 1 |

## Level table

| Level | Damage | Research cost | Research time | Lab level |
|---|---|---|---|---|
| 1 | 150 | N/A | N/A | N/A |
| 2 | 180 | 50,000 | 2h | 1 |
| 3 | 210 | 100,000 | 4h | 2 |
| 4 | 240 | 200,000 | 6h | 3 |
| 5 | 270 | 600,000 | 1d | 6 |
| 6 | 320 | 1,500,000 | 1d 12h | 7 |
| 7 | 400 | 2,500,000 | 3d | 8 |
| 8 | 480 | 4,200,000 | 3d 12h | 9 |
| 9 | 560 | 6,300,000 | 5d | 10 |
| 10 | 600 | 10,000,000 | 6d | 13 |
| 11 | 640 | 13,500,000 | 7d | 14 |
| 12 | 680 | 18,500,000 | 10d | 15 |
| 13 | 720 | 27,000,000 | 14d | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- damage per bolt -> `Damage` (absolute HP)
- radius -> `Radius`/100 tiles (200 -> 2 tiles)
- stun -> `StunTimeMS` (and `FreezeTimeMS`) = 100 ms
- bolt count -> `NumberOfHits` = 1, `RandomRadius` = 0
- immunities -> `ImmunityTH_CC` = TRUE, `ImmunityStorages` = TRUE
- unlock -> `SpellForgeLevel` = 1
- timing -> `DeployTimeMS` 800, `HitTimeMS` 100
- research -> cost/time of client row N-1 (`UpgradeCost`, `UpgradeTimeH`) buy level N; `LaboratoryLevel` of row N gates level N

**Automatic wiki-vs-client check**

- MATCH `radiusTiles`: wiki 2 vs client 2 (`Radius/100`)
- MATCH `stunSeconds`: wiki 0.1 vs client 0.1 (`StunTimeMS/1000`)
- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `spellFactoryLevel`: wiki 1 vs client 1 (`SpellForgeLevel`)
- MATCH `damage` at levels 1-13 (`Damage`)
- MATCH `researchCost` at levels 2-13 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-13 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-13 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Client also sets `FreezeTimeMS` = 100 next to `StunTimeMS` = 100; the wiki only documents a 0.1 s stun.
- The max-level client row (L13) repeats L12's `UpgradeCost`/`UpgradeTimeH` as a placeholder; it is not a real upgrade.
