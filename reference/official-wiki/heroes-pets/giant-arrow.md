# Giant Arrow

- **Source:** https://clashofclans.fandom.com/wiki/Giant_Arrow
- **Wiki revision:** 623346 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Archer Queen
- **Client record:** `character_items.csv` → `Piercing Arrow`

> Queen Common active item (Blacksmith 2): a piercing giant arrow aimed at an Air Defense that damages everything in a 1-tile-wide path across the village.

## Mechanics

- Common equipment for the Archer Queen; ability type **Active**; unlock/obtain: Blacksmith Level 2.
- Levels 1–18. Blacksmith level required by equipment level: 1–9 → 2; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Projectile Damage 750 → 1,500; Damage per Second Increase 20 → 132; Hitpoint Increase 80 → 581.
- Ability: fires one huge piercing arrow that flies through the entire village; everything within 1 tile of its path — buildings and defending ground/air troops and heroes — takes 750 → 1,500 damage. The wiki lists Air Defense as its favourite target, and Air Defenses take double damage.
- Rage Spells and similar boosts do not increase the arrow's damage. The arrow disappears after leaving the village (about 70.7 tiles corner to corner).
- It behaves as an indestructible 'construct' (can trigger an Invisibility Spell Tower).
- Passive: +20 → +132 DPS and +80 → +581 HP.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Projectile Damage | Hero Boosts / Damage per Second Increase | Hero Boosts / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|
| 1 | 750 | 20 | 80 | N/A | N/A | 2 |
| 2 | 750 | 23 | 93 | 120 | - | 2 |
| 3 | 850 | 27 | 106 | 240 | 20 | 2 |
| 4 | 850 | 30 | 119 | 400 | - | 2 |
| 5 | 850 | 33 | 133 | 600 | - | 2 |
| 6 | 1,000 | 37 | 146 | 840 | 100 | 2 |
| 7 | 1,000 | 40 | 159 | 1,120 | - | 2 |
| 8 | 1,000 | 43 | 172 | 1,440 | - | 2 |
| 9 | 1,100 | 50 | 199 | 1,800 | 200 | 2 |
| 10 | 1,100 | 59 | 241 | 1,900 | - | 3 |
| 11 | 1,100 | 68 | 284 | 2,000 | - | 3 |
| 12 | 1,200 | 77 | 326 | 2,100 | 400 | 3 |
| 13 | 1,200 | 86 | 369 | 2,200 | - | 5 |
| 14 | 1,200 | 96 | 411 | 2,300 | - | 5 |
| 15 | 1,350 | 105 | 454 | 2,400 | 600 | 5 |
| 16 | 1,350 | 114 | 496 | 2,500 | - | 7 |
| 17 | 1,350 | 123 | 539 | 2,600 | - | 7 |
| 18 | 1,500 | 132 | 581 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Archer Queen |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Blacksmith Level 2 |
| Damage Radius | 1 tile |
| Favorite Target | Air Defense; (Damage 2x) |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `projectileDamage` = `MainAbilities:special_abilities[ArcherQueenPierceProjectile].Damage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `Damage Radius (1 tile) / Favorite Target (Air Defense, 2x)`: `PenetratingRadius` 100; `PreferedTargetBuildingClass=Air Defense` with `ExtraDamagePercentageAgainstTarget` 100

**Client columns and interpretation notes**

- Client record name `Piercing Arrow` (TID `TID_GEAR_PIERCING_ARROW`).
- `special_abilities[ArcherQueenPierceProjectile]`: `Damage`, `PreferedTargetBuildingClass=Air Defense`, `ExtraDamagePercentageAgainstTarget` 100 (+100% = 2× vs the preferred target), `PenetratingRadius` 100 (1 tile), `PenetratingExtraRange` 40000, `ProjectileOnActivation=QueenPierceProjectile` (`Speed` 3500, `HitsGroundAndAir=TRUE`), `DeactivateAfterTime` −1.

**Mismatches / ambiguities**

- None found in the compared fields.
