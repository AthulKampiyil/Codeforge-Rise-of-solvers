# Logger

- Source: [Logger](https://clashofclans.fandom.com/wiki/Logger) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `625039`; retrieved 2026-09-15
- Category: townhall-weapon
- Client reference (18.400.21): `characters.csv` -> `Guardian Logger (guardians.csv Logger)`

## Mechanics

- Town Hall 18 Guardian (shared Guardian rules apply). Added April 27, 2026.
- Attack: throws a log at the closest target every 2.5 s from 7 tiles; the log hits and **knocks back** every unit it passes, ground and air at once, and keeps rolling for the post-hit range (5 tiles at levels 1-3, 6 tiles at levels 4-5). Level 5: 350 DPS / 875 per hit, 12,000 HP.
- Pushback 1.5 tiles (raised from 1 on July 14, 2026). The damage radius is not documented on the page ('??').
- Movement speed 8 (the slowest Guardian); patrol radius 14 tiles; trigger radius 15 tiles. Deals no damage on death.
- Upgrades: levels 2-5 cost 18M / 22M / 26M / 28M and take 7 / 9 / 11 / 13 days.

### Recent balance notes (from the page's History table)

- July 14, 2026: pushback 1 -> 1.5 tiles; post-hit range 7/8 -> 5/6 tiles.
- April 27, 2026: added.

## Level table

**Statistics**

| Targets | Attack Type | Movement Speed | Attack Speed | Range | Patrol Radius | Trigger Radius | Damage Radius | Pushback Range |
|---|---|---|---|---|---|---|---|---|
| Ground & Air | Splash Damage | 8 | 2.5s | 7 tiles | 14 tiles | 15 tiles | ?? | 1.5 tiles |

**Statistics**

| Level | Damage per Second | Damage per Hit | Hitpoints | Post-Hit Tile Range | Upgrade Cost | Upgrade Time |
|---|---|---|---|---|---|---|
| 1 | 230 | 575 | 8,000 | 5 tiles | N/A | N/A |
| 2 | 260 | 650 | 9,000 | 5 tiles | 18,000,000 | 7d |
| 3 | 290 | 725 | 10,000 | 5 tiles | 22,000,000 | 9d |
| 4 | 320 | 800 | 11,000 | 6 tiles | 26,000,000 | 11d |
| 5 | 350 | 875 | 12,000 | 6 tiles | 28,000,000 | 13d |

## Client comparison

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| damageRadius | all | ?? (undocumented) | PenetratingRadius 180 (1.8 tiles) | client value fills the wiki gap |

**Interpretation of client columns**

- Verified equal (wiki vs client): `dps@1`, `damagePerHit@1`, `hitpoints@1`, `postHitTileRange@1`, `dps@2`, `damagePerHit@2`, `hitpoints@2`, `upgradeCost@2`, `upgradeTime@2`, `postHitTileRange@2`, `dps@3`, `damagePerHit@3`, `hitpoints@3`, `upgradeCost@3`, `upgradeTime@3`, `postHitTileRange@3`, `dps@4`, `damagePerHit@4`, `hitpoints@4`, `upgradeCost@4`, `upgradeTime@4`, `postHitTileRange@4`, `dps@5`, `damagePerHit@5`, `hitpoints@5`, `upgradeCost@5`, `upgradeTime@5`, `postHitTileRange@5`, `movementSpeed`, `attackSeconds`, `range`, `triggerRadius`, `patrolRadius`, `pushbackRange`.
- characters.csv `Guardian Logger`: `DPS` 230..350, `Hitpoints` 8000..12000, `AttackSpeed` 2500 (`CoolDownOverride` 1300), `AttackRange` 700, `Speed` 100, `Pushback` 150, `PenetratingProjectile` TRUE, `PenetratingRadius` 180, `PenetratingExtraRange` 500/500/500/600/600, projectile `LoggerProjectile`, `AlertRadius` 1500, `MaxSearchRadiusForDefender` 1400.
- The client already contains the July 14, 2026 balance change (pushback 150, post-hit 5/6 tiles), which dates this client snapshot to between July 14 and August 31, 2026.
- guardians.csv `Logger`: `ActivationRadius` 16, `PatrolRadius` 350; only the first row carries `Level` (later rows only set CharacterLevels).
