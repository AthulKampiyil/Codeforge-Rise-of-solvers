# Healing Tome

- **Source:** https://clashofclans.fandom.com/wiki/Healing_Tome
- **Wiki revision:** 621304 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Grand Warden
- **Client record:** `character_items.csv` → `Healing Tome`

> Warden Common active item (Blacksmith 6): a 15 → 20 s healing aura that follows him and heals allies (heroes at full rate) 60 → 150 HP/s; passive HP and recovery.

## Mechanics

- Common equipment for the Grand Warden; ability type **Active**; unlock/obtain: Blacksmith level 6.
- Levels 1–18. Blacksmith level required by equipment level: 1–15 → 6; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Healing per Second 60 → 150; Ability Duration 15 s → 20 s; Hitpoint Increase 92 → 685; Health Recovery Increase 165 → 863.
- Ability: for 15 s (levels 1–2) up to 20 s (18) a healing field centred on and moving with the Warden heals every friendly unit in the ring, including heroes and himself at the full rate: 60 HP/s (1–2), 70 (3–5), 80 (6–8), 100 (9–11), 120 (12–14), 140 (15–17), 150 (18). Siege Machines are not healed.
- Recovery on activation +165 → +863 HP; passive +92 → +685 HP.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Healing per Second | Ability Attributes / Ability Duration | Hero Boosts / Hitpoint Increase | Hero Boosts / Health Recovery Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 60 | 15.0s | 92 | 165 | N/A | N/A | 6 |
| 2 | 60 | 15.0s | 107 | 193 | 120 | - | 6 |
| 3 | 70 | 16.0s | 122 | 220 | 240 | 20 | 6 |
| 4 | 70 | 16.0s | 137 | 248 | 400 | - | 6 |
| 5 | 70 | 16.0s | 153 | 275 | 600 | - | 6 |
| 6 | 80 | 17.0s | 168 | 303 | 840 | 100 | 6 |
| 7 | 80 | 17.0s | 183 | 330 | 1,120 | - | 6 |
| 8 | 80 | 17.0s | 198 | 358 | 1,440 | - | 6 |
| 9 | 100 | 18.0s | 229 | 413 | 1,800 | 200 | 6 |
| 10 | 100 | 18.0s | 280 | 463 | 1,900 | - | 6 |
| 11 | 100 | 18.0s | 330 | 513 | 2,000 | - | 6 |
| 12 | 120 | 19.0s | 381 | 563 | 2,100 | 400 | 6 |
| 13 | 120 | 19.0s | 432 | 613 | 2,200 | - | 6 |
| 14 | 120 | 19.0s | 482 | 663 | 2,300 | - | 6 |
| 15 | 140 | 19.5s | 533 | 713 | 2,400 | 600 | 6 |
| 16 | 140 | 19.5s | 584 | 763 | 2,500 | - | 7 |
| 17 | 140 | 19.5s | 634 | 813 | 2,600 | - | 7 |
| 18 | 150 | 20.0s | 685 | 863 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Grand Warden |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Blacksmith level 6 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `healthRecoveryIncrease` = `character_items.HealOnActivation` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `abilityDurationSeconds` = `MainAbilities:special_abilities[GrandWardenHealAura].DeactivateAfterTime` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client milliseconds ÷ 1000)
- `healingPerSecond`: = −`spells[Healing Tome Aura].Damage` ÷ 0.3 s pulse interval (18/21/24/30/36/42/45 → 60/70/80/100/120/140/150) — all levels match

**Client columns and interpretation notes**

- `special_abilities[GrandWardenHealAura]`: `DeactivateAfterTime` 15000/16000/17000/18000/19000/19500/20000, `AuraSpell=Healing Tome Aura`.
- `spells[Healing Tome Aura]`: `Damage` −18/−21/−24/−30/−36/−42/−45 per pulse, `TimeBetweenHitsMS` 300, `Radius` 900, `ImmunitySiegeMachines`, and `ExecuteHealthPermil` −60 (a percentage-based heal term the wiki does not mention).

**Mismatches / ambiguities**

- `ExecuteHealthPermil`: wiki **flat 60–150 HP/s only** vs client **ExecuteHealthPermil −60 on the aura** — possible extra 6% max-HP heal per pulse or threshold; unverified
