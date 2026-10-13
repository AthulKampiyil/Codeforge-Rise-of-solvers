# Hot Candle

- Source: [Hot Candle](https://clashofclans.fandom.com/wiki/Hot_Candle) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `625219`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `seasonal_defense_modules.csv` -> `Inferno Candle (InfernoCandleHPModule / AttackModule / EffectModule)`

## Mechanics

- Crafted Defense chosen at the Crafting Station (Phase 4: August 1 - December 31, 2026). 3x3.
- Range 10.5 tiles, one volley every 0.5 s, ground and air. Each flame is single-target; flames can stack on the same unit.
- Target count decays: base form fires **6** flames; after the first melt **4**; after the second **3**. Per-flame damage does not change. The melt timer (effect module) sets when each stage starts: level 1 base form until 59 s, first decay 60-94 s, second decay from 95 s; level 10: 77 s / 78-131 s / 132 s+.
- Timer start: originally the time counted from scouting; a July 31, 2026 fix started it when a building is destroyed, and the August 31, 2026 update changed it to start when a troop is deployed (the intended behavior).
- Target spread in base form: 6+ units -> 6 nearest; 5 units -> nearest gets 2; 4 units -> two nearest get 2; 3 units -> 2 each; 2 units -> 3 each; 1 unit -> all 6. After melting it behaves like the Inferno Artillery (4) or Multi-Archer Tower (3).
- Modules: Hitpoints 1,600 -> 6,000; Damage 40 -> 125 per flame (80 -> 250 DPS per flame); Seconds Active (melt timings). Level caps by Town Hall: module level 1 TH11 ... levels 8-10 TH18.

### Recent balance notes (from the page's History table)

- August 31, 2026: melt timer now starts at first troop deployment.
- July 31, 2026: timer bug fix (started when a building is destroyed).

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH11: 1

Size: 3x3

**Common Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted | Number of Targets | Number of Targets | Number of Targets |
|---|---|---|---|---|---|---|
| Range | Attack Speed | Damage Type | Unit Type Targeted | Base Form | First Decay | Second Decay |
| 10.5 Tiles | 0.5s | Single Target | Ground & Air | 6 | 4 | 3 |

**Module 1: Hitpoints**

| Level | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|
| 1 | 1,600 | N/A | N/A | N/A | 11 |
| 2 | 1,800 | 3,500,000 | 6h | 146 | 12 |
| 3 | 2,150 | 4,500,000 | 8h | 169 | 13 |
| 4 | 2,500 | 5,500,000 | 10h | 189 | 14 |
| 5 | 2,700 | 6,500,000 | 12h | 207 | 15 |
| 6 | 3,150 | 7,500,000 | 18h | 254 | 16 |
| 7 | 3,900 | 8,500,000 | 1d 19h | 393 | 17 |
| 8 | 4,500 | 10,000,000 | 3d 8h | 536 | 18 |
| 9 | 5,200 | 11,500,000 | 5d 18h | 704 | 18 |
| 10 | 6,000 | 13,000,000 | 9d 12h | 905 | 18 |

**Module 2: Damage**

| Level | Damage per Second per Flame | Damage per Hit | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|
| 1 | 80 | 40 | N/A | N/A | N/A | 11 |
| 2 | 100 | 50 | 4,000,000 | 8h | 169 | 12 |
| 3 | 120 | 60 | 5,000,000 | 10h | 189 | 13 |
| 4 | 150 | 75 | 6,000,000 | 11h | 198 | 14 |
| 5 | 160 | 80 | 7,500,000 | 13h | 216 | 15 |
| 6 | 180 | 90 | 9,000,000 | 19h | 261 | 16 |
| 7 | 190 | 95 | 10,500,000 | 1d 22h | 406 | 17 |
| 8 | 210 | 105 | 12,000,000 | 3d 11h | 546 | 18 |
| 9 | 230 | 115 | 13,500,000 | 6d 4h | 729 | 18 |
| 10 | 250 | 125 | 15,000,000 | 10d | 929 | 18 |

**Module 3: Seconds Active**

| Level | Total Seconds Active | Total Seconds Active | Total Seconds Active | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| Level | Base Form | First Decay | Second Decay | Cost | Build Time | Experience Gained | Town Hall Level Required |
| 1 | 59s | 60s - 94s | 95s+ | N/A | N/A | N/A | 11 |
| 2 | 61s | 62s - 98s | 99s+ | 30,000 | 4h | 120 | 12 |
| 3 | 63s | 64s - 102s | 103s+ | 40,000 | 6h | 146 | 13 |
| 4 | 65s | 66s - 106s | 107s+ | 50,000 | 8h | 169 | 14 |
| 5 | 67s | 68s - 110s | 111s+ | 60,000 | 10h | 189 | 15 |
| 6 | 69s | 70s - 114s | 115s+ | 70,000 | 16h | 240 | 16 |
| 7 | 71s | 72s - 118s | 119s+ | 80,000 | 1d 16h | 379 | 17 |
| 8 | 73s | 74s - 122s | 123s+ | 90,000 | 3d 2h | 516 | 18 |
| 9 | 75s | 76s - 126s | 127s+ | 100,000 | 5d 6h | 673 | 18 |
| 10 | 77s | 78s - 131s | 132s+ | 110,000 | 9d | 881 | 18 |

## Client comparison

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| townHall [Module 1: Hitpoints] | 1 | 11 | 12 | InfernoCandleHPModule.TownHallLevel |
| townHall [Module 2: Damage] | 1 | 11 | 12 | InfernoCandleAttackModule.TownHallLevel |
| townHall [Module 3: Seconds Active] | 1 | 11 | 12 | InfernoCandleEffectModule.TownHallLevel |
| meltTimerStart | all | first troop deployment (Aug 31, 2026) | InfernoCandleEffectAbility ActiveAfterNumBuildingsDestroyed 1 | client has the July 31, 2026 behaviour (timer starts when a building is destroyed) |

**Interpretation of client columns**

- Verified equal (wiki vs client): `hitpoints [Module 1: Hitpoints]@1`, `cost [Module 1: Hitpoints]@2`, `buildSeconds [Module 1: Hitpoints]@2`, `xp [Module 1: Hitpoints]@2`, `townHall [Module 1: Hitpoints]@2`, `hitpoints [Module 1: Hitpoints]@2`, `cost [Module 1: Hitpoints]@3`, `buildSeconds [Module 1: Hitpoints]@3`, `xp [Module 1: Hitpoints]@3`, `townHall [Module 1: Hitpoints]@3`, `hitpoints [Module 1: Hitpoints]@3`, `cost [Module 1: Hitpoints]@4`, `buildSeconds [Module 1: Hitpoints]@4`, `xp [Module 1: Hitpoints]@4`, `townHall [Module 1: Hitpoints]@4`, `hitpoints [Module 1: Hitpoints]@4`, `cost [Module 1: Hitpoints]@5`, `buildSeconds [Module 1: Hitpoints]@5`, `xp [Module 1: Hitpoints]@5`, `townHall [Module 1: Hitpoints]@5`, `hitpoints [Module 1: Hitpoints]@5`, `cost [Module 1: Hitpoints]@6`, `buildSeconds [Module 1: Hitpoints]@6`, `xp [Module 1: Hitpoints]@6`, `townHall [Module 1: Hitpoints]@6`, `hitpoints [Module 1: Hitpoints]@6`, `cost [Module 1: Hitpoints]@7`, `buildSeconds [Module 1: Hitpoints]@7`, `xp [Module 1: Hitpoints]@7`, `townHall [Module 1: Hitpoints]@7`, `hitpoints [Module 1: Hitpoints]@7`, `cost [Module 1: Hitpoints]@8`, `buildSeconds [Module 1: Hitpoints]@8`, `xp [Module 1: Hitpoints]@8`, `townHall [Module 1: Hitpoints]@8`, `hitpoints [Module 1: Hitpoints]@8`, `cost [Module 1: Hitpoints]@9`, `buildSeconds [Module 1: Hitpoints]@9`, `xp [Module 1: Hitpoints]@9`, `townHall [Module 1: Hitpoints]@9`, `hitpoints [Module 1: Hitpoints]@9`, `cost [Module 1: Hitpoints]@10`, `buildSeconds [Module 1: Hitpoints]@10`, `xp [Module 1: Hitpoints]@10`, `townHall [Module 1: Hitpoints]@10`, `hitpoints [Module 1: Hitpoints]@10`, `damagePerHit [Module 2: Damage]@1`, `cost [Module 2: Damage]@2`, `buildSeconds [Module 2: Damage]@2`, `xp [Module 2: Damage]@2`, `townHall [Module 2: Damage]@2`, `damagePerHit [Module 2: Damage]@2`, `cost [Module 2: Damage]@3`, `buildSeconds [Module 2: Damage]@3`, `xp [Module 2: Damage]@3`, `townHall [Module 2: Damage]@3`, `damagePerHit [Module 2: Damage]@3`, `cost [Module 2: Damage]@4`, `buildSeconds [Module 2: Damage]@4`, `xp [Module 2: Damage]@4`, `townHall [Module 2: Damage]@4`, `damagePerHit [Module 2: Damage]@4`, `cost [Module 2: Damage]@5`, `buildSeconds [Module 2: Damage]@5`, `xp [Module 2: Damage]@5`, `townHall [Module 2: Damage]@5`, `damagePerHit [Module 2: Damage]@5`, `cost [Module 2: Damage]@6`, `buildSeconds [Module 2: Damage]@6`, `xp [Module 2: Damage]@6`, `townHall [Module 2: Damage]@6`, `damagePerHit [Module 2: Damage]@6`, `cost [Module 2: Damage]@7`, `buildSeconds [Module 2: Damage]@7`, `xp [Module 2: Damage]@7`, `townHall [Module 2: Damage]@7`, `damagePerHit [Module 2: Damage]@7`, `cost [Module 2: Damage]@8`, `buildSeconds [Module 2: Damage]@8`, `xp [Module 2: Damage]@8`, `townHall [Module 2: Damage]@8`, `damagePerHit [Module 2: Damage]@8`, `cost [Module 2: Damage]@9`, `buildSeconds [Module 2: Damage]@9`, `xp [Module 2: Damage]@9`, `townHall [Module 2: Damage]@9`, `damagePerHit [Module 2: Damage]@9`, `cost [Module 2: Damage]@10`, `buildSeconds [Module 2: Damage]@10`, `xp [Module 2: Damage]@10`, `townHall [Module 2: Damage]@10`, `damagePerHit [Module 2: Damage]@10`, `totalSecondsActiveBaseForm [Module 3: Seconds Active]@1`, `totalSecondsActiveFirstDecayMin [Module 3: Seconds Active]@1`, `totalSecondsActiveFirstDecayMax [Module 3: Seconds Active]@1`, `totalSecondsActiveSecondDecayMin [Module 3: Seconds Active]@1`, `cost [Module 3: Seconds Active]@2`, `buildSeconds [Module 3: Seconds Active]@2`, `xp [Module 3: Seconds Active]@2`, `townHall [Module 3: Seconds Active]@2`, `totalSecondsActiveBaseForm [Module 3: Seconds Active]@2`, `totalSecondsActiveFirstDecayMin [Module 3: Seconds Active]@2`, `totalSecondsActiveFirstDecayMax [Module 3: Seconds Active]@2`, `totalSecondsActiveSecondDecayMin [Module 3: Seconds Active]@2`, `cost [Module 3: Seconds Active]@3`, `buildSeconds [Module 3: Seconds Active]@3`, `xp [Module 3: Seconds Active]@3`, `townHall [Module 3: Seconds Active]@3`, `totalSecondsActiveBaseForm [Module 3: Seconds Active]@3`, `totalSecondsActiveFirstDecayMin [Module 3: Seconds Active]@3`, `totalSecondsActiveFirstDecayMax [Module 3: Seconds Active]@3`, `totalSecondsActiveSecondDecayMin [Module 3: Seconds Active]@3`, `cost [Module 3: Seconds Active]@4`, `buildSeconds [Module 3: Seconds Active]@4`, `xp [Module 3: Seconds Active]@4`, `townHall [Module 3: Seconds Active]@4`, `totalSecondsActiveBaseForm [Module 3: Seconds Active]@4`, `totalSecondsActiveFirstDecayMin [Module 3: Seconds Active]@4`, `totalSecondsActiveFirstDecayMax [Module 3: Seconds Active]@4`, `totalSecondsActiveSecondDecayMin [Module 3: Seconds Active]@4`, `cost [Module 3: Seconds Active]@5`, `buildSeconds [Module 3: Seconds Active]@5`, `xp [Module 3: Seconds Active]@5`, `townHall [Module 3: Seconds Active]@5`, `totalSecondsActiveBaseForm [Module 3: Seconds Active]@5`, `totalSecondsActiveFirstDecayMin [Module 3: Seconds Active]@5`, `totalSecondsActiveFirstDecayMax [Module 3: Seconds Active]@5`, `totalSecondsActiveSecondDecayMin [Module 3: Seconds Active]@5`, `cost [Module 3: Seconds Active]@6`, `buildSeconds [Module 3: Seconds Active]@6`, `xp [Module 3: Seconds Active]@6`, `townHall [Module 3: Seconds Active]@6`, `totalSecondsActiveBaseForm [Module 3: Seconds Active]@6`, `totalSecondsActiveFirstDecayMin [Module 3: Seconds Active]@6`, `totalSecondsActiveFirstDecayMax [Module 3: Seconds Active]@6`, `totalSecondsActiveSecondDecayMin [Module 3: Seconds Active]@6`, `cost [Module 3: Seconds Active]@7`, `buildSeconds [Module 3: Seconds Active]@7`, `xp [Module 3: Seconds Active]@7`, `townHall [Module 3: Seconds Active]@7`, `totalSecondsActiveBaseForm [Module 3: Seconds Active]@7`, `totalSecondsActiveFirstDecayMin [Module 3: Seconds Active]@7`, `totalSecondsActiveFirstDecayMax [Module 3: Seconds Active]@7`, `totalSecondsActiveSecondDecayMin [Module 3: Seconds Active]@7`, `cost [Module 3: Seconds Active]@8`, `buildSeconds [Module 3: Seconds Active]@8`, `xp [Module 3: Seconds Active]@8`, `townHall [Module 3: Seconds Active]@8`, `totalSecondsActiveBaseForm [Module 3: Seconds Active]@8`, `totalSecondsActiveFirstDecayMin [Module 3: Seconds Active]@8`, `totalSecondsActiveFirstDecayMax [Module 3: Seconds Active]@8`, `totalSecondsActiveSecondDecayMin [Module 3: Seconds Active]@8`, `cost [Module 3: Seconds Active]@9`, `buildSeconds [Module 3: Seconds Active]@9`, `xp [Module 3: Seconds Active]@9`, `townHall [Module 3: Seconds Active]@9`, `totalSecondsActiveBaseForm [Module 3: Seconds Active]@9`, `totalSecondsActiveFirstDecayMin [Module 3: Seconds Active]@9`, `totalSecondsActiveFirstDecayMax [Module 3: Seconds Active]@9`, `totalSecondsActiveSecondDecayMin [Module 3: Seconds Active]@9`, `cost [Module 3: Seconds Active]@10`, `buildSeconds [Module 3: Seconds Active]@10`, `xp [Module 3: Seconds Active]@10`, `townHall [Module 3: Seconds Active]@10`, `totalSecondsActiveBaseForm [Module 3: Seconds Active]@10`, `totalSecondsActiveFirstDecayMin [Module 3: Seconds Active]@10`, `totalSecondsActiveFirstDecayMax [Module 3: Seconds Active]@10`, `totalSecondsActiveSecondDecayMin [Module 3: Seconds Active]@10`.
- Base ability `SeasonalDefenseInfernoCandle`: `AttackRange` 1050, air+ground, projectile `Inferno Candle Projectile`. Attack module ability: `AttackSpeed` 500, `MultiTargets` TRUE, `NumMultiTargets` 6, `MultiHitsTarget` TRUE, `Damage` 40..125.
- Melt stages: `InfernoCandleEffectAbility` (+ `ExtraAbilities` Ability2/3 at the module level) - Ability2 `NumMultiTargets` 4 with `ActiveAfterTime` 60,000..78,000 ms, Ability3 `NumMultiTargets` 3 with 95,000..132,000 ms.
- `InfernoCandleHPModule` (Module 1: Hitpoints): resource Elixir, `StatType` HitPoints; `InfernoCandleAttackModule` (Module 2: Damage): resource Gold, `StatType` DamagePerSecond; `InfernoCandleEffectModule` (Module 3: Seconds Active): resource Dark Elixir, `StatType` TotalTimeAbilityActiveInBattle.
- Module level 1 `TownHallLevel` is 12 in the client vs TH11 on the wiki (TH11 access came with Phase 4).
