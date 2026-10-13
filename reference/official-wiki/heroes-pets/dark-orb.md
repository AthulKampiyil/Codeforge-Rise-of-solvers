# Dark Orb

- **Source:** https://clashofclans.fandom.com/wiki/Dark_Orb
- **Wiki revision:** 622302 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Minion Prince
- **Client record:** `character_items.csv` → `Dark Orb`

> Prince's starting active item: a slow-moving dark orb that damages and slows everything within 5 tiles along its path; passive DPS and HP.

## Mechanics

- Common equipment for the Minion Prince; ability type **Active**; unlock/obtain: Available by default.
- Levels 1–18. Blacksmith level required by equipment level: 1–9 → 1; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Projectile Damage 45 → 200; Slow Down 20% → 50%; Slow Down Duration 8 s → 18 s; Damage per Second Increase 10 → 73; Hitpoint Increase 588 → 1,140.
- Ability: a crystal emerges from a portal behind the Prince and travels forward for a while; every defense, defending hero and troop within the orb's 5-tile radius as it passes takes damage (45 at levels 1–2 → 200 at 18) and is slowed by 20% → 50% for 8 s → 18 s.
- Passive: +10 → +73 DPS and +588 → +1,140 HP.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Projectile Damage | Ability Attributes / Slow Down | Ability Attributes / Slow Down Duration | Hero Boosts / Damage per Second Increase | Hero Boosts / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 45 | 20% | 8s | 10 | 588 | N/A | N/A | 1 |
| 2 | 45 | 20% | 8s | 13 | 603 | 120 | - | 1 |
| 3 | 55 | 25% | 9s | 18 | 617 | 240 | 20 | 1 |
| 4 | 55 | 25% | 9s | 21 | 631 | 400 | - | 1 |
| 5 | 55 | 25% | 9s | 24 | 647 | 600 | - | 1 |
| 6 | 65 | 30% | 10s | 29 | 661 | 840 | 100 | 1 |
| 7 | 65 | 30% | 10s | 32 | 675 | 1,120 | - | 1 |
| 8 | 65 | 30% | 10s | 35 | 600 | 1,440 | - | 1 |
| 9 | 75 | 35% | 11s | 40 | 719 | 1,800 | 200 | 1 |
| 10 | 75 | 35% | 11s | 43 | 766 | 1,900 | - | 3 |
| 11 | 75 | 35% | 11s | 46 | 813 | 2,000 | - | 3 |
| 12 | 100 | 40% | 13s | 51 | 859 | 2,100 | 400 | 3 |
| 13 | 100 | 40% | 13s | 54 | 906 | 2,200 | - | 5 |
| 14 | 100 | 40% | 13s | 57 | 953 | 2,300 | - | 5 |
| 15 | 150 | 45% | 15s | 62 | 1,000 | 2,400 | 600 | 5 |
| 16 | 150 | 45% | 15s | 65 | 1,046 | 2,500 | - | 7 |
| 17 | 150 | 45% | 15s | 68 | 1,093 | 2,600 | - | 7 |
| 18 | 200 | 50% | 18s | 73 | 1,140 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Minion Prince |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Available by default |
| Damage Radius | 5 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `projectileDamage` = `MainAbilities:special_abilities[MinionAttackAbility].Damage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `slowDownPercent` = `MainAbilities:special_abilities[MinionAttackAbility].FrostOnHitPercent` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `slowDownDurationSeconds` = `MainAbilities:special_abilities[MinionAttackAbility].FrostOnHitTime` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client milliseconds ÷ 1000)
- `Damage Radius (5)`: `MinionAttackAbility.PenetratingRadius` 500 = 5 tiles (wiki omits the unit)

**Client columns and interpretation notes**

- `special_abilities[MinionAttackAbility]`: `Damage`, `FrostOnHitPercent`, `FrostOnHitTime`, `PenetratingRadius` 500 (5 tiles), `PenetratingExtraRange` 12000, `PreferedTargetBuildingClass=Defense`, `ProjectileOnActivation=vfx_projectile_DarkOrb` (`Speed` 1250, `HitsGroundAndAir=TRUE`), `ProjectileOnActivationCopyTarget=TRUE`, `DeactivateAfterTime` −1.
- The client aims the orb (preferred class Defense, copy target) and then lets it penetrate past the target; the wiki only says it travels 'where he is facing'.

**Mismatches / ambiguities**

- `hitpointIncrease` (level 8): wiki **600** vs client **690** — character_items.HitPoints
- `direction`: wiki **travels forward in the Prince's facing direction** vs client **PreferedTargetBuildingClass Defense + ProjectileOnActivationCopyTarget** — aiming rule unverified
