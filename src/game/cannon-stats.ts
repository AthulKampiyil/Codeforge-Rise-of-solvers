import source from '../../reference/cannon/combat.json' with { type: 'json' };
import projectiles from '../../reference/cannon/projectiles.json' with { type: 'json' };
import effects from '../../reference/cannon/effects.json' with { type: 'json' };

export const CANNON_LEVELS = source.levels;
export const CANNON_BUILDING = source.building;
export const CANNON = { range: source.attackRange / 100, interval: source.intervalMs / 1000 };
export const cannonStats = (level: number) => CANNON_LEVELS[level - 1];
export function cannonProjectileRow(level: number): Record<string, string> {
  const row = cannonStats(level);
  if (!row) throw Error(`Unsupported native Cannon level: ${level}`);
  return projectiles[row.projectile as keyof typeof projectiles][0];
}
export function cannonTrail(level: number) {
  const name = cannonProjectileRow(level).ParticleEmitter;
  if (!name) return;
  const row = effects.particles[name as keyof typeof effects.particles][0];
  return {
    name,
    interval: Number(row.EmissionTime) / 1000 / Number(row.ParticleCount),
    life: Number(row.MaxLife) / 1000,
  };
}
