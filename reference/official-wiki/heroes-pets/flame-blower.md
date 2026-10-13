# Flame Blower

- **Source:** https://clashofclans.fandom.com/wiki/Flame_Blower
- **Wiki revision:** 624519 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Dragon Duke
- **Client record:** `character_items.csv` → `Flame Blower`

> Duke's starting active item: a 12-tile, 60° cone of fire dealing 1,300 → 2,500 damage, with added recovery; passive HP.

## Mechanics

- Common equipment for the Dragon Duke; ability type **Active**; unlock/obtain: Available by default.
- Levels 1–18. Blacksmith level required by equipment level: 1 → none (starting level); 2–9 → 1; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Ability Damage 1,300 → 2,500; Hitpoint Increase 500 → 3,100; HP Recovery Increase 150 → 1,500.
- Ability: the Duke breathes a cone of flame ahead of him (12-tile reach) dealing 1,300 (levels 1–2) → 2,500 (18) damage to everything in the cone.
- Recovery on activation +150 → +1,500 HP (no increase at level 18); passive +500 → +3,100 HP.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Damage | Hero Boosts / Hitpoint Increase | Hero Boosts / HP Recovery Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|
| 1 | 1,300 | 500 | 150 | N/A | N/A | N/A |
| 2 | 1,300 | 700 | 250 | 120 | - | 1 |
| 3 | 1,375 | 900 | 350 | 240 | 20 | 1 |
| 4 | 1,375 | 1,100 | 450 | 400 | - | 1 |
| 5 | 1,375 | 1,300 | 550 | 600 | - | 1 |
| 6 | 1,500 | 1,500 | 650 | 840 | 100 | 1 |
| 7 | 1,500 | 1,700 | 750 | 1,120 | - | 1 |
| 8 | 1,500 | 1,850 | 850 | 1,440 | - | 1 |
| 9 | 1,750 | 2,000 | 950 | 1,800 | 200 | 1 |
| 10 | 1,750 | 2,150 | 1,050 | 1,900 | - | 3 |
| 11 | 1,750 | 2,300 | 1,150 | 2,000 | - | 3 |
| 12 | 2,000 | 2,450 | 1,250 | 2,100 | 400 | 3 |
| 13 | 2,000 | 2,600 | 1,300 | 2,200 | - | 5 |
| 14 | 2,000 | 2,750 | 1,350 | 2,300 | - | 5 |
| 15 | 2,250 | 2,900 | 1,400 | 2,400 | 600 | 5 |
| 16 | 2,250 | 3,000 | 1,450 | 2,500 | - | 7 |
| 17 | 2,250 | 3,050 | 1,500 | 2,600 | - | 7 |
| 18 | 2,500 | 3,100 | 1,500 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Dragon Duke |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Available by default |
| Damage Radius | 12 tiles |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `hpRecoveryIncrease` = `character_items.HealOnActivation` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `abilityDamage` = `MainAbilities:special_abilities[DD Flaming Sneeze] → SelfSpell:spells[DragonDukeFireBlast].Damage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `Damage Radius (12 tiles)`: `spells[DragonDukeFireBlast].Radius` 1200 with `ConeAngle` 60° (cone width not on the wiki)

**Client columns and interpretation notes**

- `special_abilities[DD Flaming Sneeze]`: `SelfSpell=DragonDukeFireBlast`, `PreActivationDelayTime` 100, `PreDeactivationDelayTime` 750, `SpellsBoostedByParent=FALSE` (the burst is not boosted by his rage/rampage), `DeactivateAfterTime` 1.
- `spells[DragonDukeFireBlast]`: `Radius` 1200, `ConeAngle` 60, `Damage` 1300/1375/1500/1750/2000/2250/2500, `NumberOfHits` 1.

**Mismatches / ambiguities**

- None found in the compared fields.
