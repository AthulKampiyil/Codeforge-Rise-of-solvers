import { BUILDINGS, type BuildingKind } from './data';
import type { SkeletonMode } from './skeleton-stats';
export type Blueprint = readonly [BuildingKind, number, number, number?, SkeletonMode?];
type Ring = readonly [number, number, number, number];
export interface CampaignLayout {
  buildings: readonly Blueprint[];
  rings: readonly Ring[];
  hint: string;
  recommended: number;
  health: number;
  defense: number;
}
export const CAMPAIGN_LAYOUTS: readonly CampaignLayout[] = [
  {
    buildings: [
      ['townhall', 11, 10],
      ['goldstorage', 7, 10],
      ['elixirstorage', 11, 6],
      ['cannon', 16, 10],
      ['archertower', 10, 15],
      ['goldmine', 6, 15],
      ['collector', 17, 6],
      ['barracks', 14, 16],
      ['camp', 18, 14],
      ['builder', 7, 7],
    ],
    rings: [[9, 9, 18, 19]],
    hint: 'Let giants absorb fire while your ranged troops follow.',
    recommended: 50,
    health: 0.65,
    defense: 0.7,
  },
  {
    buildings: [
      ['townhall', 12, 10],
      ['goldstorage', 7, 10],
      ['elixirstorage', 12, 5],
      ['barracks', 6, 16],
      ['camp', 18, 16],
      ['builder', 19, 7],
      ['goldmine', 5, 6],
      ['collector', 18, 11],
      ['cannon', 9, 15],
      ['archertower', 16, 6],
    ],
    rings: [[6, 8, 21, 20]],
    hint: 'The open west approach leads toward the treasury. Send a scout before committing a group through a gate.',
    recommended: 55,
    health: 0.8,
    defense: 0.85,
  },
  {
    buildings: [
      ['townhall', 11, 11],
      ['goldstorage', 7, 7],
      ['elixirstorage', 16, 15],
      ['barracks', 6, 15],
      ['camp', 17, 5],
      ['goldmine', 3, 10],
      ['collector', 21, 13],
      ['archertower', 16, 9],
      ['cannon', 9, 16],
      ['mortar', 15, 12],
      ['builder', 8, 4],
    ],
    rings: [[6, 6, 20, 20]],
    hint: 'Mortar shells punish a crowded army. Deploy in two groups.',
    recommended: 65,
    health: 0.9,
    defense: 1,
  },
  {
    buildings: [
      ['townhall', 15, 10],
      ['goldstorage', 11, 5],
      ['goldmine', 5, 8],
      ['goldmine', 5, 12],
      ['goldstorage', 5, 16],
      ['elixirstorage', 11, 16],
      ['barracks', 17, 17],
      ['camp', 20, 5],
      ['collector', 20, 11],
      ['cannon', 9, 10],
      ['mortar', 12, 13],
      ['archertower', 16, 6],
      ['builder', 7, 20],
    ],
    rings: [[10, 8, 21, 20]],
    hint: 'The mines are exposed, but the keep is protected from the east.',
    recommended: 75,
    health: 1,
    defense: 1.1,
  },
  {
    buildings: [
      ['townhall', 11, 11],
      ['archertower', 6, 8],
      ['archertower', 17, 8],
      ['archertower', 8, 17],
      ['archertower', 17, 17],
      ['cannon', 12, 7],
      ['mortar', 12, 17],
      ['goldstorage', 7, 12],
      ['elixirstorage', 17, 12],
      ['barracks', 11, 3],
      ['camp', 3, 18],
      ['goldmine', 3, 10],
      ['collector', 21, 5],
      ['builder', 21, 20],
      ['airdefense', 9, 7],
    ],
    rings: [
      [6, 6, 20, 20],
      [10, 10, 15, 15],
    ],
    hint: 'Four towers cover the corners, and the first air defense guards the keep.',
    recommended: 85,
    health: 1.1,
    defense: 1.1161,
  },
  {
    buildings: [
      ['townhall', 11, 10],
      ['wizardtower', 7, 7],
      ['archertower', 18, 14],
      ['cannon', 8, 13],
      ['cannon', 16, 8],
      ['mortar', 12, 16],
      ['mortar', 15, 16],
      ['goldstorage', 5, 17],
      ['elixirstorage', 19, 6],
      ['goldmine', 4, 7],
      ['collector', 21, 17],
      ['barracks', 10, 20],
      ['camp', 3, 12],
      ['builder', 17, 21],
      ['airdefense', 15, 12],
    ],
    rings: [[7, 6, 20, 19]],
    hint: 'A Sweeper guards the western air approach. Fly behind its nozzle or use ground troops to clear it.',
    recommended: 95,
    health: 1.2,
    defense: 1.2054,
  },
  {
    buildings: [
      ['townhall', 11, 10],
      ['elixirstorage', 7, 7],
      ['elixirstorage', 16, 7],
      ['elixirstorage', 11, 16],
      ['collector', 3, 12],
      ['collector', 20, 12],
      ['collector', 16, 20],
      ['goldstorage', 6, 18],
      ['barracks', 4, 4],
      ['camp', 20, 4],
      ['cannon', 8, 12],
      ['cannon', 16, 13],
      ['archertower', 10, 5],
      ['archertower', 19, 18],
      ['mortar', 8, 15],
      ['builder', 20, 21],
      ['airdefense', 15, 10],
    ],
    rings: [[6, 6, 20, 20]],
    hint: 'Collectors distract ground troops. Balloons ignore them — and the walls.',
    recommended: 105,
    health: 1.3,
    defense: 1.2946,
  },
  {
    buildings: [
      ['townhall', 12, 11],
      ['wizardtower', 7, 8],
      ['archertower', 18, 8],
      ['archertower', 8, 17],
      ['archertower', 18, 17],
      ['cannon', 11, 7],
      ['cannon', 12, 17],
      ['mortar', 7, 13],
      ['mortar', 18, 13],
      ['goldstorage', 3, 6],
      ['elixirstorage', 22, 14],
      ['goldmine', 3, 18],
      ['collector', 20, 3],
      ['barracks', 12, 3],
      ['camp', 3, 12],
      ['builder', 22, 20],
      ['airdefense', 14, 7],
    ],
    rings: [
      [6, 6, 21, 20],
      [10, 10, 17, 16],
    ],
    hint: 'A hidden Seeking Air Mine can cripple a flyer. Scout with a Balloon before committing Dragons or Healers.',
    recommended: 115,
    health: 1.4,
    defense: 1.3839,
  },
  {
    buildings: [
      ['townhall', 11, 10],
      ['camp', 5, 4],
      ['camp', 20, 20],
      ['barracks', 4, 19],
      ['archertower', 7, 9],
      ['archertower', 18, 8],
      ['archertower', 7, 17],
      ['archertower', 17, 17],
      ['cannon', 11, 6],
      ['cannon', 11, 17],
      ['mortar', 15, 6],
      ['mortar', 15, 14],
      ['goldstorage', 4, 12],
      ['elixirstorage', 20, 12],
      ['goldmine', 20, 5],
      ['collector', 11, 21],
      ['builder', 5, 8],
      ['airdefense', 7, 12],
      ['airdefense', 16, 11],
    ],
    rings: [
      [6, 5, 20, 20],
      [10, 9, 15, 14],
    ],
    hint: 'Layered walls protect the keep, and two air defenses cover the approach.',
    recommended: 125,
    health: 1.5,
    defense: 1.371,
  },
  {
    buildings: [
      ['townhall', 11, 11],
      ['wizardtower', 6, 7],
      ['archertower', 18, 7],
      ['archertower', 7, 18],
      ['archertower', 18, 18],
      ['cannon', 12, 6],
      ['cannon', 6, 12],
      ['cannon', 19, 12],
      ['cannon', 12, 19],
      ['mortar', 8, 15],
      ['mortar', 16, 13],
      ['goldstorage', 7, 3],
      ['elixirstorage', 18, 3],
      ['camp', 3, 19],
      ['barracks', 20, 21],
      ['goldmine', 3, 7],
      ['collector', 22, 7],
      ['builder', 5, 16],
      ['airdefense', 9, 6],
      ['airdefense', 15, 16],
    ],
    rings: [[5, 5, 22, 22]],
    hint: 'Every approach is defended. Lightning the air defenses, then fly over the walls.',
    recommended: 135,
    health: 1.6,
    defense: 1.4919,
  },
  {
    buildings: [
      ['townhall', 11, 11],
      ['cannon', 7, 11],
      ['cannon', 17, 11],
      ['cannon', 11, 7],
      ['cannon', 10, 17],
      ['archertower', 7, 5],
      ['archertower', 18, 6],
      ['archertower', 7, 19],
      ['archertower', 18, 19],
      ['mortar', 7, 15],
      ['mortar', 17, 15],
      ['mortar', 15, 7],
      ['goldstorage', 3, 10],
      ['elixirstorage', 21, 10],
      ['barracks', 11, 21],
      ['camp', 12, 2],
      ['goldmine', 3, 4],
      ['collector', 22, 19],
      ['builder', 3, 18],
      ['airdefense', 7, 8],
      ['airdefense', 13, 17],
    ],
    rings: [
      [6, 5, 20, 21],
      [10, 10, 15, 15],
    ],
    hint: 'A reinforced keep, three mortars and paired air defenses. Bring spells.',
    recommended: 145,
    health: 1.7,
    defense: 1.6129,
  },
  {
    buildings: [
      ['townhall', 11, 11],
      ['goldstorage', 7, 7],
      ['elixirstorage', 16, 7],
      ['goldstorage', 7, 16],
      ['elixirstorage', 16, 16],
      ['wizardtower', 4, 10],
      ['archertower', 20, 10],
      ['archertower', 10, 5],
      ['archertower', 10, 19],
      ['cannon', 5, 13],
      ['cannon', 19, 14],
      ['cannon', 14, 4],
      ['cannon', 14, 20],
      ['mortar', 8, 12],
      ['mortar', 16, 12],
      ['mortar', 12, 8],
      ['mortar', 12, 16],
      ['barracks', 2, 3],
      ['camp', 21, 21],
      ['goldmine', 2, 20],
      ['collector', 21, 3],
      ['builder', 3, 17],
      ['airdefense', 5, 19],
      ['airdefense', 17, 19],
    ],
    rings: [
      [4, 4, 22, 22],
      [10, 10, 15, 15],
    ],
    hint: 'The final fortress. Two Seeking Air Mines protect the core; attack behind the Sweeper and bring spells.',
    recommended: 160,
    health: 1.8,
    defense: 1.55,
  },
];
/** Hidden hazards are separate so scouting previews never list their positions or counts. */
const CAMPAIGN_TRAPS: readonly (readonly Blueprint[])[] = [
  [],
  [['bomb', 13, 8]],
  [
    ['bomb', 13, 6],
    ['bomb', 13, 20],
  ],
  [
    ['bomb', 10, 14],
    ['springtrap', 15, 20],
  ],
  [
    ['bomb', 13, 20],
    ['airbomb', 16, 6],
  ],
  [
    ['bomb', 13, 6],
    ['springtrap', 20, 13],
    ['airbomb', 18, 11],
  ],
  [
    ['giantbomb', 13, 20],
    ['bomb', 6, 13],
    ['springtrap', 13, 6],
  ],
  [
    ['bomb', 13, 20],
    ['airbomb', 21, 14],
    ['springtrap', 6, 16],
  ],
  [
    ['giantbomb', 12, 14],
    ['bomb', 6, 11],
    ['airbomb', 13, 5],
  ],
  [
    ['bomb', 13, 22],
    ['springtrap', 5, 13],
    ['airbomb', 22, 14],
  ],
  [
    ['giantbomb', 10, 5],
    ['springtrap', 14, 20],
    ['airbomb', 20, 14],
  ],
  [
    ['bomb', 13, 4],
    ['giantbomb', 12, 22],
    ['springtrap', 4, 13],
    ['airbomb', 22, 14],
  ],
];
const CAMPAIGN_AIR_CONTROL: readonly (readonly Blueprint[])[] = [
  [],
  [],
  [],
  [],
  [],
  [['airsweeper', 12, 8, 4]],
  [['airsweeper', 11, 14, 2]],
  [
    ['airsweeper', 13, 15, 4],
    ['seekingairmine', 8, 11],
  ],
  [
    ['airsweeper', 16, 9, 6],
    ['seekingairmine', 9, 15],
  ],
  [
    ['airsweeper', 12, 9, 0],
    ['seekingairmine', 11, 17],
  ],
  [
    ['airsweeper', 18, 9, 4],
    ['seekingairmine', 12, 15],
  ],
  [
    ['airsweeper', 16, 10, 6],
    ['seekingairmine', 10, 8],
    ['seekingairmine', 10, 17],
  ],
];
const CAMPAIGN_TESLAS: readonly (readonly Blueprint[])[] = [
  [],
  [],
  [],
  [],
  [],
  [],
  [['tesla', 9, 10]],
  [['tesla', 15, 17]],
  [
    ['tesla', 9, 7],
    ['tesla', 18, 14],
  ],
  [
    ['tesla', 9, 10],
    ['tesla', 16, 9],
  ],
  [['tesla', 16, 18]],
  [
    ['tesla', 8, 10],
    ['tesla', 19, 17],
  ],
];
/** Authored structure footprints plus rings with deliberate gates and no overlapping posts. */
const CAMPAIGN_BOMB_TOWERS: readonly (readonly Blueprint[])[] = [
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [['bombtower', 14, 17]],
  [['bombtower', 12, 15]],
  [['bombtower', 21, 13]],
  [['bombtower', 19, 7]],
];
export function campaignBlueprint(index: number): Blueprint[] {
  const layout = CAMPAIGN_LAYOUTS[index];
  if (!layout) throw new RangeError('Unknown campaign stage');
  const result: Blueprint[] = [
    ...layout.buildings,
    ...CAMPAIGN_TRAPS[index],
    ...CAMPAIGN_AIR_CONTROL[index],
    ...CAMPAIGN_TESLAS[index],
    ...CAMPAIGN_BOMB_TOWERS[index],
    ...(
      [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [
          ['skeletontrap', 11, 13],
          ['skeletontrap', 16, 13, undefined, 'air'],
        ],
        [
          ['skeletontrap', 11, 15],
          ['skeletontrap', 15, 12, undefined, 'air'],
        ],
        [
          ['skeletontrap', 10, 13],
          ['skeletontrap', 15, 13, undefined, 'air'],
        ],
        [
          ['skeletontrap', 13, 15],
          ['skeletontrap', 15, 13, undefined, 'air'],
        ],
        [
          ['skeletontrap', 13, 15],
          ['skeletontrap', 15, 13, undefined, 'air'],
        ],
      ] as readonly (readonly Blueprint[])[]
    )[index],
  ];
  const occupied = new Set<string>();
  for (const [k, x, y] of result)
    for (let dx = 0; dx < BUILDINGS[k].size; dx++)
      for (let dy = 0; dy < BUILDINGS[k].size; dy++) occupied.add(`${x + dx},${y + dy}`);
  const wall = (x: number, y: number) => {
    const key = `${x},${y}`;
    if (occupied.has(key)) return;
    occupied.add(key);
    result.push(['wall', x, y]);
  };
  for (const [x0, y0, x1, y1] of layout.rings) {
    const mid = Math.floor((x0 + x1) / 2);
    for (let x = x0; x <= x1; x++) {
      if (x !== mid) wall(x, y0);
      if (x !== mid && x !== mid + 1) wall(x, y1);
    }
    for (let y = y0 + 1; y < y1; y++) {
      if (y !== Math.floor((y0 + y1) / 2)) wall(x0, y);
      if (y !== Math.floor((y0 + y1) / 2) + 1) wall(x1, y);
    }
  }
  return result;
}
