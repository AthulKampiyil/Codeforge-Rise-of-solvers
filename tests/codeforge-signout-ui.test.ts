import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const loadDialog = () => readFileSync(new URL('../src/ui/codeforge-dialog.ts', import.meta.url), 'utf8');

describe('in-game CodeForge sign out', () => {
  it('offers sign out beside the signed-in account, and only while authenticated', () => {
    const dialog = loadDialog();
    expect(dialog).toContain('class="game-btn stone" data-cf-signout');
    expect(dialog).toContain('authenticated ? `<button class="game-btn stone" data-cf-signout');
    expect(dialog).toContain('Sign in to connect your Codeforces account and sync progress.');
  });

  it('ends the server session and only clears local tokens when the player confirms a local-only fallback', () => {
    const dialog = loadDialog();
    expect(dialog).toContain('await authApi.logout(getRefreshToken() ?? undefined)');
    expect(dialog).toMatch(/catch \{\s*if \(closed \|\| !window\.confirm\('The server could not end this session\. Sign out on this device only\?'\)\) return;\s*clearTokens\(\);/);
  });

  it('drops every panel-side session and lands on the sign-in page immediately', () => {
    const dialog = loadDialog();
    expect(dialog).toContain('user = null; accounts = []; profile = null; wallet = null; sync = [];');
    expect(dialog).toContain("history = []; historyTotal = 0; pendingProof = null; copyNotice = '';");
    expect(dialog).toContain("window.location.assign('/?cp=1&return=%2F')");
  });

  it('keeps focus restore and the busy guard aware of the sign-out control', () => {
    const dialog = loadDialog();
    expect(dialog).toContain("'data-cf-signout'");
    expect(dialog).toContain("root.querySelector('[data-cf-signout]')?.addEventListener('click', signOut, { signal });");
    expect(dialog).toMatch(/const signOut = \(\) => \{\s*if \(closed \|\| busy\) return;/);
  });
});
