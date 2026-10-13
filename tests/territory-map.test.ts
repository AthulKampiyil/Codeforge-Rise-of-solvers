import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseTerritoryPolygon } from '../src/cp/ui';

const source = readFileSync(new URL('../src/cp/ui/index.ts', import.meta.url), 'utf8');

describe('territory map geometry and interaction', () => {
  it('accepts valid 800x600 coordinate polygons and rejects unsafe or degenerate data', () => {
    expect(parseTerritoryPolygon([[60, 170], [170, 140], [240, 260]])).toEqual([[60, 170], [170, 140], [240, 260]]);
    expect(parseTerritoryPolygon(null)).toBeNull();
    expect(parseTerritoryPolygon([[0, 0], [5, Number.NaN], [8, 9]])).toBeNull();
    expect(parseTerritoryPolygon([[0, 0], [1, 1]])).toBeNull();
    expect(parseTerritoryPolygon([[0, 0], [801, 1], [2, 2]])).toBeNull();
    expect(parseTerritoryPolygon([[0, 0], [1, 1, 2], [2, 2]])).toBeNull();
  });

  it('uses only server zone geometry and ownership, with selected-zone SVG controls and an invalid-geometry list fallback', () => {
    expect(source).toMatch(/parseTerritoryPolygon\(zone\.map_polygon\)/);
    expect(source).toMatch(/role="button" tabindex="0" aria-pressed="\$\{selected\}" aria-label="Select \$\{name\}\. Owner: \$\{owner\}"/);
    expect(source).toMatch(/data-map-zone="\$\{esc\(zone\.id\)\}"/);
    expect(source).toMatch(/const missingGeometry=valid\.length!==zones\.length/);
    expect(source).toMatch(/Some boundaries are unavailable; all zones remain selectable here/);
    expect(source).toMatch(/focused\.scores\?Object\.entries\(focused\.scores\)/);
    expect(source).toMatch(/event\.event_type==='TERRITORY_ZONE_CHANGED'&&tab==='territory'\)void loadTab\('territory'\)/);
    expect(source).toMatch(/if\(getAccessToken\(\)&&tab==='territory'\)void loadTab\('territory'\)/);
  });
});
