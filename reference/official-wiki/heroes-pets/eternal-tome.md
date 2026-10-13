# Eternal Tome

- **Source:** https://clashofclans.fandom.com/wiki/Eternal_Tome
- **Wiki revision:** 621300 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Grand Warden
- **Client record:** `character_items.csv` → `Eternal Tome`

> Warden's starting active item: makes himself and all friendly units in his ring invincible for 3.2 → 8.2 s; no passive boosts.

## Mechanics

- Common equipment for the Grand Warden; ability type **Active**; unlock/obtain: Available by default.
- Levels 1–18. Blacksmith level required by equipment level: 1 → none (starting level); 2–9 → 1; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Ability Duration 3.2 s → 8.2 s.
- Ability: every friendly unit inside the Warden's 9-tile ring, including the Warden, becomes invincible. Duration grows every level: 3.2 s (1), 3.5, 4.2, 4.5, 4.7, 5.5, 5.7, 6.0, 6.7, 6.8, 6.9, 7.2, 7.3, 7.4, 7.7, 7.8, 7.9, 8.2 s (18).
- Units that leave the ring lose invincibility one second later; units that enter or spawn inside it while active gain it (behaviour since June 2025).
- Invincibility only blocks direct damage: slows (Poison Spell Tower, defensive Headhunter), knockback on small units (Giant Bomb), Air Sweeper push and Spring Traps still apply.
- It is the only item with no passive stat boost.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Duration | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|
| 1 | 3.2s | N/A | N/A | N/A |
| 2 | 3.5s | 120 | - | 1 |
| 3 | 4.2s | 240 | 20 | 1 |
| 4 | 4.5s | 400 | - | 1 |
| 5 | 4.7s | 600 | - | 1 |
| 6 | 5.5s | 840 | 100 | 1 |
| 7 | 5.7s | 1,120 | - | 1 |
| 8 | 6.0s | 1,440 | - | 1 |
| 9 | 6.7s | 1,800 | 200 | 1 |
| 10 | 6.8s | 1,900 | - | 3 |
| 11 | 6.9s | 2,000 | - | 3 |
| 12 | 7.2s | 2,100 | 400 | 3 |
| 13 | 7.3s | 2,200 | - | 5 |
| 14 | 7.4s | 2,300 | - | 5 |
| 15 | 7.7s | 2,400 | 600 | 5 |
| 16 | 7.8s | 2,500 | - | 7 |
| 17 | 7.9s | 2,600 | - | 7 |
| 18 | 8.2s | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Grand Warden |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Available by default |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `abilityDurationSeconds`: = (`GrandWardenInvulnerability.DeactivateAfterTime` + aura `ShieldTime` 1000) ÷ 1000 — all 18 levels match (the wiki includes the one-second linger)

**Client columns and interpretation notes**

- `special_abilities[GrandWardenInvulnerability]` (18 rows): `DeactivateAfterTime` 2200 → 7200, `AuraSpell=Eternal Tome Aura` at the item level.
- `spells[Eternal Tome Aura]`: `Radius` 900, `TimeBetweenHitsMS` 100, `NumberOfHits` 23 → 73, `ShieldTime` 1000, `ShieldProtectionPercent` 100, building immunities (`ImmunityTH_CC`, `ImmunityStorages`, `ImmunityWalls`, `ImmunityOtherBuildings`, `ImmunityTotems`).
- Warden auras are spells cast on him (`AuraSpell`) with `Radius` 900 (9 tiles) that pulse every `TimeBetweenHitsMS`; effects on a unit persist for `BoostTimeMS`/`ShieldTime` (1000 ms) after its last pulse, which is the wiki's 'lose it one second after leaving the ring'.

**Mismatches / ambiguities**

- None found in the compared fields.
