import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../src/game/scene.ts', import.meta.url), 'utf8');

describe('topic outpost labels follow earned-level art bounds', () => {
  it('retains the compact default anchor while moving below tall scaled art', () => {
    expect(source).toMatch(/const labelY = Math\.max\(p\.y \+ 34, image\.getBounds\(\)\.bottom \+ 8\)/);
    expect(source).toMatch(/const labelX = labelOffsets/);
    expect(source).toMatch(/label\.setPosition\(labelX, labelY\)\.setDepth\(labelY \+ 1\)/);
  });

  it('keeps earned-level structure art and scaling independent of label placement', () => {
    expect(source).toMatch(/this\.styleBuilding\(image, slot\.artKind, structure\.artLevel\)/);
    expect(source).toMatch(/image\.setScale\(structure\.scale\)/);
  });
});
