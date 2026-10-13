# Battle Blimp

- **Source:** https://clashofclans.fandom.com/wiki/Battle_Blimp
- **Wiki revision:** 624365; retrieved 2026-09-15
- **Category:** `siege-machine`
- **Client row:** `characters.json` -> `Battle Blimp` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Workshop level 2 (Town Hall 12). Housing 1. Researched with Elixir.
- Air machine that ignores Walls and flies directly toward the Town Hall, dropping bombs (area splash, every 1.5 s) on buildings it passes over; each bomb is roughly a Lightning Spell's worth of damage.
- Stats: speed 18; DPS 100-300; damage per bomb 150-450; death explosion 700-1,200; HP only 3,000-5,500, so it is easy to shoot down.
- Carries the attacker's Clan Castle troops and releases them where it is destroyed (by damage, by reaching/finishing its objective, or by the player tapping release). It can be deployed with an empty Clan Castle, in which case nothing comes out. With no Clan Castle troops it still bombs its route and can bait the Town Hall weapon.
- Like every Siege Machine it ignores the attacker's spells (no Rage/Heal/Haste/etc.) and cannot be healed by Healers, cloned or recalled; Grand Warden auras such as Eternal Tome (and Life Gem where noted) still apply. Life Gem affects it, Rage Gem does not.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | None |
| attackType | Area Splash |
| movementSpeed | 18 |
| attackSpeedSeconds | 1.5 |
| workshopLevel | 2 |

## Level table

| Level | DPS | Damage / attack | Death damage | HP | Research cost | Research time | Lab level |
|---|---|---|---|---|---|---|---|
| 1 | 100 | 150 | 700 | 3,000 | N/A | N/A | N/A |
| 2 | 140 | 210 | 800 | 3,500 | 2,500,000 | 2d | 10 |
| 3 | 180 | 270 | 900 | 4,000 | 3,500,000 | 3d | 10 |
| 4 | 220 | 330 | 1,000 | 4,500 | 6,500,000 | 7d | 11 |
| 5 | 260 | 390 | 1,100 | 5,000 | 10,000,000 | 9d | 13 |
| 6 | 300 | 450 | 1,200 | 5,500 | 26,000,000 | 13d 12h | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- bombs -> `CanAttackWhileMoving` TRUE, `Projectile` 'Siege Zeppelin Projectile', `DamageRadius` 300, `AttackSpeed` 1500, `DPS`
- death damage -> `DieDamage` 700..1200, `DieDamageRadius` 300, `DieDamageDelay` 700
- flight -> `IsFlying` TRUE, `Speed` 225 (18)
- destination -> `PreferredMovementTarget` Town Hall, `RetargetAfterHit` TRUE
- manual release -> SiegeMachineFlyerSelfDestruct
- unexplained -> `AttackCount` 20

**Automatic wiki-vs-client check**

- MATCH `workshopLevel`: wiki 2 vs client 2 (`BarrackLevel`)
- MATCH `movementSpeed`: wiki 18 vs client 18 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 1.5 vs client 1.5 (`AttackSpeed/1000`)
- MATCH `hitpoints` at levels 1-6 (`Hitpoints`)
- MATCH `dps` at levels 1-6 (`DPS`)
- MATCH `damagePerAttack` at levels 1-6 (`DPS*AttackSpeed/1000`)
- MATCH `deathDamage` at levels 1-6 (`DieDamage`)
- MATCH `researchCost` at levels 2-6 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-6 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-6 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- `AttackCount` = 20 has no wiki counterpart (possibly a cap on bomb drops or a legacy field); verify before using.
