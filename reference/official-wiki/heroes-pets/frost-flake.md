# Frost Flake

- **Source:** https://clashofclans.fandom.com/wiki/Frost_Flake
- **Wiki revision:** 621307 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Royal Champion
- **Client record:** `character_items.csv` → `Frost Charm`

> Champion Epic active item: fires 4 → 7 ice flakes at separate nearby defenses, each dealing small damage and freezing the target for 5.2 → 7 s; passive HP.

## Mechanics

- Epic equipment for the Royal Champion; ability type **Active**; unlock/obtain: Buy in Meltdown Mayhem event for 3,100 Ember Medal; or purchasable from the Trader for 1,500 Gem.
- Levels 1–27. Blacksmith level required by equipment level: 1–12 → 1; 13–15 → 3; 16–18 → 5; 19–21 → 7; 22–24 → 8; 25–27 → 9.
- Total ore from level 1 to max (sum of wiki costs): 56,060 Shiny Ore, 3,720 Glowy Ore, 480 Starry Ore.
- Per-level stats (level 1 → max): Projectile Damage 105 → 294; Slow Down Duration 5.2 s → 7 s; Number of Targets 4 → 7; Hitpoint Increase 50 → 700.
- Ability: simultaneously launches ice flakes at the defenses nearest the Champion — 4 flakes (levels 1–8), 5 (9–17), 6 (18–26), 7 (27). Each hits one different target, deals 105 → 294 damage and freezes it (100% slow) for 5.2 s rising by 0.2 s per tier to 7 s.
- If there are too few defenses, other buildings and defending troops (air included) are targeted; surplus flakes are wasted.
- Passive: +50 → +700 HP.
- Obtain: Meltdown Mayhem event (3,100 medals) or 1,500 gems at the Trader.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Projectile Damage | Ability Attributes / Slow Down Duration | Ability Attributes / Number of Targets | Hero Boost / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Upgrade Cost / Starry Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 105 | 5.2s | 4 | 50 | N/A | N/A | N/A | 1 |
| 2 | 105 | 5.2s | 4 | 75 | 120 | - | - | 1 |
| 3 | 126 | 5.4s | 4 | 100 | 240 | 20 | - | 1 |
| 4 | 126 | 5.4s | 4 | 125 | 400 | - | - | 1 |
| 5 | 126 | 5.4s | 4 | 150 | 600 | - | - | 1 |
| 6 | 147 | 5.6s | 4 | 175 | 840 | 100 | - | 1 |
| 7 | 147 | 5.6s | 4 | 200 | 1,120 | - | - | 1 |
| 8 | 147 | 5.6s | 4 | 225 | 1,440 | - | - | 1 |
| 9 | 168 | 5.8s | 5 | 250 | 1,800 | 200 | 10 | 1 |
| 10 | 168 | 5.8s | 5 | 275 | 1,900 | - | - | 1 |
| 11 | 168 | 5.8s | 5 | 300 | 2,000 | - | - | 1 |
| 12 | 189 | 6s | 5 | 325 | 2,100 | 400 | 20 | 1 |
| 13 | 189 | 6s | 5 | 350 | 2,200 | - | - | 3 |
| 14 | 189 | 6s | 5 | 375 | 2,300 | - | - | 3 |
| 15 | 210 | 6.2s | 5 | 400 | 2,400 | 600 | 30 | 3 |
| 16 | 210 | 6.2 | 5 | 425 | 2,500 | - | - | 5 |
| 17 | 210 | 6.2s | 5 | 450 | 2,600 | - | - | 5 |
| 18 | 231 | 6.4s | 6 | 475 | 2,700 | 600 | 50 | 5 |
| 19 | 231 | 6.4s | 6 | 500 | 2,800 | - | - | 7 |
| 20 | 231 | 6.4s | 6 | 525 | 2,900 | - | - | 7 |
| 21 | 252 | 6.6s | 6 | 550 | 3,000 | 600 | 100 | 7 |
| 22 | 252 | 6.6s | 6 | 575 | 3,100 | - | - | 8 |
| 23 | 252 | 6.6s | 6 | 600 | 3,200 | - | - | 8 |
| 24 | 273 | 6.8s | 6 | 625 | 3,300 | 600 | 120 | 8 |
| 25 | 273 | 6.8s | 6 | 650 | 3,400 | - | - | 9 |
| 26 | 273 | 6.8s | 6 | 675 | 3,500 | - | - | 9 |
| 27 | 294 | 7s | 7 | 700 | 3,600 | 600 | 150 | 9 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Royal Champion |
| Ability Type | Active |
| Rarity | Epic |
| Unlock Requirement | Buy in Meltdown Mayhem event for 3,100 Ember Medal; or purchasable from the Trader for 1,500 Gem |
| Slow Down | 100% |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `projectileDamage` = `MainAbilities:special_abilities[FrostBlast].Damage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `slowDownDurationSeconds` = `MainAbilities:special_abilities[FrostBlast].FrostOnHitTime` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client milliseconds ÷ 1000)
- `numberOfTargets` = `MainAbilities:special_abilities[FrostBlast].ProjectileOnActivationCount` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `Slow Down (100%)`: `FrostBlast.FrostOnHitPercent` 100

**Client columns and interpretation notes**

- Client record name `Frost Charm`.
- `special_abilities[FrostBlast]`: `Damage`, `FrostOnHitTime` 5200 → 7000, `FrostOnHitPercent` 100, `ProjectileOnActivationCount` 4 → 7, `ProjectileOnActivationDifferentTargets=TRUE`, `PreferedTargetBuildingClass=Defense`, `DeactivateAfterNumberOfHits` 1; projectile `rc_gear_frostblast_Projectile` (ballistic, speed 1500) also has `SlowdownDefencePercent` 50 (unexplained).

**Mismatches / ambiguities**

- None found in the compared fields.
