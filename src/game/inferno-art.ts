import portraits from '../../reference/inferno/portraits.json' with { type: 'json' };
import { type InfernoMode } from './inferno-weapon';
import { type NativeMatrix } from './native-mesh';

export type InfernoArtState = 'active' | 'empty' | 'constructing' | 'upgrading' | 'ruin';

export function infernoPortrait(level: number, mode: InfernoMode = 'single') {
  const portrait = portraits.portraits.find((row) => row.level === level && row.mode === mode);
  if (!portrait) throw new Error(`Unsupported Inferno portrait: ${level} ${mode}`);
  return portrait;
}
export const infernoTexture = (level: number, mode: InfernoMode = 'single') => {
  infernoPortrait(level, mode);
  return `inferno-level-${level}-${mode}`;
};
export const infernoAsset = (level: number, mode: InfernoMode = 'single') =>
  `/${infernoPortrait(level, mode).path}`;

/** Shared local world registration; native executable alignment remains unverified. */
export const INFERNO_ROOT: NativeMatrix = [1.2, 0, 0, 0, 1.2, -64];
