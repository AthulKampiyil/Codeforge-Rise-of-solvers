import { expect, test, type Browser, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { platform, release } from 'node:os';

const SAMPLES_PER_VIEWPORT = 3;
const samples = [
  { name: 'desktop', width: 1440, height: 960 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

const topics = [
  ['topic-arrays', 'arrays', 'Arrays', 0],
  ['topic-strings', 'strings', 'Strings', 1],
  ['topic-math', 'math', 'Math', 2],
  ['topic-greedy', 'greedy', 'Greedy', 3],
  ['topic-graphs', 'graphs', 'Graphs', 4],
  ['topic-trees', 'trees', 'Trees', 5],
  ['topic-dp', 'dynamic-programming', 'Dynamic Programming', 0],
  ['topic-data-structures', 'data-structures', 'Data Structures', 1],
] as const;
const positions = [[18, 20], [23, 17], [28, 18], [15, 23], [33, 25], [17, 30], [24, 33], [31, 30]] as const;
const wallet = { coins: 250, gold: 12500, elixir: 9800, gems: 12, builder_capacity: 0, rewarded_solves: 37 };

const layout = {
  revision: 1,
  rules_version: 1,
  rules: {
    coordinate_space: 'village-grid', min_x: 8, min_y: 8, max_x_exclusive: 40, max_y_exclusive: 40,
    footprint_width: 3, footprint_height: 3, allowed_facings: ['default', 'mirrored'],
  },
  items: topics.map(([id, slug], index) => ({
    topic_id: id, topic_key: slug, x: positions[index][0], y: positions[index][1], facing: 'default',
  })),
};

async function mockAuthenticatedApi(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({ sub: 'performance-user', sid: 'performance' }))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    localStorage.setItem('codeforge.accessToken', `eyJhbGciOiJub25lIn0.${payload}.signature`);
    localStorage.setItem('codeforge.refreshToken', 'performance-refresh-token');
  });
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    let body: unknown = {};
    if (path === '/auth/me') {
      body = { id: 'performance-user', username: 'Benchmark', email: 'benchmark@example.test', is_active: true, is_admin: false, is_suspended: false, created_at: '2025-01-01T00:00:00Z' };
    } else if (path === '/auth/judge-accounts' || path === '/platform_sync/status') {
      body = [];
    } else if (path === '/village/me') {
      body = {
        user_id: 'performance-user', total_solved: 37, average_level: 2.25, defense_rating: 80,
        topics: topics.map(([id, slug, display_name, level], index) => ({
          id, name: slug, display_name, structure_key: slug, progress_points: 20 + index,
          level, points_to_next_level: 10, progress_pct: level ? 45 + index : 0,
        })),
      };
    } else if (path === '/economy/wallet') {
      body = wallet;
    } else if (path === '/village/outposts') {
      body = { items: topics.map(([id]) => ({ topic_id: id, tier: 0, next_gold_cost: 500, next_elixir_cost: 400 })), wallet };
    } else if (path === '/village/outposts/layout') {
      body = layout;
    } else if (path === '/attacks/targets' || path === '/attacks/active' || path === '/guilds') {
      body = [];
    } else if (path === '/attacks/cooldown') {
      body = { can_attack: true, cooldown_minutes: 60, next_available_at: null, remaining_seconds: null };
    } else if (path === '/guilds/me') {
      body = null;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.routeWebSocket('**', (socket) => socket.close());
}

function percentile(values: number[], p: number): number {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.ceil(p * ordered.length) - 1];
}

async function measureViewport(browser: Browser, viewport: typeof samples[number]): Promise<number[]> {
  const times: number[] = [];
  for (let index = 0; index < SAMPLES_PER_VIEWPORT; index += 1) {
    // A new isolated browser context for each sample provides a cold, empty HTTP cache.
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    try {
      const page = await context.newPage();
      await mockAuthenticatedApi(page);
      // Do not wait for the full load event: that would include noncritical art
      // requests after the first usable canvas and overstate this milestone.
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#game canvas')).toBeVisible({ timeout: 30_000 });
      // Navigation Timing starts at navigationStart (timeOrigin); read only after the canvas is visible.
      times.push(await page.evaluate(() => performance.now()));
    } finally {
      await context.close();
    }
  }
  return times;
}

for (const viewport of samples) {
  test(`CodeForge authenticated canvas navigation performance (${viewport.name})`, async ({ browser }, testInfo) => {
    const timesMs = await measureViewport(browser, viewport);
    const report = {
      benchmark: 'navigation-start-to-authenticated-phaser-canvas-visible',
      environment: {
        browser: browser.browserType().name(),
        browserVersion: browser.version(),
        system: { platform: platform(), release: release(), architecture: process.arch },
      },
      viewport: { name: viewport.name, width: viewport.width, height: viewport.height },
      cacheMode: 'cold isolated browser context per sample',
      sampleCount: timesMs.length,
      timesMs,
      p50Ms: percentile(timesMs, 0.5),
      p95Ms: percentile(timesMs, 0.95),
      note: 'Local mocked API; informational measurement only, no 2-second SRS assertion.',
    };
    const artifactPath = testInfo.outputPath(`codeforge-performance-${viewport.name}.json`);
    await writeFile(artifactPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`CodeForge ${viewport.name} performance: ${JSON.stringify(report)}`);
  });
}
