# Troop Movement Speed

- **Source:** https://clashofclans.fandom.com/wiki/Troop_Movement_Speed
- **Wiki revision:** 624844 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** mechanic
- **Client record:** none (see Client comparison)

> Reference for converting internal speed values (tiles/s × 100) to the wiki's in-game speed numbers (internal ÷ 12.5); hero and pet rows only are relevant here.

## Mechanics

- Internal speed ÷ 100 = tiles per second; in-game (wiki) speed = internal ÷ 12.5, rounded for display. Example: King 200 → 16 (2 tiles/s), Queen 300 → 24, L.A.S.S.I 400 → 32, Poison Lizard 450 → 36.
- Equipment/pet speed boosts shown on the wiki are also internal ÷ 12.5, but the in-game display truncates (e.g. Barbarian Puppet +120 internal is shown as 9.5, +160 as 12.7).
- Subtroops on this page used by equipment/pets: Frostmite 24 (300), Booger 16 (200), Giant Giant 13 (165).

### Wiki table(s): Heroes and Pets

| Hero/Pet | In Game Speed | Internal Speed | Speed in Tiles/Second |
|---|---|---|---|
| Barbarian King | 16 | 200 | 2 |
| Archer Queen | 24 | 300 | 3 |
| Minion Prince | 24 | 300 | 3 |
| Grand Warden | 16 | 200 | 2 |
| Royal Champion | 24 | 300 | 3 |
| L.A.S.S.I | 32 | 400 | 4 |
| Electro Owl | 20 | 250 | 2.5 |
| Mighty Yak | 20 | 250 | 2.5 |
| Unicorn | 16 | 200 | 2 |
| Frosty | 24 | 300 | 3 |
| Diggy | 32 | 400 | 4 |
| Poison Lizard | 36 | 450 | 4.5 |
| Phoenix | 16 | 200 | 2 |
| Spirit Fox | 24 | 300 | 3 |
| Angry Jelly | 16 | 200 | 2 |
| Sneezy | 24 | 300 | 3 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Barbarian King: internal 200 = `heroes[Barbarian King].Speed`; in-game 16 = 200/12.5
- Archer Queen: internal 300 = `heroes[Archer Queen].Speed`; in-game 24 = 300/12.5
- Minion Prince: internal 300 = `heroes[Minion Prince].Speed`; in-game 24 = 300/12.5
- Grand Warden: internal 200 = `heroes[Grand Warden].Speed`; in-game 16 = 200/12.5
- Royal Champion: internal 300 = `heroes[Royal Champion].Speed`; in-game 24 = 300/12.5
- L.A.S.S.I: internal 400 = `pets[LASSI].Speed`; in-game 32 = 400/12.5
- Electro Owl: internal 250 = `pets[Electro Owl].Speed`; in-game 20 = 250/12.5
- Unicorn: internal 200 = `pets[Unicorn].Speed`; in-game 16 = 200/12.5
- Frosty: internal 300 = `pets[Frosty].Speed`; in-game 24 = 300/12.5
- Diggy: internal 400 = `pets[Diggy].Speed`; in-game 32 = 400/12.5
- Poison Lizard: internal 450 = `pets[Poison Lizard].Speed`; in-game 36 = 450/12.5
- Phoenix: internal 200 = `pets[Phoenix].Speed`; in-game 16 = 200/12.5
- Spirit Fox: internal 300 = `pets[Spirit Fox].Speed`; in-game 24 = 300/12.5
- Angry Jelly: internal 200 = `pets[Angry Jelly].Speed`; in-game 16 = 200/12.5
- Sneezy: internal 300 = `pets[Sneezy].Speed`; in-game 24 = 300/12.5

**Client columns and interpretation notes**

- `heroes.csv`, `pets.csv`, `characters.csv` column `Speed`; boosts in `special_abilities.csv` `SpeedBoost` (internal units) and in spells `SpeedBoost` (already in wiki units for aura spells such as Heroic Torch).

**Mismatches / ambiguities**

- `Mighty Yak.internalSpeed`: wiki **250** vs client **300** — pets[Mighty Yak].Speed
- `Dragon Duke.speedRow`: wiki **not listed** vs client **250** — table omits this unit
- `Greedy Raven.speedRow`: wiki **not listed** vs client **350** — table omits this unit
