import type Phaser from 'phaser';
import {
  animationStates,
  characterFacing,
  characterLocator,
  rowExport,
  rowScale,
} from './character-poses';
import { garrisonAura, garrisonDeathSpell, garrisonStats } from './garrison-kinds';
import { visualRandom } from './visual-random';
import type { GarrisonDefender } from './defenders';
import { isGarrisonDefender } from './defenders';
import type { Battle } from './model';
import { presentationLive, presentationTime } from './presentation-clock';

/**
 * Local, restrained visuals for the later garrison mechanics whose original effects are particle
 * emitter records not yet imported (`Electro Dragon Attack Chain` beams, `ElectroDragonDie`'s
 * `Lightning Spell Hit`, `E_titanAreaDamage` and `Warlock Summon`). Every shape derives from
 * recorded battle state and the battle clock, so replay seeks reproduce it exactly.
 */
export interface LateEffectBolt {
  key: string;
  kind: 'bolt';
  points: { x: number; y: number }[];
  color: number;
  width: number;
  alpha: number;
  depth: number;
}
export interface LateEffectRing {
  key: string;
  kind: 'ring';
  x: number;
  y: number;
  rx: number;
  ry: number;
  color: number;
  width: number;
  alpha: number;
  fill: number;
  depth: number;
}
export type LateEffectShape = LateEffectBolt | LateEffectRing;
type Iso = (x: number, y: number) => { x: number; y: number };

/** Seconds a chain segment, a death bolt, a summon glow and an aura pulse stay visible. */
export const LATE_EFFECT_TIMES = { chain: 0.25, bolt: 0.35, summon: 0.5, pulse: 0.4 } as const;
const BODY_HEIGHT = 16;
const CHAIN_COLOR = 0xbfe8ff;
const SUMMON_COLOR = 0xc67bff;

/** A jagged line with deterministic perpendicular offsets (straight under reduced motion). */
function jagged(
  from: { x: number; y: number },
  to: { x: number; y: number },
  seed: [number, number],
  reduced: boolean,
) {
  const segments = 6;
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / length,
    ny = dx / length;
  return Array.from({ length: segments + 1 }, (_, i) => {
    const t = i / segments;
    const jitter =
      reduced || i === 0 || i === segments
        ? 0
        : (visualRandom(seed[0], seed[1], i) - 0.5) * Math.min(18, length * 0.18);
    return { x: from.x + dx * t + nx * jitter, y: from.y + dy * t + ny * jitter };
  });
}
/** A world circle of `radius` tiles projected to screen axes. */
function ellipse(iso: Iso, radius: number) {
  const origin = iso(0, 0);
  const d = radius / Math.SQRT2;
  return { rx: Math.abs(iso(d, -d).x - origin.x), ry: Math.abs(iso(d, d).y - origin.y) };
}
const fade = (since: number, duration: number) => Math.max(0, 1 - since / duration);

function chainShapes(
  defender: GarrisonDefender,
  reduced: boolean,
  iso: Iso,
  lift: number,
  elapsed: number,
) {
  const shapes: LateEffectShape[] = [];
  const stats = garrisonStats(defender.kind, defender.level);
  const attackRow = animationStates(stats.animation).attack[0];
  const elevate = (x: number, y: number, air: boolean | undefined, height = BODY_HEIGHT) => {
    const point = iso(x, y);
    return { x: point.x, y: point.y - height - (air ? lift : 0) };
  };
  for (const attack of defender.attacks) {
    if (!attack.chain) continue;
    const since = elapsed - attack.at;
    if (since >= 0 && since < LATE_EFFECT_TIMES.chain) {
      // The primary bolt leaves the source `attack_pivot` locator of the attack row's action frame.
      const facing = characterFacing(attack.targetX - attack.x, attack.targetY - attack.y);
      const exportName = rowExport(attackRow, facing.view);
      const frame = Math.max(0, Number(attackRow.ActionFrame || 1) - 1);
      const pivot = characterLocator(
        stats.animation,
        exportName,
        facing.mirror,
        rowScale(attackRow),
        'attack_pivot',
        frame,
      );
      const origin = iso(attack.x, attack.y);
      const from = {
        x: origin.x + (pivot?.x ?? 0),
        y: origin.y + (pivot?.y ?? 0) - (stats.flying ? lift : 0),
      };
      shapes.push({
        key: `late-chain:${defender.id}:${attack.n}:0`,
        kind: 'bolt',
        points: jagged(
          from,
          elevate(attack.hitX ?? attack.targetX, attack.hitY ?? attack.targetY, attack.air),
          [defender.id, (attack.n ?? 0) * 8],
          reduced,
        ),
        color: CHAIN_COLOR,
        width: 3,
        alpha: fade(since, LATE_EFFECT_TIMES.chain),
        depth: 7800,
      });
    }
    for (const [index, jump] of attack.chain.entries()) {
      const jumpSince = elapsed - jump.at;
      if (jumpSince < 0 || jumpSince >= LATE_EFFECT_TIMES.chain) continue;
      const previous = index ? attack.chain[index - 1].air : attack.air;
      shapes.push({
        key: `late-chain:${defender.id}:${attack.n}:${index + 1}`,
        kind: 'bolt',
        points: jagged(
          elevate(jump.fromX, jump.fromY, previous),
          elevate(jump.x, jump.y, jump.air),
          [defender.id, (attack.n ?? 0) * 8 + index + 1],
          reduced,
        ),
        color: CHAIN_COLOR,
        width: 2.5,
        alpha: fade(jumpSince, LATE_EFFECT_TIMES.chain),
        depth: 7800,
      });
    }
  }
  return shapes;
}

/**
 * `elapsed` samples the transient shapes (chains, death bolts, summon glows): callers pass the
 * presentation clock so shapes alive at the finish fade out instead of freezing. The aura ring
 * of a living defender is a loop and stays on the battle clock.
 */
export function garrisonLateEffectShapes(
  battle: Battle | null,
  reduced: boolean,
  iso: Iso,
  lift: number,
  elapsed = battle?.elapsed ?? 0,
): LateEffectShape[] {
  const shapes: LateEffectShape[] = [];
  if (!battle) return shapes;
  for (const defender of battle.defenders ?? []) {
    if (!isGarrisonDefender(defender) || battle.elapsed < defender.spawnedAt) continue;
    const stats = garrisonStats(defender.kind, defender.level);
    if (stats.chain) shapes.push(...chainShapes(defender, reduced, iso, lift, elapsed));
    const spell = defender.bolts ? garrisonDeathSpell(stats) : undefined;
    for (const [index, bolt] of (defender.bolts ?? []).entries()) {
      const since = elapsed - bolt.at;
      if (!spell || since < 0 || since >= LATE_EFFECT_TIMES.bolt) continue;
      const ground = iso(bolt.x, bolt.y);
      const alpha = fade(since, LATE_EFFECT_TIMES.bolt);
      shapes.push({
        key: `late-bolt:${defender.id}:${index}`,
        kind: 'bolt',
        points: jagged(
          { x: ground.x, y: ground.y - 220 },
          ground,
          [defender.id, 1000 + index],
          reduced,
        ),
        color: CHAIN_COLOR,
        width: 4,
        alpha,
        depth: 7800,
      });
      shapes.push({
        key: `late-bolt-ring:${defender.id}:${index}`,
        kind: 'ring',
        x: ground.x,
        y: ground.y,
        ...ellipse(iso, spell.radius),
        color: CHAIN_COLOR,
        width: 2,
        alpha: alpha * 0.6,
        fill: alpha * 0.12,
        depth: -837,
      });
    }
    const aura = stats.aura ? garrisonAura(stats) : undefined;
    if (aura && defender.hp > 0) {
      const point = iso(defender.x, defender.y);
      const first = defender.spawnedAt + aura.firstHit;
      const pulses =
        battle.elapsed < first ? -1 : Math.floor((battle.elapsed - first) / aura.interval + 1e-9);
      const since = pulses < 0 ? Infinity : battle.elapsed - (first + pulses * aura.interval);
      const pulse = reduced ? 0 : fade(since, LATE_EFFECT_TIMES.pulse);
      shapes.push({
        key: `late-aura:${defender.id}`,
        kind: 'ring',
        x: point.x,
        y: point.y,
        ...ellipse(iso, aura.radius),
        color: CHAIN_COLOR,
        width: 2,
        alpha: 0.28 + 0.4 * pulse,
        fill: 0.05 + 0.08 * pulse,
        depth: -837,
      });
    }
    for (const event of defender.summon?.events ?? []) {
      const since = elapsed - event.at;
      if (since < 0 || since >= LATE_EFFECT_TIMES.summon) continue;
      const point = iso(defender.x, defender.y);
      const alpha = fade(since, LATE_EFFECT_TIMES.summon);
      shapes.push({
        key: `late-summon:${defender.id}:${event.n}`,
        kind: 'ring',
        x: point.x,
        y: point.y,
        ...ellipse(iso, 1 + since),
        color: SUMMON_COLOR,
        width: 2,
        alpha: alpha * 0.8,
        fill: alpha * 0.18,
        depth: -837,
      });
    }
  }
  return shapes;
}

/** Everything a shape's Graphics draws, relative to its position. */
function shapeSignature(shape: LateEffectShape) {
  if (shape.kind === 'bolt') {
    let points = '';
    for (const point of shape.points) points += `${point.x},${point.y};`;
    return `bolt:${shape.color}:${shape.width}:${shape.alpha}:${points}`;
  }
  return `ring:${shape.color}:${shape.width}:${shape.alpha}:${shape.fill}:${shape.rx}:${shape.ry}`;
}

/** One Graphics object per shape key; destroyed when the shape expires or the battle ends. */
export class GarrisonLateEffects {
  private graphics = new Map<string, Phaser.GameObjects.Graphics>();
  /** Last drawn signature per key: unchanged shapes (a resting aura) are not redrawn. */
  private drawn = new Map<string, string>();
  constructor(private scene: Phaser.Scene) {}
  render(battle: Battle | null, reduced: boolean, iso: Iso, lift: number) {
    const wanted = new Set<string>();
    const shapes = battle
      ? garrisonLateEffectShapes(
          battle,
          reduced,
          iso,
          lift,
          // After the grace window every transient shape has expired (all last under 1 s).
          presentationLive(battle) ? presentationTime(battle) : Infinity,
        )
      : [];
    for (const shape of shapes) {
      wanted.add(shape.key);
      let g = this.graphics.get(shape.key);
      if (!g) {
        g = this.scene.add.graphics();
        g.setData('nativeGarrisonLateEffect', shape.key);
        this.graphics.set(shape.key, g);
      }
      if (g.depth !== shape.depth) g.setDepth(shape.depth);
      const x = shape.kind === 'bolt' ? 0 : shape.x,
        y = shape.kind === 'bolt' ? 0 : shape.y;
      if (g.x !== x || g.y !== y) g.setPosition(x, y);
      const signature = shapeSignature(shape);
      if (this.drawn.get(shape.key) === signature) continue;
      this.drawn.set(shape.key, signature);
      g.clear();
      if (shape.kind === 'bolt') {
        const stroke = (width: number, color: number, alpha: number) => {
          g.lineStyle(width, color, alpha).beginPath();
          g.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++)
            g.lineTo(shape.points[i].x, shape.points[i].y);
          g.strokePath();
        };
        stroke(shape.width + 3, shape.color, shape.alpha * 0.35);
        stroke(shape.width, 0xffffff, shape.alpha);
      } else {
        g.fillStyle(shape.color, shape.fill).fillEllipse(0, 0, shape.rx * 2, shape.ry * 2);
        g.lineStyle(shape.width, shape.color, shape.alpha).strokeEllipse(
          0,
          0,
          shape.rx * 2,
          shape.ry * 2,
        );
      }
    }
    for (const [key, g] of this.graphics)
      if (!wanted.has(key)) {
        g.destroy();
        this.graphics.delete(key);
        this.drawn.delete(key);
      }
  }
  clear() {
    for (const g of this.graphics.values()) g.destroy();
    this.graphics.clear();
    this.drawn.clear();
  }
}
