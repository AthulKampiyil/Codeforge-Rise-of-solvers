import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const hud = fs.readFileSync(new URL('../src/ui/hud.ts', import.meta.url), 'utf8');
const dialog = fs.readFileSync(new URL('../src/ui/codeforge-dialog.ts', import.meta.url), 'utf8');
const dialogCss = fs.readFileSync(new URL('../src/ui/codeforge-dialog.css', import.meta.url), 'utf8');

describe('native CodeForge attack problem links', () => {
  it('accepts only validated HTTPS Codeforces URLs', () => {
    expect(hud).toMatch(/export function codeforcesProblemUrl\(problem: Record<string, unknown>\)/);
    expect(hud).toMatch(/url\.protocol === 'https:'/);
    expect(hud).toMatch(/\['codeforces\.com', 'www\.codeforces\.com', 'codeforces\.com\.ru'\]/);
  });

  it('constructs a trusted contest link only from backend contest/index fields', () => {
    expect(hud).toMatch(/problem\.contest_id != null && problem\.index != null/);
    expect(hud).toMatch(/https:\/\/codeforces\.com\/contest\/\$\{encodeURIComponent\(String\(problem\.contest_id\)\)\}\/problem\/\$\{encodeURIComponent\(String\(problem\.index\)\)\}/);
  });

  it('routes the original attack button to Codeforces in server mode and removes fake local actions', () => {
    expect(hud).toMatch(/class="attack-btn" data-action="\$\{readOnly \? 'codeforge' : 'campaign'\}"/);
    expect(hud).toMatch(/readOnly \? 'CF CHALLENGE' : 'SINGLE PLAYER'/);
    expect(hud).toMatch(/readOnly \? '' : `<div class="bottom-right">/);
    expect(hud).toMatch(/\$\{readOnly \? '' : `<nav class="left-tools"/);
    expect(hud).toMatch(/readOnly \? 'Solve rewards'/);
  });

  it('renders outpost costs from the store and disables purchases without fresh eligible state', () => {
    expect(hud).toMatch(/cpVillageStore\.upgradeOutpost\(topicId\)/);
    expect(hud).toMatch(/snapshot\.outposts\?\.items\.find\(\(item\) => item\.topic_id === selected\.id\)/);
    expect(hud).toMatch(/row\.next_gold_cost/);
    expect(hud).toMatch(/row\.next_elixir_cost/);
    expect(hud).toMatch(/outpost\.tier >= 5/);
    expect(hud).toMatch(/snapshot\.stale \|\| snapshot\.updatedAt === null/);
    expect(hud).toMatch(/wallet\.gold < outpost\.next_gold_cost \|\| wallet\.elixir < outpost\.next_elixir_cost/);
    expect(hud).toMatch(/codeforge:topic-selected/);
  });

  it('keeps CodeForge attacks and outpost actions reachable through the HUD dispatcher', () => {
    expect(hud).toMatch(/case 'codeforge':[\s\S]*?openCodeForgeDialog\(this\.modalEl\)[\s\S]*?cpVillageStore\.start\(\)/);
    expect(hud).toMatch(/case 'cf-outpost-upgrade':[\s\S]*?upgradeCodeForgeOutpost\(arg\)/);
    expect(hud).toMatch(/case 'cf-attack-launch':[\s\S]*?launchCodeForgeAttack\(arg\)/);
    expect(hud).toMatch(/'cf-outpost-upgrade', 'cf-outpost-refresh'/);
  });

  it('uses a responsive native modal layout and copy for the attack section', () => {
    expect(dialog).toMatch(/Village attacks are available below/);
    expect(dialog).not.toMatch(/Attack challenges are available in the full CodeForge workflow/);
    expect(dialogCss).toMatch(/\.cf-link-form\s*\{[\s\S]*?grid-template-columns/);
    expect(dialogCss).toMatch(/@media \(max-width: 620px\)/);
    expect(dialogCss).toMatch(/\.setting-row small \+ small/);
  });

  it('keeps null outpost prices unavailable and blocks upgrades when either price is missing', () => {
    expect(hud).toMatch(/v == null \? 'unavailable'/);
    expect(hud).toMatch(/typeof outpost\.next_gold_cost === 'number' && typeof outpost\.next_elixir_cost === 'number'/);
    expect(hud).toMatch(/!costsAvailable/);
  });

  it('provides copy/select fallback, exact First Name instructions, and in-memory token recovery', () => {
    expect(dialog).toMatch(/First Name field on your Codeforces profile/);
    expect(dialog).toMatch(/data-copy-proof/);
    expect(dialog).toMatch(/navigator\.clipboard\?\.writeText/);
    expect(dialog).toMatch(/field\?\.select\(\)/);
    expect(dialog).toMatch(/let pendingProof: \{ accountId: string; token: string; session: string \} \| null = null/);
    expect(dialog).not.toMatch(/localStorage|sessionStorage/);
  });

  it('guards asynchronous rendering after the dialog is closed', () => {
    expect(dialog).toMatch(/if \(closed\) return; closed = true; abort\.abort\(\); root\.innerHTML = ''/);
    expect(dialog).toMatch(/if \(closed\) return; notice = success; await load\(\)/);
    expect(dialog).toMatch(/if \(closed\) return;\s*const account/);
  });
});
