# Meteor Staff

- **Source:** https://clashofclans.fandom.com/wiki/Meteor_Staff
- **Wiki revision:** 624746 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** equipment · **Hero:** Minion Prince
- **Client record:** `character_items.csv` → `Meteor Staff`

> Prince Epic passive item: every 10 → 5 s a meteor hits the nearest defense at any distance for 250 → 850 area damage; passive DPS and HP.

## Mechanics

- Epic equipment for the Minion Prince; ability type **Passive**; unlock/obtain: Buy in Cosmic Rock event for 3,100 Rock Medal; Buy in Wise Warriors event for 3,100 Grumpy Medal; or purchasable from the Trader for 1,500 Gem.
- Levels 1–27. Blacksmith level required by equipment level: 1–12 → 1; 13–15 → 3; 16–18 → 5; 19–21 → 7; 22–24 → 8; 25–27 → 9.
- Total ore from level 1 to max (sum of wiki costs): 56,060 Shiny Ore, 3,720 Glowy Ore, 480 Starry Ore.
- Per-level stats (level 1 → max): Cooldown Time 10 s → 5 s; Damage per Hit 250 → 850; Damage per Second Increase 13 → 125; Hitpoint Increase 558 → 1,381.
- Passive ability: while the Prince is on the map and not knocked out, a meteor is called periodically — every 10 s at levels 1–2, 0.5 s faster per tier, 5 s at level 27 — onto the defense nearest to him regardless of distance (if no defense remains, the nearest building).
- Each meteor deals 250 → 850 damage in a 2-tile radius (enough to catch buildings adjacent to a 3x3 target), hurting both ground and air units. Targets must be targetable (not under Invisibility/Overgrowth); no meteor falls if nothing is targetable, and a meteor can be wasted on a defense destroyed before impact.
- Meteors do not trigger Invisibility Spell Towers.
- Passive: +13 → +125 DPS and +558 → +1,381 HP.
- Obtain: 3,100 event medals (Cosmic Rock, Wise Warriors) or 1,500 gems at the Trader.

## Level table

Costs on a row are the price to reach that level (wiki convention). Values as displayed on the wiki.

| Level | Ability Attributes / Cooldown Time | Ability Attributes / Damage per Hit | Hero Boost / Damage per Second Increase | Hero Boost / Hitpoint Increase | Upgrade Cost / Shiny Ore | Upgrade Cost / Glowy Ore | Upgrade Cost / Starry Ore | Blacksmith Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 10s | 250 | 13 | 558 | N/A | N/A | N/A | 1 |
| 2 | 10s | 250 | 17 | 587 | 120 | - | - | 1 |
| 3 | 9.5s | 300 | 21 | 615 | 240 | 20 | - | 1 |
| 4 | 9.5s | 300 | 25 | 644 | 400 | - | - | 1 |
| 5 | 9.5s | 300 | 29 | 673 | 600 | - | - | 1 |
| 6 | 9s | 350 | 33 | 702 | 840 | 100 | - | 1 |
| 7 | 9s | 350 | 37 | 730 | 1,120 | - | - | 1 |
| 8 | 9s | 350 | 41 | 759 | 1,440 | - | - | 1 |
| 9 | 8.5s | 400 | 45 | 788 | 1,800 | 200 | 10 | 1 |
| 10 | 8.5s | 400 | 49 | 817 | 1,900 | - | - | 1 |
| 11 | 8.5s | 400 | 53 | 845 | 2,000 | - | - | 1 |
| 12 | 8s | 450 | 57 | 874 | 2,100 | 400 | 20 | 1 |
| 13 | 8s | 450 | 61 | 903 | 2,200 | - | - | 3 |
| 14 | 8s | 450 | 65 | 932 | 2,300 | - | - | 3 |
| 15 | 7.5s | 500 | 69 | 960 | 2,400 | 600 | 30 | 3 |
| 16 | 7.5s | 500 | 73 | 989 | 2,500 | - | - | 5 |
| 17 | 7.5s | 500 | 77 | 1,018 | 2,600 | - | - | 5 |
| 18 | 7s | 575 | 81 | 1,047 | 2,700 | 600 | 50 | 5 |
| 19 | 7s | 575 | 85 | 1,107 | 2,800 | - | - | 7 |
| 20 | 7s | 575 | 90 | 1,139 | 2,900 | - | - | 7 |
| 21 | 6.5s | 650 | 95 | 1,171 | 3,000 | 600 | 100 | 7 |
| 22 | 6.5s | 650 | 100 | 1,205 | 3,100 | - | - | 8 |
| 23 | 6.5s | 650 | 105 | 1,239 | 3,200 | - | - | 8 |
| 24 | 6s | 750 | 110 | 1,273 | 3,300 | 600 | 120 | 8 |
| 25 | 6s | 750 | 115 | 1,309 | 3,400 | - | - | 9 |
| 26 | 6s | 750 | 120 | 1,345 | 3,500 | - | - | 9 |
| 27 | 5s | 850 | 125 | 1,381 | 3,600 | 600 | 150 | 9 |

### Wiki constants (single-row tables)

| Field | Value |
|---|---|
| User | Minion Prince |
| Ability Type | Passive |
| Rarity | Epic |
| Unlock Requirement | Buy in Cosmic Rock event for 3,100 Rock Medal; Buy in Wise Warriors event for 3,100 Grumpy Medal; or purchasable from the Trader for 1,500 Gem |
| Damage Radius | 2 tiles |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- `damagePerSecondIncrease` = `character_items.DPS` (all levels)
- `hitpointIncrease` = `character_items.HitPoints` (all levels)
- `blacksmithLevelRequired` = `character_items.RequiredBlacksmithLevel` (all levels)
- Ore costs: the wiki cost on level N equals client row N−1 `UpgradeResources`/`UpgradeCosts` (CommonOre = Shiny, RareOre = Glowy, EpicOre = Starry) for every level
- `cooldownTimeSeconds` = `MainAbilities:special_abilities[MPMeteorStaff].ActivationCooldown` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (client milliseconds ÷ 1000)
- `damagePerHit` = `MainAbilities:special_abilities[MPMeteorStaff] → CastSpell:spells[MPMeteorStaffSpell].Damage` at the item's `MainAbilityLevels`/`ExtraAbilityLevels` (same value)
- `Damage Radius (2 tiles)`: `spells[MPMeteorStaffSpell].Radius` 200

**Client columns and interpretation notes**

- `special_abilities[MPMeteorStaff]`: `ActivationCooldown` 10000 → 5000, `ActiveWhileAlive=TRUE`, `CastSpell=MPMeteorStaffSpell` with `CastSpellTarget=Defense` at `CastSpellLevel` = tier, `DeactivateAfterTime` −1.
- `spells[MPMeteorStaffSpell]`: `Damage` 250 → 850, `Radius` 200, `NumberOfHits` 1, `DeployTimeMS` 800, `ChargingTimeMS` 300 (cast-to-impact delay the wiki does not give).

**Mismatches / ambiguities**

- None found in the compared fields.
