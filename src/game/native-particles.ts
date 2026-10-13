import {
  nativeScenePoses,
  type NativeMatrix,
  type NativeMeshGraph,
  type NativeScenePose,
} from './native-mesh';

type Row = Record<string, string>;
type Point = { x: number; y: number };
export interface NativeParticlePose {
  key: string;
  emitter: string;
  poses: NativeScenePose[];
  x: number;
  y: number;
  depth: number;
}
const FIELDS = [
  'MinLife',
  'MaxLife',
  'StartScale',
  'EndScale',
  'ScaleRandomMin',
  'ScaleRandomMax',
  'MinHorizAngle',
  'MaxHorizAngle',
  'MinVertAngle',
  'MaxVertAngle',
  'MinSpeed',
  'MaxSpeed',
  'StartRadiusMin',
  'StartRadiusMax',
  'Inertia',
  'Slowdown',
  'StartX',
  'StartY',
  'Gravity',
  'StartZ',
  'StartAngleMin',
  'StartAngleMax',
  'MinRotate',
  'MaxRotate',
  'Alpha',
  'ParticleFadeOutTime',
  'FadeOutTime',
  'FadeInTime',
] as const;
type Parsed = Record<(typeof FIELDS)[number], number> & {
  bounce: boolean;
  orientHorizontal: boolean;
  orientMovement: boolean;
  scaleTimeline: boolean;
  isoParticle: boolean;
};
/** Emitter rows are static CSV records: parse each numeric column once, not per particle. */
const parsedRows = new WeakMap<Row, Parsed>();
function parsed(row: Row): Parsed {
  let result = parsedRows.get(row);
  if (result) return result;
  result = {
    bounce: row.BounceFromGround === 'TRUE',
    orientHorizontal: row.OrientToParentType === 'HorizontalAngle',
    orientMovement: row.OrientToMovement === 'TRUE',
    scaleTimeline: row.ScaleTimeline === 'TRUE',
    isoParticle: row.IsIsoParticle === 'TRUE',
  } as Parsed;
  for (const field of FIELDS) result[field] = Number(row[field] ?? 0);
  parsedRows.set(row, result);
  return result;
}
const clamp = (t: number) => Math.max(0, Math.min(1, t));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Source ranges with local continuous damping; native inertia/slowdown equations are unverified. */
export function nativeParticleTravel(
  speed: number,
  inertia: number,
  slowdown: number,
  age: number,
) {
  const time = inertia > 0 ? Math.log1p(inertia * age) / inertia : age;
  const moving = slowdown > 0 ? Math.min(time, speed / slowdown) : time;
  return Math.max(0, speed * moving - (slowdown * moving * moving) / 2);
}
/** Shared source-particle interpretation; effect-specific native art and static ground registration. */
export function nativeParticleSampler(
  graph: NativeMeshGraph,
  artScale: number,
  options: {
    reducedEmitters?: readonly string[];
    staticEmitters?: Readonly<Record<string, number>>;
    altitudeScale?: number;
    /** Effective duration for an animated descendant inside a static outer clip. */
    timelineDurations?: Readonly<Record<string, number>>;
    /** Cannon emitters use signed speeds and a radius along their firing cone. */
    signedSpeed?: boolean;
    directionalRadius?: boolean;
    orientTravelToParent?: boolean;
  } = {},
) {
  const { reducedEmitters = [], staticEmitters = {}, altitudeScale = 0.8 } = options;
  return function particle(
    key: string,
    emitter: string,
    rows: Row[],
    age: number,
    ground: Point,
    random: (slot: number) => number,
    layer: string,
    reduced: boolean,
    parentAngle = 0,
    parentMapAngle = 0,
  ): NativeParticlePose | undefined {
    const row = rows[0],
      p = parsed(row),
      life = mix(p.MinLife, p.MaxLife, random(0)) / 1000;
    if (age < 0 || age >= life) return;
    if (reduced && !reducedEmitters.includes(emitter)) return;
    const variant = rows[Math.floor(random(1) * rows.length)],
      name = variant.ParticleExportName;
    const phase = reduced ? 0.5 : clamp(age / life);
    const scale =
      (((artScale * mix(p.StartScale, p.EndScale, phase)) / 100) *
        mix(p.ScaleRandomMin, p.ScaleRandomMax, random(2))) /
      100;
    const horizontal =
      (mix(p.MinHorizAngle, p.MaxHorizAngle, random(3)) * Math.PI) / 180 +
      (options.orientTravelToParent && p.orientHorizontal ? parentMapAngle : 0);
    const vertical = (mix(p.MinVertAngle, p.MaxVertAngle, random(4)) * Math.PI) / 180;
    const rawSpeed = mix(p.MinSpeed, p.MaxSpeed, random(5));
    const sign = options.signedSpeed && rawSpeed < 0 ? -1 : 1;
    const speed = options.signedSpeed ? Math.abs(rawSpeed) : rawSpeed;
    const radius = mix(p.StartRadiusMin, p.StartRadiusMax, random(6));
    const radiusAngle =
      options.directionalRadius && p.orientHorizontal ? horizontal : random(7) * Math.PI * 2;
    const distance = reduced ? 0 : nativeParticleTravel(speed, p.Inertia, p.Slowdown, age) * sign;
    const x =
      p.StartX +
      Math.cos(radiusAngle) * radius +
      Math.cos(horizontal) * Math.cos(vertical) * distance;
    const y =
      p.StartY +
      Math.sin(radiusAngle) * radius +
      Math.sin(horizontal) * Math.cos(vertical) * distance;
    const gravity = p.Gravity,
      z0 = p.StartZ;
    const dampedTime = p.Inertia > 0 ? Math.log1p(p.Inertia * age) / p.Inertia : age;
    const velocity = (Math.max(0, speed - p.Slowdown * dampedTime) / (1 + p.Inertia * age)) * sign;
    let z = z0 + Math.sin(vertical) * distance - (gravity * age * age) / 2;
    let verticalSpeed = Math.sin(vertical) * velocity - gravity * age;
    if (p.bounce && z < 0 && gravity > 0) {
      // Solve the first floor crossing of this same damped trajectory, then make
      // one local 35% rebound. Native restitution is not in the source table.
      let low = 0,
        high = age;
      for (let i = 0; i < 24; i++) {
        const mid = (low + high) / 2;
        const height =
          z0 +
          Math.sin(vertical) * nativeParticleTravel(speed, p.Inertia, p.Slowdown, mid) -
          (gravity * mid * mid) / 2;
        if (height > 0) low = mid;
        else high = mid;
      }
      const hit = (low + high) / 2,
        after = age - hit;
      const time = p.Inertia > 0 ? Math.log1p(p.Inertia * hit) / p.Inertia : hit;
      const velocity = Math.max(0, speed - p.Slowdown * time) / (1 + p.Inertia * hit);
      const rebound = Math.max(0, gravity * hit - velocity * Math.sin(vertical)) * 0.35;
      z = Math.max(0, rebound * after - (gravity * after * after) / 2);
      verticalSpeed = z > 0 ? rebound - gravity * after : 0;
    }
    let angle =
      ((mix(p.StartAngleMin, p.StartAngleMax, random(8)) +
        mix(p.MinRotate, p.MaxRotate, random(9)) * (reduced ? 0 : age)) *
        Math.PI) /
      180;
    if (p.orientHorizontal) angle += parentAngle;
    if (p.orientMovement) {
      const vx = Math.cos(horizontal) * Math.cos(vertical) * velocity,
        vy = Math.sin(horizontal) * Math.cos(vertical) * velocity;
      angle += Math.atan2((vx + vy) * 0.16 - verticalSpeed * altitudeScale, (vx - vy) * 0.32);
    }
    const c = Math.cos(angle) * scale,
      sn = Math.sin(angle) * scale;
    const root: NativeMatrix = [c, -sn, 0, sn, c, (staticEmitters[emitter] ?? 0) * scale];
    const clip = graph.clips[graph.exports[name]];
    const seconds = p.scaleTimeline
      ? options.timelineDurations?.[name] !== undefined
        ? phase * options.timelineDurations[name]
        : (phase * clip.timeline.length) / clip.fps
      : reduced
        ? 0
        : age;
    let alpha = p.Alpha / 100;
    const fadeOut = p.ParticleFadeOutTime / 1000,
      fadeOut2 = p.FadeOutTime / 1000;
    if (fadeOut) alpha *= clamp((life - age) / fadeOut);
    if (fadeOut2) alpha *= clamp((life - age) / fadeOut2);
    const fadeIn = p.FadeInTime / 1000;
    if (fadeIn) alpha *= clamp(age / fadeIn);
    if (reduced && !Object.hasOwn(staticEmitters, emitter)) alpha *= 0.25;
    if (alpha <= 0) return;
    let poses = nativeScenePoses(graph, name, seconds, {}, root);
    if (variant.AdditiveBlend === 'TRUE' && !reduced)
      poses = [
        {
          key: name + ':emitter',
          group: poses,
          blend: 8,
          multiply: [1, 1, 1, alpha],
          add: [0, 0, 0, 0],
        },
      ];
    else if (alpha !== 1)
      poses = poses.map((pose) => ({
        ...pose,
        multiply: [pose.multiply[0], pose.multiply[1], pose.multiply[2], pose.multiply[3] * alpha],
      }));
    const groundLayer = layer === 'Ground' || p.isoParticle;
    return {
      key,
      emitter,
      poses,
      x: ground.x + (x - y) * 0.32,
      y:
        ground.y +
        (x + y) * 0.16 -
        (Object.hasOwn(staticEmitters, emitter) || reduced ? 0 : z * altitudeScale),
      depth: groundLayer
        ? -870
        : emitter === 'Grass'
          ? ground.y + (x + y) * 0.16
          : layer === 'Top'
            ? 8000
            : ground.y + (x + y) * 0.16 + 1,
    };
  };
}
