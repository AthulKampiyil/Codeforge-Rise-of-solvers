import type { GarrisonDefender } from './defenders';
import type { Battle } from './model';
import type { NativeScenePose } from './native-mesh';
import { characterPose } from './character-poses';
import { characterArts, commonDeathArt } from './character-art';

// Verified original black-alpha shadow shapes: troop files use 0 (Super Minion 3); common death 45.
const shadowSets = new Map<string, Set<number[]>>();
function shadowVertices(prefix: string) {
  let set = shadowSets.get(prefix);
  if (set) return set;
  const art = [...Object.values(characterArts()), commonDeathArt()].find(
    (a) => a.prefix === prefix,
  )!;
  set = new Set(art.shadows.flatMap((id) => art.graph.shapes[id].map(([, vertices]) => vertices)));
  shadowSets.set(prefix, set);
  return set;
}

/** Original body and ground-shadow commands plus the graph prefix that owns their textures. */
export function characterLayers(defender: GarrisonDefender, battle: Battle, reduced = false) {
  const pose = characterPose(defender, battle, reduced);
  if (!pose) return undefined;
  const shadows = shadowVertices(pose.prefix);
  const split = (poses: NativeScenePose[]) => {
    const body: NativeScenePose[] = [],
      shadow: NativeScenePose[] = [];
    for (const item of poses) {
      if ('group' in item) {
        const nested = split(item.group);
        if (nested.body.length) body.push({ ...item, group: nested.body });
        if (nested.shadow.length) shadow.push({ ...item, group: nested.shadow });
      } else (shadows.has(item.vertices) ? shadow : body).push(item);
    }
    return { body, shadow };
  };
  return { ...split(pose.poses), prefix: pose.prefix };
}

/** Separate original shadow commands without changing their texels, transforms or timeline. */
export function garrisonLayers(defender: GarrisonDefender, battle: Battle, reduced = false) {
  const layers = characterLayers(defender, battle, reduced);
  return { body: layers?.body ?? [], shadow: layers?.shadow ?? [] };
}
