# Stun Blaster

- **Source:** https://clashofclans.fandom.com/wiki/Stun_Blaster
- **Wiki revision:** 624501 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Dragon Duke
- **Client record:** `character_items.csv` → `Stun Blaster`

> Duke Common active item (Blacksmith 9): an 8-tile shockwave that damages (150 → 400) and stuns defenses and defending troops for 4.5 → 7.5 s; passive DPS, HP and recovery.

## Mechanics

- Common equipment for the Dragon Duke; ability type **Active**; unlock/obtain: Blacksmith level 9.
- Levels 1–18. Blacksmith level required by equipment level: 1 → none (starting level); 2–18 → 9.
- Total ore from level 1 to max (sum of wiki costs): 27,360 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Ability Total Damage 150 → 400; Stun Duration 4.5 s → 7.5 s; Damage per Second Increase 40 → 90; Health Recovery 150 → 1,300; Hitpoint Increase 450 → 2,400.
- Ability: a shockwave around the Duke (8-tile radius) damages and stuns buildings, defending troops and heroes: damage 150 (levels 1–2) → 400 (18), stun 4.5 s → 7.5 s (+0.5 s per tier). Resource buildings and Walls are unaffected.
- The wiki's comparison describes several quick damage ticks like the Earthquake Spell Tower effect.
- Recovery on activation +150 → +1,300 HP; passive +40 → +90 DPS and +450 → +2,400 HP (no HP increase at level 18).

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Total Damage | Stun Duration | Hero Boosts / Damage per Second Increase | Hero Boosts / Health Recovery | Hero Boosts / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 150 | 4.5s | 40 | 150 | 450 | N/A | N/A | N/A |
| 2 | 150 | 4.5s | 43 | 250 | 650 | 120 | - | 9 |
| 3 | 200 | 5s | 46 | 350 | 850 | 240 | 20 | 9 |
| 4 | 200 | 5s | 49 | 450 | 1,000 | 400 | - | 9 |
| 5 | 200 | 5s | 52 | 550 | 1,150 | 600 | - | 9 |
| 6 | 250 | 5.5s | 55 | 650 | 1,300 | 940 | 100 | 9 |
| 7 | 250 | 5.5s | 58 | 750 | 1,450 | 1,120 | - | 9 |
| 8 | 250 | 5.5s | 61 | 850 | 1,600 | 1,440 | - | 9 |
| 9 | 300 | 6s | 64 | 950 | 1,750 | 1,800 | 200 | 9 |
| 10 | 300 | 6s | 67 | 1,050 | 1,900 | 1,900 | - | 9 |
| 11 | 300 | 6s | 70 | 1,100 | 2,000 | 2,000 | - | 9 |
| 12 | 350 | 6.5s | 73 | 1,150 | 2,100 | 2,100 | 400 | 9 |
| 13 | 350 | 6.5s | 76 | 1,180 | 2,200 | 2,200 | - | 9 |
| 14 | 350 | 6.5s | 79 | 1,210 | 2,275 | 2,300 | - | 9 |
| 15 | 375 | 7s | 82 | 1,240 | 2,325 | 2,400 | 600 | 9 |
| 16 | 375 | 7s | 85 | 1,270 | 2,375 | 2,500 | - | 9 |
| 17 | 375 | 7s | 88 | 1,290 | 2,400 | 2,600 | - | 9 |
| 18 | 400 | 7.5s | 90 | 1,300 | 2,400 | 2,700 | 600 | 9 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Dragon Duke |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Blacksmith level 9 |
| Damage Radius | 8 tiles |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- `abilityTotalDamage` = `MainAbilities:special_abilities[DDBlastAbility] → SelfSpell:spells[DDBlastSpell].Damage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `stunDurationSeconds` = `MainAbilities:special_abilities[DDBlastAbility] → SelfSpell:spells[DDBlastSpell].StunTimeMS` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client milliseconds ÷ 1000)
- `healthRecovery` = `character_items.HealOnActivation` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `Damage Radius (8 tiles)`: `spells[DDBlastSpell].Radius` 800

**Client columns and interpretation notes**

- `special_abilities[DDBlastAbility]` → `SelfSpell=DDBlastSpell`: `Radius` 800, `Damage` 150 → 400, `StunTimeMS` 4500 → 7500, `NumberOfHits` 1, `TimeBetweenHitsMS` 1, `ImmunityStorages=TRUE`, `ImmunityWalls=TRUE`, heroes/other characters/TH-CC not immune.

**Mismatches / ambiguities**

- `upgradeCostShinyOre` (level 6): wiki **940** vs client **840** — client stores this on row L−1 (`UpgradeCosts`)
- `hitCount`: wiki **'deals damage multiple times in a short period' (total damage column)** vs client **NumberOfHits 1** — single hit in client data
- `immunity`: wiki **resource buildings immune** vs client **ImmunityStorages TRUE only** — whether collectors/drills are hit is unclear
