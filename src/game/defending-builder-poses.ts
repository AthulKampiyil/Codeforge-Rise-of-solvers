import { BUILDINGS } from './data';
import { characterArt } from './character-art';
import {
  animationStates,
  characterFacing,
  rowExport,
  rowScale,
  type CharacterPose,
} from './character-poses';
import { defendingBuilderStats, type DefendingBuilder } from './defending-builder';
import type { Battle } from './model';
import { nativeScenePoses, type NativeScenePose } from './native-mesh';
import { battleBuilding } from './battle-index';

/** State-driven original poses: walk to a target, the looping `attack` (build) row, idle otherwise. */
export function defendingBuilderPose(
  builder: DefendingBuilder,
  battle: Battle,
  reduced = false,
): CharacterPose | null {
  if (battle.elapsed < builder.spawnedAt || builder.hiddenAt !== undefined) return null;
  const stats = defendingBuilderStats(builder.level);
  const states = animationStates(stats.animation);
  const art = characterArt(stats.animation);
  const target = battleBuilding(battle, builder.target);
  const aim =
    builder.path[0] ??
    (target
      ? {
          x: target.x + BUILDINGS[target.kind].size / 2,
          y: target.y + BUILDINGS[target.kind].size / 2,
        }
      : undefined);
  const facing = characterFacing(aim ? aim.x - builder.x : 1, aim ? aim.y - builder.y : 0);
  const moving = builder.path.length > 0;
  const row = (builder.repairing ? states.attack : moving ? states.walk : states.idle)[0];
  const time = reduced ? 0 : Math.max(0, battle.elapsed - builder.spawnedAt);
  const scale = rowScale(row);
  const mirror = row.HasDirections === 'TRUE' ? facing.mirror : 1;
  return {
    prefix: art.prefix,
    shadows: art.shadows,
    poses: nativeScenePoses(art.graph, rowExport(row, facing.view), time, {}, [
      scale * mirror,
      0,
      0,
      0,
      scale,
      0,
    ]),
  };
}

/** Original body and ground-shadow commands, separated like the garrison character layers. */
export function defendingBuilderLayers(builder: DefendingBuilder, battle: Battle, reduced = false) {
  const pose = defendingBuilderPose(builder, battle, reduced);
  if (!pose) return null;
  const graph = characterArt(defendingBuilderStats(builder.level).animation).graph;
  const shadowVertices = new Set(pose.shadows.flatMap((id) => graph.shapes[id].map(([, v]) => v)));
  const split = (
    items: NativeScenePose[],
  ): { body: NativeScenePose[]; shadow: NativeScenePose[] } => {
    const body: NativeScenePose[] = [],
      shadow: NativeScenePose[] = [];
    for (const item of items) {
      if ('group' in item) {
        const nested = split(item.group);
        if (nested.body.length) body.push({ ...item, group: nested.body });
        if (nested.shadow.length) shadow.push({ ...item, group: nested.shadow });
      } else (shadowVertices.has(item.vertices) ? shadow : body).push(item);
    }
    return { body, shadow };
  };
  return { prefix: pose.prefix, ...split(pose.poses) };
}
