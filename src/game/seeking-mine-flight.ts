import source from '../../reference/seeking-mine/effects.json' with { type: 'json' };

const row = source.particles.large_airTrap_redSmoke[0];
export const SEEKING_MINE_TRAIL = {
  interval: Number(row.EmissionTime) / 1000 / Number(row.ParticleCount),
  life: Number(row.MaxLife) / 1000,
};
export interface SeekingMineTrailPoint {
  index: number;
  at: number;
  x: number;
  y: number;
  direction: { x: number; y: number };
}
/** Recomputed presentation history; never serialized into village or replay input. */
export interface SeekingMineFlight {
  trail: SeekingMineTrailPoint[];
  nextTrail: number;
  resolvedAt?: number;
  hit?: boolean;
}
export function recordSeekingMineTrail(
  flight: SeekingMineFlight,
  launch: number,
  start: number,
  end: number,
  elapsed: number,
  from: { x: number; y: number },
  to: { x: number; y: number },
  impact: boolean,
) {
  const { interval, life } = SEEKING_MINE_TRAIL;
  flight.trail = flight.trail.filter((p) => elapsed - p.at < life);
  flight.nextTrail = Math.max(
    flight.nextTrail,
    Math.ceil((Math.max(start, elapsed - life) - launch) / interval - 1e-9),
  );
  if (end <= start) return;
  const dx = to.x - from.x,
    dy = to.y - from.y,
    direction = { x: dx - dy, y: (dx + dy) / 2 };
  for (
    let at = launch + flight.nextTrail * interval;
    at < end + (impact ? -1e-9 : 1e-9);
    at = launch + flight.nextTrail * interval
  ) {
    const t = Math.max(0, Math.min(1, (at - start) / (end - start)));
    flight.trail.push({
      index: flight.nextTrail++,
      at,
      x: from.x + dx * t,
      y: from.y + dy * t,
      direction,
    });
  }
}
