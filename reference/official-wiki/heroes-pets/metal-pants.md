# Metal Pants

- **Source:** https://clashofclans.fandom.com/wiki/Metal_Pants
- **Wiki revision:** 621028 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Minion Prince
- **Client record:** `character_items.csv` → `Metal Pants`

> Prince Common active item (Blacksmith 3): 9 → 15 s shield reducing all damage by 46% → 70%, with large recovery; passive HP.

## Mechanics

- Common equipment for the Minion Prince; ability type **Active**; unlock/obtain: Blacksmith level 3.
- Levels 1–18. Blacksmith level required by equipment level: 1–12 → 3; 13–15 → 5; 16–18 → 7.
- Total ore from level 1 to max (sum of wiki costs): 27,260 Shiny Ore, 1,920 Glowy Ore.
- Per-level stats (level 1 → max): Ability Duration 9 s → 15 s; Incoming Damage Reduction 46% → 70%; Hitpoint Increase 850 → 1,700; HP Recovery Increase 1,600 → 2,500.
- Ability: an orange shield reduces all incoming damage by 46% (levels 1–2), 50%, 54%, 58%, 62%, 66%, 70% (18) for 9 s rising by 1 s per tier to 15 s.
- Recovery on activation +1,600 → +2,500 HP; passive +850 → +1,700 HP.
- History: an unreleased 'Trap Shield' (90% trap-damage reduction) appears to be its prototype.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Ability Duration | Ability Attributes / Incoming Damage Reduction | Hero Boosts / Hitpoint Increase | Hero Boosts / HP Recovery Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 9s | 46% | 850 | 1,600 | N/A | N/A | 3 |
| 2 | 9s | 46% | 900 | 1,675 | 120 | - | 3 |
| 3 | 10s | 50% | 950 | 1,750 | 240 | 20 | 3 |
| 4 | 10s | 50% | 1,000 | 1,800 | 400 | - | 3 |
| 5 | 10s | 50% | 1,050 | 1,850 | 600 | - | 3 |
| 6 | 11s | 54% | 1,100 | 1,900 | 840 | 100 | 3 |
| 7 | 11s | 54% | 1,150 | 1,950 | 1,120 | - | 3 |
| 8 | 11s | 54% | 1,200 | 2,000 | 1,440 | - | 3 |
| 9 | 12s | 58% | 1,250 | 2,050 | 1,800 | 200 | 3 |
| 10 | 12s | 58% | 1,300 | 2,100 | 1,900 | - | 3 |
| 11 | 12s | 58% | 1,350 | 2,150 | 2,000 | - | 3 |
| 12 | 13s | 62% | 1,400 | 2,200 | 2,100 | 400 | 3 |
| 13 | 13s | 62% | 1,450 | 2,250 | 2,200 | - | 5 |
| 14 | 13s | 62% | 1,500 | 2,300 | 2,300 | - | 5 |
| 15 | 14s | 66% | 1,550 | 2,350 | 2,400 | 600 | 5 |
| 16 | 14s | 66% | 1,600 | 2,400 | 2,500 | - | 7 |
| 17 | 14s | 66% | 1,650 | 2,450 | 2,600 | - | 7 |
| 18 | 15s | 70% | 1,700 | 2,500 | 2,700 | 600 | 7 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Minion Prince |
| Ability Type | Active |
| Rarity | Common |
| Unlock Requirement | Blacksmith level 3 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `hpRecoveryIncrease` = `character_items.HealOnActivation` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `abilityDurationSeconds` = `MainAbilities:special_abilities[MinionPrinceStoneSkinAbility].DeactivateAfterTime` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client milliseconds ÷ 1000)
- `incomingDamageReductionPercent` = `MainAbilities:special_abilities[MinionPrinceStoneSkinAbility].ShieldProtectionPercent` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)

**Client columns and interpretation notes**

- `special_abilities[MinionPrinceStoneSkinAbility]`: `ShieldProtectionPercent` 46 → 70, `DeactivateAfterTime` 9000 → 15000.
- Deprecated record `MP Trap Shield` → `MinionPrinceTrapShieldAbility` (uses `TrapShieldProtectionPercent`) remains in the client.

**Mismatches / ambiguities**

- None found in the compared fields.
