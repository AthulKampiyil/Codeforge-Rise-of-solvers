import type { Battle, Building } from './model';
import {
  towerArcherAttackTiming,
  type TowerArcherAction,
  type TowerArcherFacing,
} from './archer-tower-art';
import { ARCHER_TOWER } from './archer-tower-stats';
import { battleDefenseTarget } from './battle-index';

/** Original clips face right. These projected angle sectors are a local interpretation. */
export function towerArcherFacing(dx: number, dy: number): TowerArcherFacing {
  const x = dx - dy,
    y = (dx + dy) / 2;
  return { direction: y < -Math.abs(x) / 2 ? 1 : y > Math.abs(x) / 2 ? 3 : 2, flip: x < 0 };
}

/** Derive facing from simulation-owned targeting, without storing presentation state. */
export function battleTowerArcherFacing(
  tower: Building,
  battle?: Battle | null,
): TowerArcherFacing {
  const idle: TowerArcherFacing = { direction: 3, flip: false };
  if (!battle?.nativeArcherTowers || tower.hp <= 0 || tower.constructing) return idle;
  const target = battleDefenseTarget(battle, tower.id);
  if (!target || target.hp <= 0) return idle;
  const dx = target.x - tower.x - 1.5,
    dy = target.y - tower.y - 1.5;
  return Math.hypot(dx, dy) <= ARCHER_TOWER.range ? towerArcherFacing(dx, dy) : idle;
}

/** Sample the original release and follow-through from actual launch time.
 * Pre-release windup is not inferred from cooldown, which can stall under stun.
 */
export function battleTowerArcherPose(
  tower: Building,
  battle: Battle | null | undefined,
  seconds: number,
  reduced = false,
): TowerArcherFacing & TowerArcherAction {
  const idle = {
    ...battleTowerArcherFacing(tower, battle),
    action: 'idle' as const,
    time: reduced ? 0 : seconds,
  };
  if (
    !battle?.nativeArcherTowers ||
    battle.finished ||
    reduced ||
    tower.hp <= 0 ||
    tower.constructing ||
    tower.upgradeEnd ||
    (battle.defenseStuns[tower.id] ?? 0) > battle.elapsed
  )
    return idle;
  const pending = battle.archerTowerWindups?.[tower.id]?.pending;
  if (pending && battle.elapsed >= pending.startedAt && battle.elapsed < pending.releaseAt)
    return { ...idle, action: 'attack', time: battle.elapsed - pending.startedAt };
  const shot = battle.archerTowerShots?.[tower.id];
  if (!shot) return idle;
  const age = battle.elapsed - shot.at;
  const timing = towerArcherAttackTiming(tower.level);
  if (age < 0 || age >= timing.duration - timing.release) return idle;
  return {
    ...towerArcherFacing(shot.x - tower.x - 1.5, shot.y - tower.y - 1.5),
    action: 'attack',
    time: timing.release + age,
  };
}
