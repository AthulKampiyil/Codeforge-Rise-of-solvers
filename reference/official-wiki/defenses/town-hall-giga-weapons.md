# Town Hall/Giga Weapons

- Source: [Town Hall/Giga Weapons](https://clashofclans.fandom.com/wiki/Town_Hall/Giga_Weapons) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `621287`; retrieved 2026-09-15
- Category: mechanic
- Client reference (18.400.21): `weapons.csv` -> `Townhall12, Townhall13, Townhall14, Townhall15, Townhall16`

## Mechanics

- The Giga Tesla (TH12) and Giga Inferno (TH13-16) are one weapon line built into the Town Hall; the Giga Inferno is treated as a direct upgrade of the Giga Tesla with a different look. Since October 6, 2025 none of them has upgrade levels.
- Shared rules: activates only when the Town Hall is damaged (troop or spell) or at 51% destruction; not triggered by units entering range. Before activation the Town Hall is not a defense for defense-targeting troops. While the Town Hall weapon is upgrading it does not defend or explode and is not targeted as a defense.
- Shared attack: range 10 tiles, up to 4 simultaneous targets, ground and air. TH12 zaps every 0.5 s (140 DPS, 70 per hit); TH13-16 use inferno beams ticking every 0.128 s (220 / 280 / 300 / 300 DPS per target) - lower per-hit damage, less overkill and faster retargeting.
- Death bomb when the Town Hall is destroyed: TH12 500 damage (4 tiles); TH13 700 (4 tiles) + 50% slow for 8 s; TH14 900 (4 tiles) + 12 s poison (180 DPS max, 50% slow); TH15 1,000 (4.5 tiles) + poison; TH16 1,100 (4.5 tiles) + poison.
- At TH17 the TH16 Giga Inferno is merged with a level 7 Eagle Artillery into the Inferno Artillery (see town-hall-inferno-artillery.md); its death bomb became the separate Giga Bomb trap.

### Recent balance notes (from the page's History table)

- October 6, 2025: all Giga weapon levels removed; TH13-16 build times cut; TH15 death damage 1,100 -> 1,000; TH16 cost 16M -> 15M.
- March 24, 2025 and earlier: repeated level cost/time reductions (now moot).

## Level table

**Statistics**

| Town Hall | Damage per Second per Target | Damage per Hit | Attack Speed | Damage when Destroyed | Death Damage Radius | Poison Max DPS | Speed Decrease | Attack Rate Decrease | Slowdown Time when Destroyed | Hitpoints |
|---|---|---|---|---|---|---|---|---|---|---|
| 12 | 140 | 70 | 0.5s | 500 | 4 tiles | N/A | N/A | N/A | N/A | 7,500 |
| 13 | 220 | 28.16 | 0.128s | 700 | 4 tiles | N/A | 50% | 50% | 8s | 8,200 |
| 14 | 280 | 35.84 | 0.128s | 900 | 4 tiles | 180 | 50% | 50% | 12s | 8,900 |
| 15 | 300 | 38.4 | 0.128s | 1,000 | 4.5 tiles | 180 | 50% | 50% | 12s | 9,600 |
| 16 | 300 | 38.4 | 0.128s | 1,100 | 4.5 tiles | 180 | 50% | 50% | 12s | 10,000 |

**Statistics**

| Range | Number of Targets | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 10 | 4 | Multiple Targets | Ground & Air |

## Client comparison

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| damageWhenDestroyed | 14 | 900 | 1000 | DieDamage |

**Interpretation of client columns**

- Verified equal (wiki vs client): `dpsPerTarget@12`, `damagePerHit@12`, `attackSeconds@12`, `damageWhenDestroyed@12`, `deathDamageRadius@12`, `hitpoints@12`, `dpsPerTarget@13`, `damagePerHit@13`, `attackSeconds@13`, `damageWhenDestroyed@13`, `deathDamageRadius@13`, `hitpoints@13`, `dpsPerTarget@14`, `damagePerHit@14`, `attackSeconds@14`, `deathDamageRadius@14`, `hitpoints@14`, `poisonMaxDps@14`, `dpsPerTarget@15`, `damagePerHit@15`, `attackSeconds@15`, `damageWhenDestroyed@15`, `deathDamageRadius@15`, `hitpoints@15`, `poisonMaxDps@15`, `dpsPerTarget@16`, `damagePerHit@16`, `attackSeconds@16`, `damageWhenDestroyed@16`, `deathDamageRadius@16`, `hitpoints@16`, `poisonMaxDps@16`.
- Per-TH weapon rows are single-level in weapons.csv (consistent with the removal of weapon levels). Death effects: `DieDamageSpell` TH13 Frost / TH14 Poison / TH15 Poison (TH15 and TH16 share it).
