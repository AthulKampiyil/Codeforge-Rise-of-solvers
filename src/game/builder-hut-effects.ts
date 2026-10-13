import raw from '../../reference/builder-hut/effects.json' with { type: 'json' };
import { nativeEffectPlayer } from './late-goblin-buildings-effects';
import { BUILDER_HUT_GRAPH } from './builder-hut-poses';

type Row = Record<string, string>;
export const BUILDER_HUT_EFFECTS = raw.effects as Record<string, Row[]>;
export const BUILDER_HUT_SOUNDS = raw.sounds;
export const builderHutSample = (path: string) =>
  `builder-hut-${path.split('/').at(-1)!.replace('.ogg', '')}`;
/** Original Nailgun Attack FX, Generic Hit and Building Destroyed rows with their samples. */
export const BUILDER_HUT_EFFECT_PLAYER = nativeEffectPlayer(
  BUILDER_HUT_GRAPH,
  raw as { effects: Record<string, Row[]>; particles: Record<string, Row[]> },
  builderHutSample,
  'builder-hut',
  { reducedEmitters: [] },
);
