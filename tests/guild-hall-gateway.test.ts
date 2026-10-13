import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const scene = readFileSync(new URL('../src/game/scene.ts', import.meta.url), 'utf8');
const boot = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');

describe('Guild Hall village gateway', () => {
  it('draws original procedural art outside topic slots and routes only a completed server-village tap', () => {
    expect(scene).toMatch(/private drawGuildHall\(\)[\s\S]*?this\.add\.graphics\(\)[\s\S]*?0xd5b457/);
    expect(scene).toMatch(/this\.guildHallCenter = p/);
    expect(scene).toMatch(/if \(topic\?\.topicId\)[\s\S]*?codeforge:topic-selected[\s\S]*?if \(this\.guildHallHit\(world\.x, world\.y\)\)/);
    expect(scene).toMatch(/const onPointerUp = \(p: Phaser\.Input\.Pointer\)[\s\S]*?if \(this\.dragged \|\| gesture !== 'none'\) return;[\s\S]*?this\.tap\(p\)/);
    expect(boot).toContain("'/?cp=1&tab=guild&return=%2F'");
    expect(boot).toContain("className = 'skip-link guild-hall-skip'");
  });

  it('leaves camera gesture classification and the fixed topic-slot count untouched', () => {
    expect(scene).toMatch(/private classifyDrag\(p: Phaser\.Input\.Pointer\)[\s\S]*?if \(this\.model\.serverReadOnly\) return 'pan'/);
    expect(scene).toMatch(/for \(const topic of presentation\.slots\)/);
    expect(scene).not.toMatch(/CP_VILLAGE_TOPIC_SLOTS\.push/);
  });
});
