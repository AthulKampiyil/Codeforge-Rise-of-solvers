import catalog from '../../reference/music/catalog.json' with { type: 'json' };

/**
 * Original client music (see reference/music): the classic Home theme in three parts, the
 * battle planning and combat loops, and the battle intro, victory and defeat stings.
 */
export type MusicScene = 'home' | 'planning' | 'combat' | 'victory' | 'defeat';
type Loop = 'home' | 'planning' | 'combat';
type Sting = 'intro' | 'victory' | 'defeat';
const paths = (scene: keyof typeof catalog.tracks) => catalog.tracks[scene].map((t) => t.path);
const LOOPS: Record<Loop, string[]> = {
  home: paths('home'),
  planning: paths('planning'),
  combat: paths('combat'),
};
const STINGS: Record<Sting, string> = {
  intro: paths('intro')[0],
  victory: paths('victory')[0],
  defeat: paths('defeat')[0],
};
/** Music sits under the effects, as in the original's default mix. */
export const MUSIC_VOLUME = 0.5;

/** What should be playing for the battle on screen, or at home without one. */
export function musicScene(
  battle: { started: boolean; finished?: boolean; stars: number } | null | undefined,
): MusicScene {
  if (!battle) return 'home';
  if (battle.finished) return battle.stars > 0 ? 'victory' : 'defeat';
  return battle.started ? 'combat' : 'planning';
}

export interface MusicElement {
  src: string;
  loop: boolean;
  volume: number;
  paused: boolean;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: 'ended', listener: () => void): void;
}
export interface MusicHost {
  context(): AudioContext | null;
  element(): MusicElement;
  /** Whole-file bytes; a full GET lets the service worker keep the track for offline play. */
  fetch(path: string): Promise<ArrayBuffer>;
  objectUrl(bytes: ArrayBuffer, path: string): string;
}
const browserHost: MusicHost = {
  context: () => null,
  element: () => {
    const el = new Audio();
    el.preload = 'auto';
    return el;
  },
  fetch: async (path) => {
    const response = await fetch(`/${path}`);
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    return response.arrayBuffer();
  },
  objectUrl: (bytes, path) =>
    URL.createObjectURL(
      new Blob([bytes], { type: path.endsWith('.mp3') ? 'audio/mpeg' : 'audio/ogg' }),
    ),
};

/**
 * Loops stream through one media element, so a three-minute track never sits decoded in
 * memory; Home plays its three parts in order and starts over. Stings are seconds long and
 * play through Web Audio. Turning music off pauses in place, so a hidden page or the setting
 * resumes where it stopped.
 */
export class MusicPlayer {
  private el: MusicElement | null = null;
  private scene: MusicScene | null = null;
  private loop: Loop | null = null;
  private part = 0;
  private enabled = false;
  private urls = new Map<string, Promise<string | null>>();
  private stings = new Map<string, Promise<AudioBuffer | null>>();
  /** Increments on every change, so a slow download cannot start a track no longer wanted. */
  private generation = 0;
  private host: MusicHost;
  constructor(context: () => AudioContext | null, host: Partial<MusicHost> = {}) {
    this.host = { ...browserHost, context, ...host };
  }
  get playing() {
    return this.enabled && !!this.el && !this.el.paused;
  }
  get current() {
    return this.loop ? LOOPS[this.loop][this.part] : null;
  }
  setEnabled(on: boolean) {
    if (this.enabled === on) return;
    this.enabled = on;
    this.generation++;
    if (on) this.resume();
    else this.el?.pause();
  }
  setScene(scene: MusicScene) {
    if (scene === this.scene) return;
    const previous = this.scene;
    this.scene = scene;
    this.generation++;
    const loop = scene === 'victory' || scene === 'defeat' ? null : scene;
    if (loop !== this.loop) {
      this.el?.pause();
      this.loop = loop;
      this.part = 0;
    }
    if (!this.enabled) return;
    if (!loop) this.sting(scene as Sting);
    else if (loop === 'planning' && previous !== 'planning') {
      const generation = this.generation;
      this.sting('intro', () => generation === this.generation && this.resume());
    } else this.resume();
  }
  private url(path: string) {
    let url = this.urls.get(path);
    if (!url) {
      url = this.host
        .fetch(path)
        .then((bytes) => this.host.objectUrl(bytes, path))
        .catch(() => {
          this.urls.delete(path);
          return null;
        });
      this.urls.set(path, url);
    }
    return url;
  }
  private resume() {
    if (!this.enabled || !this.loop) return;
    const loop = this.loop,
      part = this.part,
      generation = this.generation;
    void this.url(LOOPS[loop][part]).then((url) => {
      if (!url || generation !== this.generation || !this.enabled) return;
      const el = (this.el ??= this.createElement());
      if (el.src !== url) el.src = url;
      el.loop = LOOPS[loop].length === 1;
      el.volume = MUSIC_VOLUME;
      void el.play().catch(() => {});
    });
  }
  private createElement() {
    const el = this.host.element();
    el.addEventListener('ended', () => {
      if (!this.loop) return;
      this.part = (this.part + 1) % LOOPS[this.loop].length;
      this.generation++;
      this.resume();
    });
    return el;
  }
  private sting(kind: Sting, then?: () => void) {
    const ctx = this.host.context();
    const path = STINGS[kind];
    if (!ctx) return then?.();
    let buffer = this.stings.get(path);
    if (!buffer) {
      buffer = this.host
        .fetch(path)
        .then((bytes) => ctx.decodeAudioData(bytes))
        .catch(() => {
          this.stings.delete(path);
          return null;
        });
      this.stings.set(path, buffer);
    }
    void buffer.then((decoded) => {
      if (!decoded || !this.enabled) return then?.();
      const source = ctx.createBufferSource(),
        gain = ctx.createGain();
      gain.gain.value = MUSIC_VOLUME;
      source.buffer = decoded;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        then?.();
      };
      source.start();
    });
  }
}
