import Phaser from 'phaser';
import './style.css';
import './ui/compact-hud.css';
import { GameModel } from './game/model';
import { VillageScene, prepareHomeArt } from './game/scene';
import { AudioManager } from './game/audio';
import { HUD } from './ui/hud';
import { configureDisplay, displaySize } from './game/display';
import { recordBootResources } from './offline';
import { decodeLoadedImages } from './game/image-decode';
import { watchSystemMotion } from './ui/motion';
import { Haptics } from './ui/haptics';
import { authApi } from './cp/api';
import { getAccessToken, getRefreshToken, onAuthExpired } from './cp/client';
import { cpVillageStore, type CPVillageSnapshot } from './cp/store';
import { CP_VILLAGE_TOPIC_SLOTS, mapVillageProfile } from './cp/village-presentation';
import type { User, Wallet } from './cp/types';
recordBootResources();
decodeLoadedImages();
/** A 1×1 fully transparent PNG. */
const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==';
async function boot() {
    if (new URLSearchParams(location.search).get('cp') === '1') {
      // Keep the loading screen up until the control panel has mounted, so the
      // gap between the two never shows as a blank page.
      const { mountCodeForgeWorkflows } = await import('./cp/main');
      mountCodeForgeWorkflows();
      document.querySelector('#loading')?.remove();
      return;
    }
    const redirectToControlPanel = () => {
      window.location.href = '/?cp=1&return=%2F';
    };
    let initialToken = getAccessToken();
    if (!initialToken) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        redirectToControlPanel();
        return;
      }
      try {
        const tokens = await authApi.refresh(refreshToken);
        if (getRefreshToken() !== tokens.refresh_token || getAccessToken() !== tokens.access_token) {
          redirectToControlPanel();
          return;
        }
        initialToken = tokens.access_token;
      } catch {
        redirectToControlPanel();
        return;
      }
    }
    if (!initialToken) {
      redirectToControlPanel();
      return;
    }
    let user: User;
    try {
      user = await authApi.me();
    } catch {
      if (!getAccessToken()) {
        redirectToControlPanel();
        return;
      }
      throw new Error('Your village could not connect to the server. Check your connection and try again.');
    }
    if (!sameSession(initialToken, getAccessToken())) {
      redirectToControlPanel();
      return;
    }
    const initialSnapshot = await cpVillageStore.start();
    if (!sameSession(initialToken, getAccessToken())) {
      redirectToControlPanel();
      return;
    }
    if (!validVillageSnapshot(initialSnapshot, user))
      throw new Error('Your village could not load from the server. Check your connection and try again.');
    let activeUser = user;
    const model = new GameModel(undefined, Date.now(), { serverReadOnly: true });
    model.setServerVillageSnapshot(
      initialSnapshot.village,
      serverEconomy(initialSnapshot.outposts?.wallet ?? initialSnapshot.wallet!, activeUser),
      initialSnapshot.outposts ?? null,
    );
    if (!model.applyTopicOutpostLayout(modelLayout(initialSnapshot)))
      throw new Error('Your village layout could not load from the server. Check your connection and try again.');
    let ownsSession = true;
    let refreshGeneration = 0;
    const clearServerProjection = () => {
      model.setServerVillageSnapshot(null, null, null);
    };
    const invalidateSession = () => {
      if (!ownsSession) return;
      ownsSession = false;
      refreshGeneration++;
      clearServerProjection();
      unsubscribeVillage();
      cpVillageStore.stop();
      redirectToControlPanel();
    };
    const applySnapshot = (snapshot: Readonly<CPVillageSnapshot>) => {
      if (!ownsSession) return;
      if (!sameSession(initialToken, getAccessToken())) {
        invalidateSession();
        return;
      }
      if (snapshot.village && snapshot.village.user_id !== activeUser.id) {
        invalidateSession();
        return;
      }
      if (!validVillageSnapshot(snapshot, activeUser)) {
        // Refresh/loading snapshots are not authoritative, but they must not reveal
        // the local starter village or erase an in-progress server layout draft.
        model.markServerSnapshotUnavailable();
        return;
      }
      model.setServerVillageSnapshot(
        snapshot.village,
        serverEconomy(snapshot.outposts?.wallet ?? snapshot.wallet!, activeUser),
        snapshot.outposts ?? null,
      );
      if (!model.applyTopicOutpostLayout(modelLayout(snapshot))) model.markServerSnapshotUnavailable();
    };
    const unsubscribeVillage = cpVillageStore.subscribe(applySnapshot);
    const releaseAuthExpired = onAuthExpired(() => {
      invalidateSession();
    });
    const audio = new AudioManager();
    audio.enabled = model.state.settings.sound;
    // Vibration for the player's own raid: replays (the first-run Goblin raid among them) stay
    // still, and victory buzzes only when the raid earned a star.
    const haptics = new Haptics();
    audio.feedback = (cue) => {
      if (model.replay || model.state.settings.haptics === false) return;
      if (cue === 'deploy' || cue === 'destroy') haptics.pulse(cue);
      else if (cue === 'victory' && (model.battle?.stars ?? 0) > 0) haptics.pulse(cue);
    };
    watchSystemMotion(model);
    document.addEventListener(
      'pointerdown',
      () => {
        audio.unlock();
        if (model.state.settings.music) audio.music(true);
      },
      { once: true },
    );
    // Graphs kept out of the startup bundle, for the families this village already owns.
    await prepareHomeArt(model.buildings);
    const scene = new VillageScene(model, audio);
    new HUD(model, scene, audio);
    const visitGuildHall = () => window.location.assign('/?cp=1&tab=guild&return=%2F');
    const guildHallButton = document.createElement('button');
    guildHallButton.type = 'button';
    guildHallButton.className = 'skip-link guild-hall-skip';
    guildHallButton.textContent = 'Visit Guild Hall';
    guildHallButton.setAttribute('aria-label', 'Visit Guild Hall');
    guildHallButton.addEventListener('click', visitGuildHall);
    document.querySelector('#ui')?.append(guildHallButton);
    window.addEventListener('codeforge:open-guild-hall', visitGuildHall);
    new Phaser.Game({
      type: Phaser.WEBGL,
      parent: 'game',
      backgroundColor: '#45623d',
      antialias: true,
      roundPixels: false,
      powerPreference: 'high-performance',
      scale: {
        mode: Phaser.Scale.NONE,
        ...displaySize(window.innerWidth, window.innerHeight, 1),
      },
      callbacks: { postBoot: configureDisplay },
      render: { pixelArt: false, antialias: true },
      input: { activePointers: 3 },
      // A long press on a phone (streaming troops, holding a building) fires contextmenu;
      // the canvas has no menu of its own to offer.
      disableContextMenu: true,
      scene: [scene],
      // Phaser held every frame to ~16 ms for 120 frames after boot, focus or a return to the page
      // (panicMax), and below 5 FPS swapped each frame's time for an old one (min). On a device
      // drawing a few frames a second, battles and the practice countdown then crawled for most
      // of a minute. Real frame times now reach the scene up to a second (longer ones, such as the
      // first frame back from a hidden tab, still get a sane substitute), and the scene caps how
      // far one frame advances the game.
      fps: { target: 60, smoothStep: true, min: 1, panicMax: 0 },
      // Phaser's stock placeholder for a texture that has not loaded (lazy art still in
      // flight, a failed fetch) is an opaque black square; draw nothing instead.
      images: { missing: TRANSPARENT_PIXEL },
      loader: {
        // Hundreds of boot images: let the browser fetch and decode them as plain images
        // instead of XHR → Blob → object URL → Image, which copies every file twice on the
        // main thread. Phaser caps Android at 6 parallel requests (an HTTP/1.1 heuristic);
        // the host serves HTTP/2, so the boot queue should not drain six files at a time.
        imageLoadType: 'HTMLImageElement',
        maxParallelDownloads: 32,
      },
    });
    window.addEventListener('pagehide', () => {
      audio.samples.stop();
      ownsSession = false;
      window.removeEventListener('codeforge:open-guild-hall', visitGuildHall);
      unsubscribeVillage();
      releaseAuthExpired();
      cpVillageStore.stop();
    });
    window.addEventListener('pageshow', (event) => {
      // A restored document must reacquire ownership and reload the latest state.
      if (event.persisted) window.location.reload();
    });
    document.addEventListener('visibilitychange', () => {
      if (!ownsSession) return;
      if (document.hidden) {
        audio.samples.stop();
        audio.music(false);
      } else {
        if (model.state.settings.music) audio.music(true);
        void refreshServerState();
      }
    });
    window.addEventListener('online', () => void refreshServerState());
    const refreshServerState = async () => {
      if (!ownsSession) return;
      if (!sameSession(initialToken, getAccessToken())) {
        invalidateSession();
        return;
      }
      const generation = ++refreshGeneration;
      try {
        const refreshedUser = await authApi.me();
        if (!ownsSession || generation !== refreshGeneration) return;
        if (!sameSession(initialToken, getAccessToken()) || refreshedUser.id !== activeUser.id) {
          invalidateSession();
          return;
        }
        activeUser = refreshedUser;
        const snapshot = await cpVillageStore.refresh();
        if (!ownsSession || generation !== refreshGeneration) return;
        if (!sameSession(initialToken, getAccessToken())) {
          invalidateSession();
          return;
        }
        applySnapshot(snapshot);
      } catch {
        // An unavailable/expired server session is never replaced by local game state.
        if (!ownsSession || generation !== refreshGeneration) return;
        model.markServerSnapshotUnavailable();
        if (!getAccessToken() || !sameSession(initialToken, getAccessToken())) invalidateSession();
      }
    };
    Object.assign(window, {
      render_game_to_text: () =>
        JSON.stringify({
          mode: 'unavailable',
          resources: {
            gold: model.serverEconomy?.gold ?? null,
            elixir: model.serverEconomy?.elixir ?? null,
            dark: null,
            gems: model.serverEconomy?.gems ?? null,
          },
          builderCapacity: model.serverEconomy?.builderCapacity ?? null,
          army: null,
          hero: null,
          selectedWalls: null,
          wallPreview: null,
          obstacles: null,
          buildings: null,
          replay: null,
          battle: null,
          coordinates: null,
        }),
    });
}

function sameSession(expected: string, current: string | null): boolean {
  return !!current && sessionIdentity(expected) === sessionIdentity(current);
}

function sessionIdentity(token: string): string {
  try {
    const payload = token.split('.')[1];
    if (payload) {
      const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: unknown; sid?: unknown };
      if (claims.sub != null || claims.sid != null) return `${String(claims.sub ?? '')}:${String(claims.sid ?? '')}`;
    }
  } catch { /* opaque access token: use its exact identity */ }
  return token;
}

function validVillageSnapshot(snapshot: Readonly<CPVillageSnapshot>, user: User): snapshot is Readonly<CPVillageSnapshot> & { village: NonNullable<CPVillageSnapshot['village']>; wallet: Wallet; layout: NonNullable<CPVillageSnapshot['layout']> } {
  const wallet = snapshot.wallet;
  return !snapshot.stale && !snapshot.loading && !!snapshot.village && snapshot.village.user_id === user.id && !!wallet && !!snapshot.layout &&
    [wallet.gold, wallet.elixir, wallet.gems, wallet.builder_capacity].every((value) => Number.isFinite(value));
}

function modelLayout(snapshot: Readonly<CPVillageSnapshot>) {
  const profile = snapshot.village!;
  const topicKeys = new Map(mapVillageProfile(profile).slots
    .filter((slot) => slot.topicId)
    .map((slot) => [slot.topicId!, CP_VILLAGE_TOPIC_SLOTS.find((definition) => definition.id === slot.slotId)!.slug]));
  return {
    ...snapshot.layout!,
    items: snapshot.layout!.items.map(({ topic_id, ...item }) => ({
      ...item,
      topic_id,
      topic_key: topicKeys.get(topic_id) ?? item.topic_key ?? '',
    })),
  };
}

function serverEconomy(wallet: Wallet, user: User) {
  return { gold: wallet.gold, elixir: wallet.elixir, gems: wallet.gems, builderCapacity: wallet.builder_capacity, username: user.username };
}
boot().catch((error) => {
  console.error(error);
  const label = document.querySelector('#load-label');
  if (label) label.textContent = 'Your village could not start. Refresh the page to try again.';
});
