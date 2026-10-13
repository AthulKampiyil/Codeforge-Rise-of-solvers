import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../src/ui/hud.ts', import.meta.url), 'utf8');

describe('authenticated CodeForge HUD isolation', () => {
  it('removes legacy entry verbs from both read-only dispatch and render allowlists', () => {
    const dispatch = source.match(/if \(\(m as GameModel & \{ serverReadOnly\?: boolean \}\)\.serverReadOnly\) \{\s*const allowed = new Set\(\[([\s\S]*?)\]\);/)?.[1];
    const renderBlock = source.slice(source.indexOf('this.renderCodeForgeLayoutControls();', source.indexOf('render() {')));
    const render = renderBlock.match(/const allowed = new Set\(\[([\s\S]*?)\]\);/)?.[1];
    expect(dispatch).toBeDefined();
    expect(render).toBeDefined();
    for (const verb of ['campaign', 'achievements', 'battle-log', 'builders']) {
      expect(dispatch).not.toContain(`'${verb}'`);
      expect(render).not.toContain(`'${verb}'`);
    }
  });

  it('hides the visible builder and achievement entry controls only in server-read-only home HUD', () => {
    expect(source).toMatch(/if \(\(this\.model as GameModel & \{ serverReadOnly\?: boolean \}\)\.serverReadOnly\)\s*return '';/);
    expect(source).toMatch(/\$\{readOnly \? '' : `<button data-action="builders"/);
    expect(source).toMatch(/\$\{readOnly \? '' : `<nav class="left-tools"/);
  });

  it('keeps Codeforces, settings, camera, topic and server-layout actions allowed', () => {
    const allowlist = source.match(/const allowed = new Set\(\[([\s\S]*?)\]\);/)?.[1] ?? '';
    for (const verb of ['codeforge', 'cf-attack-refresh', 'cf-attack-open', 'cf-attack-check', 'cf-attack-launch', 'cf-topic-select', 'cf-outpost-upgrade', 'cf-outpost-refresh', 'cf-layout-edit', 'cf-layout-save', 'cf-layout-cancel', 'cf-layout-flip', 'settings', 'sound', 'music', 'motion', 'battery', 'haptics', 'zoom-in', 'zoom-out', 'recenter'])
      expect(allowlist).toContain(`'${verb}'`);
    expect(source).toMatch(/data-action="codeforge" aria-label="Open Codeforces attacks and account progress"/);
    expect(source).toMatch(/data-action="\$\{readOnly \? 'codeforge' : 'campaign'\}"/);
  });
});
