import { expect, test } from '@playwright/test';

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

const wallet = {
  coins: 250, gold: 12500, elixir: 9800, gems: 12,
  builder_capacity: 0, rewarded_solves: 37,
};

const positions = [
  [18, 20], [23, 17], [28, 18], [15, 23],
  [33, 25], [17, 30], [24, 33], [31, 30],
] as const;

const layout = {
  revision: 1,
  rules_version: 1,
  rules: {
    coordinate_space: 'village-grid',
    min_x: 8, min_y: 8, max_x_exclusive: 40, max_y_exclusive: 40,
    footprint_width: 3, footprint_height: 3,
    allowed_facings: ['default', 'mirrored'],
  },
  items: topics.map(([id, slug], index) => ({
    topic_id: id, topic_key: slug, x: positions[index][0], y: positions[index][1], facing: 'default',
  })),
};

test('authenticated Phase1B village boots read-only and exposes Codeforces attacks', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  const apiPaths: string[] = [];
  let guildLeaderId = 'smoke-user';
  let formerLeaderLeft = false;
  let territoryRefreshes = 0;
  let cfLinked = false;
  let cfVerified = false;
  let syncPhase: 'idle' | 'in_progress' | 'complete' = 'idle';
  let syncStatusReads = 0;
  let failNextSyncRequest = true;
  let onboardingFresh = false;
  page.on('pageerror', (error) => pageErrors.push(error.message));

  // Seed auth before instrumentation so its one permitted write is not counted as a save.
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({ sub: 'smoke-user', sid: 'phase1b' }))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    localStorage.setItem('codeforge.accessToken', `eyJhbGciOiJub25lIn0.${payload}.signature`);
    localStorage.setItem('codeforge.refreshToken', 'smoke-refresh-token');
    const writes: string[] = [];
    const originalSet = Storage.prototype.setItem;
    const originalRemove = Storage.prototype.removeItem;
    const isAuthToken = (key: string) => key === 'codeforge.accessToken' || key === 'codeforge.refreshToken';
    Storage.prototype.setItem = function (key, value) {
      if (!isAuthToken(key)) writes.push(`set:${key}`);
      return originalSet.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      if (!isAuthToken(key)) writes.push(`remove:${key}`);
      return originalRemove.call(this, key);
    };
    Object.defineProperty(window, '__phase1bLocalWrites', { value: writes });
    const idbWrites: string[] = [];
    Object.defineProperty(window, '__phase1bIdbWrites', { value: idbWrites });
    for (const method of ['add', 'put', 'delete', 'clear'] as const) {
      const original = (IDBObjectStore.prototype as any)[method];
      (IDBObjectStore.prototype as any)[method] = function (this: IDBObjectStore, ...args: unknown[]) {
        idbWrites.push(method);
        return original.apply(this, args);
      };
    }
  });

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api/, '');
    apiPaths.push(path);
    let body: unknown;
    let responseStatus = 200;
    if (path === '/auth/me') {
      body = { id: 'smoke-user', username: 'Phase1B', email: 'smoke@example.test', is_active: true, is_admin: false, is_suspended: false, created_at: '2025-01-01T00:00:00Z' };
    } else if (path === '/auth/judge-accounts' && route.request().method() === 'POST') {
      cfLinked = true;
      body = { verification_token: 'CF-PROOF-7KQ9', message: 'Linked', judge_account: { id: 'judge-cf', judge_type: 'codeforces', handle: 'phase1b_solver', verified_flag: false, last_sync_at: null, created_at: '2025-01-01T00:00:00Z' } };
    } else if (path === '/auth/judge-accounts/judge-cf/pending-proof') {
      body = { verification_token: 'CF-PROOF-7KQ9' };
    } else if (path === '/auth/judge-accounts/judge-cf/verify' && route.request().method() === 'POST') {
      cfVerified = true;
      body = { message: 'Verified', judge_account: { id: 'judge-cf', judge_type: 'codeforces', handle: 'phase1b_solver', verified_flag: true, last_sync_at: null, created_at: '2025-01-01T00:00:00Z' } };
    } else if (path === '/auth/judge-accounts') {
      body = cfLinked ? [{ id: 'judge-cf', judge_type: 'codeforces', handle: 'phase1b_solver', verified_flag: cfVerified, last_sync_at: null, created_at: '2025-01-01T00:00:00Z' }] : [];
    } else if (path === '/platform_sync/status') {
      if (!cfLinked) body = [];
      else {
        if (syncPhase === 'in_progress' && ++syncStatusReads >= 2) syncPhase = 'complete';
        body = [{ judge_name: 'codeforces', status: syncPhase === 'complete' ? 'up_to_date' : syncPhase === 'in_progress' ? 'in_progress' : 'unknown', last_synced_at: syncPhase === 'complete' ? '2025-01-03T00:00:00Z' : null, last_error: null, history_state: syncPhase === 'idle' ? 'pending' : syncPhase, history_rows: syncPhase === 'complete' ? 37 : 0, history_pages: syncPhase === 'complete' ? 2 : 0 }];
      }
    } else if (path.startsWith('/platform_sync/sync') && route.request().method() === 'POST') {
      if (failNextSyncRequest) {
        failNextSyncRequest = false;
        responseStatus = 503;
        body = { detail: 'Import queue unavailable' };
      } else {
        syncPhase = 'in_progress';
        syncStatusReads = 0;
        body = { status: 'queued', judge_account_id: 'judge-cf' };
      }
    } else if (path === '/village/me') {
      body = onboardingFresh ? {
        user_id: 'smoke-user', total_solved: 0, average_level: 0, defense_rating: 0, topics: [],
      } : {
        user_id: 'smoke-user', total_solved: 37, average_level: 2.25, defense_rating: 80,
        topics: topics.map(([id, slug, display_name, level], index) => ({
          id, name: slug, display_name, structure_key: slug,
          progress_points: 20 + index, level, points_to_next_level: 10, progress_pct: level ? 45 + index : 0,
        })),
      };
    } else if (path === '/economy/wallet') {
      body = onboardingFresh ? { ...wallet, rewarded_solves: 0 } : wallet;
    } else if (path === '/village/outposts') {
      body = { items: topics.map(([id]) => ({ topic_id: id, tier: 0, next_gold_cost: 500, next_elixir_cost: 400 })), wallet: onboardingFresh ? { ...wallet, rewarded_solves: 0 } : wallet };
    } else if (path === '/village/outposts/layout') {
      body = layout;
    } else if (path === '/attacks/targets') {
      body = [];
    } else if (path === '/attacks/active') {
      body = [];
    } else if (path === '/attacks/cooldown') {
      body = { can_attack: true, cooldown_minutes: 60, next_available_at: null, remaining_seconds: null };
    } else if (path === '/guilds/me' || path === '/guilds/guild-1') {
      body = formerLeaderLeft ? null : {
        id: 'guild-1', name: 'Oak Guard', description: 'A field test guild',
        created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
        memberships: [
          { guild_id: 'guild-1', user_id: 'smoke-user', username: 'Phase1B', role: guildLeaderId === 'smoke-user' ? 'leader' : 'member', joined_at: '2025-01-01T00:00:00Z', level: 2, solved_count: 37, attack_count: 0 },
          { guild_id: 'guild-1', user_id: 'successor-user', username: 'Mosskeeper', role: guildLeaderId === 'successor-user' ? 'leader' : 'member', joined_at: '2025-01-02T00:00:00Z', level: 3, solved_count: 24, attack_count: 1 },
        ],
      };
    } else if (path === '/guilds') {
      body = [{ id: 'guild-1', name: 'Oak Guard', description: 'A field test guild', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }];
    } else if (path === '/guilds/guild-1/join-requests') {
      body = [];
    } else if (path === '/guilds/guild-1/leader-transfer' && route.request().method() === 'POST') {
      guildLeaderId = String((route.request().postDataJSON() as { target_user_id?: string }).target_user_id);
      body = { message: 'Leadership transferred' };
    } else if (path === '/guilds/guild-1/leave' && route.request().method() === 'POST') {
      formerLeaderLeft = true;
      body = { message: 'You left the guild' };
    } else if (path === '/guilds/territory/zones') {
      territoryRefreshes++;
      body = [
        { id: 'zone-nexus', name: 'The Nexus', owning_guild_id: 'guild-1', topic_affinity: { graphs: 1 }, description: 'Central crossing', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', map_polygon: [[240,260],[290,230],[430,245],[420,360],[270,370],[160,420]], scores: { 'guild-1': 72 } },
        { id: 'zone-north', name: 'North <Gate>', owning_guild_id: null, topic_affinity: {}, description: 'Northern pass', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', map_polygon: [[170,140],[290,130],[290,230],[240,260]], scores: null },
        { id: 'zone-unmapped', name: 'Unmapped Shore', owning_guild_id: 'other-guild', topic_affinity: {}, description: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', map_polygon: null, scores: { 'other-guild': 18 } },
      ];
    } else {
      body = {};
    }
    await route.fulfill({ status: responseStatus, contentType: 'application/json', body: JSON.stringify(body) });
  });
  // Realtime is an optional invalidation channel; HTTP snapshots above are authoritative here.
  await page.routeWebSocket('**', (socket) => socket.close());

  await page.goto('/');
  const canvas = page.locator('#game canvas');
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.player-name')).toHaveText('Phase1B');
  await expect(page.getByRole('button', { name: 'Open Codeforces challenge attacks' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Campaign map' })).toHaveCount(0);
  await expect(page.locator('[data-action="builders"]')).toHaveCount(0);
  await expect(page.locator('[data-action="achievements"]')).toHaveCount(0);
  await expect.poll(() => apiPaths).toEqual(expect.arrayContaining([
    '/auth/me', '/village/me', '/economy/wallet', '/village/outposts', '/village/outposts/layout',
  ]));

  // The world canvas carries the grass and topic nameplates; the stable server topic labels are
  // also exposed in the CodeForge detail panel for an accessible, deterministic content check.
  await page.getByRole('button', { name: 'Open Codeforces challenge attacks' }).click();
  await expect(page.locator('.cf-outpost-panel')).toContainText('Arrays');
  await expect(page.locator('.cf-outpost-panel')).toContainText('Dynamic Programming');
  await expect(page.locator('.cf-outpost-panel')).toContainText('Topic level 0');
  await expect(page.locator('.cf-outpost-panel')).toContainText('Topic level 5');
  await expect(page.locator('.cf-attack-panel')).toContainText('Village attacks');
  await expect(page.locator('.cf-attack-panel')).toContainText('Codeforces problem set');
  await page.getByRole('button', { name: 'Close dialog' }).click();

  const zoomIn = page.getByRole('button', { name: 'Zoom in' });
  await expect(zoomIn).toBeVisible();
  await zoomIn.click();
  await page.getByRole('button', { name: 'Center village' }).click();
  await page.keyboard.press('Escape');

  await page.waitForTimeout(1200);
  await page.screenshot({ path: testInfo.outputPath('codeforge-phase1b-isolation.png'), fullPage: true });
  expect(await page.evaluate(() => (window as any).__phase1bLocalWrites)).toEqual([]);
  expect(await page.evaluate(() => (window as any).__phase1bIdbWrites)).toEqual([]);

  // A focusable gateway mirrors the in-world Guild Hall for keyboard and assistive-tech users.
  const hallLink = page.getByRole('button', { name: 'Visit Guild Hall' });
  await hallLink.focus();
  await expect(hallLink).toBeVisible();
  await hallLink.evaluate(element => (element as HTMLElement).blur());
  const canvasBounds = await canvas.boundingBox();
  if (!canvasBounds) throw new Error('Village canvas has no visible bounds');
  await page.mouse.click(canvasBounds.x + canvasBounds.width * 0.528, canvasBounds.y + canvasBounds.height * 0.454);
  await expect(page).toHaveURL(/\?cp=1&tab=guild&return=%2F/);
  await expect(page.getByRole('heading', { name: 'Oak Guard' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose the next leader' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('guild-leadership-transfer.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => Math.max(document.documentElement.scrollWidth,document.body.scrollWidth))).toBeLessThanOrEqual(390);
  await expect(page.getByLabel('New leader')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('guild-leadership-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.locator('#cp-successor').selectOption('successor-user');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Transfer leadership' }).click();
  await expect.poll(() => apiPaths).toContain('/guilds/guild-1/leader-transfer');
  await expect(page.getByRole('button', { name: 'Leave guild' })).toBeEnabled();
  await expect(page.locator('#cp-transfer-leadership')).toHaveCount(0);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Leave guild' }).click();
  await expect.poll(() => apiPaths).toContain('/guilds/guild-1/leave');
  await page.getByRole('button', { name: 'Territory' }).click();
  await expect(page.getByRole('heading', { name: 'Territory map' })).toBeVisible();
  await expect(page.locator('.cp-map-zone')).toHaveCount(2);
  await expect(page.locator('.cp-zone-list-item')).toHaveCount(3);
  await page.locator('[data-map-zone="zone-nexus"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'The Nexus' })).toBeVisible();
  await expect(page.locator('.cp-zone-details')).toContainText('72');
  await expect(page.locator('.cp-territory-map img')).toHaveCount(0);
  await page.locator('.cp-zone-list-item').filter({ hasText: 'North <Gate>' }).click();
  await expect(page.getByRole('heading', { name: 'North <Gate>' })).toBeVisible();
  const beforeRefresh = territoryRefreshes;
  await page.getByRole('button', { name: '↻ Refresh' }).click();
  await expect.poll(() => territoryRefreshes).toBeGreaterThan(beforeRefresh);
  const beforeReconnect = territoryRefreshes;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect.poll(() => territoryRefreshes).toBeGreaterThan(beforeReconnect);
  await page.screenshot({ path: testInfo.outputPath('territory-map-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => Math.max(document.documentElement.scrollWidth,document.body.scrollWidth))).toBeLessThanOrEqual(390);
  await expect(page.locator('.cp-territory-map')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('territory-map-mobile.png'), fullPage: true });

  // First-time and returning states are both driven by the mocked server account/sync data.
  await page.setViewportSize({ width: 1440, height: 960 });
  onboardingFresh = true;
  await page.goto('/?cp=1');
  await expect(page.locator('.cp-stat').filter({ hasText: 'PROBLEMS SOLVED' }).locator('strong')).toHaveText('0');
  await expect(page.locator('.cp-onboarding-step')).toHaveCount(5);
  await expect(page.locator('[data-onboarding-step="1"]')).toHaveAttribute('data-step-state','complete');
  await expect(page.locator('[data-onboarding-step="2"]')).toHaveAttribute('data-step-state','current');
  await expect(page.locator('[data-onboarding-step="4"]')).not.toHaveAttribute('data-step-state','complete');
  await page.screenshot({ path: testInfo.outputPath('onboarding-first-visit-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => Math.max(document.documentElement.scrollWidth,document.body.scrollWidth))).toBeLessThanOrEqual(390);
  await page.screenshot({ path: testInfo.outputPath('onboarding-first-visit-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 960 });

  await page.getByRole('button', { name: 'Link Codeforces handle' }).click();
  const handleInput=page.getByRole('textbox',{name:'Codeforces handle'});
  await expect(handleInput).toBeFocused();
  await handleInput.fill('phase1b_solver');
  await page.getByRole('button',{name:'Link handle'}).click();
  await expect(page.locator('[data-onboarding-step="2"]')).toHaveAttribute('data-step-state','complete');
  await expect(page.locator('[data-onboarding-step="3"]')).toHaveAttribute('data-step-state','current');
  await expect(page.locator('.cp-onboarding')).toContainText('CF-PROOF-7KQ9');
  await page.getByRole('button', { name: 'Review verification' }).click();
  await page.locator('#cp-verify').click();
  await expect(page.locator('[data-onboarding-step="3"]')).toHaveAttribute('data-step-state','complete');
  await expect(page.locator('[data-onboarding-step="4"]')).toHaveAttribute('data-step-state','current');
  await page.getByRole('button', { name: 'Import Codeforces history' }).click();
  await expect(page.locator('[data-onboarding-step="4"]')).toHaveAttribute('data-step-state','failed');
  await page.getByRole('button', { name: 'Retry history import' }).click();
  await expect(page.locator('[data-onboarding-step="4"]')).toHaveAttribute('data-step-state','current');
  await expect(page.locator('[data-onboarding-step="4"]')).not.toHaveAttribute('data-step-state','complete');
  await expect(page.locator('.cp-onboarding')).toContainText('Import requested. Waiting for Codeforces history to finish.');
  await page.locator('#cp-sync-refresh').click();
  await expect(page.locator('[data-onboarding-step="4"]')).toHaveAttribute('data-step-state','complete');
  await expect(page.locator('[data-onboarding-step="5"]')).toHaveAttribute('data-step-state','complete');
  await page.screenshot({ path: testInfo.outputPath('onboarding-returning-verified.png'), fullPage: true });
  await page.reload();
  await expect(page.locator('[data-onboarding-step="3"]')).toHaveAttribute('data-step-state','complete');
  await expect(page.locator('[data-onboarding-step="4"]')).toHaveAttribute('data-step-state','complete');
  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('heading', { name: 'Help & handbook' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Shared frontier' })).toBeVisible();
  await expect(page.locator('.cp-help-faq')).toHaveCount(4);
  await page.screenshot({ path: testInfo.outputPath('codeforge-field-guide.png'), fullPage: true });
  await page.screenshot({ path: testInfo.outputPath('codeforge-help-handbook.png'), fullPage: true });
  await page.getByRole('button', { name: 'Open War Map' }).click();
  await expect(page.getByRole('heading', { name: 'Territory map' })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('signed-out CodeForge auth and registration fit desktop and mobile viewports', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  const leaderboardRequests: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/api/league/leaderboard**', async (route) => {
    leaderboardRequests.push(new URL(route.request().url()).search);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { user_id: 'private-id-a', username: 'Oakheart', trophy_count: 1840, league_tier: 'Gold', rank: 1 },
        { user_id: 'private-id-b', username: 'Mosskeeper', trophy_count: 1265, league_tier: 'Silver', rank: 2 },
      ]),
    });
  });

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/?cp=1');
  await expect(page.getByRole('heading', { name: 'Enter the frontier.' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Global standings' })).toBeVisible();
  await expect(page.locator('.cp-public-rank')).toHaveCount(2);
  await expect(page.locator('.cp-public-panel')).toContainText('Oakheart');
  await expect(page.locator('.cp-public-panel')).toContainText('1840');
  await expect(page.locator('.cp-public-panel')).not.toContainText('private-id-a');
  await expect.poll(() => leaderboardRequests).toEqual(expect.arrayContaining([
    expect.stringContaining('scope=global'),
  ]));
  await expect.poll(() => page.evaluate(() => Math.max(
    document.documentElement.scrollWidth,
    document.body.scrollWidth,
  ))).toBeLessThanOrEqual(1440);
  await page.screenshot({ path: testInfo.outputPath('codeforge-auth-desktop.png'), fullPage: true });

  await page.getByRole('button', { name: 'Create an account' }).click();
  await expect(page.getByRole('heading', { name: 'Build your account.' })).toBeVisible();
  await expect(page.getByLabel('Village name')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => Math.max(
    document.documentElement.scrollWidth,
    document.body.scrollWidth,
  ))).toBeLessThanOrEqual(390);
  await expect(page.locator('.cp-public-panel')).toBeVisible();
  await expect(page.locator('.cp-public-rank')).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath('codeforge-register-mobile.png'), fullPage: true });

  await page.getByRole('button', { name: 'I already have an account' }).click();
  await expect(page.getByRole('heading', { name: 'Enter the frontier.' })).toBeVisible();
  await expect(page.getByLabel('Village name')).toBeHidden();
  await expect.poll(() => page.evaluate(() => Math.max(
    document.documentElement.scrollWidth,
    document.body.scrollWidth,
  ))).toBeLessThanOrEqual(390);
  await page.screenshot({ path: testInfo.outputPath('codeforge-auth-mobile.png'), fullPage: true });
  expect(pageErrors).toEqual([]);
});
