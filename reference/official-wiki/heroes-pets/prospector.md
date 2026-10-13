# Prospector

- **Source:** https://clashofclans.fandom.com/wiki/Prospector
- **Wiki revision:** 623235 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** mechanic
- **Client record:** `villager_apprentices.csv` → `Prospector`

> TH10 Helper (Gold Pass CPoints) who converts up to 2,000 Shiny / 120 Glowy / 2 Starry Ore into another ore type once per helper work day.

## Mechanics

- Appears near the Helper Hut from Town Hall 10; recruited with the Gold Pass for Challenge Points (2,400 → 2,200 → 60 CPoints between March and May 2026) and stays until season end.
- Once per work day he converts one ore type into another, instantly; maximum input per conversion: 2,000 Shiny, 120 Glowy or 2 Starry.
- All Helpers share one 23-hour work-day timer that starts when the first Helper job of the day is assigned (the Prospector does not reset it to 23 h if assigned later).
- Unlike the Alchemist he has no upgrades and no conversion bonus.

## Level table

| Level | Ore Conversion Max (Shiny Ore) | Ore Conversion Max (Glowy Ore) | Ore Conversion Max (Starry Ore) | Town Hall Level Required |
|---|---|---|---|---|
| 1 | 2,000 | 120 | 2 | 10 |

## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `oreConversionMaxShinyOre` 2,000 = `villager_apprentices[Prospector].MaxSourceResource` entry
- `oreConversionMaxGlowyOre` 120 = `villager_apprentices[Prospector].MaxSourceResource` entry
- `oreConversionMaxStarryOre` 2 = `villager_apprentices[Prospector].MaxSourceResource` entry
- `townHallLevelRequired` 10 = `RequiredTownHallLevel`

**Client columns and interpretation notes**

- `villager_apprentices.csv` → `Prospector`: `Type=PROSPECTOR`, `RequiredTownHallLevel` 10, `SourceResource`/`TargetResource` `CommonOre;RareOre;EpicOre`, `MaxSourceResource` and `MaxTargetResource` 2000;120;2, `ResourceConvertionMultiplier` 100, `MaxSourceResourceMultiplier` 100.
- The equal source/target maxima imply a fixed 2,000 : 120 : 2 (= 1,000 : 60 : 1) exchange rate between ore types — the wiki does not state the rate.
- The record has seven rows with `CostResource=Diamonds`, `Cost` 100/250/500/1000/1000/1500/1500 and `BoostTimeSeconds` 4 — gem prices the wiki does not mention (the wiki shows one level and a CPoints unlock).

**Mismatches / ambiguities**

- `levels/cost`: wiki **1 level; unlocked with Gold Pass CPoints** vs client **7 rows with Diamonds Cost 100…1500** — meaning of client rows (per-use or per-level gem price?) unverified
- `conversionRate`: wiki **not stated** vs client **2000:120:2 via Max*Resource** — rate inferred from client columns
