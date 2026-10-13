export interface SampleCue {
  key: string;
  sample: string;
  at: number;
  volume: number;
  pitch: number;
  loop?: boolean;
}

/**
 * Registers a loaded sample from a scene's binary cache. A failed download leaves no cache
 * entry; that sample then stays silent instead of throwing in a constructor or loader callback.
 */
export function registerCachedSample(
  scene: { cache: { binary: { exists(key: string): boolean; get(key: string): unknown } } },
  samples: { register(name: string, data: unknown): boolean },
  key: string,
) {
  return scene.cache.binary.exists(key) && samples.register(key, scene.cache.binary.get(key));
}

/**
 * One-shot cues older than this (battle seconds) are past every native sample's length, so
 * presentations skip building them. `sync` would drop them anyway once decoded.
 */
export const CUE_HORIZON = 10;
/** True while a one-shot cue fired at `at` can still be heard at `elapsed`. */
export const cueAudible = (at: number, elapsed: number) => elapsed - at < CUE_HORIZON;

/** Concurrent voices of one sample; further overlapping cues of it stay silent. */
export const MAX_VOICES_PER_SAMPLE = 4;
/** Concurrent sample voices in total (Web Audio mixes every source on the audio thread). */
export const MAX_VOICES = 32;

/** Short native samples synchronized to the simulation clock, including replay seeks. */
export class SampleAudio {
  private encoded = new Map<string, ArrayBuffer>();
  private buffers = new Map<string, AudioBuffer>();
  private decoding = new Set<string>();
  private active = new Map<
    string,
    { source: AudioBufferSourceNode; gain: GainNode; sample: string }
  >();
  private ended = new Set<string>();
  /** Interface one-shots, outside the simulation clock (see `shot`). */
  private shots = new Set<AudioBufferSourceNode>();
  private last?: { elapsed: number; wall: number; speed: number };
  constructor(private context: () => AudioContext | null) {}
  /**
   * Registers an encoded sample. Anything but an ArrayBuffer (a missing loader entry after a
   * failed download) is ignored: a throw here would escape into the loader's completion
   * callback and leave the art it gates unfinished.
   */
  register(name: string, data: unknown) {
    if (!(data instanceof ArrayBuffer)) return false;
    this.encoded.set(name, data);
    this.decode();
    return true;
  }
  /** Whether a sample is decoded and can play. */
  has(name: string) {
    return this.buffers.has(name);
  }
  decode() {
    const ctx = this.context();
    if (!ctx) return;
    for (const [name, data] of this.encoded)
      if (!this.decoding.has(name) && data instanceof ArrayBuffer) {
        this.decoding.add(name);
        void ctx
          .decodeAudioData(data.slice(0))
          .then((buffer) => this.buffers.set(name, buffer))
          .catch(() => {});
      }
  }
  /**
   * Plays a decoded sample now, at the client's volume (0–1) and pitch, for interface and village
   * feedback that follows no battle clock. False when it cannot play yet (not decoded, sound off
   * or too many voices), so the caller can fall back.
   */
  shot(sample: string, volume: number, pitch = 1) {
    const ctx = this.context(),
      buffer = this.buffers.get(sample);
    if (!ctx || ctx.state !== 'running' || !buffer) return false;
    if (this.shots.size >= MAX_VOICES_PER_SAMPLE * 2) return true;
    const source = ctx.createBufferSource(),
      gain = ctx.createGain();
    source.buffer = buffer;
    source.playbackRate.value = pitch;
    gain.gain.value = volume * 0.12;
    source.connect(gain);
    gain.connect(ctx.destination);
    this.shots.add(source);
    source.onended = () => {
      this.shots.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start();
    return true;
  }
  private static safeStop(source: AudioBufferSourceNode) {
    try {
      source.stop();
    } catch {
      // Already stopped/ended — disconnect below still applies.
    }
  }
  stop() {
    for (const { source, gain } of this.active.values()) {
      SampleAudio.safeStop(source);
      source.disconnect();
      gain.disconnect();
    }
    this.active.clear();
    this.ended.clear();
    this.last = undefined;
  }
  sync(cues: SampleCue[], elapsed: number, speed: number, playing: boolean) {
    const ctx = this.context();
    if (!ctx || ctx.state !== 'running' || !playing) {
      this.stop();
      return;
    }
    this.decode();
    if (
      this.last &&
      Math.abs(elapsed - this.last.elapsed - (ctx.currentTime - this.last.wall) * this.last.speed) >
        0.15
    )
      this.stop();
    this.last = { elapsed, wall: ctx.currentTime, speed };
    const wanted = new Set<string>();
    const voices = new Map<string, number>();
    for (const node of this.active.values())
      voices.set(node.sample, (voices.get(node.sample) ?? 0) + 1);
    for (const cue of cues) {
      const buffer = this.buffers.get(cue.sample),
        age = (elapsed - cue.at) * cue.pitch;
      if (!buffer || age < 0 || (!cue.loop && age >= buffer.duration) || buffer.duration <= 0)
        continue;
      wanted.add(cue.key);
      // Audio can finish between fixed simulation ticks. Do not replay its final tail.
      if (this.ended.has(cue.key)) continue;
      let node = this.active.get(cue.key);
      if (!node) {
        const playing = voices.get(cue.sample) ?? 0;
        // Big battles stack dozens of identical impacts: cap them rather than the mixer.
        if (playing >= MAX_VOICES_PER_SAMPLE || this.active.size >= MAX_VOICES) continue;
        voices.set(cue.sample, playing + 1);
        const source = ctx.createBufferSource(),
          gain = ctx.createGain();
        source.buffer = buffer;
        if (cue.loop) source.loop = true;
        source.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.value = cue.volume * 0.12;
        source.playbackRate.value = cue.pitch * speed;
        node = { source, gain, sample: cue.sample };
        this.active.set(cue.key, node);
        source.onended = () => {
          if (this.active.get(cue.key)?.source === source) {
            this.active.delete(cue.key);
            this.ended.add(cue.key);
          }
          source.disconnect();
          gain.disconnect();
        };
        source.start(0, cue.loop ? age % buffer.duration : age);
      } else {
        node.source.playbackRate.value = cue.pitch * speed;
        if (cue.loop) node.gain.gain.value = cue.volume * 0.12;
      }
    }
    for (const [key, node] of this.active)
      if (!wanted.has(key)) {
        SampleAudio.safeStop(node.source);
        node.source.disconnect();
        node.gain.disconnect();
        this.active.delete(key);
      }
    for (const key of this.ended) if (!wanted.has(key)) this.ended.delete(key);
  }
}
