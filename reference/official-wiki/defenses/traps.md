# Traps

- Source: [Traps/Home Village](https://clashofclans.fandom.com/wiki/Traps/Home_Village) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `622056`; retrieved 2026-09-15
- Category: mechanic
- Client reference (18.400.21): `traps.csv` -> `(all trap rows)`

## Mechanics

- Traps stay hidden until an attacking unit enters their trigger radius (exception: the Giga Bomb is always visible).
- After triggering, a trap must be re-armed; re-arming is free and automatic on login and needs no Builder. A triggered but not re-armed trap does not exist for the next attacker (invisible and inactive).
- In Clan Wars, Legend League and Friendly Battles traps are active for every attack regardless of re-arm state.
- Traps have no no-deploy (red) zone, so troops may be deployed on top of them; traps can sit inside other buildings' red zones. Traps being upgraded are visible to attackers (and troops may still be deployed on them).
- Traps are not buildings: they do not need to be destroyed and do not count toward destruction percentage.
- Placing and re-arming needs no Builder; upgrading does. Each trap is upgraded individually; trap upgrades are cheap and short compared with buildings.
- If a Bomb or Giant Bomb has been triggered and the battle ends before it explodes, it remains armed.
- The Hidden Tesla is a hidden defensive building, not a trap (it never needs re-arming).
- Permanent Home Village traps: Bomb, Spring Trap, Air Bomb, Giant Bomb, Seeking Air Mine, Skeleton Trap, Tornado Trap, Giga Bomb; temporary event traps have a single level and disappear after the event.

## Level table

## Client comparison

No mismatches found in the compared fields.

**Interpretation of client columns**

- traps.csv rows carry `TriggerRadius`, `DamageRadius`, `AirTrigger`/`GroundTrigger`, `MinTriggerHousingLimit`, `ActionFrame` (arming delay), `Passable` TRUE (walkable/deployable), `Visible` (Giga Bomb only), `Pushback`/`PushbackHousingLimit`, `EjectVictims`/`EjectHousingLimit` (spring), and `Spell`/`Spawned*` for effect traps.
- Trap counts per Town Hall live in townhall_levels.csv (one column per trap name); trap level-1 rows use TownHallLevel 1 except the Tornado Trap and Giga Bomb.
- Units that cannot trigger traps are character-side (`TriggersTraps` column on characters.csv).
