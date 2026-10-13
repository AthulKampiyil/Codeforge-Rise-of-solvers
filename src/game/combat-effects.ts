import Phaser from 'phaser';
import type { FX } from './model';
import type { EffectTween } from './effect-timeline';
import { ShapeAtlas, applyShape, type BakedShape } from './shape-atlas';

type Point = { x: number; y: number };
type Weapon = NonNullable<FX['weapon']>;
const COLORS: Record<Weapon, number> = {
  arrow: 0xffe3a3,
  cannonball: 0xffc16a,
  rocket: 0xffa94a,
  fireball: 0xff8c32,
  bomb: 0xffb54f,
  towerbomb: 0xffb54f,
  arcane: 0xcf8dff,
  healing: 0xffed8a,
  xbowbolt: 0xffe3a3,
  native: 0xfff0c2,
};
/** Transient flashes beyond this many are dropped; heavy fights produced thousands. */
const MAX_TRANSIENT = 320;
/** Idle images kept for reuse. */
const MAX_POOLED = 256;
/** Data keys effects carry while live (tests and tools find effects by them). */
const DATA_KEYS = [
  'weapon',
  'projectileId',
  'impact',
  'muzzle',
  'blastRadius',
  'dragonBreath',
  'kingQuake',
] as const;

/**
 * Short-lived weapon graphics. They never apply damage or mutate the battle.
 *
 * Every shape is baked once into a shared texture page and drawn as a pooled image, so a hit
 * costs one textured quad instead of a new Graphics object whose paths Phaser re-triangulates
 * every frame it is alive.
 */
export class CombatEffects {
  /** Live effect objects: flights, impacts, flashes. Idle pooled images are not included. */
  private objects = new Set<Phaser.GameObjects.Image>();
  private flights = new Map<string, Phaser.GameObjects.Image>();
  private pool: Phaser.GameObjects.Image[] = [];
  private shapes: ShapeAtlas;
  private transient = 0;
  constructor(
    private scene: Phaser.Scene,
    private animate: (config: EffectTween) => void = (config) => {
      scene.tweens.add(config);
    },
    shapes?: ShapeAtlas,
  ) {
    this.shapes = shapes ?? new ShapeAtlas(scene, 'combat-shapes', 1024, 2);
  }

  /** Takes a pooled image showing `shape`; `transient` effects count against the cap. */
  private take(shape: BakedShape, x: number, y: number, depth: number, transient: boolean) {
    let image: Phaser.GameObjects.Image | undefined;
    while (this.pool.length) {
      const candidate = this.pool.pop()!;
      // Scene transitions may have destroyed pooled images.
      if (candidate.scene) {
        image = candidate;
        break;
      }
    }
    if (!image) image = this.scene.add.image(x, y, shape.key, shape.frame);
    applyShape(image, shape);
    image
      .setPosition(x, y)
      .setRotation(0)
      .setAlpha(1)
      .setVisible(true)
      .setActive(true)
      .setData('transient', transient);
    if (image.depth !== depth) image.setDepth(depth);
    this.objects.add(image);
    if (transient) this.transient++;
    return image;
  }
  private remove(image: Phaser.GameObjects.Image, reuse = true) {
    if (!this.objects.delete(image)) return;
    if (image.getData('transient')) this.transient--;
    this.scene.tweens.killTweensOf(image);
    if (!image.scene) return;
    if (reuse && this.pool.length < MAX_POOLED) {
      for (const key of DATA_KEYS)
        if (image.getData(key) !== undefined) image.setData(key, undefined);
      image.setVisible(false).setActive(false);
      this.pool.push(image);
    } else image.destroy();
  }
  /** The base scale of an image showing `shape` at world size `scale`. */
  private scaleOf(shape: BakedShape, scale = 1) {
    return scale / shape.resolution;
  }
  private full() {
    return this.transient >= MAX_TRANSIENT;
  }
  clear() {
    // Destroy rather than pool: effect timelines may still hold these as tween targets.
    for (const image of [...this.objects]) this.remove(image, false);
    this.flights.clear();
    this.transient = 0;
  }

  quake(point: Point, radius: number, reduced: boolean) {
    const rx = radius * 32 * Math.SQRT2,
      ry = rx / 2;
    const shape = this.shapes.shape(
      `quake:${radius.toFixed(2)}`,
      -rx - 5,
      -ry - 5,
      rx * 2 + 10,
      ry * 2 + 10,
      (g) => {
        g.lineStyle(7, 0x80623c, 0.22).strokeEllipse(0, 0, rx * 2, ry * 2);
        g.lineStyle(2, 0xffe5a2, 0.7).strokeEllipse(0, 0, rx * 2, ry * 2);
        for (let i = 0; i < 13; i++) {
          const angle = (i * Math.PI * 2) / 13,
            inner = 0.15 + (i % 3) * 0.1;
          g.lineStyle(2, 0x62482c, 0.65).beginPath();
          g.moveTo(Math.cos(angle) * rx * inner, Math.sin(angle) * ry * inner);
          g.lineTo(Math.cos(angle + 0.025) * rx * 0.52, Math.sin(angle + 0.025) * ry * 0.52);
          g.lineTo(Math.cos(angle - 0.06) * rx * 0.8, Math.sin(angle - 0.06) * ry * 0.8);
          g.strokePath();
        }
      },
    );
    const g = this.take(shape, point.x, point.y, 24, false).setData('kingQuake', true);
    g.setScale(this.scaleOf(shape, reduced ? 1 : 0.76));
    this.animate({
      targets: g,
      scale: this.scaleOf(shape),
      alpha: 0,
      duration: 380,
      onComplete: () => this.remove(g),
    });
  }

  private weaponShape(weapon: Weapon) {
    return this.shapes.shape(`weapon:${weapon}`, -26, -14, 44, 28, (g) => {
      const color = COLORS[weapon];
      if (weapon === 'healing') {
        g.fillStyle(color, 0.2).fillEllipse(-5, 0, 22, 12);
        g.fillStyle(color, 0.85).fillCircle(0, 0, 4);
        g.fillStyle(0xfffff0).fillCircle(0, 0, 2);
      } else if (weapon === 'arrow') {
        g.lineStyle(2, 0x67442a).lineBetween(-12, 0, 8, 0);
        g.fillStyle(0xdce2d4).fillTriangle(7, -3, 14, 0, 7, 3);
        g.fillStyle(0xffecc3).fillTriangle(-13, -4, -6, 0, -13, 4);
      } else if (weapon === 'rocket') {
        g.fillStyle(0xff742d, 0.6).fillTriangle(-22, 0, -8, -5, -8, 5);
        g.fillStyle(0xffdd7b).fillTriangle(-16, 0, -7, -2, -7, 2);
        g.fillStyle(0x38373a).fillRoundedRect(-9, -4, 18, 8, 2);
        g.fillStyle(0xd7a956).fillRect(-5, -4, 3, 8);
        g.fillStyle(0xce4840).fillTriangle(8, -4, 15, 0, 8, 4);
      } else if (weapon === 'fireball' || weapon === 'arcane') {
        g.fillStyle(color, 0.2).fillEllipse(-8, 0, 32, 15);
        g.fillStyle(color, 0.6).fillTriangle(-23, 0, 0, -7, 0, 7);
        g.fillStyle(color).fillCircle(0, 0, 7);
        g.fillStyle(0xfff4cf).fillCircle(2, -1, 3);
      } else {
        const radius = weapon === 'bomb' || weapon === 'towerbomb' ? 6 : 4;
        g.fillStyle(0x272a2d).fillCircle(0, 0, radius);
        g.lineStyle(1, 0x141619).strokeCircle(0, 0, radius);
        g.fillStyle(0x90918b).fillCircle(-2, -2, 1.5);
        if (weapon === 'bomb' || weapon === 'towerbomb') {
          g.lineStyle(2, 0xcda867).lineBetween(0, -6, 3, -9);
          g.fillStyle(0xffd56b).fillCircle(3, -9, 2);
        }
      }
    });
  }

  poseProjectile(id: string, weapon: Weapon, from: Point, to: Point, progress: number) {
    let g = this.flights.get(id);
    if (!g) {
      g = this.take(this.weaponShape(weapon), from.x, from.y, 8000, false)
        .setData('weapon', weapon)
        .setData('projectileId', id);
      this.flights.set(id, g);
    }
    const t = weapon === 'bomb' ? progress ** 3 : progress;
    g.setPosition(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
    if (weapon !== 'bomb') g.setRotation(Math.atan2(to.y - from.y, to.x - from.x));
  }

  retainProjectiles(ids: ReadonlySet<string>) {
    for (const [id, g] of this.flights)
      if (!ids.has(id)) {
        this.remove(g);
        this.flights.delete(id);
      }
  }

  projectile(weapon: Weapon, from: Point, to: Point, reduced: boolean) {
    if (reduced) {
      this.impact(weapon, to, true);
      return;
    }
    if (this.full()) return;
    const g = this.take(this.weaponShape(weapon), from.x, from.y, 8000, true).setData(
      'weapon',
      weapon,
    );
    if (weapon !== 'bomb') g.setRotation(Math.atan2(to.y - from.y, to.x - from.x));
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const duration = weapon === 'bomb' ? 330 : Phaser.Math.Clamp(distance * 1.05, 120, 300);
    this.scene.tweens.add({
      targets: g,
      x: to.x,
      y: to.y,
      duration,
      ease: weapon === 'bomb' ? 'Cubic.easeIn' : 'Linear',
      onComplete: () => {
        this.remove(g);
        this.impact(weapon, to, false);
      },
    });
    this.muzzle(weapon, from);
  }

  muzzle(weapon: Weapon, from: Point) {
    if ((weapon !== 'cannonball' && weapon !== 'rocket') || this.full()) return;
    const shape = this.shapes.shape('muzzle', -10, -10, 20, 20, (g) => {
      g.fillStyle(0xffd28b, 0.9).fillCircle(0, 0, 8);
      g.fillStyle(0xfff4d2).fillCircle(0, 0, 3);
    });
    const flash = this.take(shape, from.x, from.y, 8000, true).setData('muzzle', weapon);
    this.animate({
      targets: flash,
      alpha: 0,
      scale: this.scaleOf(shape, 1.6),
      duration: 100,
      onComplete: () => this.remove(flash),
    });
  }

  groundBlast(
    at: Point,
    radius: number,
    reduced: boolean,
    kind: 'bomb' | 'mortar' | 'towerbomb' = 'bomb',
  ) {
    if (this.full()) return;
    const width = radius * 64 * Math.SQRT2,
      height = width / 2;
    const halfW = Math.max(width / 2, 23) + 2,
      top = Math.max(height / 2, 25) + 2,
      bottom = Math.max(height / 2, 14) + 2;
    const shape = this.shapes.shape(
      `blast:${radius.toFixed(3)}`,
      -halfW,
      -top,
      halfW * 2,
      top + bottom,
      (g) => {
        g.fillStyle(0xffa244, 0.17).fillEllipse(0, 0, width, height);
        g.lineStyle(2, 0xffd18b, 0.9).strokeEllipse(0, 0, width, height);
        g.fillStyle(0x493020, 0.45).fillEllipse(0, 0, 26, 13);
        g.fillStyle(0xffac38, 0.95);
        g.fillTriangle(-22, -3, -4, -8, 0, 3);
        g.fillTriangle(22, -3, 4, -8, 0, 3);
        g.fillTriangle(-6, -24, -10, 1, 4, 2);
        g.fillTriangle(8, 13, -6, -1, 8, -4);
        g.fillStyle(0xffe4a5, 0.85).fillEllipse(0, -3, 13, 8);
      },
    );
    const g = this.take(shape, at.x, at.y, 7000, true)
      .setData('impact', kind)
      .setData('blastRadius', radius);
    g.setScale(this.scaleOf(shape, reduced ? 1 : 0.6));
    this.animate({
      targets: g,
      scale: this.scaleOf(shape),
      alpha: 0,
      duration: reduced ? 100 : 240,
      onComplete: () => this.remove(g),
    });
  }

  breath(from: Point, to: Point, reduced: boolean) {
    if (this.full()) return;
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    // One baked plume per 8 px of reach; the image stretches the remainder exactly.
    const reach = Math.max(8, Math.round(length / 8) * 8);
    const shape = this.shapes.shape(`breath:${reach}`, -4, -18, reach + 14, 36, (g) => {
      for (const [color, alpha, width, share] of [
        [0xf75a24, 0.4, 14, 1],
        [0xff9d29, 0.95, 9, 0.97],
        [0xffedbe, 0.95, 4, 0.82],
      ]) {
        const plume = [new Phaser.Math.Vector2(0, -1)];
        for (let i = 1; i <= 9; i++) {
          const t = i / 10;
          plume.push(
            new Phaser.Math.Vector2(
              reach * share * t,
              -width * (0.15 + t * 0.85) * (0.8 + 0.2 * Math.sin(i * 2.7)),
            ),
          );
        }
        plume.push(new Phaser.Math.Vector2(reach * share + width * 0.5, 0));
        for (let i = 9; i >= 1; i--) {
          const t = i / 10;
          plume.push(
            new Phaser.Math.Vector2(
              reach * share * t,
              width * (0.15 + t * 0.85) * (0.8 + 0.2 * Math.cos(i * 2.3)),
            ),
          );
        }
        g.fillStyle(color, alpha).fillPoints(plume, true);
      }
      g.fillStyle(0xffc657, 0.75)
        .fillCircle(reach, -4, 5)
        .fillCircle(reach + 3, 4, 4);
    });
    const g = this.take(shape, from.x, from.y, 8000, true).setData('dragonBreath', true);
    g.setScale(this.scaleOf(shape, length / reach), this.scaleOf(shape));
    g.setRotation(Math.atan2(to.y - from.y, to.x - from.x));
    this.animate({
      targets: g,
      alpha: 0,
      duration: reduced ? 100 : 280,
      onComplete: () => this.remove(g),
    });
  }

  impact(weapon: Weapon | 'melee', at: Point, reduced: boolean) {
    if (this.full()) return;
    const color = weapon === 'melee' ? 0xffe5b7 : COLORS[weapon];
    const explosive =
      weapon === 'bomb' || weapon === 'rocket' || weapon === 'fireball' || weapon === 'arcane';
    const shape = this.shapes.shape(`impact:${weapon}`, -15, -15, 30, 30, (g) => {
      if (weapon === 'healing') {
        g.fillStyle(color, 0.18).fillCircle(0, 0, 13);
        g.lineStyle(1.5, color, 0.8).strokeEllipse(0, 3, 24, 12);
        g.fillStyle(0xffffdd, 0.95).fillRoundedRect(-2, -8, 4, 14, 1);
        g.fillRoundedRect(-7, -3, 14, 4, 1);
      } else if (explosive) {
        g.fillStyle(color, 0.3).fillCircle(0, 0, 13);
        g.lineStyle(2, color, 0.9).strokeCircle(0, 0, 9);
        g.fillStyle(0xfff1c4).fillCircle(0, 0, 4);
      } else {
        g.lineStyle(2, color, 0.9);
        g.lineBetween(-7, -5, 7, 5);
        g.lineBetween(-4, 7, 4, -7);
      }
    });
    const g = this.take(shape, at.x, at.y, 8000, true).setData('impact', weapon);
    this.animate({
      targets: g,
      alpha: 0,
      scale: this.scaleOf(shape, reduced ? 1 : explosive ? 1.8 : 1.3),
      duration: reduced ? 100 : 180,
      onComplete: () => this.remove(g),
    });
  }
}
