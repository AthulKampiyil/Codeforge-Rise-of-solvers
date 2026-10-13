# Merged defenses (synthesized)

- No standalone 'Merge' page exists on the Clash of Clans Wiki (searched 'merge', 'merging defenses', 'Merged defense'); this entry is synthesized from the pages listed below.
- Sources (retrieved 2026-09-15): [Ricochet Cannon](https://clashofclans.fandom.com/wiki/Ricochet_Cannon) rev `624465`; [Multi-Archer Tower](https://clashofclans.fandom.com/wiki/Multi-Archer_Tower) rev `624863`; [Multi-Gear Tower](https://clashofclans.fandom.com/wiki/Multi-Gear_Tower) rev `624494`; [Super Wizard Tower/Home Village](https://clashofclans.fandom.com/wiki/Super_Wizard_Tower/Home_Village) rev `624749`; [Town Hall/Inferno Artillery](https://clashofclans.fandom.com/wiki/Town_Hall/Inferno_Artillery) rev `622642`; [Town Hall](https://clashofclans.fandom.com/wiki/Town_Hall) rev `624170`; [Cannon/Home Village](https://clashofclans.fandom.com/wiki/Cannon/Home_Village) rev `624457`; [Archer Tower/Home Village](https://clashofclans.fandom.com/wiki/Archer_Tower/Home_Village) rev `624456`; [Wizard Tower](https://clashofclans.fandom.com/wiki/Wizard_Tower) rev `625327`; [Eagle Artillery](https://clashofclans.fandom.com/wiki/Eagle_Artillery) rev `625122`
- Category: mechanic

## Mechanics

- From Town Hall 16, some maxed defenses can be **merged** into a new, stronger defense. The merge is a construction (needs a Builder, costs resources and time shown as the merged building's level-1 build) and **cannot be undone**; the input buildings disappear permanently.
- Inputs must be at the required max level. Ricochet Cannon and Multi-Archer Tower accept only **non-geared** Cannons/Archer Towers; the Multi-Gear Tower requires the **geared-up** Cannon and Archer Tower.
- Completing every available merge (up to the Town Hall's count) is required before the next Town Hall upgrade, like the 'place all buildings' rule. For the Multi-Gear Tower this indirectly requires Builder Base progress (the gear-ups).
- Merged defenses keep receiving new levels and supercharges while the input defenses stop getting levels (their Supercharge banner is 'disabled').
- The TH17 Town Hall itself is a merge: Town Hall 16 + level 7 Eagle Artillery -> Inferno Artillery weapon; the Eagle Artillery is removed.

## Level table

| Merged defense | Town Hall | Inputs | Client MergeRequirement | Count per TH (wiki) | Count per TH (client townhall_levels) |
|---|---|---|---|---|---|
| Ricochet Cannon | 16 | 2x Cannon level 21 (not geared up) | `Cannon:21:0;Cannon:21:0` | TH16: 2, TH17: 3 | TH16: 2, TH17: 3 |
| Multi-Archer Tower | 16 | 2x Archer Tower level 21 (not geared up) | `Archer Tower:21:0;Archer Tower:21:0` | TH16: 2, TH17: 3 | TH16: 2, TH17: 3 |
| Multi-Gear Tower | 17 | geared-up Cannon level 21 + geared-up Archer Tower level 21 | `Archer Tower:21:1;Cannon:21:1` | TH17: 1 | TH17: 1 |
| Inferno Artillery (Town Hall 17 weapon) | 17 | Town Hall 16 (Giga Inferno) + Eagle Artillery level 7 | `Eagle Artillery:7:0` | TH17: 1 | TH17: n/a |
| Super Wizard Tower | 18 | 2x Wizard Tower level 17 | `Wizard Tower:17:0;Wizard Tower:17:0` | TH18: 2 | TH18: 2 |

## Client comparison

- `MergeRequirement` is stored on the **result** building (level 1 row; on the Town Hall 17 row for the Inferno Artillery) as `Name:level:gearedFlag` entries separated by `;` - e.g. `Cannon:21:0;Cannon:21:0`, `Archer Tower:21:1;Cannon:21:1`, `Wizard Tower:17:0;Wizard Tower:17:0`, `Eagle Artillery:7:0`. The third field is the geared-up flag (0 = must not be geared up, 1 = must be geared up).
- Result counts per TH are ordinary townhall_levels.csv columns (`Ricochet Cannon`, `Multi Archer Tower`, `Multi Gear Tower`, `Super Wizard Tower`); the input columns (`Cannon`, `Archer Tower`, `Wizard Tower`, `Eagle Artillery`) keep their old counts, so 'remaining' inputs must be computed as count - 2 x merged (or - 1 for mixed merges).
- globals `REQUIRE_ALL_BUILDINGS_PLACED_FOR_TOWN_HALL_UPGRADE` TRUE; whether merges gate the Town Hall is not an explicit column (engine rule).
- Forward-inheritance pitfall: the Town Hall 18 row inherits `MergeRequirement` `Eagle Artillery:7:0` from TH17 if blanks are inherited; the live TH18 has no merge requirement.

All merge requirements and result counts per Town Hall agree with the wiki.
