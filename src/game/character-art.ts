import { CHARACTER_GRAPHS, CHARACTER_GRAPH_ALIASES, PROJECTILE_GROUPS } from './character-catalog';
import type { NativeMeshGraph } from './native-mesh';

export type CharacterGraph = NativeMeshGraph & { shadowShapes?: number[] };
export interface CharacterGraphEntry {
  graph: CharacterGraph;
  /** Scene texture prefix; the No Flight Zone foundation keeps its established keys. */
  prefix: string;
  /** Original black-alpha ground shadow shapes rendered on their own layer. */
  shadows: readonly number[];
}
type Graphs = typeof import('./character-graphs');
let graphs: Graphs | undefined;
let loading: Promise<Graphs> | undefined;
/**
 * Fetches the character graphs once (the garrison and late campaign art wait for it); a failed
 * fetch can be retried by calling again.
 */
export function loadCharacterArt(): Promise<Graphs> {
  loading ??= import('./character-graphs').then(
    (module) => (graphs = module),
    (error) => {
      loading = undefined;
      throw error;
    },
  );
  return loading;
}
export const characterArtLoaded = () => graphs !== undefined;
const loaded = () => {
  if (!graphs) throw new Error('Character art is not loaded yet');
  return graphs;
};
/** Captured native character graphs, keyed by animation block. */
export const characterArts = (): Record<string, CharacterGraphEntry> => loaded().CHARACTER_ART;
export const commonDeathArt = (): CharacterGraphEntry => loaded().COMMON_DEATH_ART;
/** Projectile exports grouped by their original file. */
export const projectileArts = (): Record<string, CharacterGraphEntry> => loaded().PROJECTILE_ART;
/** Later projectile rows keep their own graphs (Witch bolt, Bowler boulder, Lava Hound shots). */
export const projectileGroupArts = (): Record<string, CharacterGraphEntry> =>
  loaded().PROJECTILE_GROUP_ART;
const projectileCache = new Map<string, CharacterGraphEntry>();
/** The graph holding a projectile row's export: its later group, else its original file. */
export function projectileArt(name: string, swf: string) {
  const cacheKey = `${name}\n${swf}`;
  const known = projectileCache.get(cacheKey);
  if (known) return known;
  const group = Object.entries(PROJECTILE_GROUPS).find(([, names]) => names.includes(name))?.[0];
  const art = group ? projectileGroupArts()[group] : projectileArts()[swf];
  if (!art) throw Error(`Missing native projectile art: ${name}`);
  projectileCache.set(cacheKey, art);
  return art;
}
/** Resolve graph aliases (GolemSmall_lvl6 names exactly the Golem_lvl6 exports). */
const aliasTarget = (animation: string) => {
  const alias = Object.keys(CHARACTER_GRAPH_ALIASES).find(
    (name) => name.replaceAll(' ', '') === animation.replaceAll(' ', ''),
  );
  return alias ? CHARACTER_GRAPHS[CHARACTER_GRAPH_ALIASES[alias]].animation! : animation;
};
// Several lookups per garrison defender per frame: resolve each animation name once.
const artCache = new Map<string, CharacterGraphEntry>();
export function characterArt(animation: string) {
  const known = artCache.get(animation);
  if (known) return known;
  const target = aliasTarget(animation);
  const arts = characterArts();
  const key = Object.keys(arts).find(
    (name) => name.replaceAll(' ', '') === target.replaceAll(' ', ''),
  );
  if (!key) throw Error(`Missing native character art: ${animation}`);
  const art = arts[key];
  artCache.set(animation, art);
  return art;
}
/** Imported previews (idle frame zero, two pixels per native unit) and their padded icons. */
export function characterPreview(animation: string) {
  const target = aliasTarget(animation);
  const key = Object.entries(CHARACTER_GRAPHS).find(([, g]) => g.animation === target)?.[0];
  return key
    ? {
        preview: `/assets/characters-native/${key}/preview.png`,
        icon: `/assets/characters-native/${key}/icon.png`,
      }
    : undefined;
}
