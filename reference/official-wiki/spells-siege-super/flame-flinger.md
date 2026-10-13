# Flame Flinger

- **Source:** https://clashofclans.fandom.com/wiki/Flame_Flinger
- **Wiki revision:** 624810; retrieved 2026-09-15
- **Category:** `siege-machine`
- **Client row:** `characters.json` -> `Flame Flinger` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Workshop level 6 (Town Hall 14). Housing 1. Researched with Elixir. Needs Clan Castle 8 (Town Hall 12+) to be received (TH11 and below removed Sept 2024).
- Slow ground catapult (speed 6) that targets defenses from long range (wiki: 11 tiles) and lobs a burst of three Fire Spirit projectiles every 5 s.
- Each impact deals direct damage and sets a burning area that damages enemy ground units and buildings over time with a Poison-like ramp up to the level's max flame DPS (80-130). Fire deals extra damage to Walls.
- Burn duration: the wiki summary says 22 s, its history says it was raised from 20 to 30 s in June 2022; the client burn lasts 30 s (see notes).
- Loses about 17 HP per second (lifetime 100 s at L1 to ~123.5 s at L5). HP 1,700-2,100, so long-range defenses and traps are its main threat.
- Carries the attacker's Clan Castle troops and releases them where it is destroyed (by damage, by reaching/finishing its objective, or by the player tapping release). It can be deployed with an empty Clan Castle, in which case nothing comes out.
- Like every Siege Machine it ignores the attacker's spells (no Rage/Heal/Haste/etc.) and cannot be healed by Healers, cloned or recalled; Grand Warden auras such as Eternal Tome (and Life Gem where noted) still apply.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | Defenses |
| attackType | Area Splash (Ground Only) |
| rangeTiles | 11 |
| housingSpace | 1 |
| movementSpeed | 6 |
| burstIntervalSeconds | 5 |
| shotsPerBurst | 3 |
| hpDecayPerSecond | 17 |
| workshopLevel | 6 |

## Level table

| Level | DPS | Damage / hit | Flame max DPS | Lifetime (s) | HP | Research cost | Research time | Lab level |
|---|---|---|---|---|---|---|---|---|
| 1 | 124 (client 127) | 225 | 80 | 100 | 1,700 | N/A | N/A | N/A |
| 2 | 137 (client 141) | 250 | 95 | 105.88 | 1,800 | 5,500,000 | 3d | 10 |
| 3 | 151 (client 155) | 275 | 105 | 111.76 | 1,900 | 8,000,000 | 4d | 10 |
| 4 | 165 (client 169) | 300 | 120 | 117.64 | 2,000 | 10,000,000 | 7d | 11 |
| 5 | 179 (client 184) | 325 | 130 | 123.52 | 2,100 | 18,000,000 | 12d | 14 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- burst -> `AttackSpeed` 5000, `BurstCount` 3, `BurstDelay` 128 ms, `Projectile` FireCatapultProjectile1..5
- burn area -> projectile `HitSpell` FireSpiritExplosion (level = machine level): `PoisonDPS` 80..130, `PoisonIncreaseSlowly` TRUE, `Radius` 250, `NumberOfHits` 75 x `TimeBetweenHitsMS` 400 = 30 s, `PreferredTarget` Wall x`PreferredTargetDamageMod` 25
- direct hit -> `DPS` 127..184 (no per-projectile damage column), `DamageRadius` 100, `DamageMultiplierTarget` Wall / `DamageMultiplierPercent` 800
- range -> `AttackRange` 1005 (10.05 tiles)
- decay -> `LoseHpPerTick` 17 / 1000 ms
- speed -> `Speed` 80 = 6.4 in-game (wiki 6)

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `workshopLevel`: wiki 6 vs client 6 (`BarrackLevel`)
- MATCH `movementSpeed`: wiki 6 vs client 6 (`trunc(Speed/12.5)`)
- MATCH `burstIntervalSeconds`: wiki 5 vs client 5 (`AttackSpeed/1000`)
- MATCH `shotsPerBurst`: wiki 3 vs client 3 (`BurstCount`)
- MATCH `hpDecayPerSecond`: wiki 17 vs client 17 (`LoseHpPerTick`)
- MATCH `hitpoints` at levels 1-5 (`Hitpoints`)
- MISMATCH `dps` (5 of 5 levels; `DPS`): L1: wiki 124 vs client 127; L2: wiki 137 vs client 141; L3: wiki 151 vs client 155; L4: wiki 165 vs client 169; L5: wiki 179 vs client 184
- MATCH `flameMaxDps` at levels 1-5 (`FireSpiritExplosion[level].PoisonDPS`)
- MATCH `lifetimeSeconds` at levels 1-5 (`Hitpoints/LoseHpPerTick`)
- MATCH `researchCost` at levels 2-5 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-5 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-5 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- DPS mismatch at every level (wiki 124/137/151/165/179 vs client `DPS` 127/141/155/169/184).
- Per-projectile damage: the wiki's 225-325 is one third of a burst. It equals client `DPS` x ~5.32 s / 3 (e.g. 127 x 5.315 / 3 = 225) - i.e. the burst cycle including `BurstDelay` - but the exact client formula is not recoverable from the tables. Treat as ambiguous.
- Range mismatch: wiki 11 tiles vs client `AttackRange` 1005 (10.05 tiles).
- Burn duration: client 30 s (75 x 400 ms) agrees with the wiki history, not the wiki summary's 22 s.
- Wall damage: two client multipliers exist - x8 on the machine (`DamageMultiplierPercent` 800) and x25 on the burn spell (`PreferredTargetDamageMod` 25); the wiki only says fire does 'additional damage' to Walls.
