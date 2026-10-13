# Ores

- **Source:** https://clashofclans.fandom.com/wiki/Ores
- **Wiki revision:** 617303 (retrieved 2026-09-15 via the MediaWiki API)
- **Category:** mechanic
- **Client record:** none (see Client comparison)

> Shiny, Glowy and Starry Ore: Blacksmith-only currencies earned from Star Bonus, Clan Wars, Hero's Journey, Trader and offers; capped by Blacksmith level.

## Mechanics

- Three currencies used only for equipment upgrades: Shiny (every level), Glowy (every third level), Starry (Epic items only, every third level from level 9). Storage caps depend on Blacksmith level (10,000/1,000/200 → 50,000/5,000/1,000).
- Ores can be earned once the player is TH8+ and has built the Blacksmith (the Blacksmith page table shows capacity per level).
- Star Bonus: completing it from Skeleton league up gives all three ore types, scaling by league (Skeleton 1: 300 Shiny / 20 Glowy; Legend: 1,100 / 65 / 2 Starry); Star Bonus multipliers apply to ore (since April 2024).
- Clan Wars: every attack on a TH8+ base adds ore to the war bonus; at least one star gives the full amount for the enemy's Town Hall, otherwise a share proportional to destruction.
  - Starry Ore only from TH10+ bases; loss pays half; Clan Perk war-loot bonuses do not apply to ore.
  - Max per base: TH8 380/15/–, TH9 410/18/–, TH10 460/21/3, TH11 560/24/3, TH12 610/27/4, TH13 710/30/4, TH14 810/33/4, TH15 960/36/5, TH16–17 1,110/39/6.
- Trader: occasional ore stock, 10 free Glowy Ore per weekly refresh, Raid Medal deals (500 Shiny for 350, 50 Glowy for 300, 5 Starry for 350 medals; each twice per weekly refresh). Event shops and paid offers also sell ore.
- Gems can only cover a shortfall during an upgrade, at 1 gem per Shiny, 5 per Glowy, 35 per Starry.

### Wiki table(s): Star Bonus

| League | Shiny Ore Reward | Glowy Ore Reward | Starry Ore Reward |
|---|---|---|---|
| Skeleton 1 | 300 | 20 | - |
| Skeleton 2 | 325 | 21 | - |
| Skeleton 3 | 350 | 22 | - |
| Barbarian 4 | 375 | 23 | - |
| Barbarian 5 | 400 | 24 | - |
| Barbarian 6 | 425 | 25 | - |
| Archer 7 | 450 | 26 | - |
| Archer 8 | 475 | 27 | 1 |
| Archer 9 | 500 | 29 | 1 |
| Wizard 10 | 525 | 31 | 1 |
| Wizard 11 | 550 | 33 | 1 |
| Wizard 12 | 575 | 35 | 1 |
| Valkyrie 13 | 600 | 37 | 1 |
| Valkyrie 14 | 625 | 39 | 1 |
| Valkyrie 15 | 650 | 41 | 1 |
| Witch 16 | 675 | 43 | 1 |
| Witch 17 | 725 | 45 | 1 |
| Witch 18 | 775 | 47 | 1 |
| Golem 19 | 825 | 49 | 1 |
| Golem 20 | 875 | 51 | 1 |
| Golem 21 | 900 | 53 | 1 |
| P.E.K.K.A 22 | 925 | 54 | 1 |
| P.E.K.K.A 23 | 950 | 55 | 1 |
| P.E.K.K.A 24 | 963 | 56 | 1 |
| Titan 25 | 1,000 | 57 | 1 |
| Titan 26 | 1,010 | 58 | 1 |
| Titan 27 | 1,020 | 59 | 1 |
| Dragon 28 | 1,030 | 60 | 1 |
| Dragon 29 | 1,040 | 61 | 1 |
| Dragon 30 | 1,050 | 62 | 1 |
| Electro 31 | 1,060 | 62 | 2 |
| Electro 32 | 1,070 | 63 | 2 |
| Electro 33 | 1,080 | 64 | 2 |
| Legend | 1,100 | 65 | 2 |


### Wiki table(s): Clan Wars

| Town Hall Level | Max Available Shiny Ore | Max Available Glowy Ore | Max Available Starry Ore |
|---|---|---|---|
| 8 | 380 | 15 | - |
| 9 | 410 | 18 | - |
| 10 | 460 | 21 | 3 |
| 11 | 560 | 24 | 3 |
| 12 | 610 | 27 | 4 |
| 13 | 710 | 30 | 4 |
| 14 | 810 | 33 | 4 |
| 15 | 960 | 36 | 5 |
| 16-17 | 1,110 | 39 | 6 |


## Client comparison

**Matches (every wiki level checked against the inherited client rows)**

- Gem price per missing ore 1 / 5 / 35 = `globals` COMMON_ORE_DIAMOND_COST_1/10/100 = 1/10/100, RARE_ORE_DIAMOND_COST 5, EPIC_ORE_DIAMOND_COST 35
- War result scaling: `globals` ALLIANCE_WAR_ORE_LOOT_BONUS_PERCENT_WIN/LOSE/DRAW = 100/50/75 %

**Client columns and interpretation notes**

- `resources.csv` names: `CommonOre` (Shiny), `RareOre` (Glowy), `EpicOre` (Starry). Caps: `buildings[Blacksmith].MaxStoredCommonOre/RareOre/EpicOre`.
- War ore: `townhall_levels.csv` `WarPrizeCommonOreCap`, `WarPrizeRareOreCap`, `WarPrizeEpicOreCap`; result multipliers `ALLIANCE_WAR_ORE_LOOT_BONUS_PERCENT_WIN/LOSE/DRAW` 100/50/75.
- Star Bonus ore: `league_tiers.csv` has `CommonOreRewardStarBonus`/`RareOreRewardStarBonus`/`EpicOreRewardStarBonus` columns but only `Unranked` is filled (0); the legacy `leagues.csv` holds the pre-2025 table (Bronze III 125/6 … Legendary 1,000/54/0). The wiki's current 34-tier table cannot be verified from decoded files.

**Mismatches / ambiguities**

- `clanWar.maxAvailableStarryOre` (level TH14): wiki **4** vs client **5** — townhall_levels.WarPrizeEpicOreCap
- `clanWar.availability` (level TH6): wiki **not listed (wiki: ore from war only vs TH8+)** vs client **100/0/0** — client has non-zero war ore caps below TH8
- `clanWar.availability` (level TH7): wiki **not listed (wiki: ore from war only vs TH8+)** vs client **150/10/0** — client has non-zero war ore caps below TH8
- `clanWar.drawMultiplier`: wiki **4/7 of the win amount** vs client **75% (ALLIANCE_WAR_ORE_LOOT_BONUS_PERCENT_DRAW)** — loss = half agrees (LOSE 50)
- `starBonus.table`: wiki **34 Skeleton→Legend tiers (e.g. Legend 1,100/65/2)** vs client **league_tiers ore columns blank; legacy leagues.csv has 22 tiers (Legendary 1,000/54/0)** — current Star Bonus ore rewards are not present in the decoded client tables
