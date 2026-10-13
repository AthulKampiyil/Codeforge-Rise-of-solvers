# Revenge Deck

- **Source:** https://clashofclans.fandom.com/wiki/Revenge_Deck
- **Wiki revision:** 625297 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Dragon Duke
- **Client record:** `character_items.csv` → `Draconic Counter`

> Duke Epic passive item: counter-attacks anything that damages him with a card (150 → 225 damage) and heals 30 → 60 per counter, max once per 0.8 s per attacker; passive HP.

## Mechanics

- Epic equipment for the Dragon Duke; ability type **Passive**; unlock/obtain: Buy in Awesome Medal Event for 3,100 Quest Medal.
- Levels 1–27. Blacksmith level required by equipment level: 1–12 → 1; 13–15 → 3; 16–18 → 5; 19–21 → 7; 22–24 → 8; 25–27 → 9.
- Total ore from level 1 to max (sum of wiki costs): 56,060 Shiny Ore, 3,720 Glowy Ore, 480 Starry Ore.
- Per-level stats (level 1 → max): Heal per Counter 30 → 60; Counter Damage 150 → 225; Hitpoint Increase 900 → 3,200.
- Passive ability: when an enemy unit or defense damages the Duke, he launches a card back at it (150 → 225 damage) and heals himself (30 → 60). Each attacker has its own 0.8 s counter cooldown.
- No counter against traps or defensive spells, non-damaging effects (e.g. Air Sweeper), very distant attackers (wiki '25 (?) tiles', e.g. a far Eagle Artillery), attackers already destroyed or self-destroying (Yetimites, Electromites), or secondary damage such as Electro Dragon chains/death damage, Firemite splash or Electro Titan aura.
- Counter damage and healing ignore difficulty modifiers.
- Passive: +900 → +3,200 HP.
- Obtain: Awesome Medal Event (3,100 Quest Medals). Client name `Draconic Counter`.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Heal per Counter | Ability Attributes / Counter Damage | Hero Boost / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Upgrade Cost / Starry Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 30 | 150 | 900 | N/A | N/A | N/A | 1 |
| 2 | 30 | 150 | 988 | 120 | - | - | 1 |
| 3 | 32 | 155 | 1,077 | 240 | 20 | - | 1 |
| 4 | 32 | 155 | 1,165 | 400 | - | - | 1 |
| 5 | 32 | 155 | 1,254 | 600 | - | - | 1 |
| 6 | 35 | 160 | 1,342 | 840 | 100 | - | 1 |
| 7 | 35 | 160 | 1,431 | 1,120 | - | - | 1 |
| 8 | 35 | 160 | 1,519 | 1,440 | - | - | 1 |
| 9 | 39 | 165 | 1,608 | 1,800 | 200 | 10 | 1 |
| 10 | 39 | 165 | 1,696 | 1,900 | - | - | 1 |
| 11 | 39 | 165 | 1,785 | 2,000 | - | - | 1 |
| 12 | 43 | 175 | 1,873 | 2,100 | 400 | 20 | 1 |
| 13 | 43 | 175 | 1,962 | 2,200 | - | - | 3 |
| 14 | 43 | 175 | 2,050 | 2,300 | - | - | 3 |
| 15 | 46 | 185 | 2,139 | 2,400 | 600 | 30 | 3 |
| 16 | 46 | 185 | 2,227 | 2,500 | - | - | 5 |
| 17 | 46 | 185 | 2,316 | 2,600 | - | - | 5 |
| 18 | 49 | 195 | 2,404 | 2,700 | 600 | 50 | 5 |
| 19 | 49 | 195 | 2,493 | 2,800 | - | - | 7 |
| 20 | 49 | 195 | 2,581 | 2,900 | - | - | 7 |
| 21 | 52 | 205 | 2,670 | 3,000 | 600 | 100 | 7 |
| 22 | 52 | 205 | 2,758 | 3,100 | - | - | 8 |
| 23 | 52 | 205 | 2,847 | 3,200 | - | - | 8 |
| 24 | 55 | 215 | 2,935 | 3,300 | 600 | 120 | 8 |
| 25 | 55 | 215 | 3,024 | 3,400 | - | - | 9 |
| 26 | 55 | 215 | 3,112 | 3,500 | - | - | 9 |
| 27 | 60 | 225 | 3,200 | 3,600 | 600 | 150 | 9 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Dragon Duke |
| Ability Type | Passive |
| Rarity | Epic |
| Unlock Requirement | Buy in Awesome Medal Event for 3,100 Quest Medal |
| Maximum Counter Range | 25 Tiles |
| Counter Cooldown | 0.8s |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `healPerCounter` = `MainAbilities:special_abilities[DragonScaleReflect].HealOnReflect` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `counterDamage` = `MainAbilities:special_abilities[DragonScaleReflect].ReflectedDamage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `Counter Cooldown (0.8s)`: `DragonScaleReflect.ReflectCooldownMS` 800

**Client columns and interpretation notes**

- `special_abilities[DragonScaleReflect]`: `ReflectsDamage=TRUE`, `ReflectBehavior=MovableCharacterDamageOverrides`, `ReflectedDamage` 150 → 225, `HealOnReflect` 30 → 60, `ReflectCooldownMS` 800, `ReflectedRange` 100000, `ReflectProjectile=ddreversalcardprojectile` (speed 1650), `ActiveWhileAlive`, `DeactivateOnDeath`.

**Mismatches / ambiguities**

- `Maximum Counter Range`: wiki **25 tiles (marked uncertain)** vs client **ReflectedRange 100000 (1,000 tiles if 1/100 tile)** — client suggests effectively unlimited range; exclusions must come from ReflectBehavior rules
