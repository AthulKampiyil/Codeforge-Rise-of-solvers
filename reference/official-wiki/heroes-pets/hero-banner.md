# Hero Banner

- **Source:** https://clashofclans.fandom.com/wiki/Hero_Banner
- **Wiki revision:** 622708 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** building
- **Client record:** none (see Client comparison)

> 2x2 untargetable defensive post: each banner holds one defending hero; banners come from Hero Hall slots (1/2/3/4 at TH7/9/11/13).

## Mechanics

- Not bought in the shop: available banners equal the defensive hero slots (wiki building box: 1 at TH7, 2 at TH9, 3 at TH11, 4 at TH13). All available banners must be placed before upgrading the Town Hall.
- Each banner is occupied by exactly one hero, who patrols around it and returns there when lured too far.
- Banners have no hitpoints, cannot be targeted and do not count toward destruction percentage, but — unlike other untargetable objects — they block troop deployment in a one-tile margin around them.
- Defending heroes walk, except the Minion Prince and Dragon Duke who fly; the Grand Warden always defends in ground mode. Defending heroes use no equipment.
- TH4–6 have no banner: the King's slot there is attack-only.

## Client comparison

**Client columns and interpretation notes**

- There is no `buildings.csv` record for banners. The banner object is `hero_flags.csv` → `EmptyHeroFlag` (`Width`/`Height` 2, `PassableSubtilesAtEdge` 2, `IsFadedAndPassableInCombat=FALSE`); per-hero art comes from `heroes.csv` `HeroFlagExportName`, `HeroFlagBaseExportName`, `HeroBannerPrefix`.
- Legacy altars (`Barbarian King Altar`, `Archer Queen Altar`, `Grand Warden Altar`, `Royal Champion Altar`) remain as `NonFunctional` 3x3 buildings with 250 HP and `IsHeroBarrack=TRUE`; they are not placed in current villages (no `townhall_levels` counts).
- Banner counts follow `globals.TAVERN_LEVEL_TO_HERO_SLOT_COUNT` together with the Hero Hall level the TH allows; the per-TH availability therefore equals the Hero Hall gates.
- Defensive patrol/aggro radii are per hero (`PatrolRadius`, `AlertRadius`, `MaxSearchRadiusForDefender`); `globals.HERO_DEFENCE_AUTO_HEAL=TRUE`.

**Mismatches / ambiguities**

- `deploymentMargin`: wiki **blocks deployment one tile around the banner** vs client **hero_flags.EmptyHeroFlag PassableSubtilesAtEdge 2** — margin semantics not directly encoded; verify in engine
