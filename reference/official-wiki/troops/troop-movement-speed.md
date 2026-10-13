# Troop Movement Speed (mechanic)

- Source: [Troop Movement Speed](https://clashofclans.fandom.com/wiki/Troop_Movement_Speed) - revision `624844` - retrieved 2026-09-15
- Compared with pinned client 18.400.21 logic tables

## Mechanics

- The wiki distinguishes the in-game "Movement Speed" shown to players from the internal speed in the game files.
- In-game speed = internal speed / 12.5, rounded to the nearest whole number (half up): 220 -> 17.6 -> 18, 130 -> 10.4 -> 10, 160 -> 12.8 -> 13.
- The wiki believes internal speed is measured in 1/100 tiles per second, so 100 internal = 1 tile/s and 8 in-game points are about 1 tile/s. The client uses the same 1/100-tile unit for every distance column (e.g. Archer AttackRange 350 = 3.5 tiles, Electro Titan aura Radius 350 = 3.5 tiles, Ice Golem freeze Radius 750 = 7.5 tiles).
- Speed boosts (e.g. Rage) are added to the in-game number, not to the internal number (wiki); client Rage/Haste SpeedBoost values (20-32 / 28-56) are therefore in-game units.
- Values marked * on the wiki are derived from files and never shown in-game (Miner on defense, air-mode Skeleton Trap skeletons).

## Evidence

- 61/62 rows of the wiki Troops table satisfy in-game = round(internal / 12.5); 62/62 satisfy tiles/s = internal / 100.
- 56/62 rows whose unit exists in the client have client `Speed` equal to the wiki internal value.
- 39/40 troop pages in this dossier show a Movement Speed equal to round(client Speed / 12.5).

## Table (Home Village troops section) with client comparison

| Unit | Wiki in-game | Wiki internal | Wiki tiles/s | Client row | Client Speed | round(Speed/12.5) |
|---|---|---|---|---|---|---|
| Barbarian | 18 | 220 | 2.2 | Barbarian | 220 | 18 |
| Archer | 24 | 300 | 3 | Archer | 300 | 24 |
| Goblin | 32 | 400 | 4 | Goblin | 400 | 32 |
| Giant | 12 | 150 | 1.5 | Giant | 150 | 12 |
| Wall Breaker | 24 | 300 | 3 | Wall Breaker | 300 | 24 |
| Balloon | 10 | 130 | 1.3 | Balloon | 130 | 10 |
| Wizard | 16 | 200 | 2 | Wizard | 200 | 16 |
| Healer | 16 | 200 | 2 | Healer | 200 | 16 |
| Dragon | 16 | 200 | 2 | Dragon | 200 | 16 |
| P.E.K.K.A | 16 | 200 | 2 | PEKKA | 200 | 16 |
| Baby Dragon | 16 | 200 | 2 | Baby Dragon | 250 | 20 |
| Miner | 32 | 400 | 4 | Miner | 400 | 32 |
| Miner (on defense) | 20* | 250 | 2.5 | Miner + globals.UNDERGROUND_UNIT_GROUND_SPEED_PERCENTAGE | 280 | 22 |
| Electro Dragon | 12 | 150 | 1.5 | Electro Dragon | 160 | 13 |
| Yeti | 12 | 150 | 1.5 | Yeti | 150 | 12 |
| Yetimite | 24 | 300 | 3 | Yetimite | 300 | 24 |
| Dragon Rider | 20 | 250 | 2.5 | Dragon Rider | 250 | 20 |
| Electro Titan | 16 | 200 | 2 | Electro Titan | 200 | 16 |
| Root Rider | 12 | 150 | 1.5 | Root Rider | 150 | 12 |
| Thrower | 18 | 225 | 2.25 | Thrower | 220 | 18 |
| Meteor Golem | 12 | 150 | 1.5 | Meteor Golem | 150 | 12 |
| Meteor Golem/Meteormite | 16 | 200 | 2 | Meteormite | 200 | 16 |
| Minion | 32 | 400 | 4 | Minion | 400 | 32 |
| Hog Rider | 24 | 300 | 3 | Hog Rider | 300 | 24 |
| Valkyrie | 24 | 300 | 3 | Valkyrie | 300 | 24 |
| Golem | 12 | 150 | 1.5 | Golem | 150 | 12 |
| Golemite | 12 | 150 | 1.5 | Golemite | 150 | 12 |
| Witch | 12 | 150 | 1.5 | Witch | 150 | 12 |
| Lava Hound | 20 | 250 | 2.5 | Lava Hound | 250 | 20 |
| Bowler | 14 | 175 | 1.75 | Bowler | 175 | 14 |
| Ice Golem | 12 | 150 | 1.5 | Ice Golem | 150 | 12 |
| Headhunter | 24 | 300 | 3 | Headhunter | 300 | 24 |
| Druid | 24 | 300 | 3 | Druid | 300 | 24 |
| Furnace | 0 | 0 | 0 | Furnace | 0 | 0 |
| Super Barbarian | 20 | 250 | 2.5 | Super Barbarian | 250 | 20 |
| Super Archer | 24 | 300 | 3 | Super Archer | 300 | 24 |
| Super Giant | 12 | 150 | 1.5 | Super Giant | 150 | 12 |
| Sneaky Goblin | 32 | 400 | 4 | Sneaky Goblin | 400 | 32 |
| Super Wall Breaker | 28 | 350 | 3.5 | Super Wall Breaker | 350 | 28 |
| Rocket Balloon | 12 | 150 | 1.5 | Rocket Balloon | 150 | 12 |
| Super Wizard | 20 | 250 | 2.5 | Super Wizard | 250 | 20 |
| Super Dragon | 14 | 175 | 1.75 | Super Dragon | 175 | 14 |
| Inferno Dragon | 20 | 250 | 2.5 | Inferno Dragon | 225 | 18 |
| Super Miner | 32 | 400 | 4 | Super Miner | 400 | 32 |
| Super Yeti | 12 | 150 | 1.5 | Super Yeti | 150 | 12 |
| Super Yeti/Electromite | 24 | 300 | 3 | Electromite | 300 | 24 |
| Super Minion | 16 | 200 | 2 | Super Minion | 200 | 16 |
| Super Valkyrie | 20 | 250 | 2.5 | Super Valkyrie | 300 | 24 |
| Super Witch | 12 | 150 | 1.5 | Super Witch | 150 | 12 |
| Ice Hound | 20 | 250 | 2.5 | Ice Hound | 250 | 20 |
| Super Bowler | 14 | 175 | 1.75 | Super Bowler | 175 | 14 |
| Skeleton (spawned by Witches, Skeleton Spells or Ground mode Skeleton Traps) | 24 | 300 | 3 | Skeleton | 300 | 24 |
| Skeleton / (spawned by air mode Skeleton Traps) | 18* | 220 | 2.2 | Trap Air Skeleton | 220 | 18 |
| Big Boy (spawned by Super Witches) | 12 | 150 | 1.5 | Big Boy | 150 | 12 |
| Lava Pup (spawned by Lava Hounds) | 32 | 400 | 4 | Lava Pup | 400 | 32 |
| Ice Pup (spawned by Ice Hounds) | 32 | 400 | 4 | Ice Hound Pup | 400 | 32 |
| Bat (spawned by Bat Spells) | 57 | 700 | 7 | Spell Bat | 700 | 56 |
| Frostmites (spawned by Frosty) | 24 | 300 | 3 | BouncingFrostmite | 300 | 24 |
| Bear (transformed from Druid) | 20 | 250 | 2.5 | Bear | 250 | 20 |
| Furnace/Firemite (spawned by Furnace) | 32 | 400 | 4 | Firemite Spawn | 400 | 32 |
| Sneezy/Booger (spawned by Sneezy) | 16 | 200 | 2 | Booger | 200 | 16 |
| Giant Giant (spawned by Action Figure) | 13 | 165 | 1.65 | Giant Giant | 165 | 13 |

## Client comparison

### Mismatches

| Field | Wiki | Client | Note |
|---|---|---|---|
| internalSpeed | Baby Dragon: 200 (in-game 16) | Baby Dragon: 250 (in-game 20) | in scope |
| internalSpeed | Miner (on defense): 250 (in-game 20) | Miner + globals.UNDERGROUND_UNIT_GROUND_SPEED_PERCENTAGE: 280 (in-game 22) | in scope |
| internalSpeed | Electro Dragon: 150 (in-game 12) | Electro Dragon: 160 (in-game 13) | in scope |
| internalSpeed | Thrower: 225 (in-game 18) | Thrower: 220 (in-game 18) | in scope |
| internalSpeed | Inferno Dragon: 250 (in-game 20) | Inferno Dragon: 225 (in-game 18) | outside this dossier (reported for other categories) |
| internalSpeed | Super Valkyrie: 250 (in-game 20) | Super Valkyrie: 300 (in-game 24) | outside this dossier (reported for other categories) |
| wikiRounding | Bat (spawned by Bat Spells): in-game 57 | internal 700 / 12.5 = 56 | wiki row is not internal/12.5 rounded |
| troopPageMovementSpeed | headhunter: 32 | Speed 300 -> 24 -> 24 | troop page disagrees with client |

### Client columns

- `characters.Speed` (internal speed), `globals.UNDERGROUND_UNIT_GROUND_SPEED_PERCENTAGE`=70 (surface speed of underground units), `spells.Rage/Haste.SpeedBoost` (in-game units).
- Repo note: `src/game/extra-troops.ts` converts `Speed / 100` to tiles/s, which matches this conversion; the hand-written Balloon in `src/game/data.ts` uses 1.25 tiles/s (the old internal 125 / in-game 10) while the client says 130 = 1.3 tiles/s.
