# Town Hall/Guardians

- Source: [Town Hall/Guardians](https://clashofclans.fandom.com/wiki/Town_Hall/Guardians) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `623106`; retrieved 2026-09-15
- Category: townhall-weapon
- Client reference (18.400.21): `guardians.csv` -> `InfernoArtillery (Longshot), MeleeAreaaaa (Smasher), Logger`

## Mechanics

- At Town Hall 18 the Town Hall has no weapon; instead one Guardian chosen by the player defends it (Longshot is the default). The Town Hall itself is no longer a defensive building at TH18.
- The selected Guardian stands on top of the Town Hall before battle and jumps down once an enemy enters its range (trigger radius per Guardian: Longshot 19, Smasher 14, Logger 15 tiles). If the Town Hall is destroyed first, it jumps down immediately.
- Guardians start at level 1 and are upgraded with Builders (max level 5); while upgrading a Guardian cannot defend in Multiplayer Battles but still defends in other modes.
- Not Heroes: Headhunters do not prefer them; defensive Rage (Spell Tower, Super Valkyrie) applies at full strength; Healers and Druids heal them at normal troop rates.
- Poison Spell (and Headhunter / Poison Lizard poison) applies only 30% of its effect (damage and slows).
- They have no housing space value, so defeating them gives nothing toward the Dark Crown.

### Recent balance notes (from the page's History table)

- April 27, 2026: Logger added; Poison now affects Guardians at 30%.
- November 17, 2025: Guardians introduced with Town Hall 18 (Longshot, Smasher).

## Level table

## Client comparison

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| housingSpace | all | none | characters.csv HousingSpace 25 for all three | client carries a housing value; the wiki says Guardians give no Dark Crown value - treat HousingSpace as non-scoring |
| TH18 heal weapon | 18 | not mentioned | weapons.csv Townhall18: TH18Heal, DPS -600, AttackRange 2000, OnlyHealDamagedTargets, UseHealthToHeal (50%) | not referenced by the Town Hall 18 row; possibly unused/experimental - do not implement without evidence |

**Interpretation of client columns**

- guardians.csv rows: `InfernoArtillery` -> Longshot (`isDefault` TRUE), `MeleeAreaaaa` -> Smasher, `Logger` -> Guardian Logger; plus deprecated prototypes (`Eagle`, `GigaInferno`, `Assassins`, `Reviver`, `Sniffer`, `Builder`, `Returner`) flagged `Deprecated` TRUE.
- Shared columns: `ActivationRadius`, `LeapTimeMS` 750, `LeapDistance` 3 (the jump down), `PatrolRadius` 350, `SpawnAmounts` 1, `UpgradeData` GuardianGeneral (upgrade_data.csv: Elixir 18M/22M/26M/28M, 7/9/11/13 days).
- Town Hall 18 row: `HousesGuardians` TRUE.
- Poison scaling: globals `GUARDIAN_POISON_SPEED_MULTIPLIER` 30, `GUARDIAN_POISON_ATTACK_SPEED_MULTIPLIER` 30.
