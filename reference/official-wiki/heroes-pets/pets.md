# Pets

- **Source:** https://clashofclans.fandom.com/wiki/Pets
- **Wiki revision:** 621456 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** mechanic
- **Client record:** none (see Client comparison)

> Hub page: twelve Pet House pets that accompany a hero on attack; immortal between battles, one per hero, never defend.

## Mechanics

- Pets: L.A.S.S.I, Electro Owl, Mighty Yak, Unicorn, Frosty, Diggy, Poison Lizard, Phoenix, Spirit Fox, Angry Jelly, Sneezy, Greedy Raven (Pet House levels 1–12).
- Each pet is assigned to one hero and is deployed only alongside that hero; a pet is summoned once per battle, needs no regeneration after being defeated and is available whenever it is not upgrading.
- Pets do not defend. Each has a special ability (see individual pages).
- For housing-space counters pets count as 20 (Dark Crown) and they are ignored by the Monolith Arrow counter; their Warden weight is 3.

## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- All twelve wiki pets exist in `pets.csv` (L.A.S.S.I = `LASSI`, Greedy Raven = `Crow`)

**Client columns and interpretation notes**

- `pets.csv`: `HousingSpace` 20 for all pets, `LaboratoryLevel` = Pet House requirement, `UpgradeResource` DarkElixir, `LeashLength` and `PreferMasterTarget` control following, `HeroDeathAbility*` columns control behaviour when the hero falls.
- Pet records not on the wiki: `Phoenix Egg` (egg form), `Stork`, `JumpAuraPet`, `SpeedupPet`, `Turtle`, `AirSplitPetSpawnRemoved` (prototypes).

**Mismatches / ambiguities**

- `clientOnlyPetRecords`: wiki **not listed** vs client **Phoenix Egg** — helper/prototype records in pets.csv (Phoenix Egg is the Phoenix's egg form)
