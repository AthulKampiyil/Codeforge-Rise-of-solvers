import { describe, expect, it } from 'vitest';
import { GameModel, initialSave } from '../src/game/model';

describe('server-owned village model', () => {
  it('accepts server economy snapshots by copy and exposes server builder capacity', () => {
    const model = new GameModel(undefined, 10_000, { serverReadOnly: true });
    const snapshot = {
      gold: 12,
      elixir: 34,
      gems: 5,
      builderCapacity: 7,
      username: 'Village owner',
    };
    model.setServerEconomy(snapshot);
    snapshot.gold = 999;
    expect(model.serverEconomy).toEqual({
      gold: 12,
      elixir: 34,
      gems: 5,
      builderCapacity: 7,
      username: 'Village owner',
    });
    expect(model.builders).toBe(7);
    expect(model.busy).toBe(0);
    expect(() => model.setServerEconomy({ ...snapshot, builderCapacity: -1 })).toThrow();
  });

  it('does not accrue or simulate locally, while tick still advances the clock', () => {
    const save = initialSave();
    save.gold = 42;
    const model = new GameModel(save, 1_000, { serverReadOnly: true });
    const gold = model.state.gold;
    const stored = model.state.buildings.find((building) => building.kind === 'goldmine')!.stored;
    const lastTick = model.state.lastTick;
    const clock = model.clock;
    model.tick(clock + 60_000);
    model.step(60);
    expect(model.clock).toBe(clock + 60_000);
    expect(model.state.lastTick).toBe(clock + 60_000);
    expect(model.state.gold).toBe(gold);
    expect(model.state.buildings.find((building) => building.kind === 'goldmine')!.stored).toBe(stored);
    expect(model.state.lastTick).not.toBe(lastTick);
  });

  it('skips legacy roster, equipment, and inferred-wins initialization', () => {
    const save = initialSave();
    delete (save.army as Partial<typeof save.army>).babydragon;
    save.equipment = {
      levels: { puppet: 1, vial: 1, boots: 1 },
      loadout: ['puppet', 'vial'],
    };
    save.stats.wins = undefined as unknown as number;
    const beforeEquipment = structuredClone(save.equipment);
    const model = new GameModel(save, 2_000, { serverReadOnly: true });

    expect(Object.hasOwn(model.state.army, 'babydragon')).toBe(false);
    expect(model.state.equipment).toEqual(beforeEquipment);
    expect(model.state.stats.wins).toBeUndefined();
    expect(model.state.nativeCampaign).toBeUndefined();
    expect(model.state.campaignLoot).toBeUndefined();
    expect(model.clock).toBe(2_000);
  });

  it('rejects reachable local resource and village mutations in server mode', () => {
    const model = new GameModel(undefined, 1_000, { serverReadOnly: true });
    const save = structuredClone(model.state);
    expect(model.place(2, 2)).toBe(false);
    expect(model.upgrade(model.townhall!.id)).toBe(false);
    expect(model.train('swordsman')).toBe(false);
    expect(model.startBattle(0, false)).toBe(false);
    model.collect();
    expect(model.state).toEqual(save);
  });
});
