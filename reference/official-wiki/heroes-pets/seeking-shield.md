# Seeking Shield

- **Source:** https://clashofclans.fandom.com/wiki/Seeking_Shield
- **Wiki revision:** 621327 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Royal Champion
- **Client record:** `character_items.csv` → `Seeking Shield`

> Champion's starting active item: a thrown shield that hits four different targets anywhere on the map (defenses first) for 1,000 → 2,500 each; passive HP.

## Mechanics

- Common equipment for the Royal Champion; ability type **Active**; unlock/obtain: Available by default.
- Levels 1–18. Blacksmith level required by equipment level: 1 → none (starting level); 2–9 → 1; 10–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Projectile Damage (per Target) 1,000 → 2,500; Hitpoint Increase 40 → 380.
- Ability: she throws a shield that seeks 4 distinct targets with unlimited travel, dealing 1,000 (levels 1–2) → 2,500 (18) damage to each, ground or air.
- Target order: defenses only while at least four remain; otherwise all remaining defenses, then defending troops or other buildings. A target is never hit twice; with no valid target the shield flies to the top corner of the map and is wasted.
- Since December 2023 the throw is not tied to her animation (slowdowns only slow the animation); when triggered by KO it is released instantly. She keeps attacking normally afterwards.
- Passive: +40 → +380 HP.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Projectile Damage (per Target) | Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|
| 1 | 1,000 | 40 | N/A | N/A | N/A |
| 2 | 1,000 | 60 | 120 | - | 1 |
| 3 | 1,250 | 80 | 240 | 20 | 1 |
| 4 | 1,250 | 100 | 400 | - | 1 |
| 5 | 1,250 | 120 | 600 | - | 1 |
| 6 | 1,500 | 140 | 840 | 100 | 1 |
| 7 | 1,500 | 160 | 1,120 | - | 1 |
| 8 | 1,500 | 180 | 1,440 | - | 1 |
| 9 | 1,750 | 200 | 1,800 | 200 | 1 |
| 10 | 1,750 | 220 | 1,900 | - | 3 |
| 11 | 1,750 | 240 | 2,000 | - | 3 |
| 12 | 2,000 | 260 | 2,100 | 400 | 3 |
| 13 | 2,000 | 280 | 2,200 | - | 5 |
| 14 | 2,000 | 300 | 2,300 | - | 5 |
| 15 | 2,250 | 320 | 2,400 | 600 | 5 |
| 16 | 2,250 | 340 | 2,500 | - | 7 |
| 17 | 2,250 | 360 | 2,600 | - | 7 |
| 18 | 2,500 | 380 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Royal Champion |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Available by default |
| Number of Targets | 4 |
| Targets | Ground & Air |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `projectileDamagePerTarget` = `MainAbilities:special_abilities[RoyalChampionShieldBounce].Damage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `Number of Targets (4) / Targets (Ground & Air)`: `ProjectileBounces` 3 + initial target

**Client columns and interpretation notes**

- `special_abilities[RoyalChampionShieldBounce]`: `Damage`, `ProjectileBounces` 3 (= 4 targets), `PreferedTargetBuildingClass=Defense`, `ProjectileOnActivation=AmazonQueen_shield` (ballistic, `Speed` 2000, `MaxBounceDistance` 7000), `ProjectileOnActivationCopyTarget=TRUE`, `PreActivationDelayTime` 933 ms, `DeactivateAfterTime` 1200 with `DisableAttacking=TRUE` (she pauses attacking for 1.2 s).

**Mismatches / ambiguities**

- `throwDelay`: wiki **released immediately (not animation-bound); instant on KO** vs client **PreActivationDelayTime 933 ms, DisableAttacking for 1200 ms** — client encodes a ~0.9 s pre-activation delay
