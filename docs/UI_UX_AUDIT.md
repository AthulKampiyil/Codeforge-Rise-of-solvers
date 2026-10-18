# UI / UX Audit — CodeForge

Static audit of the CodeForge overlay (`src/cp/**`), the in-game HUD (`src/ui/**`) and `index.html` / CSS. Every entry was verified in source (file:line quoted).

**Status:** all 6 high-severity items (H1–H6) and all 14 medium items (M1–M14) are **fixed**; see the "Fixed in this pass" note under each. The 13 low items remain open — this is the remaining backlog.

**After the medium fixes**

- `npm run typecheck`, `npm run typecheck:tests` and the full `npm test` (15 files / 60 tests) pass.
- M9 also changed the backend (`backend/app/modules/m8_notifications/router.py`, verified with `pytest backend/tests/test_m8_realtime.py` — 12 passed) and a raw handshake against a rebuilt API: `Sec-WebSocket-Protocol: codeforge.bearer, <jwt>` answers `101` and negotiates `codeforge.bearer`, `?token=` still works, no token is rejected.
- **M9 requires the API image and the client to ship together:** the client no longer sends `?token=`, so an older API build would refuse the socket. Rebuild with `docker compose -p webcoc-codeforge -f docker-compose.codeforge.yml up --build -d api`.
- No browser pass has been run for the visual/runtime items (M2/M3/M4/M6/M7/M10); they are verified by source inspection and typecheck only.

**Baseline at audit time**

- `npm run typecheck` — pass
- `npm test -- tests/cp-client.test.ts tests/cp-village-boot.test.ts tests/cp-village-presentation.test.ts tests/cp-admin.test.ts` — pass (28 tests)
- Type-safety and unit tests do **not** catch anything below: all of it is runtime/visual/a11y.

**After the high-severity fixes:** `npm run typecheck`, `npm run typecheck:tests` and the full `npm test` (15 files / 60 tests) pass. `npm run test:docs` is broken independently of this work — it calls `scripts/check-doc-links.mjs`, which does not exist in the repo.

**Counts:** 6 high (fixed) · 14 medium (fixed) · 13 low.

---

## High — functional or data-losing

### H1. Double-click "Purchase" buys twice
`src/cp/ui/index.ts:131` · `src/cp/ui/index.ts:350` · `src/cp/ui/index.ts:328`

`run()` sets `busy=true` but never early-returns on `busy`, and the shop buttons are rendered without `disabled`:

```ts
async function run(fn, success?) { busy=true; error=''; render(); try { await fn(); … }
<button class="cp-primary" data-buy="${esc(item.id)}">   // no ${busy?'disabled':''}
```

Each click mints a fresh idempotency key (`crypto.randomUUID()`), so the second click is a second distinct purchase, not a retry.
**Fix:** `if (busy) return;` in `run()`, and render `data-buy`/`data-equip`/`data-launch` with `${busy?'disabled':''}`.

**Fixed in this pass:** `run()` now starts with `if(busy)return;`, and the shop/attack/guild action buttons (`data-buy`, `data-equip`, `data-launch`, `data-join`, `data-approve`, `data-reject`, `data-remove-member`, `#cp-verify`, `#cp-leave-guild`) render with `${busy?'disabled':''}`. The purchase idempotency key also falls back when `crypto.randomUUID` is missing, matching `src/cp/store.ts:316`.

### H2. Double-click "Launch attack" can start two attacks
`src/cp/ui/index.ts:301` · `src/cp/ui/index.ts:377`

```ts
<button class="cp-primary" data-launch="${esc(t.id)}" ${cooldown&&!cooldown.can_attack?'disabled':''}>Launch attack</button>
root.querySelectorAll('[data-launch]').forEach(b=>b.addEventListener('click',()=>void run(…attacksApi.launch…
```

Disabled only by cooldown, never by in-flight state, and `run()` has no re-entry guard — same root cause as H1.

**Fixed in this pass:** same `run()` guard, plus `data-launch` now disables while `busy`: `${busy||(cooldown&&!cooldown.can_attack)?'disabled':''}`.

### H3. A failed sign-in wipes the credentials the user typed
`src/cp/ui/index.ts:261`

The auth branch rebuilds `root.innerHTML` from scratch with value-less `<input>`s, and the submit error path calls `render()` again:

```ts
catch(e){busy=false;error=message(e);render();}
```

Every server error forces the user to retype email **and** password.
**Fix:** keep the draft values in module state and re-emit them as `value="…"` (or don't rebuild the form on error).

**Fixed in this pass:** `render()` snapshots text controls (`captureEditableFields()`) before replacing `root.innerHTML` and restores them on both exits (`restoreEditableFields()`), including the caret/selection and which field had focus. Restoring only fills fields that re-render empty, so app-rendered defaults are never clobbered.

### H4. Background refresh re-renders the whole UI and erases in-progress input
`src/cp/ui/index.ts:82-85` · `src/cp/store.ts:70` · `src/cp/store.ts:274`

```ts
const storeUnsubscribe = cpVillageStore.subscribe(snapshot => { … render(); });
this.publish({ …this.snapshot, loading: true, stale: true, error: null });   // refresh start
if ([…"VILLAGE_UPDATED"…].includes(event.event_type)) void this.refresh();   // realtime
```

Every publish replaces `root.innerHTML`, so text typed into the guild description, admin search or handle field silently disappears mid-keystroke (a realtime `VILLAGE_UPDATED` or a 25s sync poll is enough).
**Fix:** skip `render()` while an editable field has focus, or patch only the sections that changed.

**Fixed in this pass:** the same capture/restore pair now runs around every `render()`, so store publishes, realtime events and the 25s sync poll no longer drop in-progress text or the caret. (Still a full innerHTML rebuild, so scroll position and unbound transient state are not preserved — see M5 and L items.)

### H5. Proof-token instructions contradict each other — following one breaks verification
`src/cp/ui/index.ts:300` vs `src/cp/ui/index.ts:240` and `src/ui/codeforge-dialog.ts:47`

- Village panel: `Add this exact token to your Codeforces profile (bio or blog), then verify:`
- Onboarding + dialog: `Copy this proof token into the First Name field on your Codeforces profile…`

A user who follows the Village panel puts the token where the verifier never reads it.

**Fixed in this pass:** the Village panel now says `Add this exact token to the First Name field of your Codeforces profile, save it, then verify:`, and the link-success toast names the First Name field too.

### H6. `aria-modal="true"` dialog leaves the background fully reachable
`src/ui/hud.ts:1487` · `src/ui/hud.ts:2831-2834` · `src/ui/codeforge-dialog.ts:86-88`

```ts
openCodeForgeDialog(this.modalEl);              // does not set this.panel
this.scene.uiBlocked = !!this.panel || !!result; // → false
this.hudEl.inert = this.scene.uiBlocked;         // → not inert
```

`close()` only does `root.innerHTML=''`; there is no focus trap and no focus restore to the launcher, so Tab wanders behind the modal.

---

## Medium — broken affordance, layout or contrast

**Fixed in this pass:** `openCodeForgeDialog` now captures the launcher, sets `inert` on every sibling along the ancestor chain from `#modal-root` up to `<body>` (remembering prior values), traps Tab/Shift+Tab inside the dialog, focuses the first control on open, restores focus by descriptor across re-renders (plus the handle draft), and on `close()` restores the `inert` flags and returns focus to the launcher. The dialog's `run()` also gained a `busy` re-entry guard.

### M1. Hamburger, scrim and drawer-close are dead controls with live ARIA
`src/cp/ui/index.ts:292-294` · `src/cp/ui/ui.css:32-40`

`#cp-drawer-toggle` flips `drawerOpen` and `aria-expanded`, but the theme neutralizes the effect:

```css
#cp-ui .cp-main{position:relative;…;transform:none;opacity:1;pointer-events:auto}
#cp-ui .cp-scrim{display:none}
```

Screen readers announce a state change; nothing moves. Either wire the drawer (mobile needs it) or delete the button, scrim and `aria-expanded`.

**Fixed in this pass:** the ☰ toggle, the scrim and the panel × are gone, along with the `drawerOpen` state, its `{{`-style bindings and every `.cp-menu-toggle` / `.cp-scrim` / `.cp-main.open` CSS rule. `.cp-main` is a permanent column in both themes, so the active tab is now a no-op (`if(tab===next)return;`) and Escape no longer has a drawer to close. The background-refresh gates that read `drawerOpen` now re-render unconditionally.

### M2. Overlay layout uses `100vh` — mobile clips the bottom
`src/cp/ui/ui.css:29` · `src/cp/ui/ui.css:30` (override the `100dvh` at `:13`)

```css
#cp-ui{…min-height:100vh;…}
#cp-ui .cp-shell{position:relative;height:auto;min-height:100vh;…}
```

On mobile browsers `100vh` > visible viewport (URL bar), so the HUD page scrolls/clips. The rest of the file already uses `100dvh`.

**Fixed in this pass:** all three `100vh` declarations are `100dvh`.

### M3. Dark-theme colors kept on the light parchment theme (~1.5:1)
Light overrides (`src/cp/ui/ui.css:79-116`) repaint `.cp-main`, `.cp-panel`, inputs, buttons — but not these:

| Selector | Color | Where it lands |
|---|---|---|
| `.cp-form label` (`ui.css:9`) | `#c7c9b2` | "Guild name" / "Description" labels on light panel |
| `.cp-optional` (`ui.css:9`) | `#8e9a7d` | "(optional)" |
| `.cp-problem a` (`ui.css:5`) | `#e7c96f` | "Open problem ↗" links, no light override exists |
| `.cp-admin-tabs button` (`ui.css:18`) | `#b3bba0` | Admin tab labels on light background |
| `.cp-admin-search label` / `.cp-suspend-form label` (`ui.css:18`) | `#c3c8b1` | Form labels |
| `.cp-config-value` (`ui.css:18`) | `#bfc4aa` | Config keys |
| `.cp-admin-badge` (`ui.css:18`) | `#edcf79` | Badges |

**Fix:** add these to the light-theme block, or replace them with the `--field-ink` / `--field-ink-soft` tokens.

**Fixed in this pass:** a final light-theme override block (last in the file, so it wins ties) paints every selector in the table with `#cp-ui`-scoped colors: `.cp-form label`, `.cp-admin-search label`, `.cp-suspend-form label`, `.cp-optional`, `.cp-problem` + `.cp-problem a` (and its hover), `.cp-admin-tabs button` / `button.active`, `.cp-config-value`, `.cp-admin-badge`.

### M4. Help tab silently swallows every status banner
`src/cp/ui/index.ts:271`

```ts
if(tab==='help'){const helpMain=root.querySelector('.cp-main');if(helpMain)helpMain.innerHTML=helpView();}
```

`.cp-alert`, `.cp-notice` and `.cp-loading` render above the tab body, then Help replaces the whole `<main>` — errors, notices and "Updating your field…" can never appear on Help.

**Fixed in this pass:** Help renders from the same `<main>` template as every other tab (`…tab==='notices'?noticeView():tab==='help'?helpView():adminView()`), so the alert/notice/loading banners above it survive. The post-render replacement of `<main>` is gone — it was also the reason a non-admin briefly got admin markup on the Help tab.

### M5. Tab switches race — a slow earlier request can overwrite the current tab
`src/cp/ui/index.ts:333`

`loadTab` applies results unconditionally (`[targets,active,cooldown]=await Promise.all(…)`) with no request-generation token, so rapid nav lets a stale response write into the screen now showing.
**Fix:** bump a counter per call and drop responses whose counter is stale.

**Fixed in this pass:** `loadTab` takes `const generation=++loadTabGeneration` and every branch awaits into local `next*` bindings that are committed only after `generation===loadTabGeneration`; a stale response returns before `busy=false;render()`, so it can neither write into the tab now showing nor clear the spinner of a newer request.

### M6. Expired-session message is dead code — logout hard-reloads the page
`src/cp/ui/index.ts:335` · `src/cp/ui/index.ts:375`

`clearUser()` ends with `window.location.reload()`, so the `expired` handler's `error='Your session ended. Sign in to continue.';render();` is discarded, and a normal logout also full-reloads instead of showing the sign-in state.

**Fixed in this pass:** `clearUser()` now ends with `clearTokens();render();` instead of `window.location.reload()`, so sign-out lands on the sign-in state immediately and the `expired` handler's message is actually visible. The logout-failure confirm branch no longer clears tokens twice.

### M7. Incoming attack hijacks whatever the user was doing
`src/cp/ui/index.ts:103` · `src/cp/ui/index.ts:171-173`

```ts
if(event.event_type==='ATTACK_INCOMING'){ … void openAttackFromNotification(attackId); }
// openAttackFromNotification: tab='attacks';drawerOpen=true;…;busy=true;render();
```

Mid-typing in the guild form, the UI switches tabs and re-renders without consent.
**Fix:** show a non-blocking notice with an "Open" button instead of force-navigating.

**Fixed in this pass:** an incoming attack sets `notice='Incoming attack from another village.'` with `noticeAction={label:'Open attack', run:…}`, rendered as an action button inside the existing `.cp-notice`; the tab never changes on its own. The notice markup gained a `<span>` plus an optional `#cp-notice-action` button (with `#cp-ui` flex styles), and every place that sets a plain notice clears the stale action.

### M8. Realtime goes permanently dead after 10 retries
`src/cp/realtime.ts:55`

```ts
if (!this.enabled || this.reconnectTimer || !getAccessToken() || this.attempts >= 10) return;
```

Nothing ever re-calls `connect()`: `syncOnResume` only refreshes HTTP and `cpVillageStore.start()` early-returns on an unchanged session. After ~10 failures the user silently loses live updates for the rest of the session.

**Fixed in this pass:** `RealtimeClient.watchResume()` clears `attempts` and retries on `online` and on `visibilitychange`→visible (only when enabled, no live socket, no pending retry and a token is present), and `disconnect()` removes both listeners.

### M9. Access token sent in the WebSocket query string
`src/cp/realtime.ts:32`

```ts
url.search = new URLSearchParams({ token }).toString();
```

Tokens in URLs land in proxy/server access logs and browser network records. Prefer a `Sec-WebSocket-Protocol` value or the first-message auth pattern.

**Fixed in this pass:** the client connects with `new WebSocket(url, [WS_BEARER_SUBPROTOCOL, token])` and no longer puts the token in the query string; the backend reads it from the `Sec-WebSocket-Protocol` header, still accepts `?token=` for older clients, and accepts with the negotiated subprotocol. Verified against the rebuilt API: the header path gets `101 Switching Protocols` with `Sec-WebSocket-Protocol: codeforge.bearer`, the query path still connects, and a tokenless handshake is refused. Two backend tests cover the new paths (`backend/tests/test_m8_realtime.py`, 12 passed).

### M10. HUD modal focus trap omits `<select>` and `<textarea>`
`src/ui/hud.ts:2711`

```ts
dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href]')
```

The Campaign modal's region/section selects are focusable but excluded, so Tab escapes the dialog.

**Fixed in this pass:** the trap selects `button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])`, filters out zero-size elements with `getClientRects().length>0`, and wraps when `document.activeElement` is outside the dialog.

### M11. Topic-outpost edit toolbar (z-index 1200) floats over modals (z-index 20)
`src/ui/topic-outpost-toolbar.css:3` · `src/ui/hud.ts:1192` · `src/ui/hud.ts:1292`

The toolbar is `position:fixed; z-index:1200` and appended to `root`, while `.modal-backdrop` is `z-index:20` (`src/style.css:1041`). `show()` only calls `model.cancel()`, which does not exit edit mode, so opening Settings during topic editing leaves the toolbar visible **and clickable** on top of the dialog (it is also not inside the inert `hudEl`).

**Fixed in this pass:** the toolbar is `z-index: 19` — below `.modal-backdrop` (80) and below every transient surface (toast 30 and up).

### M12. Transient UI stacks above open dialogs
`src/style.css:146` (`#loading` 100) · `:1015` (`#toast` 30) · `:1027` (`#save-state` 50) · `:6083` (`#update-ready` 60) · `:6290` (`.skip-link` 70) · `:5195` (`.resource-flight` 150) — all over `.modal-backdrop` `:1041` (20).

Toasts, the save indicator and the service-worker prompt render over an open dialog.

**Fixed in this pass:** `.modal-backdrop` is `z-index: 80`, above `#toast` (30), `#save-state` (50) and `#update-ready` (60), still below `#loading` (100) and `.resource-flight` (150).

### M13. Raw technical errors shown to users
`src/cp/client.ts:9` · `src/cp/ui/index.ts:105`

```ts
super(typeof detail === "string" ? detail : `Request failed with status ${status}`);
function message(e) { … return typeof detail==='string'?detail:e instanceof Error?e.message:'…'; }
```

A non-string server error renders verbatim as `Request failed with status 500` in `role="alert"` UI.

**Fixed in this pass:** `ApiError` falls back to `statusMessage(status)` when the server sends no string detail, so 0/401/403/404/408/429/5xx and unknown codes read as sentences instead of `Request failed with status 500`. The network-error half was **deliberately dropped**: converting a fetch rejection to an `ApiError` hides the original message that the ambiguous-write retry path in `src/cp/store.ts` and `tests/cp-village-boot.test.ts` rely on.

### M14. `body.cp-mode` styles never activate
`src/cp/ui/ui.css:4` · `src/cp/ui/ui.css:13`

```css
body.cp-mode #ui{display:none!important}body.cp-mode #game{filter:saturate(.76) brightness(.72)}
```

No code anywhere adds the `cp-mode` class — the intended "hide the game HUD and dim the village behind the overlay" never happens, so both surfaces compete.

**Fixed in this pass:** the dead `body.cp-mode` rules are replaced by a comment — `mountCodeForgeUI` already hides every `body` sibling with `hidden`, and the game never boots under `?cp=1`.

---

## Low — polish, accessibility, robustness

| # | Issue | Location |
|---|---|---|
| L1 | `crypto.randomUUID()` used without the existing fallback — purchases throw on plain-HTTP LAN (insecure context) | `src/cp/ui/index.ts:350` vs the guard already in `src/cp/store.ts:316` |
| L2 | 6–8px text: `.cp-nav` 8px, mobile `.cp-stat small` / `.cp-wallet small` 7px, HUD labels 6px | `src/cp/ui/ui.css:13`, `ui.css:6`; `src/style.css:2242,2350,2464,4216`; `src/ui/compact-hud.css:123,220` |
| L3 | `document.title` is never updated — no per-view/tab title, bad for screen readers and history | `index.html:11` (no `document.title` writes in `src/`) |
| L4 | Context card positioned with `window.innerHeight` instead of `visualViewport` — lands under the mobile keyboard | `src/ui/hud.ts:1112-1116` |
| L5 | Native blocking `window.confirm` for destructive/leadership actions (unlink, transfer, leave, suspend) — unstyled, unlocalizable, inconsistent with app dialogs | `src/cp/ui/index.ts:256,340,343,372,373` |
| L6 | `button()` helper never emits `type="button"` — latent submit-on-click if these are ever wrapped in a form | `src/ui/hud.ts:355-356` |
| L7 | HUD modal backdrop is not click-to-dismiss while the CodeForge dialog is — inconsistent dismissal | `src/ui/hud.ts:4535` (handler at `:2844` only disables animation) vs `src/ui/codeforge-dialog.ts:82-84` |
| L8 | `aria-label` on a role-less `<div>` is ignored by AT | `index.html:22` (`<div id="game" aria-label=…>`) |
| L9 | `removeEventListener('visibilitychange', syncOnResume)` targets a handler never registered (`syncOnResume` is bound to `online`) — the real handler is `onVisibility` | `src/cp/ui/index.ts:379-381` |
| L10 | 1.2s `setInterval` polls `localStorage` via `getAccessToken()` twice a second for the page's whole lifetime — battery/CPU cost on mobile | `src/cp/main.ts:17` |
| L11 | Boot overlay has no `role`/`aria-live`; failure only swaps `#load-label` text — progress/failure never announced | `index.html:24-29`, `src/main.ts:311-314` |
| L12 | `aria-expanded` without `aria-controls` on the auth register toggle; "Village name" input has no `minlength`/`maxlength` (password has `minlength="8"`) | `src/cp/ui/index.ts:261` |
| L13 | Help tab / buttons `.cp-text-button`, `.cp-menu-toggle`, `.cp-user button` have transition but no `:hover`/`:active` style in the light theme | `src/cp/ui/ui.css:104-110`, `ui.css:107` |

---

## Suggested order

1. **H1/H2/H3/H4** — one pass over `run()` + form-state preservation fixes four user-visible data-loss/duplication bugs.
2. **H5** — one-line copy fix, currently blocks verification for anyone following the Village panel.
3. **M14 + M1/M2** — decide whether the overlay is a full-screen layer (activate `cp-mode`, fix `100dvh`, drop the dead drawer) or an in-HUD panel; the current code is half of each.
4. **M3** — contrast sweep of the light theme; cheap, large visual win.
5. **H6/M10/M11** — dialog focus and stacking pass.
6. **M5-M9, M12, M13** — behaviour/robustness.
7. **L1-L13** — polish; L11/L3 are worth doing with any a11y pass.

## Verified as *not* bugs (checked and cleared)

- `.cp-register-name{display:none!important}` **is** overridden when registering (`ui.css:17`) — registration is not broken.
- XSS: interpolations in `hud.ts`, `codeforge-dialog.ts` and `cp/ui/index.ts` pass through `html()` / `esc()`; `#toast` uses `textContent` (`src/ui/hud.ts:1130`).
- Focus/caret survive `render()` rebuilds via `focusMark`/`restoreFocusMark` (`src/ui/hud.ts:599-636`).
- `#loading` is removed after boot (`src/game/scene.ts:1189-1194`).
- `.modal` uses `max-width:100%` / `max-height:min(800px,100%)` with a flex-column body — the 780px modal does not overflow.
- `.cf-attack-panel` / `.cf-outpost-panel` are live, created by `mountCodeForgeAttacks()` with a MutationObserver (`src/ui/hud.ts:1226-1264`).
- Empty states are present for every CP list (`No guilds are available…`, `No attack targets…`, `No topic progress…`, `No global standings…`).
