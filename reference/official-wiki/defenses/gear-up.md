# Gear Up (synthesized)

- No standalone 'Gear Up' page exists (search returned only user guides and the Builder Base pages); this entry is synthesized from the Home Village defense pages below.
- Sources (retrieved 2026-09-15): [Cannon/Home Village](https://clashofclans.fandom.com/wiki/Cannon/Home_Village) rev `624457`; [Archer Tower/Home Village](https://clashofclans.fandom.com/wiki/Archer_Tower/Home_Village) rev `624456`; [Mortar](https://clashofclans.fandom.com/wiki/Mortar) rev `625094`
- Category: mechanic

## Mechanics

- Gearing up converts a Home Village defense into a permanent alternate-attack version. It is done by the **Master Builder** (from the Builder Base), who must be free, and requires the matching Builder Base defense at a given level.
- Cannon -> Burst mode (needs Double Cannon level 4, BH4; Cannon level 7, TH6); Archer Tower -> Fast Attack mode (needs BB Archer Tower level 6, BH6; Archer Tower level 10, TH8); Mortar -> Burst mode (needs Multi Mortar level 8, BH8; Mortar level 8, TH10). Costs/times: 1,000,000 Gold / 2 days; 3,000,000 / 7 days; 6,000,000 / 14 days.
- A geared-up building keeps its level progression (same HP/costs) but uses its alternate attack stats; there is no toggle back. The Mortar is the only geared-up defense that can also be supercharged.
- Geared-up Cannon/Archer Tower cannot be used for the Ricochet Cannon / Multi-Archer Tower merges but are required for the Multi-Gear Tower merge (TH17).
- Achievements 'High Gear' reward gearing up 1 / 2 / 3 buildings.

## Level table

| Defense | Mode | Needs (Builder Base) | HV level (TH) | Cost | Time | Effect | Client GearUp columns |
|---|---|---|---|---|---|---|---|
| Cannon | Burst mode | Double Cannon level 4 (BH4) | 7 (TH6) | 1,000,000 | 2d | 4-ball bursts, 0.192 s apart, 1.6 s between bursts; range 9 -> 7; DPS x2; per-ball +36% | `BB Double Cannon`, req `3`, cost `1000000`, time `2880` min, count `Cannon_gearup`=1 |
| Archer Tower | Fast Attack mode | Archer Tower level 6 (BH6) | 10 (TH8) | 3,000,000 | 7d | fire interval 0.5 -> 0.25 s; range 10 -> 8; DPS x2 | `BB Archer Tower`, req `5`, cost `3000000`, time `10080` min, count `Archer Tower_gearup`=1 |
| Mortar | Burst mode | Multi Mortar level 8 (BH8) | 8 (TH10) | 6,000,000 | 14d | 3-shell bursts, 0.5 s apart; range unchanged (4-11); per-shell damage reduced, DPS up | `BB Multi Mortar`, req `7`, cost `6000000`, time `20160` min, count `Mortar_gearup`=1 |

## Client comparison

- `GearUpBuilding` (BB building name), `GearUpLevelRequirement` (**0-based** BB level: 3 = level 4, 5 = level 6, 7 = level 8), `GearUpResource` Gold and `GearUpTID` sit on level 1; `GearUpCost` and `GearUpTime` (**minutes**: 2880 / 10080 / 20160) appear on the first eligible Home Village level (7 / 10 / 8). All values agree with the wiki.
- The alternate attack lives in the `Alt*` columns of the same rows (`AltAttackMode`, `AltDPS`, `AltAttackSpeed`, `AltAttackRange`, `AltBurstCount`, `AltBurstDelay`, and `AltCoolDownOverride` on the Mortar only) - see cannon.md, archer-tower.md and mortar.md for per-level parity notes (notably the ambiguous geared-up Mortar per-shell damage).
- townhall_levels.csv has `Cannon_gearup`, `Archer Tower_gearup`, `Mortar_gearup` columns set to 1 at TH1 and never raised: at most one of each type can be geared up. (The wiki pages do not state a limit explicitly.)

No mismatches in gear-up requirements, costs or times.
