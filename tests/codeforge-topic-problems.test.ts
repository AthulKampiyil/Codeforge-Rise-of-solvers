import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const hud = readFileSync(new URL('../src/ui/hud.ts', import.meta.url), 'utf8');
const api = readFileSync(new URL('../src/cp/api.ts', import.meta.url), 'utf8');

describe('a clicked building shows only its own topic\u2019s problems', () => {
  it('asks the server to scope solved history to one topic', () => {
    expect(api).toMatch(/solvedHistory: \(offset = 0, limit = 50, topic\?: string\)/);
    expect(api).toMatch(/query\(\{ offset, limit, topic \}\)/);
    expect(hud).toMatch(/villageApi\.solvedHistory\(previous\.length, CODEFORGE_TOPIC_PROBLEMS_PAGE, topic\.name\)/);
    expect(hud).toMatch(/const CODEFORGE_TOPIC_PROBLEMS_PAGE = 12;/);
  });

  it('loads that topic when a building tap or a Details button selects it', () => {
    expect(hud).toMatch(/codeforge:topic-selected[\s\S]*?this\.action\('codeforge'\);\s*void this\.loadCodeForgeTopicProblems\(topicId\)/);
    expect(hud).toMatch(/case 'cf-topic-select':[\s\S]*?void this\.loadCodeForgeTopicProblems\(arg\)/);
  });

  it('renders the selection\u2019s own problems inside the topic detail', () => {
    expect(hud).toMatch(/cf-outpost-detail[\s\S]*?codeforgeTopicProblemsView\(selected\)/);
    expect(hud).toMatch(/codeforgeTopicProblems\?\.topicId === selected\.id/);
    expect(hud).toMatch(/No solved problems are recorded for/);
  });

  it('links each row through the validated Codeforces problem URL builder', () => {
    expect(hud).toMatch(/export function codeforcesSolvedProblemUrl\(problemId: string\)[\s\S]*?codeforcesProblemUrl\(\{ contest_id: match\[1\], index: match\[2\] \}\)/);
    expect(hud).toMatch(/<ol class="cf-topic-problems">/);
  });

  it('keeps paging through the topic inside the server-read-only HUD allowlist', () => {
    const allowlist = hud.match(/const allowed = new Set\(\[([\s\S]*?)\]\);/)?.[1] ?? '';
    expect(allowlist).toContain("'cf-topic-problems-more'");
    expect(hud).toMatch(/case 'cf-topic-problems-more':[\s\S]*?loadCodeForgeTopicProblems\(this\.codeforgeTopicId, true\)/);
  });

  it('grows the dialog in one reserved block instead of a nested scroller', () => {
    const css = readFileSync(new URL('../src/ui/codeforge-dialog.css', import.meta.url), 'utf8');
    const list = css.match(/\.codeforge-modal \.cf-topic-problems \{([\s\S]*?)\}/)?.[1] ?? '';
    expect(list).not.toMatch(/max-height|overflow/);
    expect(css).toMatch(/\.codeforge-modal \.cf-topic-problems-slot \{[^}]*min-height:/);
    expect(hud).toMatch(/slot\(`\$\{heading\}/);
  });

  it('scrolls the dialog body itself, never the page, when the rows land', () => {
    const start = hud.indexOf('private scrollDialogBodyTo(');
    const helper = hud.slice(start, hud.indexOf('private codeforgeTopicProblemsView'));
    expect(start).toBeGreaterThan(-1);
    expect(helper).toMatch(/target\?\.closest<HTMLElement>\('\.modal-body'\)/);
    expect(helper).toMatch(/scroller\.scrollTo\(\{ top: Math\.max\(0, scroller\.scrollTop \+ offset\), behavior \}\)/);
    expect(helper).not.toMatch(/scrollIntoView/);
    expect(hud).toMatch(/this\.renderCodeForgeOutposts\(\);\s*this\.scrollCodeForgeOutpostDetail\(append \? 'nearest' : 'start', this\.codeforgeScrollBehavior\(\)\);/);
    expect(hud).toMatch(/private codeforgeScrollBehavior\(\): ScrollBehavior \{[\s\S]{0,200}prefers-reduced-motion/);
    expect(hud).not.toMatch(/scrollIntoView\(\{ block: 'start'/);
    expect(hud).toMatch(/case 'cf-topic-select':[\s\S]{0,220}loadCodeForgeTopicProblems\(arg\);\s*break;/);
  });
});

describe('opening the popup does not jump while it loads', () => {
  const css = readFileSync(new URL('../src/ui/codeforge-dialog.css', import.meta.url), 'utf8');

  it('opens at its final size instead of re-centring as rows land', () => {
    const modal = css.match(/\.modal\.codeforge-modal \{([\s\S]*?)\}/)?.[1] ?? '';
    expect(modal).toMatch(/height: min\(820px, 100%\);/);
    expect(css).toMatch(/\.cf-skeleton span \{[\s\S]{0,160}animation:/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.cf-skeleton span \{\s*animation: none;/);
  });

  it('shows placeholder rows until the first village snapshot arrives', () => {
    expect(hud).toMatch(/const codeforgeSkeleton = \(rows: number\) =>/);
    expect(hud).toMatch(/snapshot\.loading \? codeforgeSkeleton\(4\) : '<p>No topic progress is available yet\.<\/p>'/);
  });

  it('writes a panel only when its markup actually changed', () => {
    expect(hud).toMatch(/private codeforgePanelMarkup = new WeakMap<HTMLElement, string>\(\);/);
    expect(hud).toMatch(/private paintCodeForgePanel\(panel: HTMLElement, markup: string\) \{\s*if \(this\.codeforgePanelMarkup\.get\(panel\) === markup\) return;\s*this\.codeforgePanelMarkup\.set\(panel, markup\);\s*panel\.innerHTML = markup;/);
    expect(hud.match(/this\.paintCodeForgePanel\(panel, /g)?.length).toBe(2);
    expect(hud.match(/panel\.innerHTML = /g)).toHaveLength(1);
  });

  it('waits for the row a tap aimed at before scrolling to it', () => {
    expect(hud).toMatch(/if \(this\.codeforgeFocusTopic && outposts\.querySelector\('\[data-topic-details\]'\)\) \{\s*this\.codeforgeFocusTopic = false;\s*this\.scrollCodeForgeOutpostDetail\('start', 'auto'\);/);
    expect(hud).toMatch(/if \(this\.codeforgeFocusAttacks\) \{\s*this\.codeforgeFocusAttacks = false;\s*this\.scrollDialogBodyTo\(this\.modalEl\.querySelector<HTMLElement>\('\.cf-attack-panel'\), 'start', 'auto'\);/);
  });
});
