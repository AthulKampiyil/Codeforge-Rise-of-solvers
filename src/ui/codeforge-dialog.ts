import { authApi, villageApi } from '../cp/api';
import { getAccessToken } from '../cp/client';
import type { JudgeAccount, SyncStatus, User, VillageProfile, Wallet } from '../cp/types';
import { icon } from './icons';
import './codeforge-dialog.css';

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
// Kept only in page memory so closing/reopening the panel does not lose a newly-issued token.
// Never persist proof credentials in local/session storage.
let pendingProof: { accountId: string; token: string; session: string } | null = null;
let activeDialog: (() => void) | null = null;

/** Compact CodeForge account and progress panel, rendered inside the game's existing dialog shell. */
export function openCodeForgeDialog(root: HTMLElement) {
  activeDialog?.();
  const abort = new AbortController();
  let user: User | null = null;
  let accounts: JudgeAccount[] = [];
  let profile: VillageProfile | null = null;
  let wallet: Wallet | null = null;
  let sync: SyncStatus[] = [];
  let history: Awaited<ReturnType<typeof villageApi.solvedHistory>>['items'] = [];
  let historyTotal = 0;
  let copyNotice = '';
  let busy = false;
  let error = '';
  let notice = '';
  let proofLoading = false;
  let proofError = '';
  let proofGeneration = 0;
  let closed = false;
  const signal = abort.signal;

  // The dialog declares aria-modal, so the rest of the page must stay unreachable while it is open:
  // inert every sibling along the ancestor chain, trap Tab inside, and restore both on close.
  const opener = document.activeElement instanceof HTMLElement && !root.contains(document.activeElement) ? document.activeElement : null;
  const inertTargets: { element: HTMLElement; inert: boolean }[] = [];
  for (let node: HTMLElement | null = root; node && node !== document.body; node = node.parentElement) {
    for (const sibling of Array.from(node.parentElement?.children ?? [])) {
      if (sibling === node || !(sibling instanceof HTMLElement)) continue;
      inertTargets.push({ element: sibling, inert: sibling.inert });
      sibling.inert = true;
    }
  }
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const focusable = () => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => element.getClientRects().length > 0);
  const focusDescriptor = (element: Element | null): string | null => {
    if (!(element instanceof HTMLElement) || !root.contains(element)) return null;
    for (const attribute of ['data-codeforge-close', 'data-copy-proof', 'data-cf-sync', 'data-cf-refresh', 'data-proof-token']) {
      if (element.hasAttribute(attribute)) return `[${attribute}]`;
    }
    const name = element.getAttribute('name');
    return name && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) ? `[name="${name}"]` : null;
  };
  let focusInitialized = false;

  const render = () => {
    if (closed) return;
    const account = accounts.find((a) => a.judge_type === 'codeforces');
    // Re-renders must not drop what the user typed or where the caret is.
    const restoreFocusTo = focusDescriptor(document.activeElement);
    const handleDraft = root.querySelector<HTMLInputElement>('#cf-link-form input[name="handle"]')?.value ?? '';
    const session = getAccessToken() ?? '';
    if (pendingProof && pendingProof.session !== session) pendingProof = null;
    const token = account && pendingProof?.accountId === account.id && pendingProof.session === session ? pendingProof.token : '';
    const codeforcesSync = sync.find((s) => s.judge_name === 'codeforces');
    const authenticated = !!getAccessToken();
    root.innerHTML = `<div class="modal-backdrop"><section class="modal small-modal codeforge-modal" role="dialog" aria-modal="true" aria-labelledby="codeforge-title"><header class="modal-header"><div><small>CODEFORGE</small><h1 id="codeforge-title">Your progress</h1><p>Codeforces history, village rewards and topic growth.</p></div><button class="square-btn small close-btn" data-codeforge-close aria-label="Close dialog">${icon('X', 25)}</button></header><div class="modal-body settings-body"><div class="setting-row"><div><h3>Account</h3><p>${authenticated ? `Signed in as ${escapeHtml(user?.username ?? 'Loading…')}` : 'Sign in to connect your Codeforces account and sync progress.'}</p></div>${authenticated ? '' : '<a class="game-btn blue" href="/?cp=1&amp;return=%2F">Sign in</a>'}</div>${authenticated ? `<div class="setting-row"><div><h3>Codeforces handle</h3><p>${account ? `${escapeHtml(account.handle)} · ${account.verified_flag ? 'Verified' : 'Not verified'}` : 'Link a handle to import solved problems.'}</p></div>${account?.verified_flag ? '<span>Verified</span>' : ''}</div>${account?.verified_flag ? '' : `<form id="cf-link-form" class="setting-row cf-link-form"><div><h3>${account ? 'Verify your handle' : 'Link your handle'}</h3><p>${account ? 'Add the proof token to the First Name field on your Codeforces profile, save it, then verify it here.' : 'We will provide a proof token to add to the First Name field on your Codeforces profile.'}</p></div>${account ? '' : '<input name="handle" required autocomplete="off" aria-label="Codeforces handle" placeholder="Codeforces handle">'}<button class="game-btn blue" type="submit" ${busy ? 'disabled' : ''}>${account ? 'Verify' : 'Link handle'}</button></form>${token ? `<p class="settings-note" role="status">Add this exact token to your Codeforces profile: <b>${escapeHtml(token)}</b>. Then select Verify.</p>` : ''}`}${notice ? `<p role="status">${escapeHtml(notice)}</p>` : ''}${error ? `<p role="alert">${escapeHtml(error)}</p>` : ''}<div class="setting-row cf-sync-row"><div><h3>Problem history sync</h3><p>${codeforcesSync ? `${escapeHtml(codeforcesSync.history_state.replaceAll('_', ' '))} · ${escapeHtml(codeforcesSync.history_rows)} solved rows imported` : 'No history sync status is available yet.'}${codeforcesSync?.last_error ? `<br>${escapeHtml(codeforcesSync.last_error)}` : ''}</p></div><button class="game-btn stone" data-cf-refresh ${busy ? 'disabled' : ''}>Refresh status</button><button class="game-btn green" data-cf-sync ${busy || !account?.verified_flag ? 'disabled' : ''}>${busy ? 'Working…' : 'Sync history'}</button></div><div class="setting-row"><div><h3>Village rewards</h3><p>${wallet ? `${n(wallet.gold)} gold · ${n(wallet.elixir)} elixir · ${n(wallet.gems)} gems` : 'Unavailable until your account is connected.'}</p></div></div><h3>Topic progress</h3>${profile?.topics.length ? profile.topics.map((topic) => `<div class="setting-row"><div><h3>${escapeHtml(topic.display_name || topic.name)} · Level ${n(topic.level)}</h3><p>${n(topic.progress_points)} points · ${n(topic.points_to_next_level)} to next level</p></div><b>${Math.round(Number(topic.progress_pct) || 0)}%</b></div>`).join('') : '<p>No topic progress is available yet.</p>'}<h3>Solved history <small>${n(historyTotal)} records</small></h3>${history.length ? history.map((item) => `<div class="setting-row"><div><h3>${escapeHtml(item.problem_id)}</h3><p>${item.tags.map(escapeHtml).join(' · ') || 'No tags'}${item.rating == null ? '' : ` · Rating ${n(item.rating)}`}</p><small>${escapeHtml(new Date(item.solved_at).toLocaleDateString())} · ${item.credited ? 'Reward credited' : 'No reward credited'}</small></div></div>`).join('') : '<p>No solved-history records are available.</p>'}<p class="settings-note">Village attacks are available below. More CodeForge tools are available in the full workflow.</p><a class="game-btn blue" href="/?cp=1&amp;return=%2F">Open CodeForge workflows</a>` : ''}</div></section></div>`;
    const proofMessage = account && !account.verified_flag
      ? Array.from(root.querySelectorAll<HTMLElement>('.settings-note')).find((item) => item.textContent?.startsWith('Add this exact token'))
      : null;
    if (proofMessage)
      proofMessage.outerHTML = `<div class="cf-proof-block"><p class="settings-note">Copy this proof token into the <b>First Name</b> field on your Codeforces profile, save your profile, then select Verify.</p><div class="cf-proof-copy">${token ? `<input data-proof-token readonly aria-label="Codeforces proof token" value="${escapeHtml(token)}"><button class="game-btn stone" type="button" data-copy-proof>Copy proof token</button>` : `<p role="status">${proofLoading ? 'Loading your proof token…' : proofError ? escapeHtml(proofError) : 'Proof token unavailable.'}</p>`}</div>${copyNotice ? `<p class="settings-note" role="status">${escapeHtml(copyNotice)}</p>` : ''}</div>`;
    if (account && !account.verified_flag && !root.querySelector('.cf-proof-block')) {
      root.querySelector('#cf-link-form')?.insertAdjacentHTML('afterend', `<div class="cf-proof-block"><p class="settings-note">Copy this proof token into the <b>First Name</b> field on your Codeforces profile, save your profile, then select Verify.</p><div class="cf-proof-copy">${token ? `<input data-proof-token readonly aria-label="Codeforces proof token" value="${escapeHtml(token)}"><button class="game-btn stone" type="button" data-copy-proof>Copy proof token</button>` : `<p role="status">${proofLoading ? 'Loading your proof token…' : proofError ? escapeHtml(proofError) : 'Proof token unavailable.'}</p>`}</div>${copyNotice ? `<p class="settings-note" role="status">${escapeHtml(copyNotice)}</p>` : ''}</div>`);
    }
    root.querySelector('[data-codeforge-close]')?.addEventListener('click', close, { signal });
    root.querySelector('[data-copy-proof]')?.addEventListener('click', async () => {
      const copied = await copyProof(token);
      if (closed) return;
      copyNotice = copied ? 'Proof token copied.' : 'Automatic copy is unavailable. The token is selected; copy it manually.';
      render();
      if (!copied) {
        const field = root.querySelector<HTMLInputElement>('[data-proof-token]');
        field?.focus();
        field?.select();
      }
    }, { signal });
    root.querySelector<HTMLFormElement>('#cf-link-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      if (account && !account.verified_flag) void verify(account);
      else {
        const handle = String(new FormData(event.currentTarget as HTMLFormElement).get('handle') ?? '').trim();
        void run(async () => {
          const result = await authApi.linkCodeforces(handle);
          pendingProof = { accountId: result.judge_account.id, token: result.verification_token, session: getAccessToken() ?? '' };
          accounts = [result.judge_account, ...accounts.filter((a) => a.id !== result.judge_account.id)];
        }, 'Handle linked. Copy the token into the Codeforces First Name field, save your profile, then verify.');
      }
    }, { signal });
    root.querySelector('[data-cf-sync]')?.addEventListener('click', () => void run(async () => {
      await villageApi.sync();
      sync = await villageApi.syncOverview();
    }, 'History sync requested.'), { signal });
    root.querySelector('[data-cf-refresh]')?.addEventListener('click', () => void run(async () => {
      sync = await villageApi.syncOverview();
    }, 'Sync status refreshed.'), { signal });
    root.querySelector('.modal-backdrop')?.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) close();
    }, { signal });
    const handleField = root.querySelector<HTMLInputElement>('#cf-link-form input[name="handle"]');
    if (handleField && handleDraft && !handleField.value) handleField.value = handleDraft;
    const refocus = restoreFocusTo ? root.querySelector<HTMLElement>(restoreFocusTo) : null;
    if (refocus) refocus.focus();
    else if (!focusInitialized) { focusInitialized = true; focusable()[0]?.focus(); }
  };
  const close = () => { if (closed) return; closed = true; abort.abort(); root.innerHTML = ''; for (const entry of inertTargets) entry.element.inert = entry.inert; if (opener?.isConnected) opener.focus(); if (activeDialog === close) activeDialog = null; };
  activeDialog = close;
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); }, { signal });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const items = focusable();
    if (!items.length) { event.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !root.contains(active))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (active === last || !root.contains(active))) { event.preventDefault(); first.focus(); }
  }, { signal });
  const verify = (account: JudgeAccount) => run(async () => {
    await authApi.verifyJudge(account.id);
    if (pendingProof?.accountId === account.id) pendingProof = null;
    accounts = await authApi.judgeAccounts();
  }, 'Codeforces profile verified.');
  const run = async (fn: () => Promise<void>, success: string) => {
    if (closed || busy) return;
    busy = true; error = ''; notice = ''; render();
    try { await fn(); if (closed) return; notice = success; await load(); }
    catch (cause) { if (!closed) error = cause instanceof Error ? cause.message : 'Unable to complete this request.'; }
    finally { busy = false; render(); }
  };
  const load = async () => {
    if (closed) return;
    const session = getAccessToken() ?? '';
    const generation = ++proofGeneration;
    if (!session) { user = null; pendingProof = null; proofLoading = false; proofError = ''; render(); return; }
    [user, accounts, profile, wallet, sync] = await Promise.all([
      authApi.me(), authApi.judgeAccounts(), villageApi.me(), villageApi.wallet(), villageApi.syncOverview(),
    ]);
    const account = accounts.find((item) => item.judge_type === 'codeforces' && !item.verified_flag);
    if (account && !(pendingProof?.accountId === account.id && pendingProof.session === session && pendingProof.token)) {
      proofLoading = true; proofError = ''; render();
      try {
        const result = await authApi.pendingJudgeProof(account.id);
        if (closed || generation !== proofGeneration || getAccessToken() !== session) return;
        pendingProof = { accountId: account.id, token: result.verification_token, session };
      } catch (cause) {
        if (closed || generation !== proofGeneration || getAccessToken() !== session) return;
        pendingProof = pendingProof?.session === session && pendingProof.accountId === account.id ? pendingProof : null;
        proofError = cause instanceof Error ? cause.message : 'Unable to load the proof token.';
      } finally {
        if (!closed && generation === proofGeneration && getAccessToken() === session) { proofLoading = false; render(); }
      }
    } else {
      proofLoading = false; proofError = '';
    }
    const page = await villageApi.solvedHistory(0, 12).catch(() => null);
    if (closed) return;
    history = page?.items ?? [];
    historyTotal = page?.total ?? 0;
  };
  render();
  if (getAccessToken()) {
    busy = true; render();
    void load().catch((cause) => { if (!closed) error = cause instanceof Error ? cause.message : 'Unable to load CodeForge progress.'; })
      .finally(() => { busy = false; render(); });
  }
}

async function copyProof(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard access unavailable');
    await navigator.clipboard.writeText(token);
    return true;
  } catch {
    return false;
  }
}

function n(value: number) { return Math.floor(value).toLocaleString('en-US'); }
