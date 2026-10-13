import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { topicStructurePresentation } from '../src/cp/village-presentation';
import { GameModel } from '../src/game/model';
import type { VillageOutpostsSnapshot, VillageProfile } from '../src/cp/types';

const sceneSource = readFileSync(new URL('../src/game/scene.ts', import.meta.url), 'utf8');

function profile(level: number): VillageProfile {
  return {
    user_id: 'solver', username: 'solver', total_solved: 10, average_level: 1,
    defense_rating: 1,
    topics: [{ id: 'arrays', name: 'arrays', display_name: 'Arrays', structure_key: 'arrays',
      progress_points: level * 10, level, points_to_next_level: 10, progress_pct: 0 }],
  };
}

const wallet = { gold: 1000, elixir: 1000, gems: 0, builderCapacity: 0, username: 'solver' };
const outposts: VillageOutpostsSnapshot = {
  items: [{ topic_id: 'arrays', tier: 2, next_gold_cost: 100, next_elixir_cost: 100 }],
  wallet: { coins: 0, gold: 1000, elixir: 1000, gems: 0, builder_capacity: 0, rewarded_solves: 10 },
};

describe('earned topic structure progression', () => {
  it('visually distinguishes level zero and earned levels independently of purchased tier', () => {
    const zero = topicStructurePresentation(0);
    const one = topicStructurePresentation(1);
    const three = topicStructurePresentation(3);
    expect(zero).toMatchObject({ earnedTier: 0, artLevel: 1, earned: false });
    expect(one).toMatchObject({ earnedTier: 1, artLevel: 1, earned: true });
    expect(three).toMatchObject({ earnedTier: 3, artLevel: 3, earned: true });
    expect(zero.scale).toBeLessThan(one.scale);
    expect(one.scale).toBeLessThan(three.scale);
    expect(topicStructurePresentation(99)).toEqual(topicStructurePresentation(5));
  });

  it('updates structure art presentation from a refreshed solve level while purchased tier stays unchanged', () => {
    const model = new GameModel(undefined, Date.now(), { serverReadOnly: true });
    model.setServerVillageSnapshot(profile(0), wallet, outposts);
    const slot = () => model.topicOutposts!.slots.find((entry) => entry.topicId === 'arrays')!;
    const initial = topicStructurePresentation(slot().cpLevel);
    expect(slot().purchasedTier).toBe(2);

    model.setServerVillageSnapshot(profile(4), wallet, outposts);
    const refreshed = topicStructurePresentation(slot().cpLevel);
    expect(slot()).toMatchObject({ cpLevel: 4, purchasedTier: 2 });
    expect(refreshed.artLevel).toBe(4);
    expect(refreshed.scale).toBeGreaterThan(initial.scale);
  });

  it('uses earned presentation for building style and scale, retaining purchased tier as a separate plinth cue', () => {
    expect(sceneSource).toMatch(/const structure = topicStructurePresentation\(topic\.cpLevel\)/);
    expect(sceneSource).toMatch(/this\.styleBuilding\(image, slot\.artKind, structure\.artLevel\)/);
    expect(sceneSource).toMatch(/image\.setScale\(structure\.scale\)/);
    expect(sceneSource).toMatch(/if \(hasTier && tier > 0\)[\s\S]*?0xffc95e/);
    expect(sceneSource).toMatch(/tierLabel\.setText\(hasTier \? `TIER \$\{tier\}` : 'TIER \?'\)/);
  });
});
