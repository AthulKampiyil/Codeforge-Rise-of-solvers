import { SampleAudio } from './sample-audio';
import { MusicPlayer, type MusicScene } from './music';
import villageSounds from '../../reference/village-sounds/sounds.json' with { type: 'json' };
export type Tone = 'click' | 'collect' | 'build' | 'hit' | 'destroy' | 'deploy' | 'victory';
/** The client's village feedback effects (logic/effects.csv), by its own names. */
export type VillageEffect = keyof typeof villageSounds.effects | 'Button Click';
const villageSample = (path: string) => `village-${path.split('/').pop()}`;
/** Generated tones that the client's own sounds replace once decoded. */
const TONE_EFFECT: Partial<Record<Tone, VillageEffect>> = {
  click: 'Button Click',
  build: 'Start Building',
  collect: 'Collect Gold',
};
export class AudioManager {
  context: AudioContext | null = null;
  /**
   * Native samples only see the context while sound is on: with sound off, the first gesture
   * neither decodes the ~115 samples nor plays them. Decoding starts when sound is enabled.
   */
  samples = new SampleAudio(() => (this.soundOn ? this.context : null));
  private soundOn = true;
  /** Set by the first user gesture; a context is only created after one. */
  private unlocked = false;
  private musicOn = false;
  /** The original client's Home and battle music; plays only while music is on. */
  readonly tracks = new MusicPlayer(() => (this.musicOn ? this.context : null));
  private lastPlay: Partial<Record<string, number>> = {};
  /** The village sounds load once, after the first gesture with sound on (about 200 KB). */
  private villageLoad?: Promise<void>;
  constructor() {
    if (typeof document !== 'undefined')
      document.addEventListener('visibilitychange', () => this.updateContext());
  }
  get enabled() {
    return this.soundOn;
  }
  set enabled(on: boolean) {
    if (this.soundOn === on) return;
    this.soundOn = on;
    if (!on) this.samples.stop();
    this.updateContext();
  }
  /** True while anything may be heard: sound effects or music, on a visible page. */
  private get audible() {
    return (this.soundOn || this.musicOn) && !(typeof document !== 'undefined' && document.hidden);
  }
  /** Creates the context lazily and suspends it while nothing can be heard. */
  private updateContext() {
    if (!this.unlocked) return;
    if (this.audible) {
      if (!this.context) this.context = new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume();
      this.samples.decode();
    } else if (this.context?.state === 'running') void this.context.suspend();
  }
  unlock() {
    this.unlocked = true;
    this.updateContext();
    this.loadVillageSounds();
  }
  private loadVillageSounds() {
    if (this.villageLoad || !this.soundOn || typeof fetch === 'undefined') return;
    this.villageLoad = Promise.all(
      Object.entries(villageSounds.sounds).map(async ([path, sound]) => {
        const response = await fetch('/' + sound.path);
        if (!response.ok) throw Error(`${sound.path}: ${response.status}`);
        this.samples.register(villageSample(path), await response.arrayBuffer());
      }),
    ).then(
      () => undefined,
      // Generated tones stand in; the next gesture tries again.
      () => void (this.villageLoad = undefined),
    );
  }
  /** Plays a client village sound; false when it is not decoded yet. */
  private playEffect(effect: VillageEffect) {
    if (effect === 'Button Click')
      return this.samples.shot(villageSample(villageSounds.click), 0.6);
    const row = villageSounds.effects[effect];
    const pitch = row.minPitch + Math.random() * (row.maxPitch - row.minPitch);
    return this.samples.shot(villageSample(row.sound), row.volume, pitch);
  }
  /**
   * A client village effect: collecting a resource, a building or upgrade finishing, an upgrade
   * starting. `tone` is the generated stand-in until the sound is decoded, and the haptic cue.
   */
  effect(effect: VillageEffect, tone: Tone) {
    this.feedback(tone);
    if (!this.enabled || this.throttled(effect, 50)) return;
    this.unlock();
    if (!this.playEffect(effect)) this.tone(tone);
  }
  private throttled(key: string, ms: number) {
    const now = performance.now();
    if (now - (this.lastPlay[key] ?? 0) < ms) return true;
    this.lastPlay[key] = now;
    return false;
  }
  /** Called for every cue, sound on or off (vibration follows the same moments). */
  feedback: (kind: Tone) => void = () => {};
  play(kind: Tone) {
    this.feedback(kind);
    if (!this.enabled) return;
    // Battles can emit dozens of blips per second; throttle per kind
    // so overlapping volleys don't thrash the mixer.
    const throttleMs =
      kind === 'hit' ? 70 : kind === 'destroy' ? 150 : kind === 'victory' ? 500 : 50;
    if (this.throttled(kind, throttleMs)) return;
    this.unlock();
    const effect = TONE_EFFECT[kind];
    if (effect && this.playEffect(effect)) return;
    this.tone(kind);
  }
  /** The generated stand-in for a cue. */
  private tone(kind: Tone) {
    const ctx = this.context;
    if (!ctx) return;
    const settings = {
      click: [600, 0.04, 'sine'],
      collect: [1100, 0.18, 'sine'],
      build: [360, 0.15, 'triangle'],
      hit: [120, 0.06, 'triangle'],
      destroy: [65, 0.3, 'sawtooth'],
      deploy: [420, 0.12, 'triangle'],
      victory: [660, 0.5, 'sine'],
    }[kind] as [number, number, OscillatorType];
    const [freq, duration, type] = settings;
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      kind === 'collect' ? 1800 : Math.max(30, freq * 0.5),
      ctx.currentTime + duration,
    );
    gain.gain.setValueAtTime(kind === 'destroy' ? 0.045 : 0.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
  music(on: boolean) {
    this.musicOn = on;
    if (on) this.unlock();
    else this.updateContext();
    this.tracks.setEnabled(on);
  }
  /** Follow the screen: Home, battle planning, combat, or the result's sting. */
  musicScene(scene: MusicScene) {
    this.tracks.setScene(scene);
  }
}
