import dragon7 from '../../reference/garrison/dragon7.json' with { type: 'json' };
import balloon8 from '../../reference/garrison/balloon8.json' with { type: 'json' };
import commonDeath from '../../reference/garrison/dragon-death.json' with { type: 'json' };
import goblin7 from '../../reference/characters/goblin/goblin7.json' with { type: 'json' };
import archer9 from '../../reference/characters/archer/archer9.json' with { type: 'json' };
import dragon5 from '../../reference/characters/dragon/dragon5.json' with { type: 'json' };
import pekka8 from '../../reference/characters/pekka/pekka8.json' with { type: 'json' };
import valkyrie4 from '../../reference/characters/valkyrie/warriorgirl-lvl4.json' with { type: 'json' };
import headhunter3 from '../../reference/characters/headhunter/headhunter-lvl3.json' with { type: 'json' };
import superMinion from '../../reference/characters/super_minion/superminion.json' with { type: 'json' };
import babyDragon6 from '../../reference/characters/baby_dragon/baby-dragon-6.json' with { type: 'json' };
import arrows from '../../reference/characters/projectiles/characters.json' with { type: 'json' };
import cards from '../../reference/characters/projectiles/chr-headhunter.json' with { type: 'json' };
import rockets from '../../reference/characters/projectiles/chr-super-minion.json' with { type: 'json' };
import fireballs from '../../reference/characters/projectiles/buildings.json' with { type: 'json' };
import electroDragon3 from '../../reference/characters/electro_dragon/electrodragon-lvl3.json' with { type: 'json' };
import golem6 from '../../reference/characters/golem/golem-lvl6.json' with { type: 'json' };
import witch2 from '../../reference/characters/witch/necromancer-lvl2.json' with { type: 'json' };
import skeleton from '../../reference/characters/skeleton/skeleton.json' with { type: 'json' };
import bowler3 from '../../reference/characters/bowler/troll-lvl3.json' with { type: 'json' };
import lavaHound6 from '../../reference/characters/lava_hound/adseeker-lvl6.json' with { type: 'json' };
import lavaPup from '../../reference/characters/lava_hound/tinybaby-lvl1.json' with { type: 'json' };
import electroTitan2 from '../../reference/characters/electro_titan/electrotitan-lvl2.json' with { type: 'json' };
import goldenDragon from '../../reference/characters/dragon/golden-dragon.json' with { type: 'json' };
import momma from '../../reference/characters/pekka/momma.json' with { type: 'json' };
import royalGhost from '../../reference/characters/royale_ghost/prototype-ghost.json' with { type: 'json' };
import defendingBuilder from '../../reference/characters/worker/defending-builder.json' with { type: 'json' };
import witchShots from '../../reference/characters/projectiles/witch.json' with { type: 'json' };
import boulders from '../../reference/characters/projectiles/bowler.json' with { type: 'json' };
import houndShots from '../../reference/characters/projectiles/lava-hound.json' with { type: 'json' };
import type { CharacterGraph, CharacterGraphEntry } from './character-art';

/**
 * The captured character and projectile graphs (about 2.7 MB of JSON). Only campaign Clan
 * Castle defenders, their projectiles and the Defending Builder draw from them, so they load
 * with that art (character-art.ts `loadCharacterArt`) instead of at startup.
 */
const graph = (value: unknown) => value as CharacterGraph;
const entry = (
  value: unknown,
  prefix: string,
  shadows?: readonly number[],
): CharacterGraphEntry => ({
  graph: graph(value),
  prefix,
  shadows: shadows ?? graph(value).shadowShapes ?? [],
});
/**
 * Captured native character graphs, keyed by animation block. Dragon 7, Balloon 8 and the
 * common death export come from the garrison foundation (their troop files use shadow shape 0;
 * the common death export uses 45); the rest come from import-native-characters.py.
 */
export const CHARACTER_ART: Record<string, CharacterGraphEntry> = {
  Dragon7: entry(dragon7, 'garrison-dragon', [0]),
  'Balloon Goblin8': entry(balloon8, 'garrison-balloon', [0]),
  Goblin7: entry(goblin7, 'character-goblin7'),
  Archer9: entry(archer9, 'character-archer9'),
  Dragon5: entry(dragon5, 'character-dragon5'),
  PEKKA8: entry(pekka8, 'character-pekka8'),
  WarriorGirl_lvl4: entry(valkyrie4, 'character-warriorgirl-lvl4'),
  HeadHunter_lvl3: entry(headhunter3, 'character-headhunter-lvl3'),
  SuperMinion: entry(superMinion, 'character-superminion'),
  'Baby Dragon 6': entry(babyDragon6, 'character-baby-dragon-6'),
  // Remaining garrison families, their spawned troops, the Royal Ghost and the Defending Builder.
  ElectroDragon_lvl3: entry(electroDragon3, 'character-electrodragon-lvl3'),
  Golem_lvl6: entry(golem6, 'character-golem-lvl6'),
  Necromancer_lvl2: entry(witch2, 'character-necromancer-lvl2'),
  Skeleton: entry(skeleton, 'character-skeleton'),
  Troll_lvl3: entry(bowler3, 'character-troll-lvl3'),
  ADSeeker_lvl6: entry(lavaHound6, 'character-adseeker-lvl6'),
  TinyBaby_lvl1: entry(lavaPup, 'character-tinybaby-lvl1'),
  ElectroTitan_lvl2: entry(electroTitan2, 'character-electrotitan-lvl2'),
  'Golden Dragon': entry(goldenDragon, 'character-golden-dragon'),
  MOMMA: entry(momma, 'character-momma'),
  Prototype_Ghost: entry(royalGhost, 'character-prototype-ghost'),
  'Defending Builder': entry(defendingBuilder, 'character-defending-builder'),
};
export const COMMON_DEATH_ART = entry(commonDeath, 'garrison-dragonDeath', [45]);
/** Projectile exports grouped by their original file. */
export const PROJECTILE_ART: Record<string, CharacterGraphEntry> = {
  'sc/characters.sc': entry(arrows, 'character-projectiles-characters'),
  'sc/chr_headhunter.sc': entry(cards, 'character-projectiles-headhunter'),
  'sc/chr_super_minion.sc': entry(rockets, 'character-projectiles-super-minion'),
  'sc/buildings.sc': entry(fireballs, 'character-projectiles-buildings'),
};
/** Later projectile rows keep their own graphs (Witch bolt, Bowler boulder, Lava Hound shots). */
export const PROJECTILE_GROUP_ART: Record<string, CharacterGraphEntry> = {
  witch: entry(witchShots, 'character-projectiles-witch'),
  bowler: entry(boulders, 'character-projectiles-bowler'),
  'lava-hound': entry(houndShots, 'character-projectiles-lava-hound'),
};
