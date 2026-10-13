import {
  CHARACTER_SCALE,
  animationStates,
  characterAttackTime,
  characterFacing,
  characterLocator,
  characterPose,
  rowExport,
} from './character-poses';
import { characterArts, commonDeathArt } from './character-art';
import type { GarrisonDefender } from './defenders';
import type { Battle } from './model';

/** The No Flight Zone foundation graphs, retained under their established names (once loaded). */
export const garrisonGraphs = () => ({
  dragon: characterArts().Dragon7.graph,
  balloon: characterArts()['Balloon Goblin8'].graph,
  dragonDeath: commonDeathArt().graph,
});
/** The last frame of the shared death clip. */
export const dragonDeathLastTime = () => {
  const graph = garrisonGraphs().dragonDeath;
  const clip = graph.clips[graph.exports.barbarian_death_1];
  return (clip.timeline.length - 1) / clip.fps;
};
/** Local one-based interpretation of source ActionFrame 34 in this 34-frame clip. */
export const balloonActionTime = () => {
  const graph = garrisonGraphs().balloon;
  const clip = graph.clips[graph.exports.balloon_lvl8_attack1];
  return (clip.timeline.length - 1) / clip.fps;
};
export function balloonAttackPose(defender: GarrisonDefender, elapsed: number, reduced = false) {
  const attack = characterAttackTime(defender, elapsed, 'Balloon Goblin8', 1, reduced);
  return attack ? { name: rowExport(attack.row, 1), time: attack.time } : null;
}
/** Local world size; all source vertices, colors and nested timelines remain unchanged. */
export const GARRISON_SCALE = CHARACTER_SCALE;
/** Local direction buckets shared by the original body and its source mouth locator. */
export function dragonFacing(dx: number, dy: number) {
  const { view, mirror } = characterFacing(dx, dy);
  return { name: `dragon7_fly1_${view}`, mirror };
}
/** The three source roots are static; their empty attack_pivot children retain placement matrices. */
export function dragonAttackOffset(dx: number, dy: number, animation = 'Dragon7') {
  const { view, mirror } = characterFacing(dx, dy);
  const name = rowExport(animationStates(animation).attack[0], view);
  const offset = characterLocator(animation, name, mirror, GARRISON_SCALE);
  if (!offset) throw Error('Missing original Dragon attack locator');
  return offset;
}
export function garrisonPoses(defender: GarrisonDefender, battle: Battle, reduced = false) {
  return characterPose(defender, battle, reduced)?.poses ?? [];
}
