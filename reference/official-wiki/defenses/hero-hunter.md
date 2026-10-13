# Hero Hunter

- Source: [Hero Hunter](https://clashofclans.fandom.com/wiki/Hero_Hunter) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `625024`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `seasonal_defense_modules.csv` -> `Headhunter Tower (HeadhunterTowerHPModule / AttackModule / EffectModule)`

## Mechanics

- Crafted Defense chosen at the Crafting Station (Phase 4). 3x3.
- Range 9.5 tiles, one card every 0.6 s, single target, ground and air.
- Favorite target: **Heroes**, which take **2x damage** (it does not drop its current target the moment a Hero enters range).
- Each hit applies a 3-second Poison effect (slow plus poison damage, like a Poison Spell of the module's level; like Headhunter poison it fades quickly, so the card damage dominates).
- Modules: Hitpoints 1,600 -> 6,000; Damage 145 -> 385 DPS (87 -> 231 per card; 290 -> 770 DPS vs Heroes); Poison Spell level 3 -> 12.
- Cosmetic: sword cards against troops, large crown cards against Heroes.

### Recent balance notes (from the page's History table)

- August 1, 2026: added for Phase 4 (in the game files since June 16, 2026).

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH11: 1

Size: 3x3

**Common Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted | Favorite Target | Poison Duration |
|---|---|---|---|---|---|
| 9.5 Tiles | 0.6s | Single Target | Ground & Air | Heroes (2x Damage) | 3s |

**Module 1: Hitpoints**

| Level | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|
| 1 | 1,600 | N/A | N/A | N/A | 11 |
| 2 | 1,800 | 40,000 | 8h | 169 | 12 |
| 3 | 2,150 | 50,000 | 10h | 189 | 13 |
| 4 | 2,500 | 60,000 | 11h | 198 | 14 |
| 5 | 2,700 | 70,000 | 13h | 216 | 15 |
| 6 | 3,150 | 80,000 | 19h | 261 | 16 |
| 7 | 3,900 | 90,000 | 1d 22h | 406 | 17 |
| 8 | 4,400 | 100,000 | 3d 11h | 546 | 18 |
| 9 | 5,200 | 110,000 | 6d 4h | 729 | 18 |
| 10 | 6,000 | 120,000 | 10d | 929 | 18 |

**Module 2: Damage**

| Level | Damage per Second | Damage per Hit | DPS on Heroes | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 145 | 87 | 290 | N/A | N/A | N/A | 11 |
| 2 | 155 | 93 | 310 | 3,000,000 | 4h | 120 | 12 |
| 3 | 170 | 102 | 340 | 4,000,000 | 6h | 146 | 13 |
| 4 | 185 | 111 | 370 | 5,000,000 | 8h | 169 | 14 |
| 5 | 195 | 117 | 390 | 6,000,000 | 10h | 189 | 15 |
| 6 | 210 | 126 | 420 | 7,000,000 | 16h | 240 | 16 |
| 7 | 260 | 156 | 520 | 8,000,000 | 1d 16h | 379 | 17 |
| 8 | 325 | 195 | 650 | 9,000,000 | 3d 2h | 516 | 18 |
| 9 | 350 | 210 | 700 | 10,000,000 | 5d 6h | 673 | 18 |
| 10 | 385 | 231 | 770 | 11,000,000 | 9d | 881 | 18 |

**Module 3: Poison Level**

| Level | Poison Spell Level | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|
| 1 | 3 | N/A | N/A | N/A | 11 |
| 2 | 4 | 3,500,000 | 6h | 146 | 12 |
| 3 | 5 | 4,500,000 | 8h | 169 | 13 |
| 4 | 6 | 5,500,000 | 10h | 189 | 14 |
| 5 | 7 | 6,500,000 | 12h | 207 | 15 |
| 6 | 8 | 7,500,000 | 18h | 254 | 16 |
| 7 | 9 | 8,500,000 | 1d 19h | 393 | 17 |
| 8 | 10 | 10,000,000 | 3d 8h | 536 | 18 |
| 9 | 11 | 11,500,000 | 5d 18h | 704 | 18 |
| 10 | 12 | 13,000,000 | 9d 12h | 905 | 18 |

## Client comparison

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| townHall [Module 1: Hitpoints] | 1 | 11 | 12 | HeadhunterTowerHPModule.TownHallLevel |
| townHall [Module 2: Damage] | 1 | 11 | 12 | HeadhunterTowerAttackModule.TownHallLevel |
| townHall [Module 3: Poison Level] | 1 | 11 | 12 | HeadhunterTowerEffectModule.TownHallLevel |

**Interpretation of client columns**

- Verified equal (wiki vs client): `hitpoints [Module 1: Hitpoints]@1`, `cost [Module 1: Hitpoints]@2`, `buildSeconds [Module 1: Hitpoints]@2`, `xp [Module 1: Hitpoints]@2`, `townHall [Module 1: Hitpoints]@2`, `hitpoints [Module 1: Hitpoints]@2`, `cost [Module 1: Hitpoints]@3`, `buildSeconds [Module 1: Hitpoints]@3`, `xp [Module 1: Hitpoints]@3`, `townHall [Module 1: Hitpoints]@3`, `hitpoints [Module 1: Hitpoints]@3`, `cost [Module 1: Hitpoints]@4`, `buildSeconds [Module 1: Hitpoints]@4`, `xp [Module 1: Hitpoints]@4`, `townHall [Module 1: Hitpoints]@4`, `hitpoints [Module 1: Hitpoints]@4`, `cost [Module 1: Hitpoints]@5`, `buildSeconds [Module 1: Hitpoints]@5`, `xp [Module 1: Hitpoints]@5`, `townHall [Module 1: Hitpoints]@5`, `hitpoints [Module 1: Hitpoints]@5`, `cost [Module 1: Hitpoints]@6`, `buildSeconds [Module 1: Hitpoints]@6`, `xp [Module 1: Hitpoints]@6`, `townHall [Module 1: Hitpoints]@6`, `hitpoints [Module 1: Hitpoints]@6`, `cost [Module 1: Hitpoints]@7`, `buildSeconds [Module 1: Hitpoints]@7`, `xp [Module 1: Hitpoints]@7`, `townHall [Module 1: Hitpoints]@7`, `hitpoints [Module 1: Hitpoints]@7`, `cost [Module 1: Hitpoints]@8`, `buildSeconds [Module 1: Hitpoints]@8`, `xp [Module 1: Hitpoints]@8`, `townHall [Module 1: Hitpoints]@8`, `hitpoints [Module 1: Hitpoints]@8`, `cost [Module 1: Hitpoints]@9`, `buildSeconds [Module 1: Hitpoints]@9`, `xp [Module 1: Hitpoints]@9`, `townHall [Module 1: Hitpoints]@9`, `hitpoints [Module 1: Hitpoints]@9`, `cost [Module 1: Hitpoints]@10`, `buildSeconds [Module 1: Hitpoints]@10`, `xp [Module 1: Hitpoints]@10`, `townHall [Module 1: Hitpoints]@10`, `hitpoints [Module 1: Hitpoints]@10`, `dps [Module 2: Damage]@1`, `damagePerHit [Module 2: Damage]@1`, `dpsOnHeroes [Module 2: Damage]@1`, `cost [Module 2: Damage]@2`, `buildSeconds [Module 2: Damage]@2`, `xp [Module 2: Damage]@2`, `townHall [Module 2: Damage]@2`, `dps [Module 2: Damage]@2`, `damagePerHit [Module 2: Damage]@2`, `dpsOnHeroes [Module 2: Damage]@2`, `cost [Module 2: Damage]@3`, `buildSeconds [Module 2: Damage]@3`, `xp [Module 2: Damage]@3`, `townHall [Module 2: Damage]@3`, `dps [Module 2: Damage]@3`, `damagePerHit [Module 2: Damage]@3`, `dpsOnHeroes [Module 2: Damage]@3`, `cost [Module 2: Damage]@4`, `buildSeconds [Module 2: Damage]@4`, `xp [Module 2: Damage]@4`, `townHall [Module 2: Damage]@4`, `dps [Module 2: Damage]@4`, `damagePerHit [Module 2: Damage]@4`, `dpsOnHeroes [Module 2: Damage]@4`, `cost [Module 2: Damage]@5`, `buildSeconds [Module 2: Damage]@5`, `xp [Module 2: Damage]@5`, `townHall [Module 2: Damage]@5`, `dps [Module 2: Damage]@5`, `damagePerHit [Module 2: Damage]@5`, `dpsOnHeroes [Module 2: Damage]@5`, `cost [Module 2: Damage]@6`, `buildSeconds [Module 2: Damage]@6`, `xp [Module 2: Damage]@6`, `townHall [Module 2: Damage]@6`, `dps [Module 2: Damage]@6`, `damagePerHit [Module 2: Damage]@6`, `dpsOnHeroes [Module 2: Damage]@6`, `cost [Module 2: Damage]@7`, `buildSeconds [Module 2: Damage]@7`, `xp [Module 2: Damage]@7`, `townHall [Module 2: Damage]@7`, `dps [Module 2: Damage]@7`, `damagePerHit [Module 2: Damage]@7`, `dpsOnHeroes [Module 2: Damage]@7`, `cost [Module 2: Damage]@8`, `buildSeconds [Module 2: Damage]@8`, `xp [Module 2: Damage]@8`, `townHall [Module 2: Damage]@8`, `dps [Module 2: Damage]@8`, `damagePerHit [Module 2: Damage]@8`, `dpsOnHeroes [Module 2: Damage]@8`, `cost [Module 2: Damage]@9`, `buildSeconds [Module 2: Damage]@9`, `xp [Module 2: Damage]@9`, `townHall [Module 2: Damage]@9`, `dps [Module 2: Damage]@9`, `damagePerHit [Module 2: Damage]@9`, `dpsOnHeroes [Module 2: Damage]@9`, `cost [Module 2: Damage]@10`, `buildSeconds [Module 2: Damage]@10`, `xp [Module 2: Damage]@10`, `townHall [Module 2: Damage]@10`, `dps [Module 2: Damage]@10`, `damagePerHit [Module 2: Damage]@10`, `dpsOnHeroes [Module 2: Damage]@10`, `poisonSpellLevel [Module 3: Poison Level]@1`, `cost [Module 3: Poison Level]@2`, `buildSeconds [Module 3: Poison Level]@2`, `xp [Module 3: Poison Level]@2`, `townHall [Module 3: Poison Level]@2`, `poisonSpellLevel [Module 3: Poison Level]@2`, `cost [Module 3: Poison Level]@3`, `buildSeconds [Module 3: Poison Level]@3`, `xp [Module 3: Poison Level]@3`, `townHall [Module 3: Poison Level]@3`, `poisonSpellLevel [Module 3: Poison Level]@3`, `cost [Module 3: Poison Level]@4`, `buildSeconds [Module 3: Poison Level]@4`, `xp [Module 3: Poison Level]@4`, `townHall [Module 3: Poison Level]@4`, `poisonSpellLevel [Module 3: Poison Level]@4`, `cost [Module 3: Poison Level]@5`, `buildSeconds [Module 3: Poison Level]@5`, `xp [Module 3: Poison Level]@5`, `townHall [Module 3: Poison Level]@5`, `poisonSpellLevel [Module 3: Poison Level]@5`, `cost [Module 3: Poison Level]@6`, `buildSeconds [Module 3: Poison Level]@6`, `xp [Module 3: Poison Level]@6`, `townHall [Module 3: Poison Level]@6`, `poisonSpellLevel [Module 3: Poison Level]@6`, `cost [Module 3: Poison Level]@7`, `buildSeconds [Module 3: Poison Level]@7`, `xp [Module 3: Poison Level]@7`, `townHall [Module 3: Poison Level]@7`, `poisonSpellLevel [Module 3: Poison Level]@7`, `cost [Module 3: Poison Level]@8`, `buildSeconds [Module 3: Poison Level]@8`, `xp [Module 3: Poison Level]@8`, `townHall [Module 3: Poison Level]@8`, `poisonSpellLevel [Module 3: Poison Level]@8`, `cost [Module 3: Poison Level]@9`, `buildSeconds [Module 3: Poison Level]@9`, `xp [Module 3: Poison Level]@9`, `townHall [Module 3: Poison Level]@9`, `poisonSpellLevel [Module 3: Poison Level]@9`, `cost [Module 3: Poison Level]@10`, `buildSeconds [Module 3: Poison Level]@10`, `xp [Module 3: Poison Level]@10`, `townHall [Module 3: Poison Level]@10`, `poisonSpellLevel [Module 3: Poison Level]@10`.
- Base ability `SeasonalDefenseHeadhunterTower`: `AttackRange` 950, `PreferHeroes` TRUE, `HeroDamageMultiplier` 200, `ProjectileVariantByTargetType` Hero (card vs big card projectiles).
- Attack module: `AttackSpeed` 600, `DPS` 145..385. Effect module: `PoisonOnHitSpell` Poison, `PoisonOnHitDuration` 3000, `PoisonOnHitSpellLevel` 3..12.
- `HeadhunterTowerHPModule` (Module 1: Hitpoints): resource Dark Elixir, `StatType` HitPoints; `HeadhunterTowerAttackModule` (Module 2: Damage): resource Elixir, `StatType` DamagePerSecond; `HeadhunterTowerEffectModule` (Module 3: Poison Level): resource Gold, `StatType` PoisonOnHitSpellLevel.
