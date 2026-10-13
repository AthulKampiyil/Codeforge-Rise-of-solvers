import source from '../../reference/full-client/progression.json' with { type: 'json' };
import type { TroopDef } from './data';
export const EXTRA_TROOP_KINDS = [
  'babydragon',
  'miner',
  'electrodragon',
  'yeti',
  'dragonrider',
  'electrotitan',
  'rootrider',
  'thrower',
  'meteorgolem',
  'minion',
  'hogrider',
  'valkyrie',
  'golem',
  'witch',
  'lavahound',
  'bowler',
  'icegolem',
  'headhunter',
  'apprenticewarden',
  'druid',
  'furnace',
  'ruinwitch',
  'wallwrecker',
  'battleblimp',
  'stoneslammer',
  'siegebarracks',
  'loglauncher',
  'flameflinger',
  'battledrill',
  'trooplauncher',
  'superbarbarian',
  'superarcher',
  'supergiant',
  'sneakygoblin',
  'superwallbreaker',
  'rocketballoon',
  'superwizard',
  'superdragon',
  'infernodragon',
  'superminer',
  'superyeti',
  'superminion',
  'superhogrider',
  'supervalkyrie',
  'superwitch',
  'icehound',
  'superbowler',
] as const;
export type ExtraTroopKind = (typeof EXTRA_TROOP_KINDS)[number];
export const EXTRA_TROOPS = Object.fromEntries(
  EXTRA_TROOP_KINDS.map((kind) => {
    const row = source.troopDefs[kind] as unknown as Record<string, string>,
      stats = source.troops[kind][0];
    const num = (key: string) => Number(row[key] || 0),
      rate = num('AttackSpeed') / 1000 || 1;
    return [
      kind,
      {
        name: row.Name,
        role:
          num('DPS') < 0
            ? 'SUPPORT'
            : row.IsFlying === 'TRUE'
              ? 'AIR'
              : num('AttackRange') >= 200
                ? 'RANGED'
                : 'MELEE',
        description: `${row.Name} · ${row.ProductionBuilding} level ${row.BarrackLevel}.`,
        hp: stats.hp,
        damage: stats.dps * rate,
        range: num('AttackRange') / 100,
        rate,
        speed: num('Speed') / 100,
        cost: 0,
        space: num('HousingSpace'),
        time: 0,
        width: Math.min(65, 26 + Math.sqrt(num('HousingSpace')) * 4),
        research: source.troops[kind][1]?.seconds ?? 0,
        splash: num('DamageRadius') / 100 || undefined,
        flying: row.IsFlying === 'TRUE' ? true : undefined,
        prefersDefenses: row.PreferedTargetBuilding === 'Defense' ? true : undefined,
        wallJumper: row.IsJumper === 'TRUE' || kind === 'miner',
        healer: num('DPS') < 0,
        heal: stats.heal * rate,
        deathDamage: stats.deathDamage || undefined,
        deathRadius: num('DieDamageRadius') / 100 || undefined,
      },
    ];
  }),
) as unknown as Record<ExtraTroopKind, TroopDef>;
