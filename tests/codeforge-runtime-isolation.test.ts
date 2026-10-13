import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');

describe('authenticated CodeForge runtime isolation', () => {
  it('does not schedule local economy ticks, replay work, screen-awake holds, or local saves', () => {
    expect(mainSource).toContain("new GameModel(undefined, Date.now(), { serverReadOnly: true })");
    expect(mainSource).not.toMatch(/model\.tick\(/);
    expect(mainSource).not.toMatch(/ScreenAwake|screenAwake|economyTimer/);
    expect(mainSource).not.toMatch(/saveGame|localStorage|startReplay|stepReplay/);
  });
});
