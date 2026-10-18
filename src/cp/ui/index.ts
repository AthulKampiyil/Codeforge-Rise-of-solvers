import { attacksApi, authApi, villageApi, guildApi, leagueApi, notificationsApi } from '../api';
import { getAccessToken, getRefreshToken, clearTokens } from '../client';
import { cpVillageStore } from '../store';
import { adminApi } from '../admin';
import type { Attack, AttackDetail, AttackTarget, JudgeAccount, SyncStatus, TerritoryZone, User, VillageProfile, Wallet } from '../types';
import type { AdminAuditLogEntry, AdminConfigEntry, AdminConfigValue, AdminUser } from '../types';
import './ui.css';

type Tab = 'village' | 'attacks' | 'guild' | 'territory' | 'war' | 'league' | 'economy' | 'notices' | 'help' | 'admin';
const CONTROL_PANEL_TABS: readonly Tab[] = ['village','attacks','guild','territory','war','league','economy','notices','help','admin'];
export function resolveControlPanelTab(search: string): Tab {
  const params = new URLSearchParams(search);
  const requested = params.get('tab');
  return params.get('cp') === '1' && CONTROL_PANEL_TABS.includes(requested as Tab) ? requested as Tab : 'village';
}
export function resolveVillageReturnPath(search: string, origin: string): string | null {
  const params = new URLSearchParams(search);
  if (params.get('cp') !== '1') return null;
  const requested = params.get('return');
  if (!requested) return null;
  try {
    const target = new URL(requested, origin);
    if (target.origin !== origin || target.pathname !== '/') return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch { return null; }
}
export type TerritoryPoint = [number, number];
export function parseTerritoryPolygon(value: unknown): TerritoryPoint[] | null {
  if (!Array.isArray(value) || value.length < 3) return null;
  const points: TerritoryPoint[] = [];
  for (const point of value) {
    if (!Array.isArray(point) || point.length !== 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1]) || point[0] < 0 || point[0] > 800 || point[1] < 0 || point[1] > 600) return null;
    points.push([point[0], point[1]]);
  }
  return points;
}
function territoryPolygonCenter(points: readonly TerritoryPoint[]): TerritoryPoint {
  const total = points.reduce(([x, y], [px, py]) => [x + px, y + py] as TerritoryPoint, [0, 0]);
  return [total[0] / points.length, total[1] / points.length];
}
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const problemUrl = (p: Record<string, unknown>) => {
  const direct = typeof p.problem_url === 'string' ? p.problem_url : '';
  try { const url = new URL(direct); if (url.protocol === 'https:' && ['codeforces.com','www.codeforces.com','codeforces.com.ru'].includes(url.hostname.toLowerCase())) return url.toString(); } catch { /* construct below only from trusted fields */ }
  const contest = p.contest_id ?? p.contestId; const index = p.index;
  return contest && index ? `https://codeforces.com/contest/${encodeURIComponent(String(contest))}/problem/${encodeURIComponent(String(index))}` : '';
};

export function mountCodeForgeUI() {
  const hiddenSiblings = Array.from(document.body.children, element => ({
    element: element as HTMLElement,
    hidden: (element as HTMLElement).hidden,
  }));
  hiddenSiblings.forEach(({ element }) => { element.hidden = true; });
  const root = document.createElement('div'); root.id = 'cp-ui'; document.body.append(root);
  let user: User | null = null, profile: VillageProfile | null = null, wallet: Wallet | null = null;
  let publicLeaderboard: Awaited<ReturnType<typeof leagueApi.leaderboard>> = [];
  let publicLeaderboardState: 'loading' | 'ready' | 'error' = 'loading';
  let publicLeaderboardBusy = false;
  let accounts: JudgeAccount[] = [], sync: SyncStatus[] = [], targets: AttackTarget[] = [], active: Attack[] = [];
  let guilds: Awaited<ReturnType<typeof guildApi.list>> = [], guild: Awaited<ReturnType<typeof guildApi.me>> = null;
  let joinRequests: Awaited<ReturnType<typeof guildApi.joinRequests>> = [], zones: Awaited<ReturnType<typeof guildApi.territories>> = [];
  let warRoom: Awaited<ReturnType<typeof guildApi.warRoom>> | null = null;
  let league: Awaited<ReturnType<typeof leagueApi.me>> | null = null, season: Awaited<ReturnType<typeof leagueApi.season>> | null = null;
  let leaderboard: Awaited<ReturnType<typeof leagueApi.leaderboard>> = [], trophies: Awaited<ReturnType<typeof leagueApi.ledger>> = [];
  let catalog: Awaited<ReturnType<typeof villageApi.catalog>> = [], inventory: Awaited<ReturnType<typeof villageApi.inventory>> = { items: [], equipped: [] };
  let inventoryLoaded = false;
  let notices: Awaited<ReturnType<typeof notificationsApi.history>> = [], unread = 0, leagueScope: 'global' | 'guild' = 'global', zoneFocus = '';
  let notificationRefreshBusy = false, warRoomError = '';
  let cooldown: Awaited<ReturnType<typeof attacksApi.cooldown>> | null = null;
  let adminConfig: AdminConfigEntry[] = [], adminUsers: AdminUser[] = [], adminAudit: AdminAuditLogEntry[] = [];
  let adminSection: 'balance' | 'users' | 'audit' = 'balance', adminSearch = '', adminSuspendedFilter: boolean | undefined;
  let suspendFormUserId: string | null = null;
  let tab: Tab = resolveControlPanelTab(window.location.search), error = '', busy = false, pendingToken = '', selected: AttackDetail | null = null, notice = '', noticeAction: { label: string; run: () => void } | null = null;
  let registering = false;
  let syncNotice = '', syncError = '', syncRequested = false, syncRefreshBusy = false;
  let syncPollTimer: number | undefined;
  let syncRealtimeUnsubscribe: (() => void) | undefined;
  let attackPollTimer: number | undefined, attackRefreshBusy = false, attackError = '';
  let selectedTopicId: string | null = null, villageLoading = true, loadTabGeneration = 0;
  let stopRealtime: (() => void) | undefined;
  const storeUnsubscribe = cpVillageStore.subscribe(snapshot => {
    if (!getAccessToken()) { profile = null; wallet = null; villageLoading = false; }
    else { profile = snapshot.village; wallet = snapshot.wallet; villageLoading = snapshot.loading; if (snapshot.error) error = snapshot.error.message; }
    render();
  });
  const topicSelected = (event: Event) => {
    const id = (event as CustomEvent<{topicId?: string}>).detail?.topicId;
    if (!id) return;
    selectedTopicId = id; tab = 'village'; render();
  };
  window.addEventListener('codeforge:topic-selected', topicSelected);
  const villageUpdated = () => { const snapshot = cpVillageStore.getSnapshot(); if (getAccessToken()) { profile=snapshot.village; wallet=snapshot.wallet; render(); } };
  window.addEventListener('codeforge:village-state', villageUpdated);
  async function load() {
    if (!getAccessToken()) { user=null; profile=null; wallet=null; render(); return; }
    busy=true; render();
    try { [user, accounts, sync] = await Promise.all([authApi.me(), authApi.judgeAccounts(), villageApi.syncOverview()]);const unverified=accounts.find(account=>account.judge_type==='codeforces'&&!account.verified_flag);pendingToken=unverified?await authApi.pendingJudgeProof(unverified.id).then(proof=>proof.verification_token).catch(()=>pendingToken):'';if(!inventoryLoaded){inventory=await villageApi.inventory().catch(()=>({items:[],equipped:[]}));inventoryLoaded=true;}if(!user.is_admin&&tab==='admin'){tab='village';} await cpVillageStore.refresh(); manageSyncPolling(); error=''; }
    catch(e) { error=message(e); if (!getAccessToken()) user=null; }
    busy=false; render();
    if(tab!=='village')void loadTab(tab);
  }
  async function startRealtime(){stopRealtime?.();syncRealtimeUnsubscribe?.();stopRealtime=await cpVillageStore.startRealtime();try{const unsubscribe=await notificationsApi.subscribe(event=>{if(event.event_type==='SYNC_STATUS_CHANGED')void refreshSyncOverview();if(['VILLAGE_UPDATED','TERRITORY_ZONE_CHANGED','LEAGUE_TIER_CHANGED','ATTACK_INCOMING','ATTACK_RESOLVED'].includes(event.event_type))void refreshNotifications();if(event.event_type==='TERRITORY_ZONE_CHANGED'&&tab==='territory')void loadTab('territory');if(event.event_type==='ATTACK_RESOLVED'){void refreshActiveAttacks();const attackId=String((event.payload as Record<string,unknown>|undefined)?.attack_id??'');if(selected&&(!attackId||attackId===selected.id))void refreshSelectedAttack();}if(event.event_type==='ATTACK_INCOMING'){const attackId=String((event.payload as Record<string,unknown>|undefined)?.attack_id??'');if(attackId){notice='Incoming attack from another village.';noticeAction={label:'Open attack',run:()=>void openAttackFromNotification(attackId)};render();}}});if(!getAccessToken())unsubscribe();else syncRealtimeUnsubscribe=unsubscribe;}catch{/* realtime is an enhancement; refresh and polling remain available */}}
  async function authenticateExisting(){if(!getAccessToken()&&getRefreshToken()){try{await authApi.refresh(getRefreshToken()!);}catch(e){error=message(e);}}if(getAccessToken()){void startRealtime();void load();}else{cpVillageStore.stop();void loadPublicLeaderboard();await cpVillageStore.refresh();render();}}
  function message(e: unknown) { const detail=(e as {detail?:unknown})?.detail; return typeof detail==='string'?detail:e instanceof Error?e.message:'Something went wrong. Please try again.'; }
  async function loadPublicLeaderboard() {
    if (publicLeaderboardBusy || getAccessToken()) return;
    publicLeaderboardBusy = true;
    publicLeaderboardState = 'loading';
    render();
    try {
      publicLeaderboard = await leagueApi.leaderboard('global');
      publicLeaderboardState = 'ready';
    } catch {
      publicLeaderboardState = 'error';
    } finally {
      publicLeaderboardBusy = false;
      if (!getAccessToken()) render();
    }
  }
  function publicLeaderboardView() {
    const contents = publicLeaderboardState === 'loading'
      ? '<p class="cp-public-status" role="status">Loading global standings…</p>'
      : publicLeaderboardState === 'error'
        ? '<div class="cp-public-error" role="alert"><span>Global standings could not be loaded.</span><button class="cp-secondary" id="cp-public-retry" type="button">Try again</button></div>'
        : publicLeaderboard.length
          ? `<ol class="cp-public-ranks">${publicLeaderboard.map((entry,index)=>`<li class="cp-public-rank"><b class="cp-public-place">${index+1}</b><span class="cp-public-name">${esc(entry.username)}</span><span class="cp-public-tier">${esc(entry.league_tier)}</span><strong class="cp-public-trophies">${esc(entry.trophy_count)} <span aria-label="trophies">✦</span></strong></li>`).join('')}</ol>`
          : '<p class="cp-public-status cp-public-empty">No global standings have been recorded yet.</p>';
    return `<section class="cp-public-panel" aria-labelledby="cp-public-title"><div class="cp-public-heading"><p class="cp-kicker">ACROSS THE FRONTIER</p><h2 id="cp-public-title">Global standings</h2><p class="cp-public-copy">See how villages rank by trophies.</p></div>${contents}<p class="cp-public-foot">Public standings · Global only</p></section>`;
  }
  async function run(fn:()=>Promise<unknown>, success?:string) { if(busy)return; busy=true; error=''; render(); try { await fn(); if(success){notice=success;noticeAction=null;} await load(); } catch(e){error=message(e);busy=false;render();} }
  const historyActive=(entry:SyncStatus)=>entry.history_state==='in_progress'||entry.status==='in_progress'||(syncRequested&&entry.history_state==='pending');
  function manageSyncPolling(){
    const active=sync.some(historyActive);
    if(active&&!syncPollTimer)syncPollTimer=window.setInterval(()=>{if(document.visibilityState==='visible')void refreshSyncOverview();},25_000);
    else if(!active&&syncPollTimer){clearInterval(syncPollTimer);syncPollTimer=undefined;}
    const codeforces=sync.find(item=>item.judge_name==='codeforces');
    if(codeforces&&(codeforces.history_state==='complete'||codeforces.history_state==='failed'||codeforces.status==='failed'))syncRequested=false;
  }
  async function refreshSyncOverview(){
    if(!getAccessToken()||syncRefreshBusy)return;
    syncRefreshBusy=true;
    try{sync=await villageApi.syncOverview();syncError='';manageSyncPolling();}
    catch(e){syncError=message(e);}
    finally{syncRefreshBusy=false;if(tab==='village')render();}
  }
  const isAttackPending=(attack:AttackDetail| null)=>!!attack&&(attack.pending===true||(attack.pending!==false&&['active','in_progress'].includes(attack.status)));
  function manageAttackPolling(){
    if(isAttackPending(selected)&&!attackPollTimer)attackPollTimer=window.setInterval(()=>{if(document.visibilityState==='visible')void refreshSelectedAttack();},20_000);
    else if(!isAttackPending(selected)&&attackPollTimer){clearInterval(attackPollTimer);attackPollTimer=undefined;}
  }
  async function refreshSelectedAttack(){
    if(!selected||attackRefreshBusy)return;
    const requestedId=selected.id;
    attackRefreshBusy=true;
    try{const fresh=await attacksApi.detail(requestedId);if(selected?.id!==requestedId)return;selected=fresh;attackError='';manageAttackPolling();}
    catch(e){attackError=message(e);}
    finally{attackRefreshBusy=false;if(tab==='attacks')render();}
  }
  async function refreshActiveAttacks(){
    try{active=await attacksApi.active();if(tab==='attacks')render();}
    catch(e){if(tab==='attacks'){attackError=message(e);render();}}
  }
  async function refreshNotifications(){
    if(!getAccessToken()||notificationRefreshBusy)return;
    notificationRefreshBusy=true;
    try{[notices,unread]=await Promise.all([notificationsApi.history(),notificationsApi.unreadCount().then(result=>result.unread_count)]);}
    catch(e){error=message(e);}
    finally{notificationRefreshBusy=false;render();}
  }
  async function openAttackFromNotification(attackId:string){
    if(!attackId)return;
    tab='attacks';selected=null;attackError='';busy=true;render();
    try{selected=await attacksApi.detail(attackId);active=await attacksApi.active();manageAttackPolling();}
    catch(e){attackError=message(e);}
    finally{busy=false;render();}
  }
  function renderSyncPanel(){
    const panel=root.querySelector<HTMLElement>('.cp-sync-panel');if(!panel)return;
    const verified=accounts.some(account=>account.verified_flag);
    panel.innerHTML=`<div class="cp-panel-head"><div><p class="cp-kicker">PLATFORM SYNC</p><h2>Import Codeforces history</h2></div><button class="cp-secondary" id="cp-sync-refresh" ${syncRefreshBusy?'disabled':''}>${syncRefreshBusy?'Checking…':'Refresh status'}</button></div><p class="cp-sub">Request a history import. Solved rows appear gradually while pages are processed.</p>${syncNotice?`<div class="cp-sync-feedback" role="status">${esc(syncNotice)}</div>`:''}${syncError?`<div class="cp-sync-error" role="alert">${esc(syncError)}</div>`:''}${sync.length?sync.map(entry=>{const active=historyActive(entry);const failed=entry.history_state==='failed'||entry.status==='failed'||entry.status==='degraded'||!!entry.last_error;const pending=entry.history_state==='pending';const state=entry.history_state==='in_progress'||entry.status==='in_progress'?'Importing history':entry.history_state==='complete'?'History import complete':failed?'Import needs attention':pending?(syncRequested?'Queued for import':entry.status==='unknown'?'No import run recorded':'Waiting for import'):entry.history_state.replaceAll('_',' ');return `<div class="cp-sync-entry"><div class="cp-sync-entry-head"><i class="${failed?'failed':active?'working':entry.history_state==='complete'?'complete':''}"></i><b>${esc(entry.judge_name)}</b><span>${esc(state)}</span></div><p class="cp-sync-count">${esc(entry.history_rows)} rows across ${esc(entry.history_pages)} pages imported</p>${entry.last_synced_at?`<small class="cp-sync-time">Last sync ${new Date(entry.last_synced_at).toLocaleString()}</small>`:''}${entry.last_error?`<p class="cp-sync-error">${esc(entry.last_error)}</p>`:''}${failed?'<button class="cp-secondary cp-sync-retry" data-sync-retry>Retry import</button>':''}</div>`;}).join(''):'<p class="cp-empty">Link and verify a Codeforces handle to import problem history.</p>'}<button class="cp-primary cp-sync-action" id="cp-sync" ${busy||!verified||sync.some(historyActive)?'disabled':''}>${sync.some(entry=>entry.history_state==='failed'||entry.status==='failed'||entry.status==='degraded'||!!entry.last_error)?'Retry Codeforces import':'Sync Codeforces'}</button>${!verified?'<small class="cp-hint">Verify your handle to enable sync.</small>':''}`;
  }
  function renderAuditedPlayerGaps(){
    const main=root.querySelector<HTMLElement>('.cp-main');if(!main)return;
    if(tab==='war'&&warRoomError){const empty=main.querySelector<HTMLElement>('.cp-empty');if(empty){empty.className='cp-war-access';empty.setAttribute('role','alert');empty.textContent=warRoomError;}}
    if(tab==='economy'){
      const rewardPanel=Array.from(main.querySelectorAll<HTMLElement>('.cp-panel')).find(panel=>panel.querySelector('.cp-panel-head .cp-kicker')?.textContent==='COIN HISTORY');
      const heading=rewardPanel?.querySelector('h2');if(heading)heading.textContent='Solve earnings';
      if(rewardPanel){const note=document.createElement('p');note.className='cp-sub cp-ledger-note';note.textContent='This ledger shows solve rewards only. Cosmetic purchases are not listed here.';rewardPanel.querySelector('.cp-panel-head')?.after(note);}
    }
    if(tab==='guild'&&guild){
      const role=guild.memberships.find(member=>member.user_id===user?.id)?.role;
      const leave=root.querySelector<HTMLButtonElement>('#cp-leave-guild');
      if(role==='leader'&&leave){leave.disabled=true;leave.setAttribute('aria-describedby','cp-leader-leave-reason');const wrapper=document.createElement('div');wrapper.className='cp-leave-locked';leave.replaceWith(wrapper);wrapper.append(leave);const reason=document.createElement('small');reason.id='cp-leader-leave-reason';reason.textContent='Transfer leadership before leaving the guild.';wrapper.append(reason);}
      const successors=guild.memberships.filter(member=>member.user_id!==user?.id);
      const roster=main.querySelector<HTMLElement>('.cp-panel');
      if(role==='leader'&&successors.length&&roster&&!roster.querySelector('#cp-transfer-leadership')){
        const options=successors.map(member=>`<option value="${esc(member.user_id)}">${esc(member.username)} · ${esc(member.role)}</option>`).join('');
        roster.insertAdjacentHTML('beforeend',`<form id="cp-transfer-leadership" class="cp-leadership-transfer"><div><p class="cp-kicker">GUILD LEADERSHIP</p><h3>Choose the next leader</h3><p class="cp-sub">Leadership will pass to an existing member. You can leave the guild afterward.</p></div><label for="cp-successor">New leader</label><select id="cp-successor" name="successor" required>${options}</select><button class="cp-primary" type="submit">Transfer leadership</button></form>`);
      }
    }
    if(tab==='village'){
      const panel=root.querySelector<HTMLElement>('.cp-link-panel');
      const rows=panel?.querySelectorAll<HTMLElement>('.cp-account');
      rows?.forEach((row,index)=>{
        const account=accounts[index];if(!account)return;
        const unlink=document.createElement('button');unlink.type='button';unlink.className='cp-secondary cp-unlink';unlink.textContent='Unlink';unlink.setAttribute('aria-label',`Unlink ${account.judge_type} handle ${account.handle}`);
        unlink.addEventListener('click',()=>void unlinkJudgeAccount(account));row.append(unlink);
      });
      if(accounts.length&&panel){const note=document.createElement('small');note.className='cp-unlink-note';note.textContent='Unlinking disconnects future imports. The service blocks unlinking a verified judge account with solve or reward history.';const form=panel.querySelector('.cp-link-form');if(form)form.before(note);else panel.append(note);}
    }
    if(tab==='notices'){
      const rows=root.querySelectorAll<HTMLElement>('.cp-notice-row');
      rows.forEach((row,index)=>{
        const item=notices[index];if(item?.event_type!=='ATTACK_INCOMING')return;
        const payload=item.payload??{};const id=payload.attack_id;
        if(typeof id!=='string'||!id)return;
        const idLine=document.createElement('p');idLine.className='cp-notice-attack-id';idLine.textContent=`Incoming attack · ${id}`;
        const action=document.createElement('button');action.type='button';action.className='cp-secondary';action.textContent='Open attack details';action.setAttribute('aria-label',`Open incoming attack ${id}`);action.addEventListener('click',()=>void openAttackFromNotification(id));
        row.querySelector('div:nth-child(2)')?.append(idLine,action);
      });
    }
    if(tab==='village')renderOnboarding(main);
  }
  function renderOnboarding(main:HTMLElement){
    const heading=main.querySelector<HTMLElement>('.cp-heading');
    if(!heading||main.querySelector('.cp-onboarding'))return;
    const codeforces=accounts.find(account=>account.judge_type==='codeforces');
    const linked=!!codeforces;
    const verified=!!codeforces?.verified_flag;
    const history=sync.find(entry=>entry.judge_name==='codeforces');
    const historyFailed=!!syncError||!!history&&(history.history_state==='failed'||history.status==='failed'||history.status==='degraded'||!!history.last_error);
    const historyComplete=!historyFailed&&(history?.history_state==='complete'||history?.status==='up_to_date');
    const historyActiveNow=!!history&&(history.history_state==='in_progress'||history.status==='in_progress'||(syncRequested&&history.history_state==='pending'));
    const villageReady=!!profile&&!villageLoading&&!cpVillageStore.getSnapshot().stale;
    const focusIndex=!linked?1:!verified?2:!historyComplete?3:!villageReady?4:-1;
    const steps=[
      {title:'Account',state:'complete',detail:`Signed in as ${user?.username??'player'}.`},
      {title:'Link Codeforces',state:linked?'complete':focusIndex===1?'current':'upcoming',detail:linked?`Handle ${codeforces?.handle} is linked.`:'Connect your Codeforces handle to match solved problems.'},
      {title:'Prove handle ownership',state:verified?'complete':linked?'current':'upcoming',detail:verified?'Your handle is verified.':linked?`Add the proof token to your Codeforces profile’s First Name field, save it, then verify here.${pendingToken?` Proof token: ${pendingToken}`:''}`:'Verification comes after linking.'},
      {title:'Import history',state:historyComplete?'complete':historyFailed?'failed':verified?'current':'upcoming',detail:historyComplete?`${history?.history_rows??0} history rows imported.`:historyFailed?history?.last_error||syncError||'The history import needs attention.':historyActiveNow?'Import requested. Waiting for Codeforces history to finish.':verified?'Request an import of your solved-problem history.':'Import becomes available after handle verification.'},
      {title:'Enter your village',state:villageReady?'complete':historyComplete?'current':'upcoming',detail:villageReady?'Your village is ready, with progress from your account.':'Your village opens as soon as its server profile is available.'},
    ] as const;
    const rail=`<section class="cp-onboarding" aria-labelledby="cp-onboarding-title"><div class="cp-onboarding-head"><div><p class="cp-kicker">FIRST VISIT</p><h2 id="cp-onboarding-title">Bring your progress to the village</h2><p>Five steps connect your Codeforces history to village progress.</p></div><span class="cp-onboarding-count">${steps.filter(step=>step.state==='complete').length} / 5</span></div><ol class="cp-onboarding-steps">${steps.map((step,index)=>`<li class="cp-onboarding-step is-${step.state}" data-onboarding-step="${index+1}" data-step-state="${step.state}" ${step.state==='current'||step.state==='failed'?'aria-current="step"':''}><span class="cp-step-mark" aria-hidden="true">${step.state==='complete'?'✓':index+1}</span><div class="cp-step-copy"><b>${step.title}</b><small>${esc(step.detail)}</small></div><span class="cp-step-state">${step.state==='complete'?'Complete':step.state==='current'?'Next':step.state==='failed'?'Needs attention':'Later'}</span></li>`).join('')}</ol>${!linked?'<button class="cp-secondary cp-onboarding-action" type="button" data-onboarding-action="link">Link Codeforces handle</button>':!verified?'<button class="cp-secondary cp-onboarding-action" type="button" data-onboarding-action="verify">Review verification</button>':historyFailed?'<button class="cp-primary cp-onboarding-action" type="button" data-onboarding-action="sync">Retry history import</button>':!historyComplete?`<button class="cp-primary cp-onboarding-action" type="button" data-onboarding-action="sync" ${historyActiveNow||busy?'disabled':''}>${historyActiveNow?'History import in progress':'Import Codeforces history'}</button>`:''}</section>`;
    heading.insertAdjacentHTML('beforebegin',rail);
    main.querySelectorAll<HTMLButtonElement>('[data-onboarding-action]').forEach(button=>button.addEventListener('click',()=>{
      const action=button.dataset.onboardingAction;
      if(action==='sync'){const retry=root.querySelector<HTMLButtonElement>('[data-sync-retry]');const syncButton=root.querySelector<HTMLButtonElement>('#cp-sync');if(retry&&!retry.disabled)retry.click();else if(syncButton&&!syncButton.disabled)syncButton.click();else root.querySelector<HTMLElement>('.cp-sync-panel')?.scrollIntoView({behavior:'smooth',block:'center'});return;}
      const panel=root.querySelector<HTMLElement>('.cp-link-panel');panel?.scrollIntoView({behavior:'smooth',block:'center'});
      if(action==='link')panel?.querySelector<HTMLInputElement>('input[name="handle"]')?.focus();
      else root.querySelector<HTMLElement>('#cp-verify')?.focus();
    }));
  }
  async function unlinkJudgeAccount(account:JudgeAccount){
    const warning=`Unlink ${account.judge_type} handle ${account.handle}? Future imports will stop. The service will reject this if a verified account has solve or reward history. Continue?`;
    if(!window.confirm(warning))return;
    void run(async()=>{await authApi.unlinkJudge(account.judge_type);accounts=await authApi.judgeAccounts();sync=await villageApi.syncOverview();pendingToken='';},`${account.judge_type} handle unlinked.`);
  }
  // Typed input must survive the full re-render that every store publish and request triggers:
  // capture the live values/caret before the DOM is replaced and put them back afterwards.
  type EditableField = { key: string; value: string; focused: boolean; start: number | null; end: number | null };
  const NON_TEXT_INPUTS = new Set(['checkbox', 'radio', 'file', 'submit', 'button', 'reset', 'image']);
  function editableKey(element: HTMLInputElement | HTMLTextAreaElement, counts: Map<string, number>): string {
    const base = element.name || element.id;
    if (!base || NON_TEXT_INPUTS.has(element.type)) return '';
    const index = counts.get(base) ?? 0;
    counts.set(base, index + 1);
    return `${base}#${index}`;
  }
  function captureEditableFields(): EditableField[] {
    const counts = new Map<string, number>();
    const focused = document.activeElement;
    const fields: EditableField[] = [];
    for (const element of Array.from(root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'))) {
      const key = editableKey(element, counts);
      if (!key || element.disabled) continue;
      const isFocused = element === focused;
      fields.push({ key, value: element.value, focused: isFocused, start: isFocused ? element.selectionStart : null, end: isFocused ? element.selectionEnd : null });
    }
    return fields;
  }
  function restoreEditableFields(fields: EditableField[]): void {
    if (!fields.length) return;
    const counts = new Map<string, number>();
    let focusElement: HTMLInputElement | HTMLTextAreaElement | null = null;
    let focusField: EditableField | null = null;
    for (const element of Array.from(root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'))) {
      const key = editableKey(element, counts);
      if (!key || element.disabled) continue;
      const field = fields.find(item => item.key === key);
      if (!field) continue;
      if (field.value && (field.focused || !element.value)) element.value = field.value;
      if (field.focused) { focusElement = element; focusField = field; }
    }
    if (focusElement && focusField) {
      focusElement.focus();
      if (focusField.start !== null && focusField.end !== null) {
        try { focusElement.setSelectionRange(focusField.start, focusField.end); } catch { /* input types without a text selection */ }
      }
    }
  }
  function render() {
    if (!root.isConnected) return;
    const editableFields = captureEditableFields();
    if (!user) { root.innerHTML=`<main class="cp-auth"><div class="cp-auth-layout"><section class="cp-auth-card"><div class="cp-mark">CF<span> / </span>VILLAGE</div><p class="cp-kicker">YOUR PROGRESS, IN THE FIELD</p><h1>${registering?'Build your account.':'Enter the frontier.'}</h1><p class="cp-copy">${registering?'Create an account to connect Codeforces and grow your village.':'Sign in to bring your Codeforces progress into your village.'}</p>${error?`<p class="cp-error" role="alert">${esc(error)}</p>`:''}<form id="cp-auth-form" class="${registering?'is-registering':''}"><label>Email<input required type="email" name="email" autocomplete="email"></label><label>Password<input required type="password" name="password" minlength="8" autocomplete="${registering?'new-password':'current-password'}"></label><label class="cp-register-name" ${registering?'':'hidden'}>Village name<input name="username" autocomplete="nickname" ${registering?'required':''}></label><button class="cp-primary" type="submit">${registering?'Create account':'Sign in'}</button></form><button class="cp-text-button" id="cp-auth-toggle" aria-expanded="${registering}">${registering?'I already have an account':'Create an account'}</button><p class="cp-fine">Your CodeForge account keeps your progress, guild and rewards together.</p></section>${publicLeaderboardView()}</div></main>`;
      root.querySelector<HTMLButtonElement>('#cp-auth-toggle')!.onclick=()=>{registering=!registering;error='';render();};
      root.querySelector<HTMLButtonElement>('#cp-public-retry')?.addEventListener('click',()=>void loadPublicLeaderboard());
        root.querySelector<HTMLFormElement>('#cp-auth-form')!.onsubmit=async ev=>{ev.preventDefault();const f=new FormData(ev.currentTarget as HTMLFormElement);busy=true;error='';render();try{if(registering) await authApi.register({username:String(f.get('username')),email:String(f.get('email')),password:String(f.get('password'))});await authApi.login({email:String(f.get('email')),password:String(f.get('password'))});const returnPath=resolveVillageReturnPath(window.location.search,window.location.origin);if(returnPath&&tab!=='village')window.location.assign(`/?cp=1&tab=${tab}`);else if(returnPath)window.location.assign(returnPath);else window.location.reload();}catch(e){busy=false;error=message(e);render();}};
      if(busy) root.querySelector('button[type=submit]')!.textContent='Connecting…'; restoreEditableFields(editableFields); return;
    }
    const topics=profile?.topics??[];
    const nav: [Tab,string][]=[['village','Village'],['attacks','Attacks'],['guild','Guild'],['territory','Territory'],['war','War room'],['league','League'],['economy','Store'],['notices','Notices'],['help','Help'],...(user.is_admin?[['admin','Admin'] as [Tab,string]]:[])];
    const chosenTopic=topics.find(t=>t.id===selectedTopicId);
    root.innerHTML=`<div class="cp-shell"><header class="cp-top"><div class="cp-brand"><span class="cp-sigil">C</span><span>CODEFORGE<small>FIELD COMMAND</small></span></div><div class="cp-wallet"><span>◈ <b>${wallet?.coins??'—'}</b><small>COINS</small></span><span>✦ <b>${wallet?.gems??'—'}</b><small>GEMS</small></span></div><div class="cp-user">${esc(user.username)}<button id="cp-logout" aria-label="Sign out">↗</button></div></header><aside class="cp-rail" aria-label="Village navigation">${nav.map(([id,label])=>`<button class="cp-nav ${tab===id?'selected':''}" data-tab="${id}" aria-label="${label}" title="${label}" aria-current="${tab===id?'page':'false'}"><i>${({village:'⌂',attacks:'⚔',guild:'⚑',territory:'◇',war:'▤',league:'◎',economy:'◈',notices:'✉',admin:'⚙'} as Record<string,string>)[id]}</i><span>${label}</span>${id==='notices'&&unread?`<small>${unread}</small>`:''}</button>`).join('')}</aside><main class="cp-main" aria-label="${esc(nav.find(x=>x[0]===tab)?.[1]??'Village')}"><div class="cp-drawer-head"><span>${esc(nav.find(x=>x[0]===tab)?.[1]??'Village')}</span></div>${error?`<div class="cp-alert" role="alert">${esc(error)}</div>`:''}${notice?`<div class="cp-notice" role="status"><span>${esc(notice)}</span>${noticeAction?`<button class="cp-secondary" id="cp-notice-action">${esc(noticeAction.label)}</button>`:''}<button id="cp-notice-close" aria-label="Dismiss">×</button></div>`:''}${busy||villageLoading?'<div class="cp-loading" role="status">Updating your field…</div>':''}${tab==='village'? villageView(topics):tab==='attacks'?attackView():tab==='guild'?guildView():tab==='territory'?territoryView():tab==='war'?warView():tab==='league'?leagueView():tab==='economy'?economyView():tab==='notices'?noticeView():tab==='help'?helpView():adminView()}</main>${chosenTopic?`<section class="cp-topic-card" aria-label="Selected topic"><button id="cp-topic-close" aria-label="Close topic details">×</button><p class="cp-kicker">TOPIC OUTPOST · LEVEL ${esc(chosenTopic.level)}</p><h2>${esc(chosenTopic.display_name||chosenTopic.name)}</h2><div class="cp-progress"><i style="width:${Math.max(0,Math.min(100,Number(chosenTopic.progress_pct)||0))}%"></i></div><p>${esc(chosenTopic.progress_points)} points · ${esc(chosenTopic.points_to_next_level)} to next level</p></section>`:''}</div>`;
    root.querySelectorAll<HTMLElement>('.cp-shop-item').forEach((card,index)=>{
      if(catalog[index]?.slot!=='village-skin')return;
      card.querySelectorAll<HTMLButtonElement>('[data-buy],[data-equip]').forEach(button=>{
        button.disabled=true;
        button.title='Village skin visuals are unavailable in the CP workflow.';
      });
      const details=card.querySelectorAll('small');
      const note=details[details.length-1];
      if(note)note.textContent='Village skin visuals are not supported in this workflow; purchase and equip are disabled.';
    });
    const userBar = root.querySelector('.cp-user');
    if (userBar && !userBar.querySelector('.cp-return')) {
      const returnLink = document.createElement('a');
      returnLink.className = 'cp-return';
      returnLink.href = '/';
      returnLink.textContent = 'Return to village';
      userBar.insertBefore(returnLink, userBar.querySelector('#cp-logout'));
    }
    renderSyncPanel();
    renderAuditedPlayerGaps();
    root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>b.onclick=()=>{const next=b.dataset.tab as Tab;if(tab===next)return;tab=next;void loadTab(tab);render();});

    root.querySelector('#cp-topic-close')?.addEventListener('click',()=>{selectedTopicId=null;render();});
    root.querySelector<HTMLButtonElement>('#cp-logout')!.onclick=()=>{void logout();};
    root.querySelector<HTMLButtonElement>('#cp-notice-close')?.addEventListener('click',()=>{notice='';noticeAction=null;render();});
    root.querySelector<HTMLButtonElement>('#cp-notice-action')?.addEventListener('click',()=>{const action=noticeAction;notice='';noticeAction=null;action?.run();});
    bindVillage(); bindAttacks(); bindGuild(); bindTerritory(); bindLeague(); bindEconomy(); bindNotices(); bindHelp(); bindAdmin();
    restoreEditableFields(editableFields);
  }
  function villageView(topics: VillageProfile['topics']) { return `<div class="cp-heading"><div><p class="cp-kicker">YOUR KNOWLEDGE, TAKING ROOT</p><h1>Village overview</h1><p class="cp-sub">Each solved challenge strengthens its topic.</p></div><div class="cp-rating"><span>DEFENCE RATING</span><b>${profile?.defense_rating??0}</b></div></div><div class="cp-stat-grid"><article class="cp-stat"><small>PROBLEMS SOLVED</small><strong>${profile?.total_solved??0}</strong><span>across linked topics</span></article><article class="cp-stat"><small>AVERAGE LEVEL</small><strong>${Number(profile?.average_level??0).toFixed(1)}</strong><span>village experience</span></article><article class="cp-stat"><small>TOPIC OUTPOSTS</small><strong>${topics.length}</strong><span>areas of expertise</span></article></div><section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">PROGRESSION</p><h2>Topic outposts</h2></div><span>${topics.length} TRACKED</span></div>${topics.length?`<div class="cp-topics">${topics.map(t=>`<article class="cp-topic"><div class="cp-topic-icon">${esc((t.display_name||t.name).slice(0,1).toUpperCase())}</div><div class="cp-topic-content"><div class="cp-topic-title"><b>${esc(t.display_name||t.name)}</b><span>LEVEL ${esc(t.level)}</span></div><div class="cp-progress"><i style="width:${Math.max(0,Math.min(100,Number(t.progress_pct)||0))}%"></i></div><small>${esc(t.progress_points)} pts · ${esc(t.points_to_next_level)} to next level</small></div><strong class="cp-pct">${Math.round(Number(t.progress_pct)||0)}%</strong></article>`).join('')}</div>`:'<p class="cp-empty">No topic progress yet. Link your Codeforces handle and sync to map your solved problems here.</p>'}</section><div class="cp-connect-grid"><section class="cp-panel cp-link-panel"><div class="cp-panel-head"><div><p class="cp-kicker">PROBLEM HISTORY</p><h2>Codeforces link</h2></div><span class="cp-state">${accounts.some(a=>a.verified_flag)?'VERIFIED':'NOT LINKED'}</span></div>${accounts.map(a=>`<p class="cp-account"><b>${esc(a.handle)}</b><span>${a.verified_flag?'Profile verified':'Verification pending'}</span></p>`).join('')}<form id="cp-link-form" class="cp-inline"><label>Codeforces handle<input name="handle" required placeholder="e.g. tourist" autocomplete="off"></label><button class="cp-primary" ${busy?'disabled':''}>Link handle</button></form>${pendingToken?`<div class="cp-verify"><p>Add this exact token to the First Name field of your Codeforces profile, save it, then verify:</p><code>${esc(pendingToken)}</code><button class="cp-secondary" id="cp-verify" ${busy?'disabled':''}>Check profile</button></div>`:''}</section><section class="cp-panel cp-sync-panel"><p class="cp-kicker">PLATFORM SYNC</p><h2>Bring progress up to date</h2><p class="cp-sub">Fetch your latest accepted Codeforces submissions.</p>${sync.map(s=>`<div class="cp-sync-state"><i class="${s.status==='failed'?'failed':''}"></i><b>${esc(s.judge_name)}</b><span>${esc(s.status.replaceAll('_',' '))}</span>${s.last_synced_at?`<small>${new Date(s.last_synced_at).toLocaleString()}</small>`:''}${s.last_error?`<p>${esc(s.last_error)}</p>`:''}</div>`).join('')}<button class="cp-primary" id="cp-sync" ${busy||!accounts.some(a=>a.verified_flag)?'disabled':''}>Sync Codeforces</button>${!accounts.some(a=>a.verified_flag)?'<small class="cp-hint">Verify your handle to enable sync.</small>':''}</section></div>`; }
  function attackView(){return `<div class="cp-heading"><div><p class="cp-kicker">TEST YOUR STRATEGY</p><h1>Village attacks</h1><p class="cp-sub">Challenge another CodeForge village with a problem set.</p></div><button class="cp-secondary" id="cp-refresh-targets">↻ Refresh field</button></div>${attackError&&!selected?`<div class="cp-alert" role="alert">${esc(attackError)}</div>`:''}${cooldown&&!cooldown.can_attack?`<div class="cp-alert" role="status">Attacks are on cooldown${cooldown.remaining_seconds!=null?` · ${Math.ceil(cooldown.remaining_seconds/60)} min remaining`:''}${cooldown.next_available_at?` · Available ${new Date(cooldown.next_available_at).toLocaleString()}`:''}.</div>`:''}${selected?detailView(selected):''}<section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">ONGOING</p><h2>Active attacks</h2></div></div>${active.length?active.map(a=>`<div class="cp-target"><div><b>Attack ${esc(a.id.slice(0,8))}</b><small>${esc(a.status)}</small></div><button class="cp-secondary" data-detail="${esc(a.id)}">Open details</button></div>`).join(''):'<p class="cp-empty">No active attacks. Choose a target below to begin.</p>'}</section><section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">AVAILABLE VILLAGES</p><h2>Choose a target</h2></div></div>${targets.length?targets.map(t=>`<div class="cp-target"><div class="cp-target-avatar">${esc(t.username.slice(0,1).toUpperCase())}</div><div class="cp-target-name"><b>${esc(t.username)}</b><small>Defence rating ${esc(t.defense_rating)}${t.level!=null?` · Level ${esc(t.level)}`:''}</small></div><button class="cp-primary" data-launch="${esc(t.id)}" ${busy||(cooldown&&!cooldown.can_attack)?'disabled':''}>Launch attack</button></div>`).join(''):'<p class="cp-empty">No attack targets available right now.</p>'}</section>`;}
  function detailView(d:AttackDetail){const pending=isAttackPending(d);const state=(d.resolution_state||'').toLowerCase();const stateCopy=state==='expiry_grace'?'The grace period has started. The result will be checked after it ends.':state==='sync_pending'?'Waiting for the problem history check before calculating the result.':state==='proof_complete'?'The check is complete; final scoring is still being prepared.':state?`Result check: ${state.replaceAll('_',' ')}.`:'The result is being checked.';const terminalStatus=d.status.toLowerCase().replaceAll('_',' ');const canResolve=!pending&&['active','in progress'].includes(terminalStatus);const outcome=terminalStatus==='abandoned'?'Attack ended early.':['resolved','completed','complete'].includes(terminalStatus)?'Final result':'Result ready';return `<section class="cp-panel cp-detail"><div class="cp-panel-head"><div><p class="cp-kicker">ATTACK DETAIL</p><h2>${esc(d.target_username||'Opponent village')}</h2></div><button class="cp-secondary" id="cp-close-detail">Close</button></div>${pending?`<div class="cp-attack-pending" role="status"><span class="cp-attack-pulse" aria-hidden="true"></span><div><b>Final result pending</b><p>${esc(stateCopy)}</p>${d.not_before?`<small>Next eligible check: ${new Date(d.not_before).toLocaleString()}</small>`:'<small>This view refreshes while the check is pending.</small>'}</div></div><p class="cp-sub">No final score or trophy result is available yet.</p>${attackError?`<div class="cp-alert" role="alert">${esc(attackError)}</div>`:''}<button class="cp-secondary" id="cp-refresh-attack" ${attackRefreshBusy?'disabled':''}>${attackRefreshBusy?'Checking…':'Refresh result'}</button>`:`<div class="cp-attack-outcome" role="status"><b>${esc(outcome)}</b><span>Final score: ${esc(d.score)}</span>${d.solved_fraction!=null?`<span>${Math.round(d.solved_fraction*100)}% of problems solved</span>`:''}</div>`}${!pending&&d.remaining_seconds!=null?`<p class="cp-sub">${Math.ceil(d.remaining_seconds/60)} min remaining</p>`:''}<div class="cp-attack-problems">${d.problems.map(p=>{const title=String(p.problem_name??'Problem');const url=problemUrl(p);return `<div class="cp-problem"><b>${esc(title)}</b>${p.solved_flag?' · Solved':''}${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open problem ↗</a>`:''}</div>`;}).join('')||'<p class="cp-empty">No problem details were included for this attack.</p>'}</div>${canResolve?`<button class="cp-primary" id="cp-resolve" ${busy?'disabled':''}>Resolve attack</button><button class="cp-text-button" id="cp-abandon" ${busy?'disabled':''}>End as abandoned</button>`:''}</section>`;}
  function guildView(){const role=guild?.memberships.find(m=>m.user_id===user?.id)?.role;const canManage=role==='leader'||role==='officer';return `<div class="cp-heading"><div><p class="cp-kicker">YOUR CREW</p><h1>${guild?esc(guild.name):'Guilds'}</h1><p class="cp-sub">${guild?esc(guild.description||'A shared frontier for your guild.'): 'Find a crew or establish one of your own.'}</p></div>${guild?`<button class="cp-secondary" id="cp-leave-guild" ${busy?'disabled':''}>Leave guild</button>`:''}</div>${guild?`<section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">ROSTER</p><h2>Guild members</h2></div><span>${guild.memberships.length} MEMBERS</span></div>${guild.memberships.map(m=>`<div class="cp-target"><div class="cp-target-avatar">${esc(m.username.slice(0,1).toUpperCase())}</div><div class="cp-target-name"><b>${esc(m.username)} ${m.user_id===user?.id?'<small>(you)</small>':''}</b><small>${esc(m.role)} · Level ${esc(m.level)} · ${esc(m.solved_count)} solved · ${esc(m.attack_count)} attacks</small></div>${canManage&&m.user_id!==user?.id?`<button class="cp-secondary" data-remove-member="${esc(m.user_id)}" ${busy?'disabled':''}>Remove</button>`:''}</div>`).join('')}</section>${canManage?`<section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">REQUESTS</p><h2>Join requests</h2></div></div>${joinRequests.length?joinRequests.map(r=>`<div class="cp-target"><div class="cp-target-name"><b>Request ${esc(r.id.slice(0,8))}</b><small>${esc(r.status)} · ${new Date(r.created_at).toLocaleDateString()}</small></div>${r.status==='pending'?`<button class="cp-primary" data-approve="${esc(r.id)}" ${busy?'disabled':''}>Approve</button><button class="cp-secondary" data-reject="${esc(r.id)}" ${busy?'disabled':''}>Decline</button>`:''}</div>`).join(''):'<p class="cp-empty">There are no join requests.</p>'}</section>`:''}`:`<div class="cp-connect-grid"><section class="cp-panel"><p class="cp-kicker">START A CREW</p><h2>Create a guild</h2><form id="cp-create-guild" class="cp-form"><label>Guild name<input name="name" minlength="3" maxlength="50" required></label><label>Description <span class="cp-optional">optional</span><textarea name="description" maxlength="500" rows="3"></textarea></label><button class="cp-primary">Create guild</button></form></section><section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">OPEN CREWS</p><h2>Browse guilds</h2></div></div>${guilds.length?guilds.map(g=>`<div class="cp-target"><div class="cp-target-name"><b>${esc(g.name)}</b><small>${esc(g.description||'No description')}</small></div><button class="cp-primary" data-join="${esc(g.id)}" ${busy?'disabled':''}>Request to join</button></div>`).join(''):'<p class="cp-empty">No guilds are available to join yet.</p>'}</section></div>`}`;}
  function territoryView(){
    const focused=zones.find(zone=>zone.id===zoneFocus);
    const ownerName=(zone:TerritoryZone)=>zone.owning_guild_id?guilds.find(item=>item.id===zone.owning_guild_id)?.name??`Guild ${zone.owning_guild_id.slice(0,8)}`:'Unclaimed';
    const mapped=zones.map(zone=>({zone,points:parseTerritoryPolygon(zone.map_polygon)}));
    const valid=mapped.filter((item):item is {zone:TerritoryZone;points:TerritoryPoint[]}=>!!item.points);
    const missingGeometry=valid.length!==zones.length;
    const owners=[...new Set(valid.map(item=>item.zone.owning_guild_id).filter((id):id is string=>!!id))];
    const ownerPattern=(id:string|null)=>id?`zone-owner-${owners.indexOf(id)}`:'zone-unclaimed';
    const palettes=[['#607c49','#fff4d4'],['#806843','#fff4d4'],['#587b86','#fff4d4'],['#8a6650','#fff4d4'],['#686589','#fff4d4'],['#717544','#fff4d4']];
    const hatches=['M-3 3L3-3M0 12L12 0M9 15L15 9','M0 2H12M0 6H12M0 10H12','M2 0V12M6 0V12M10 0V12','M0 0L12 12M12 0L0 12'];
    const patterns=owners.map((_,index)=>`<pattern id="zone-owner-${index}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${palettes[index%palettes.length][0]}"/><path d="${hatches[index%hatches.length]}" stroke="${palettes[index%palettes.length][1]}" stroke-opacity=".58" stroke-width="1.5"/></pattern>`).join('');
    const coordinates=valid.flatMap(item=>item.points);
    const minX=coordinates.length?Math.max(0,Math.min(...coordinates.map(point=>point[0]))-24):0;
    const minY=coordinates.length?Math.max(0,Math.min(...coordinates.map(point=>point[1]))-24):0;
    const maxX=coordinates.length?Math.min(800,Math.max(...coordinates.map(point=>point[0]))+24):800;
    const maxY=coordinates.length?Math.min(600,Math.max(...coordinates.map(point=>point[1]))+24):600;
    const viewBox=`${minX} ${minY} ${Math.max(1,maxX-minX)} ${Math.max(1,maxY-minY)}`;
    const map=valid.length?`<div class="cp-territory-map-frame"><svg class="cp-territory-map" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" role="group" aria-labelledby="cp-territory-map-title"><title id="cp-territory-map-title">Guild territory map. Focus a zone and press Enter or Space for details.</title><defs><pattern id="zone-unclaimed" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#c9c1aa"/><path d="M0 0L10 10M10 0L0 10" stroke="#817d6e" stroke-opacity=".55"/></pattern>${patterns}</defs>${valid.map(({zone,points})=>{const[cx,cy]=territoryPolygonCenter(points);const xs=points.map(point=>point[0]);const labelWidth=Math.max(45,Math.min(190,(Math.max(...xs)-Math.min(...xs))*.86));const name=esc(zone.name);const owner=esc(ownerName(zone));const selected=zone.id===zoneFocus;const coordinateList=points.map(([x,y])=>`${x},${y}`).join(' ');return `<g class="cp-map-zone ${selected?'selected':''}" data-map-zone="${esc(zone.id)}" role="button" tabindex="0" aria-pressed="${selected}" aria-label="Select ${name}. Owner: ${owner}"><polygon points="${coordinateList}" fill="url(#${ownerPattern(zone.owning_guild_id)})" aria-hidden="true"/><text class="cp-map-zone-name" x="${cx}" y="${cy-3}" textLength="${labelWidth}" lengthAdjust="spacingAndGlyphs" aria-hidden="true">${name}</text><text class="cp-map-zone-owner" x="${cx}" y="${cy+15}" aria-hidden="true">${owner}</text></g>`;}).join('')}</svg></div>`:'<p class="cp-empty cp-map-empty">No zone outlines are available. Choose a zone from the list below.</p>';
    const zoneList=missingGeometry?`<div class="cp-zone-list" aria-label="Territory zone list"><h3>Zone list</h3><p class="cp-sub">Some boundaries are unavailable; all zones remain selectable here.</p>${zones.map(zone=>`<button class="cp-zone-list-item ${zone.id===zoneFocus?'active':''}" type="button" data-zone="${esc(zone.id)}" aria-pressed="${zone.id===zoneFocus}"><span class="cp-zone-list-mark" aria-hidden="true">${zone.owning_guild_id?'▨':'◇'}</span><span><b>${esc(zone.name)}</b><small>${esc(ownerName(zone))}</small></span></button>`).join('')}</div>`:'';
    const details=focused?`<section class="cp-panel cp-zone-details"><div class="cp-panel-head"><div><p class="cp-kicker">SELECTED ZONE</p><h2>${esc(focused.name)}</h2></div><button class="cp-secondary" id="cp-clear-zone" type="button">Close</button></div><p class="cp-sub">${esc(focused.description||'No description provided.')}</p><p class="cp-sub">Owner: ${esc(ownerName(focused))}</p><p class="cp-sub">Topic affinity: ${esc(Object.keys(focused.topic_affinity??{}).join(', ')||'Not specified')}</p>${focused.scores?Object.entries(focused.scores).map(([id,score])=>`<div class="cp-score"><span>${esc(guilds.find(item=>item.id===id)?.name??`Guild ${id.slice(0,8)}`)}</span><b>${esc(score)}</b></div>`).join(''):'<p class="cp-empty">No score breakdown is available.</p>'}</section>`:'';
    return `<div class="cp-heading"><div><p class="cp-kicker">GUILD FRONTIER</p><h1>Territory</h1><p class="cp-sub">Zone ownership and standings from the latest territory data.</p></div><button class="cp-secondary" id="cp-refresh-zones" type="button" ${busy?'disabled':''}>${busy?'Refreshing…':'↻ Refresh'}</button></div>${details}<section class="cp-panel cp-map-panel"><div class="cp-panel-head"><div><p class="cp-kicker">THE FRONTIER</p><h2>Territory map</h2></div><span>${zones.length} ZONES</span></div>${map}${zoneList}</section>`;
  }
  function warView(){if(!guild)return `<div class="cp-heading"><div><p class="cp-kicker">GUILD INTELLIGENCE</p><h1>War room</h1><p class="cp-sub">Territory scores and member strengths for your guild.</p></div></div><section class="cp-panel"><p class="cp-empty">Join or create a guild to view its war-room data.</p></section>`;if(!warRoom)return `<section class="cp-panel"><p class="cp-empty">War-room information is unavailable right now.</p></section>`;return `<div class="cp-heading"><div><p class="cp-kicker">GUILD INTELLIGENCE</p><h1>War room</h1><p class="cp-sub">Read-only territory standings and member strengths.</p></div></div><section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">CONTESTED FRONTIER</p><h2>Zone standings</h2></div></div>${warRoom.contested_zones.length?warRoom.contested_zones.map(z=>`<div class="cp-war-zone"><div><b>${esc(z.zone_name)}</b><small>Leader ${esc(z.leading_guild)} · ${esc(z.gap_pct)}% gap · Affinity ${esc(Array.isArray(z.top_affinity_topics)?z.top_affinity_topics.join(', '):'—')}</small></div><span>${esc(z.our_score)} / ${esc(z.leading_score)}</span></div>`).join(''):'<p class="cp-empty">No contested zones are reported.</p>'}</section><section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">GUILD STRENGTH</p><h2>Member roster</h2></div></div>${warRoom.members.map(m=>`<div class="cp-war-member"><b>${esc(m.username)}</b><span>${esc(m.role)} · ${esc(m.league_tier)}</span><strong>${esc(m.defense_rating)} rating</strong><small>${esc(Object.entries(m.topic_levels||{}).map(([k,v])=>`${k} ${v}`).join(' · ')||'No topic levels')}</small></div>`).join('')||'<p class="cp-empty">No member details available.</p>'}</section>`;}
  function leagueView(){return `<div class="cp-heading"><div><p class="cp-kicker">SEASONAL STANDINGS</p><h1>League</h1><p class="cp-sub">Trophies earned through village competition.</p></div><div class="cp-rating"><span>YOUR TIER</span><b>${esc(league?.league_tier??'—')}</b></div></div>${league?`<div class="cp-stat-grid"><article class="cp-stat"><small>TROPHIES</small><strong>${league.trophy_count}</strong><span>current balance</span></article><article class="cp-stat"><small>RANK</small><strong>#${league.rank}</strong><span>${leagueScope} standing</span></article><article class="cp-stat"><small>SEASON</small><strong>${esc(season?.season_name??'—')}</strong><span>${season?`Week ${season.current_week}`:'No season details'}</span></article></div>${league.progress_pct!=null?`<section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">NEXT TIER</p><h2>${esc(league.next_tier??'Progress')}</h2></div><span>${Math.round(league.progress_pct)}%</span></div><div class="cp-progress cp-large"><i style="width:${Math.max(0,Math.min(100,league.progress_pct))}%"></i></div>${league.next_tier_threshold!=null?`<p class="cp-sub">Next threshold: ${league.next_tier_threshold} trophies</p>`:''}</section>`:''}`:'<section class="cp-panel"><p class="cp-empty">League profile is not available yet.</p></section>'}<section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">LEADERBOARD</p><h2>${leagueScope==='global'?'Global':'Guild'} standings</h2></div><div class="cp-switch"><button class="${leagueScope==='global'?'active':''}" data-scope="global">Global</button><button class="${leagueScope==='guild'?'active':''}" data-scope="guild" ${!guild?'disabled':''}>Guild</button></div></div>${leaderboard.length?leaderboard.map(x=>`<div class="cp-rank-row"><b>#${esc(x.rank)}</b><span>${esc(x.username)}</span><small>${esc(x.league_tier)}</small><strong>${esc(x.trophy_count)} ✦</strong></div>`).join(''):'<p class="cp-empty">No leaderboard entries available.</p>'}</section><section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">TROPHY HISTORY</p><h2>Recent changes</h2></div></div>${trophies.length?trophies.map(t=>`<div class="cp-ledger"><span>${esc(t.event_type.replaceAll('_',' '))}</span><b class="${t.delta<0?'negative':''}">${t.delta>0?'+':''}${t.delta}</b><small>${new Date(t.created_at).toLocaleDateString()}</small></div>`).join(''):'<p class="cp-empty">No trophy history yet.</p>'}</section>`;}
  function economyView(){const owned=new Set(inventory?.items.map(x=>x.item.id)??[]);const equippedIds=new Set(inventory?.equipped.map(x=>x.catalog_item_id)??[]);const palette=(ref:string)=>ref==='original:pine-dusk'?{name:'Pine Dusk',className:'pine'}:ref==='original:amber-paths'?{name:'Amber Paths',className:'amber'}:null;return `<div class="cp-heading"><div><p class="cp-kicker">VILLAGE FINERY</p><h1>Economy</h1><p class="cp-sub">Spend earned currency on available items.</p></div></div><div class="cp-stat-grid"><article class="cp-stat"><small>COINS</small><strong>${wallet?.coins??'—'}</strong><span>available balance</span></article><article class="cp-stat"><small>GEMS</small><strong>${wallet?.gems??'—'}</strong><span>available balance</span></article><article class="cp-stat"><small>REWARDED SOLVES</small><strong>${wallet?.rewarded_solves??'—'}</strong><span>credited by sync</span></article></div><section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">THE TRADING POST</p><h2>Catalog</h2></div></div>${catalog.length?`<div class="cp-zone-grid">${catalog.map(item=>{const isSkin=item.slot==='village-skin';const ownedItem=inventory?.items.find(entry=>entry.item.id===item.id);const active=owned.has(item.id)&&equippedIds.has(item.id);const look=palette(item.asset_ref);return `<article class="cp-shop-item"><span class="cp-shop-sigil">✧</span><b>${esc(item.display_name)}</b><small>${esc(item.slot)} · ${esc(item.sku)}</small><p>${item.coin_price?`◈ ${item.coin_price} coins`:''}${item.coin_price&&item.gem_price?' · ':''}${item.gem_price?`✦ ${item.gem_price} gems`:''}</p>${isSkin?`<div class="cp-skin-preview ${look?`cp-skin-preview--${look.className}`:'cp-skin-preview--unknown'}" role="img" aria-label="${look?`${look.name} village palette preview`:'Palette preview unavailable'}"></div><small>${look?`${look.name} · colors the village terrain only.`:'This palette reference is not available; the default village appearance will be kept.'}</small>`:''}${ownedItem?active?'<span class="cp-owned">EQUIPPED IN VILLAGE</span>':`<button class="cp-secondary" data-equip="${esc(item.slot)}" data-inventory="${esc(ownedItem.inventory_id)}" ${busy?'disabled':''}>${isSkin?'Equip palette':'Equip'}</button>`:`<button class="cp-primary" data-buy="${esc(item.id)}" ${busy?'disabled':''}>Purchase</button>${isSkin?'<small class="cp-skin-note">Purchase adds it to your inventory; equip it to apply.</small>':''}`}</article>`;}).join('')}</div>`:'<p class="cp-empty">The catalog has no items available.</p>'}</section><section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">YOUR COLLECTION</p><h2>Inventory & equipment</h2></div></div>${inventory?.items.length?inventory.items.map(entry=>{const active=inventory.equipped.some(eq=>eq.inventory_id===entry.inventory_id);const isSkin=entry.item.slot==='village-skin';return `<div class="cp-target"><div class="cp-target-name"><b>${esc(entry.item.display_name)}</b><small>${esc(entry.item.slot)} · acquired ${new Date(entry.purchased_at).toLocaleDateString()}${active?' · Equipped':''}</small></div><button class="cp-secondary" data-equip="${esc(entry.item.slot)}" data-inventory="${active?'':esc(entry.inventory_id)}" ${busy?'disabled':''}>${active?(isSkin?'Unequip palette':'Unequip'):(isSkin?'Equip palette':'Equip')}</button></div>`;}).join(''):'<p class="cp-empty">Your inventory is empty. Purchased items appear here.</p>'}</section><section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">COIN HISTORY</p><h2>Recent rewards</h2></div></div>${economyLedger.length?economyLedger.map(x=>`<div class="cp-ledger"><span>Solve reward · #${esc(x.solve_ordinal)}</span><b>+${esc(x.coin_delta)} ◈${x.gem_delta?` · +${esc(x.gem_delta)} ✦`:''}</b><small>${new Date(x.created_at).toLocaleDateString()}</small></div>`).join(''):'<p class="cp-empty">No economy ledger entries yet.</p>'}</section>`;}
  function noticeView(){return `<div class="cp-heading"><div><p class="cp-kicker">FIELD DISPATCHES</p><h1>Notifications</h1><p class="cp-sub">Recent updates from your village and the frontier.</p></div><span class="cp-rating">${unread} UNREAD</span></div><section class="cp-panel">${notices.length?notices.map(n=>`<article class="cp-notice-row ${n.is_read?'read':''}"><div class="cp-notice-icon">${n.is_read?'·':'!'}</div><div><b>${esc(n.event_type.replaceAll('_',' '))}</b><small>${new Date(n.created_at).toLocaleString()}</small>${n.payload?`<p>${esc(Object.entries(n.payload).map(([k,v])=>`${k.replaceAll('_',' ')}: ${typeof v==='string'?v:JSON.stringify(v)}`).join(' · '))}</p>`:''}</div>${n.is_read?'':'<button class="cp-secondary" data-read="'+esc(n.id)+'">Mark read</button>'}</article>`).join(''):'<p class="cp-empty">You have no notifications yet.</p>'}</section>`;}
  function adminView(){if(!user?.is_admin)return '<section class="cp-panel"><p class="cp-empty">Administrative access is required.</p></section>';const sections:[typeof adminSection,string][]=[['balance','Game balance'],['users','User moderation'],['audit','Audit log']];return `<div class="cp-heading"><div><p class="cp-kicker">RESTRICTED COMMAND</p><h1>Administration</h1><p class="cp-sub">Balance controls, account moderation, and recorded actions.</p></div><span class="cp-admin-badge">ADMIN</span></div><nav class="cp-admin-tabs" aria-label="Admin sections">${sections.map(([id,label])=>`<button data-admin-section="${id}" class="${adminSection===id?'active':''}" aria-current="${adminSection===id?'page':'false'}">${label}</button>`).join('')}</nav>${adminSection==='balance'?`<section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">GAME BALANCE</p><h2>Configuration</h2></div><button class="cp-secondary" id="cp-admin-refresh">Refresh</button></div>${adminConfig.length?adminConfig.map(entry=>{const type=entry.value_type;const isObject=type==='dict';const inputType=type==='int'||type==='float'?'number':'text';const step=type==='int'?'1':type==='float'?'any':undefined;const value=isObject?JSON.stringify(entry.value,null,2):String(entry.value);return `<form class="cp-config-row" data-config-form="${esc(entry.key)}"><div class="cp-config-copy"><b>${esc(entry.key)}</b><small>${esc(entry.description||'No description provided.')}</small><span>${esc(type)} · updated ${new Date(entry.updated_at).toLocaleString()}</span></div><label class="cp-config-value">${isObject?'JSON value':type==='int'||type==='float'?'Value':'Text value'}${isObject?`<textarea name="value" rows="4" required>${esc(value)}</textarea>`:`<input name="value" type="${inputType}" ${step?`step="${step}"`:''} value="${esc(value)}" required>`}</label><button class="cp-primary" type="submit">Save</button></form>`;}).join(''):'<p class="cp-empty">No balance keys are available.</p>'}</section>`:adminSection==='users'?`<section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">ACCOUNT SAFETY</p><h2>Find an account</h2></div><button class="cp-secondary" id="cp-admin-refresh">Refresh</button></div><form class="cp-admin-search" id="cp-admin-search"><label>Username or email<input name="search" value="${esc(adminSearch)}" placeholder="Search accounts" required></label><label>Account state<select name="suspended"><option value="">All accounts</option><option value="false" ${adminSuspendedFilter===false?'selected':''}>Active</option><option value="true" ${adminSuspendedFilter===true?'selected':''}>Suspended</option></select></label><button class="cp-primary">Search</button></form>${adminUsers.length?adminUsers.map(account=>`<article class="cp-admin-user"><div class="cp-admin-user-copy"><b>${esc(account.username)}${account.is_admin?'<span class="cp-admin-badge">ADMIN</span>':''}</b><small>${esc(account.email)}</small><small>Joined ${new Date(account.created_at).toLocaleDateString()} · ${account.is_suspended?'Suspended':'Active'}</small></div>${account.id===user?.id||account.is_admin?'<span class="cp-admin-protected">Protected</span>':account.is_suspended?`<button class="cp-secondary" data-unsuspend="${esc(account.id)}">Unsuspend</button>`:`<button class="cp-danger" data-suspend="${esc(account.id)}">Suspend</button>`}${suspendFormUserId===account.id?`<form class="cp-suspend-form" data-suspend-form="${esc(account.id)}"><label>Reason <textarea name="reason" rows="2" maxlength="500" required placeholder="Explain why this account should be suspended"></textarea></label><p>This action will be recorded in the admin audit log.</p><button class="cp-danger" type="submit">Continue to confirmation</button><button class="cp-text-button" type="button" data-cancel-suspend>Cancel</button></form>`:''}</article>`).join(''):'<p class="cp-empty">No accounts match this search.</p>'}</section>`:`<section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">ACCOUNTABILITY</p><h2>Recent admin actions</h2></div><button class="cp-secondary" id="cp-admin-refresh">Refresh</button></div>${adminAudit.length?adminAudit.map(entry=>`<article class="cp-audit-row"><div><b>${esc(entry.action.replaceAll('_',' '))}</b><small>${new Date(entry.created_at).toLocaleString()} · Admin ${esc(entry.admin_user_id.slice(0,8))}</small><small>${esc(entry.target_type||'Target')} · ${esc(entry.target_id||'—')}</small>${entry.details?`<pre>${esc(JSON.stringify(entry.details,null,2))}</pre>`:''}</div></article>`).join(''):'<p class="cp-empty">No administrative actions have been recorded.</p>'}</section>`}`;}
  function helpView(){return `<div class="cp-heading"><div><p class="cp-kicker">FIELD GUIDE</p><h1>Help & handbook</h1><p class="cp-sub">How CodeForge links verified solving to village growth and guild play.</p></div></div><section class="cp-panel"><p class="cp-kicker">THE SHORT VERSION</p><h2>Solve on Codeforces. Your verified history grows the village.</h2><p class="cp-sub">CodeForge does not host problem statements or submit code. Your linked Codeforces profile is the source of solve evidence; the server imports accepted results and applies topic progress.</p><button class="cp-primary" data-help-tab="village">Open village and sync</button></section><section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">GET STARTED</p><h2>Link, prove, import</h2></div></div><ol class="cp-help-steps"><li><b>Link your Codeforces handle</b><span>Add the one-time proof token to the profile’s First Name field, then verify it here. Only a verified handle can affect progress.</span></li><li><b>Request history import</b><span>Imports run in pages and may take time. Manual requests are limited to one every five minutes per account. Retry does not duplicate credited solves.</span></li><li><b>Watch topics grow</b><span>Accepted, verified problems map to supported topics. Earned topic levels shape building appearance; purchased outpost tiers are displayed separately.</span></li></ol><button class="cp-secondary" data-help-tab="village">Open Codeforces linking</button></section><section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">GUILD HANDBOOK</p><h2>Shared frontier</h2></div></div><div class="cp-help-grid"><article><b>Join a guild</b><p class="cp-sub">Browse or create a guild from the Guild Hall. A solver belongs to one guild at a time. Join requests wait for a Leader or Officer.</p><button class="cp-secondary" data-help-tab="guild">Open Guild Hall</button></article><article><b>Leadership</b><p class="cp-sub">Leaders can approve or reject requests, manage members, and transfer leadership to an existing member. The former leader can then leave.</p></article><article><b>Territory & War Room</b><p class="cp-sub">The War Map shows server-recorded zone owners and scores. Leaders and Officers can review member strengths and contested-zone alignment.</p><button class="cp-secondary" data-help-tab="territory">Open War Map</button></article></div></section><section class="cp-panel"><div class="cp-panel-head"><div><p class="cp-kicker">COMMON QUESTIONS</p><h2>Rules at a glance</h2></div></div><details class="cp-help-faq"><summary>Which judges are supported?</summary><p>Codeforces is the supported judge for this release. Other providers are not available for linking or sync.</p></details><details class="cp-help-faq"><summary>What happens when an import fails?</summary><p>Previously imported history and progress remain. Check status and use Retry when offered; a service interruption may delay new rows.</p></details><details class="cp-help-faq"><summary>How do attacks work?</summary><p>Attacks use curated Codeforces problems and require server-verified solve evidence. Results remain pending while proof is checked.</p><button class="cp-secondary" data-help-tab="attacks">Open attacks</button></details><details class="cp-help-faq"><summary>Who can view the War Room?</summary><p>Only guild Leaders and Officers can read their guild’s War Room. The backend enforces this permission.</p><button class="cp-secondary" data-help-tab="war">Open War Room</button></details></section>`;}
  let economyLedger: Awaited<ReturnType<typeof villageApi.ledger>>['items'] = [];
  async function loadTab(t:Tab){
    if(t==='admin'&&!user?.is_admin){tab='village';render();return;}
    // Rapid tab switches can land out of order: only the newest request may write state (see docs/UI_UX_AUDIT.md M5).
    const generation=++loadTabGeneration;
    error='';busy=true;render();
    try{
      if(t==='attacks'){const[nextTargets,nextActive,nextCooldown]=await Promise.all([attacksApi.targets(),attacksApi.active(),attacksApi.cooldown()]);if(generation!==loadTabGeneration)return;targets=nextTargets;active=nextActive;cooldown=nextCooldown;}
      else if(t==='guild'){const[nextGuild,nextGuilds]=await Promise.all([guildApi.me(),guildApi.list()]);const nextRequests=nextGuild&&(nextGuild.memberships.some(m=>m.user_id===user?.id&&['leader','officer'].includes(m.role)))?await guildApi.joinRequests(nextGuild.id):[];if(generation!==loadTabGeneration)return;guild=nextGuild;guilds=nextGuilds;joinRequests=nextRequests;}
      else if(t==='territory'){const[nextZones,nextGuilds,nextGuild]=await Promise.all([guildApi.territories(),guildApi.list(),guildApi.me()]);if(generation!==loadTabGeneration)return;zones=nextZones;guilds=nextGuilds;guild=nextGuild;}
      else if(t==='war'){
        warRoomError='';warRoom=null;
        const nextGuild=await guildApi.me();
        let nextWarRoom:Awaited<ReturnType<typeof guildApi.warRoom>>|null=null;
        if(nextGuild){try{nextWarRoom=await guildApi.warRoom(nextGuild.id);}catch(e){if(Number((e as {status?:unknown}).status)===403)warRoomError='War-room member strengths are available to guild leaders and officers only.';else throw e;}}
        if(generation!==loadTabGeneration)return;
        guild=nextGuild;warRoom=nextWarRoom;
      }
      else if(t==='league'){const[nextLeague,nextSeason,nextLeaderboard,nextTrophies]=await Promise.all([leagueApi.me(),leagueApi.season(),leagueApi.leaderboard(leagueScope),leagueApi.ledger()]);if(generation!==loadTabGeneration)return;league=nextLeague;season=nextSeason;leaderboard=nextLeaderboard;trophies=nextTrophies;}
      else if(t==='economy'){const[nextCatalog,nextInventory,nextLedger,nextWallet]=await Promise.all([villageApi.catalog(),villageApi.inventory(),villageApi.ledger().then(x=>x.items),villageApi.wallet()]);if(generation!==loadTabGeneration)return;catalog=nextCatalog;inventory=nextInventory;economyLedger=nextLedger;wallet=nextWallet;}
      else if(t==='notices'){const[nextNotices,nextUnread]=await Promise.all([notificationsApi.history(),notificationsApi.unreadCount().then(x=>x.unread_count)]);if(generation!==loadTabGeneration)return;notices=nextNotices;unread=nextUnread;}
      else if(t==='admin'){const[nextConfig,nextUsers,nextAudit]=await Promise.all([adminApi.listConfig(),adminApi.listUsers(),adminApi.auditLog()]);if(generation!==loadTabGeneration)return;adminConfig=nextConfig;adminUsers=nextUsers;adminAudit=nextAudit;}
    }catch(e){if(generation===loadTabGeneration)error=message(e);}
    if(generation!==loadTabGeneration)return;
    busy=false;render();
  }
  async function logout(){busy=true;error='';render();try{await authApi.logout(getRefreshToken()??undefined);clearUser();}catch(e){busy=false;error=`Sign out could not reach the server: ${message(e)}`;render();if(window.confirm('The server could not end this session. Sign out on this device only?')){clearUser();}}}
  function clearUser(){stopRealtime?.();stopRealtime=undefined;syncRealtimeUnsubscribe?.();syncRealtimeUnsubscribe=undefined;if(syncPollTimer){clearInterval(syncPollTimer);syncPollTimer=undefined;}if(attackPollTimer){clearInterval(attackPollTimer);attackPollTimer=undefined;}cpVillageStore.stop();user=null;profile=null;wallet=null;accounts=[];sync=[];targets=[];active=[];guilds=[];guild=null;joinRequests=[];zones=[];warRoom=null;league=null;season=null;leaderboard=[];trophies=[];catalog=[];inventory={items:[],equipped:[]};inventoryLoaded=false;economyLedger=[];notices=[];unread=0;leagueScope='global';zoneFocus='';cooldown=null;adminConfig=[];adminUsers=[];adminAudit=[];adminSection='balance';adminSearch='';adminSuspendedFilter=undefined;suspendFormUserId=null;selected=null;pendingToken='';notice='';error='';syncNotice='';syncError='';syncRequested=false;syncRefreshBusy=false;attackError='';attackRefreshBusy=false;notificationRefreshBusy=false;warRoomError='';tab='village';noticeAction=null;selectedTopicId=null;villageLoading=true;registering=false;busy=false;clearTokens();render();}
  async function loadAttacks(){error='';busy=true;render();try{[targets,active,cooldown]=await Promise.all([attacksApi.targets(),attacksApi.active(),attacksApi.cooldown()]);manageAttackPolling();}catch(e){error=message(e);}busy=false;render();}
  function bindVillage(){root.querySelector<HTMLFormElement>('.cp-link-panel form')?.addEventListener('submit',e=>{e.preventDefault();const handle=String(new FormData(e.currentTarget as HTMLFormElement).get('handle')).trim();void run(async()=>{const result=await authApi.linkCodeforces(handle);pendingToken=result.verification_token;accounts=[...accounts.filter(a=>a.id!==result.judge_account.id),result.judge_account];},'Handle linked. Add the token to the First Name field of your Codeforces profile, then verify.');});root.querySelector('#cp-verify')?.addEventListener('click',()=>{const pending=accounts.find(a=>a.judge_type==='codeforces'&&!a.verified_flag);if(pending)void run(async()=>{await authApi.verifyJudge(pending.id);pendingToken='';},'Codeforces profile verified.');});root.querySelector('#cp-sync')?.addEventListener('click',()=>void queueSync());root.querySelectorAll('[data-sync-retry]').forEach(button=>button.addEventListener('click',()=>void queueSync()));root.querySelector('#cp-sync-refresh')?.addEventListener('click',()=>void refreshSyncOverview());}
  async function queueSync(){busy=true;syncError='';syncNotice='';render();let accepted=false;try{const queued=await villageApi.sync();accepted=true;syncRequested=true;syncNotice=queued.status==='queued'?'Import request accepted and queued. Rows will appear gradually as history pages are processed.':'Sync request accepted.';await refreshSyncOverview();manageSyncPolling();[targets,active,cooldown]=await Promise.all([attacksApi.targets(),attacksApi.active(),attacksApi.cooldown()]);}catch(e){if(!accepted)syncRequested=false;syncError=message(e);}finally{busy=false;render();}}
  function bindGuild(){
    root.querySelector<HTMLFormElement>('#cp-transfer-leadership')?.addEventListener('submit',event=>{event.preventDefault();if(!guild||!user)return;const targetId=String(new FormData(event.currentTarget as HTMLFormElement).get('successor')||'');const successor=guild.memberships.find(member=>member.user_id===targetId);if(!successor)return;if(!window.confirm(`Make ${successor.username} the guild leader? You will remain a guild member and can leave afterward.`))return;const id=guild.id;void run(async()=>{await guildApi.transferLeadership(id,targetId);[guild,guilds]=await Promise.all([guildApi.detail(id),guildApi.list()]);},`Leadership transferred to ${successor.username}. You can now leave the guild.`);});
    root.querySelector<HTMLFormElement>('#cp-create-guild')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget as HTMLFormElement);void run(async()=>{await guildApi.create(String(f.get('name')).trim(),String(f.get('description')||'').trim()||undefined);[guild,guilds]=await Promise.all([guildApi.me(),guildApi.list()]);},'Guild created.');});
    root.querySelectorAll<HTMLElement>('[data-join]').forEach(b=>b.addEventListener('click',()=>void run(async()=>{await guildApi.requestJoin(b.dataset.join!);guilds=await guildApi.list();},'Join request sent.')));
    root.querySelector('#cp-leave-guild')?.addEventListener('click',()=>{if(guild&&window.confirm(`Leave ${guild.name}?`)){const id=guild.id;void run(async()=>{await guildApi.leave(id);guild=null;joinRequests=[];},'You left the guild.');}});
    root.querySelectorAll<HTMLElement>('[data-approve]').forEach(b=>b.addEventListener('click',()=>{if(!guild)return;const id=guild.id;void run(async()=>{await guildApi.approveJoin(id,b.dataset.approve!);joinRequests=await guildApi.joinRequests(id);guild=await guildApi.detail(id);},'Request approved.');}));
    root.querySelectorAll<HTMLElement>('[data-reject]').forEach(b=>b.addEventListener('click',()=>{if(!guild)return;const id=guild.id;void run(async()=>{await guildApi.rejectJoin(id,b.dataset.reject!);joinRequests=await guildApi.joinRequests(id);},'Request declined.');}));
    root.querySelectorAll<HTMLElement>('[data-remove-member]').forEach(b=>b.addEventListener('click',()=>{if(!guild)return;const id=guild.id;void run(async()=>{await guildApi.removeMember(id,b.dataset.removeMember!);guild=await guildApi.detail(id);},'Member removed.');}));
  }
  function bindTerritory(){const selectZone=(id:string)=>{zoneFocus=id;render();};root.querySelector('#cp-refresh-zones')?.addEventListener('click',()=>void loadTab('territory'));root.querySelectorAll<HTMLElement>('[data-map-zone]').forEach(control=>{control.addEventListener('click',()=>selectZone(control.dataset.mapZone!));control.addEventListener('keydown',event=>{const key=(event as KeyboardEvent).key;if(key!=='Enter'&&key!==' ')return;event.preventDefault();selectZone(control.dataset.mapZone!);});});root.querySelectorAll<HTMLButtonElement>('[data-zone]').forEach(button=>button.addEventListener('click',()=>selectZone(button.dataset.zone!)));root.querySelector('#cp-clear-zone')?.addEventListener('click',()=>{zoneFocus='';render();});}
  function bindLeague(){root.querySelectorAll<HTMLElement>('[data-scope]').forEach(b=>b.addEventListener('click',()=>{leagueScope=b.dataset.scope as 'global'|'guild';void loadTab('league');}));}
  function bindEconomy(){root.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach(b=>b.addEventListener('click',()=>{if(b.disabled||catalog.find(item=>item.id===b.dataset.buy)?.slot==='village-skin')return;void run(async()=>{await villageApi.purchase(b.dataset.buy!,globalThis.crypto?.randomUUID?.() ?? `purchase-${Date.now()}-${Math.random().toString(36).slice(2)}`);[wallet,inventory]=await Promise.all([villageApi.wallet(),villageApi.inventory()]);},'Purchase complete.');}));root.querySelectorAll<HTMLButtonElement>('[data-equip]').forEach(b=>b.addEventListener('click',()=>{if(b.disabled||catalog.find(item=>item.id===b.dataset.equip)?.slot==='village-skin')return;void run(async()=>{await villageApi.equip(b.dataset.equip!,b.dataset.inventory||null);inventory=await villageApi.inventory();},b.dataset.inventory?'Cosmetic equipped.':'Cosmetic unequipped.');}));}
  function bindNotices(){root.querySelectorAll<HTMLElement>('[data-read]').forEach(b=>b.addEventListener('click',()=>void run(async()=>{await notificationsApi.markRead(b.dataset.read!);[notices,unread]=await Promise.all([notificationsApi.history(),notificationsApi.unreadCount().then(x=>x.unread_count)]);},'Notification marked read.')));}
  function bindHelp(){root.querySelectorAll<HTMLButtonElement>('[data-help-tab]').forEach(button=>button.addEventListener('click',()=>{tab=button.dataset.helpTab as Tab;void loadTab(tab);}));}
  function bindAdmin(){
    if(!user?.is_admin)return;
    root.querySelectorAll<HTMLElement>('[data-admin-section]').forEach(b=>b.addEventListener('click',()=>{adminSection=b.dataset.adminSection as typeof adminSection;void loadTab('admin');}));
    root.querySelector('#cp-admin-refresh')?.addEventListener('click',()=>void loadTab('admin'));
    root.querySelectorAll<HTMLFormElement>('[data-config-form]').forEach(form=>form.addEventListener('submit',event=>{
      event.preventDefault();const key=form.dataset.configForm!;const entry=adminConfig.find(item=>item.key===key);if(!entry)return;
      const raw=String(new FormData(form).get('value')??'');let value:AdminConfigValue;
      try{
        if(entry.value_type==='str')value=raw;
        else if(entry.value_type==='int'){if(!/^-?\d+$/.test(raw))throw new Error('Enter a whole number.');value=Number(raw);if(!Number.isSafeInteger(value))throw new Error('Enter a finite whole number.');}
        else if(entry.value_type==='float'){value=Number(raw);if(!Number.isFinite(value))throw new Error('Enter a finite number.');}
        else if(entry.value_type==='dict'){const parsed:unknown=JSON.parse(raw);if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw new Error('Enter a JSON object.');value=parsed as {[key:string]: import('../types').AdminJsonValue};}
        else throw new Error(`Unsupported configuration type: ${entry.value_type}`);
      }catch(e){error=message(e);render();return;}
      void run(async()=>{await adminApi.updateConfig(key,value);[adminConfig,adminAudit]=await Promise.all([adminApi.listConfig(),adminApi.auditLog()]);},`Saved ${key}.`);
    }));
    root.querySelector<HTMLFormElement>('#cp-admin-search')?.addEventListener('submit',event=>{event.preventDefault();const values=new FormData(event.currentTarget as HTMLFormElement);adminSearch=String(values.get('search')||'').trim();const suspended=String(values.get('suspended')||'');adminSuspendedFilter=suspended===''?undefined:suspended==='true';void run(async()=>{adminUsers=await adminApi.listUsers({search:adminSearch,suspended:adminSuspendedFilter});});});
    root.querySelectorAll<HTMLElement>('[data-suspend]').forEach(button=>button.addEventListener('click',()=>{suspendFormUserId=button.dataset.suspend!;render();}));
    root.querySelectorAll<HTMLElement>('[data-cancel-suspend]').forEach(button=>button.addEventListener('click',()=>{suspendFormUserId=null;render();}));
    root.querySelectorAll<HTMLFormElement>('[data-suspend-form]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();const id=form.dataset.suspendForm!;const account=adminUsers.find(item=>item.id===id);const reason=String(new FormData(form).get('reason')||'').trim();if(!account||!reason)return;if(!window.confirm(`Suspend ${account.username}? This will prevent the user from accessing CodeForge. The reason will be recorded.`))return;suspendFormUserId=null;void run(async()=>{await adminApi.suspendUser(id,reason);[adminUsers,adminAudit]=await Promise.all([adminApi.listUsers({search:adminSearch,suspended:adminSuspendedFilter}),adminApi.auditLog()]);},`${account.username} was suspended.`);}));
    root.querySelectorAll<HTMLElement>('[data-unsuspend]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.unsuspend!;const account=adminUsers.find(item=>item.id===id);if(!account||!window.confirm(`Remove the suspension for ${account.username}?`))return;void run(async()=>{await adminApi.unsuspendUser(id);[adminUsers,adminAudit]=await Promise.all([adminApi.listUsers({search:adminSearch,suspended:adminSuspendedFilter}),adminApi.auditLog()]);},`${account.username} is active again.`);}));
  }
  function bindAttacks(){root.querySelector('#cp-refresh-targets')?.addEventListener('click',()=>void loadAttacks());root.querySelectorAll<HTMLElement>('[data-launch]').forEach(b=>b.addEventListener('click',()=>void run(async()=>{const attack=await attacksApi.launch(b.dataset.launch!);selected=await attacksApi.detail(attack.id);manageAttackPolling();[targets,active]=await Promise.all([attacksApi.targets(),attacksApi.active()]);},'Attack launched.')));root.querySelectorAll<HTMLElement>('[data-detail]').forEach(b=>b.addEventListener('click',()=>void run(async()=>{selected=await attacksApi.detail(b.dataset.detail!);attackError='';manageAttackPolling();},'Attack details loaded.')));root.querySelector('#cp-close-detail')?.addEventListener('click',()=>{selected=null;attackError='';manageAttackPolling();render();});root.querySelector('#cp-refresh-attack')?.addEventListener('click',()=>void refreshSelectedAttack());root.querySelector('#cp-resolve')?.addEventListener('click',()=>void resolveSelectedAttack(false));root.querySelector('#cp-abandon')?.addEventListener('click',()=>void resolveSelectedAttack(true));}
  async function resolveSelectedAttack(abandon:boolean){if(!selected||isAttackPending(selected)||busy)return;const id=selected.id;busy=true;attackError='';render();try{selected=await attacksApi.resolve(id,abandon);manageAttackPolling();notice=isAttackPending(selected)?'This attack is waiting for its final result.':'The attack result is ready.';active=await attacksApi.active();}catch(e){attackError=message(e);}finally{busy=false;render();}}
  const expired=()=>{clearUser();error='Your session ended. Sign in to continue.';render();};window.addEventListener('codeforge:auth-expired',expired);
  const syncOnResume=()=>{if(getAccessToken()&&accounts.length)void refreshSyncOverview();if(getAccessToken()&&isAttackPending(selected))void refreshSelectedAttack();if(getAccessToken()&&tab==='territory')void loadTab('territory');};window.addEventListener('online',syncOnResume);
  void authenticateExisting();
  const onVisibility=()=>{if(document.visibilityState==='visible')syncOnResume();};document.removeEventListener('visibilitychange',syncOnResume);document.addEventListener('visibilitychange',onVisibility);
   return ()=>{stopRealtime?.();syncRealtimeUnsubscribe?.();if(syncPollTimer)clearInterval(syncPollTimer);if(attackPollTimer)clearInterval(attackPollTimer);cpVillageStore.stop();storeUnsubscribe();window.removeEventListener('codeforge:topic-selected',topicSelected);window.removeEventListener('codeforge:village-state',villageUpdated);window.removeEventListener('codeforge:auth-expired',expired);window.removeEventListener('online',syncOnResume);document.removeEventListener('visibilitychange',onVisibility);root.remove();hiddenSiblings.forEach(({element,hidden})=>{element.hidden=hidden;});};
}
