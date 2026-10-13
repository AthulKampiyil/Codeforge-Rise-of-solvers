import type { BuildingKind } from './data';
import {
  EAGLE_ARTILLERY_ART,
  eagleArtilleryAsset,
  eagleArtilleryTexture,
} from './eagle-artillery-art';
import { MONOLITH_ART, monolithAsset, monolithTexture } from './monolith-art';
import { SCATTERSHOT_ART, scattershotAsset, scattershotTexture } from './scattershot-art';
import { SPELL_TOWER_ART, spellTowerAsset, spellTowerTexture } from './spell-tower-art';
import { TORNADO_TRAP_ART, tornadoTrapAsset, tornadoTrapTexture } from './tornado-trap-art';

export interface LatePreviewArt {
  width: number;
  height: number;
  originX: number;
  originY: number;
}

type LateArtKind = 'eagleartillery' | 'scattershot' | 'monolith' | 'spelltower' | 'tornadotrap';
const ART: Record<
  LateArtKind,
  {
    texture: (level: number, variant?: string) => string;
    asset: (level: number, variant?: string) => string;
    art: LatePreviewArt;
  }
> = {
  eagleartillery: {
    texture: eagleArtilleryTexture,
    asset: eagleArtilleryAsset,
    art: EAGLE_ARTILLERY_ART,
  },
  scattershot: { texture: scattershotTexture, asset: scattershotAsset, art: SCATTERSHOT_ART },
  monolith: { texture: monolithTexture, asset: monolithAsset, art: MONOLITH_ART },
  spelltower: { texture: spellTowerTexture, asset: spellTowerAsset, art: SPELL_TOWER_ART },
  tornadotrap: { texture: tornadoTrapTexture, asset: tornadoTrapAsset, art: TORNADO_TRAP_ART },
};
export const hasLateArt = (kind: string): kind is LateArtKind => Object.hasOwn(ART, kind);
/** `variant` is the Spell Tower weapon; other late kinds ignore it. */
export const lateTexture = (kind: BuildingKind & LateArtKind, level: number, variant?: string) =>
  ART[kind].texture(level, variant);
export const lateAsset = (kind: BuildingKind & LateArtKind, level: number, variant?: string) =>
  ART[kind].asset(level, variant);
/** Preview registration used by fallback sprites and placement ghosts. */
export const lateArt = (kind: BuildingKind & LateArtKind): LatePreviewArt => ART[kind].art;
