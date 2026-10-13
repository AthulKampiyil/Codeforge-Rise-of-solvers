# Electro Boots

- **Source:** https://clashofclans.fandom.com/wiki/Electro_Boots
- **Wiki revision:** 621042 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Royal Champion
- **Client record:** `character_items.csv` → `Electro Boots`

> Champion Epic passive item: a permanent electric aura hitting nearby enemies every 0.4 s (132 → 200 DPS); passive HP and self-heal.

## Mechanics

- Epic equipment for the Royal Champion; ability type **Passive**; unlock/obtain: Buy in Toyshop Throwdown event for 3,100 Toy Medal; Buy in Friend or Foe event for 3,100 Champ Medal; Buy in Cosmic Rock event for 3,100 Rock Medal; Buy in Equipment Blast event for 3,100 Relic Medal; or purchasable from the Trader for 1,500 Gem.
- Levels 1–27. Blacksmith level required by equipment level: 1–12 → 1; 13–15 → 3; 16–18 → 5; 19–21 → 7; 22–24 → 8; 25–27 → 9.
- Total ore from level 1 to max (sum of wiki costs): 56,060 Shiny Ore, 3,720 Glowy Ore, 480 Starry Ore.
- Per-level stats (level 1 → max): Aura Damage per Second 132 → 200; Aura Damage per Hit 52.8 → 80; Self Healing per Second 6 → 45; Hitpoint Increase 50 → 700.
- Passive ability: an electric aura around the Champion damages enemy troops and buildings in range every 0.4 s — 132 DPS at levels 1–2 rising per tier to 200 DPS at 27 (≈ 53 → 80 per pulse). It lasts until she is knocked out, pauses while she is recalled and resumes when revived or redeployed.
- The aura is larger and at some levels stronger than the Electro Titan's.
- Passive: +50 → +700 HP and self-healing 6 → 45 HP/s.
- Obtain: 3,100 event medals (Toyshop Throwdown, Friend or Foe, Cosmic Rock, Equipment Blast) or 1,500 gems at the Trader.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Aura Damage per Second | Ability Attributes / Aura Damage per Hit | Hero Boosts / Self Healing per Second | Hero Boosts / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Upgrade Cost / Starry Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 132 | 52.8 | 6 | 50 | N/A | N/A | N/A | 1 |
| 2 | 132 | 52.8 | 8 | 75 | 120 | - | - | 1 |
| 3 | 140 | 56 | 10 | 100 | 240 | 20 | - | 1 |
| 4 | 140 | 56 | 12 | 125 | 400 | - | - | 1 |
| 5 | 140 | 56 | 14 | 150 | 600 | - | - | 1 |
| 6 | 147 | 58.8 | 16 | 175 | 840 | 100 | - | 1 |
| 7 | 147 | 58.8 | 18 | 200 | 1,120 | - | - | 1 |
| 8 | 147 | 58.8 | 20 | 225 | 1,440 | - | - | 1 |
| 9 | 155 | 62 | 22 | 250 | 1,800 | 200 | 10 | 1 |
| 10 | 155 | 62 | 24 | 275 | 1,900 | - | - | 1 |
| 11 | 155 | 62 | 26 | 300 | 2,000 | - | - | 1 |
| 12 | 162 | 64.8 | 28 | 325 | 2,100 | 400 | 20 | 1 |
| 13 | 162 | 64.8 | 30 | 350 | 2,200 | - | - | 3 |
| 14 | 162 | 64.8 | 32 | 375 | 2,300 | - | - | 3 |
| 15 | 170 | 68 | 33 | 400 | 2,400 | 600 | 30 | 3 |
| 16 | 170 | 68 | 34 | 425 | 2,500 | - | - | 5 |
| 17 | 170 | 68 | 35 | 450 | 2,600 | - | - | 5 |
| 18 | 177 | 70.8 | 36 | 475 | 2,700 | 600 | 50 | 5 |
| 19 | 177 | 70.8 | 37 | 500 | 2,800 | - | - | 7 |
| 20 | 177 | 70.8 | 38 | 525 | 2,900 | - | - | 7 |
| 21 | 185 | 74 | 39 | 550 | 3,000 | 600 | 100 | 7 |
| 22 | 185 | 74 | 40 | 575 | 3,100 | - | - | 8 |
| 23 | 185 | 74 | 41 | 600 | 3,200 | - | - | 8 |
| 24 | 192 | 76.8 | 42 | 625 | 3,300 | 600 | 120 | 8 |
| 25 | 192 | 76.8 | 43 | 650 | 3,400 | - | - | 9 |
| 26 | 192 | 76.8 | 44 | 675 | 3,500 | - | - | 9 |
| 27 | 200 | 80 | 45 | 700 | 3,600 | 600 | 150 | 9 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Royal Champion |
| Ability Type | Passive |
| Rarity | Epic |
| Unlock Requirement | Buy in Toyshop Throwdown event for 3,100 Toy Medal; Buy in Friend or Foe event for 3,100 Champ Medal; Buy in Cosmic Rock event for 3,100 Rock Medal; Buy in Equipment Blast event for 3,100 Relic Medal; or purchasable from the Trader for 1,500 Gem |
| Aura Attack Speed | 0.4s |
| Aura Radius | 5 tiles |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `auraDamagePerHit` = `MainAbilities:special_abilities[Electro Boots Aura] → AuraSpell:spells[Electro Boots Aura].Damage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `selfHealingPerSecond` = `ExtraAbilities:special_abilities[RCElectroRegeneration].Regeneration` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `auraDamagePerSecond`: = client per-pulse `Damage` ÷ 0.4 s truncated (53 → 132, 59 → 147, 65 → 162, 71 → 177, 77 → 192); the wiki's per-hit column (52.8, 58.8 …) is back-computed from those truncated DPS values, so ±0.2 differences are rounding

**Client columns and interpretation notes**

- `special_abilities[Electro Boots Aura]` → `AuraSpell=Electro Boots Aura`: `Damage` 53/56/59/62/65/68/71/74/77/80 per pulse, `TimeBetweenHitsMS` 400, `Radius` 450, `NumberOfHits` 4000, `ImmunityWalls=TRUE`, and `HeroDamageMultiplier` 25 (defending heroes take only 25% — not on the wiki).
- Self-healing: `ExtraAbilities` `RCElectroRegeneration` (`Regeneration` 6 → 45 every 1000 ms; its own 27-row table, different from the shared `Regeneration`).

**Mismatches / ambiguities**

- `Aura Radius`: wiki **5 tiles** vs client **spells[Electro Boots Aura].Radius 450 (4.5 tiles)** — wiki may add unit hitbox; verify
- `heroDamage`: wiki **not mentioned** vs client **HeroDamageMultiplier 25** — aura deals 25% damage to heroes
