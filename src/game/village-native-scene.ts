import type Phaser from 'phaser';
import { BUILDINGS, type BuildingKind, sourceKind } from './data';
import type { Building, Battle } from './model';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { nativeMeshTexture } from './native-mesh-scene';
import {
  nativeScenePoses,
  type NativeMeshGraph,
  type NativeScenePose,
  type NativeMatrix,
} from './native-mesh';
import { hasNativeDefenseBody, nativeDefenseBody } from './native-defense-poses';
import { nativeTrapValues } from './native-traps';
import progressionSource from '../../reference/full-client/progression.json' with { type: 'json' };
const progression = progressionSource as unknown as {
  buildings: Record<string, (typeof progressionSource.buildings)['townhall']>;
};
import index from '../../reference/full-client/village-art.json' with { type: 'json' };

interface Reference {
  scene: string;
  export: string;
}
interface Pack {
  levels: { level: number; refs: Record<string, Reference> }[];
  scenes: Record<string, NativeMeshGraph>;
}
type Point = { x: number; y: number };
const packs = index.buildings as unknown as Record<
  string,
  { path: string; variants?: Record<string, { path: string }> }
>;
export const hasVillageNativeArt = (kind: string) => Object.hasOwn(packs, sourceKind(kind));
/** Pack key of one building family, or of one of its per-level battle-mode variant packs. */
const packKey = (kind: string, variant?: string) =>
  variant ? `${sourceKind(kind)}/${variant}` : sourceKind(kind);
const packPath = (kind: string, variant?: string) =>
  variant ? packs[sourceKind(kind)]?.variants?.[variant]?.path : packs[sourceKind(kind)]?.path;

/** In-flight and finished pack downloads by pack key, shared by every presentation. */
const fetched = new Map<string, Promise<Pack>>();
function fetchPack(key: string, path: string) {
  let pending = fetched.get(key);
  if (pending) return pending;
  pending = (async () => {
    const response = await fetch('/' + path);
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    return (await response.json()) as Pack;
  })();
  // A failed download is retried by the next request instead of failing for good.
  pending.catch(() => fetched.delete(key));
  fetched.set(key, pending);
  return pending;
}
/** Decoded texture images by texture key, shared by every presentation. */
const decoded = new Map<string, Promise<HTMLImageElement>>();
/**
 * The textures one level of a pack draws, decoded and ready to upload. A paged pack (see
 * scripts/native-pages.mjs) tags each page with the levels that draw it, so a village fetches
 * only its own levels' art; every texture of an unpaged pack serves every level.
 */
function fetchLevel(key: string, pack: Pack, level: number) {
  const images = new Map<string, HTMLImageElement>();
  return Promise.all(
    Object.entries(pack.scenes).flatMap(([name, graph]) =>
      Object.entries(graph.textures)
        .filter(([, texture]) => !texture.levels || texture.levels.includes(level))
        .map(async ([id, texture]) => {
          const textureKey = nativeMeshTexture(`village:${key}:${name}`, id);
          let image = decoded.get(textureKey);
          if (!image) {
            image = (async () => {
              const element = new Image();
              element.src = '/' + texture.path;
              await element.decode();
              return element;
            })();
            image.catch(() => decoded.delete(textureKey));
            decoded.set(textureKey, image);
          }
          images.set(textureKey, await image);
        }),
    ),
  ).then(() => images);
}
/**
 * Starts downloading the packs and level pages these buildings draw without waiting for a scene,
 * so a boot can fetch the home village's art alongside the Phaser preload rather than after it.
 */
export function prefetchVillageArt(buildings: Iterable<Pick<Building, 'kind' | 'level'>>) {
  const levels = new Map<string, Set<number>>();
  for (const b of buildings) {
    if (!hasVillageNativeArt(b.kind)) continue;
    if (!levels.has(b.kind)) levels.set(b.kind, new Set());
    levels.get(b.kind)!.add(b.level);
  }
  const started: Promise<unknown>[] = [];
  for (const [kind, wanted] of levels) {
    const path = packPath(kind);
    if (!path) continue;
    const key = packKey(kind);
    started.push(
      fetchPack(key, path)
        .then((pack) => Promise.all([...wanted].map((level) => fetchLevel(key, pack, level))))
        .catch(() => undefined),
    );
  }
  return Promise.all(started).then(() => undefined);
}

/** The pack row for a level (first match, as `find` returned), through a per-pack map. */
const levelRows = new WeakMap<Pack, Map<number, Pack['levels'][number]>>();
function levelRow(pack: Pack, level: number) {
  let rows = levelRows.get(pack);
  if (!rows) {
    rows = new Map();
    for (const row of pack.levels) if (!rows.has(row.level)) rows.set(row.level, row);
    levelRows.set(pack, rows);
  }
  return rows.get(level);
}
/**
 * Whether every field of a level row resolves to a static, resource-free export in this pack:
 * such a building's poses depend on nothing but its level and the field set. Cached per row
 * and field set (the field sets are the shared constants below).
 */
const stillRows = new WeakMap<object, Map<readonly string[], boolean>>();
function stillFields(pack: Pack, level: Pack['levels'][number], fields: readonly string[]) {
  let byFields = stillRows.get(level);
  if (!byFields) stillRows.set(level, (byFields = new Map()));
  let still = byFields.get(fields);
  if (still === undefined) {
    still = true;
    for (const field of fields) {
      const ref = level.refs[field];
      if (!ref) continue;
      const graph = pack.scenes[ref.scene];
      if (!graph || !nativeStaticExport(graph, ref.export) || nativeResourceFrames(graph)) {
        still = false;
        break;
      }
    }
    byFields.set(fields, still);
  }
  return still;
}
/** Frame count of a graph's `resource` slot (storage fill), or 0 without one. Cached per graph. */
const resourceFrames = new WeakMap<NativeMeshGraph, number>();
export function nativeResourceFrames(graph: NativeMeshGraph) {
  let frames = resourceFrames.get(graph);
  if (frames === undefined) {
    frames = 0;
    // Same resolution as before: the last `resource` slot found wins.
    for (const clip of Object.values(graph.clips))
      for (const [slot, name] of clip.names.entries())
        if (name === 'resource') frames = graph.clips[clip.children[slot]]?.timeline.length ?? 1;
    resourceFrames.set(graph, frames);
  }
  return frames;
}

/**
 * True when every clip reachable from the export has a single frame: its pose is then the same
 * at every clock (controls still apply and are part of the render signature).
 */
const staticExports = new WeakMap<NativeMeshGraph, Map<string, boolean>>();
export function nativeStaticExport(graph: NativeMeshGraph, name: string) {
  let cache = staticExports.get(graph);
  if (!cache) staticExports.set(graph, (cache = new Map()));
  let result = cache.get(name);
  if (result === undefined) {
    result = true;
    const root = graph.exports[name];
    const seen = new Set<number>();
    const stack = root === undefined ? [] : [root];
    while (stack.length && result) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const clip = graph.clips[id];
      if (!clip) continue;
      if (clip.timeline.length > 1) result = false;
      for (const child of clip.children) stack.push(child);
    }
    cache.set(name, result);
  }
  return result;
}

const graphIds = new WeakMap<NativeMeshGraph, number>();
let nextGraphId = 1;
const graphId = (graph: NativeMeshGraph) => {
  let id = graphIds.get(graph);
  if (id === undefined) graphIds.set(graph, (id = nextGraphId++));
  return id;
};

interface ViewEntry {
  view: NativeSceneView;
  /** Everything the last render depended on; an unchanged signature skips the render. */
  signature?: string;
  /** Object list tagged with the building id (first and last object, and count). */
  tagged?: { first: unknown; last: unknown; count: number };
}

/** Source timelines are fetched only for families actually visible in the village or battle. */
export class VillageNativePresentation {
  private packs = new Map<string, Pack>();
  private pending = new Set<string>();
  /** Levels whose textures are uploaded, by pack key, and level loads in flight. */
  private levelsReady = new Map<string, Set<number>>();
  private pendingLevels = new Set<string>();
  /** A level whose pages failed waits this long (performance.now ms) before asking again. */
  private levelRetryAt = new Map<string, number>();
  /** Scene views per building id, then per pack scene. */
  private views = new Map<number, Map<string, ViewEntry>>();
  /**
   * Inputs of the last render of a still building (every field export static, no trap, no
   * defense body, no resource fill): while they hold, nothing in its views can change, so the
   * per-field signature strings are not even built. Walls are most of a large layout.
   */
  private still = new Map<number, { fields: readonly string[]; level: number; density: number }>();
  /** Buildings whose views are currently hidden by the viewport cull. */
  private hidden = new Set<number>();
  private aims = new Map<number, Point>();
  private alive = true;
  private placement?: { building: Building; valid: boolean };
  private seen = new Set<number>();
  private used = new Set<string>();
  preview(building?: Building, valid = true) {
    this.placement =
      building && hasVillageNativeArt(building.kind)
        ? { building: { ...building, id: -1 }, valid }
        : undefined;
    return (
      !!building &&
      this.packs.has(building.kind) &&
      this.ready(packKey(building.kind), building.level)
    );
  }
  private ready(key: string, level: number) {
    return !!this.levelsReady.get(key)?.has(level);
  }
  constructor(
    private scene: Phaser.Scene,
    private notify: (message: string) => void,
    private storageFill: (resource: 'gold' | 'elixir') => number,
  ) {
    // Skipped renders never repaint isolated group buffers: context loss must force them.
    (
      scene.game?.renderer as { on?: (event: string, fn: () => void, context?: unknown) => void }
    )?.on?.('losewebgl', this.invalidate, this);
  }
  private invalidate() {
    for (const entries of this.views.values())
      for (const entry of entries.values()) entry.signature = undefined;
  }
  private async load(kind: BuildingKind | string, variant?: string) {
    const key = packKey(kind, variant);
    const path = packPath(kind, variant);
    if (!path || this.pending.has(key) || this.packs.has(key)) return;
    this.pending.add(key);
    try {
      const pack = await fetchPack(key, path);
      if (this.alive) this.packs.set(key, pack);
    } catch (error) {
      if (this.alive && !variant)
        this.notify(
          `Could not load ${BUILDINGS[kind as BuildingKind].name} animation. Refresh to retry.`,
        );
      console.error('Native village artwork', key, error);
    }
  }
  /** Upload the pages one level of a loaded pack draws. */
  private async loadLevel(kind: BuildingKind | string, variant: string | undefined, level: number) {
    const key = packKey(kind, variant);
    const pack = this.packs.get(key);
    const job = `${key}#${level}`;
    if (!pack || this.pendingLevels.has(job) || this.ready(key, level)) return;
    if ((this.levelRetryAt.get(job) ?? 0) > performance.now()) return;
    this.pendingLevels.add(job);
    try {
      const images = await fetchLevel(key, pack, level);
      if (!this.alive) return;
      for (const [textureKey, image] of images)
        if (!this.scene.textures.exists(textureKey))
          this.scene.textures.addImage(textureKey, image);
      if (!this.levelsReady.has(key)) this.levelsReady.set(key, new Set());
      this.levelsReady.get(key)!.add(level);
    } catch (error) {
      // A frame drawing this level asks again after a pause; the fallback sprite covers.
      this.levelRetryAt.set(job, performance.now() + 5000);
      console.error('Native village artwork', job, error);
    } finally {
      this.pendingLevels.delete(job);
    }
  }
  private drop(id: number) {
    const entries = this.views.get(id);
    if (!entries) return;
    for (const entry of entries.values()) entry.view.destroy();
    this.views.delete(id);
    this.hidden.delete(id);
    this.still.delete(id);
  }
  clear() {
    for (const id of [...this.views.keys()]) this.drop(id);
    this.aims.clear();
  }
  destroy() {
    this.alive = false;
    (
      this.scene.game?.renderer as {
        off?: (event: string, fn: () => void, context?: unknown) => void;
      }
    )?.off?.('losewebgl', this.invalidate, this);
    this.clear();
  }
  render(
    buildings: Building[],
    battle: Battle | null | undefined,
    seconds: number,
    iso: (x: number, y: number) => { x: number; y: number },
    sprites: Map<number, Phaser.GameObjects.Image>,
  ) {
    const seen = this.seen;
    seen.clear();
    const cam = (
      this.scene as unknown as {
        cameras?: {
          main?: {
            worldView?: { centerX: number; centerY: number; width: number; height: number };
            zoomX?: number;
            zoomY?: number;
          };
        };
      }
    ).cameras?.main;
    const camView = cam?.worldView;
    // Group buffers follow the physical zoom (NativeSceneView's density): part of the signature.
    const density = quantizedDensity(Math.max(1, cam?.zoomX ?? 1, cam?.zoomY ?? 1));
    const cx = camView?.centerX ?? 0;
    const cy = camView?.centerY ?? 0;
    const hw = (camView?.width ?? 0) / 2;
    const hh = (camView?.height ?? 0) / 2;
    const count = buildings.length + (this.placement ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const b = i < buildings.length ? buildings[i] : this.placement!.building;
      if (!hasVillageNativeArt(b.kind) || b.npc) continue;
      const size = BUILDINGS[b.kind].size;
      // Viewport cull before pose sampling; retain hidden views so scrolling
      // back never reallocates their RenderTextures.
      const earlyPoint = iso(b.x + size / 2, b.y + size / 2);
      if (camView && b.id !== -1) {
        const margin = 450;
        if (
          Math.abs(earlyPoint.x - cx) > hw + margin ||
          Math.abs(earlyPoint.y - cy) > hh + margin
        ) {
          const entries = this.views.get(b.id);
          if (entries) {
            seen.add(b.id);
            if (!this.hidden.has(b.id)) {
              this.hidden.add(b.id);
              this.still.delete(b.id);
              for (const entry of entries.values()) {
                for (const object of entry.view.objects) object.setVisible(false);
                // Reshow through a full render.
                entry.signature = undefined;
              }
            }
            // The native views stand in for this building; its fallback stays hidden off screen.
            const fallback = sprites.get(b.id);
            if (fallback?.visible) fallback.setVisible(false);
          }
          continue;
        }
      }
      const pack = this.packs.get(b.kind);
      if (!pack) {
        void this.load(b.kind);
        continue;
      }
      const level = levelRow(pack, b.level);
      if (!level) continue;
      if (!this.ready(packKey(b.kind), b.level)) {
        void this.loadLevel(b.kind, undefined, b.level);
        continue;
      }
      const trap = battle?.traps[b.id];
      // A resolved Tornado Trap keeps playing its triggered swirl for the spell's own duration.
      const spinning =
        b.kind === 'tornadotrap' &&
        trap &&
        seconds - trap.activatedAt < nativeTrapValues(b.kind, b.level).duration;
      const fields =
        b.hp <= 0
          ? DAMAGED
          : trap?.resolved && !spinning
            ? BROKEN
            : trap
              ? TRIGGERED
              : b.constructing
                ? CONSTRUCTION
                : b.upgradeEnd
                  ? UPGRADING
                  : IDLE;
      if (
        b.id !== -1 &&
        !trap &&
        !hasNativeDefenseBody(b.kind) &&
        stillFields(pack, level, fields)
      ) {
        const last = this.still.get(b.id);
        if (
          last &&
          last.fields === fields &&
          last.level === b.level &&
          last.density === density &&
          this.views.has(b.id)
        ) {
          seen.add(b.id);
          const fallback = sprites.get(b.id);
          if (fallback?.visible) fallback.setVisible(false);
          continue;
        }
        this.still.set(b.id, { fields, level: b.level, density });
      }
      // Battle bodies (turret aim, attack, activation and mode) of the Town Hall 11-18 defenses.
      const source = (field: string, variant?: string) => {
        const from = variant ? this.packs.get(packKey(b.kind, variant)) : pack;
        if (!from) {
          if (variant) void this.load(b.kind, variant);
          return undefined;
        }
        const row = from.levels.find((r) => r.level === b.level) ?? from.levels[0];
        if (variant && row && !this.ready(packKey(b.kind, variant), row.level)) {
          void this.loadLevel(b.kind, variant, row.level);
          return undefined;
        }
        const ref = row?.refs[field];
        const graph = ref ? from.scenes[ref.scene] : undefined;
        return ref && graph ? { ref, graph, variant } : undefined;
      };
      const body =
        !b.constructing && b.hp > 0 && !trap && hasNativeDefenseBody(b.kind)
          ? nativeDefenseBody(
              b,
              battle ?? null,
              seconds,
              (field, variant) => {
                const found = source(field, variant);
                return found ? { graph: found.graph, export: found.ref.export } : undefined;
              },
              { actionFrame: (level as { action?: number }).action, lastAim: this.aims.get(b.id) },
            )
          : undefined;
      if (body?.aim && b.id !== -1) this.aims.set(b.id, body.aim);
      const root: NativeMatrix = [1.2, 0, 0, 0, 1.2, -32 * size];
      const tintedPreview = b.id === -1 && !this.placement?.valid;
      // Resolve fields to scene groups and their render signatures before sampling any pose.
      const groups = new Map<
        string,
        {
          prefix: string;
          parts: {
            graph: NativeMeshGraph;
            name: string;
            clock: number;
            controls: Record<string, number | false>;
          }[];
          signature: string;
        }
      >();
      for (const field of fields) {
        const selected =
          field === 'ExportName' && body?.field ? source(body.field, body.variant) : source(field);
        if (!selected) continue;
        const { ref, graph, variant } = selected;
        const clock =
          field === 'ExportNameBase' ||
          field === 'ExportNameDamaged' ||
          field === 'ExportNameBroken'
            ? 0
            : field === 'ExportName' && body?.clock !== undefined
              ? body.clock
              : trap
                ? Math.max(0, seconds - trap.activatedAt)
                : seconds;
        const controls: Record<string, number | false> =
          field === 'ExportName' && body ? { ...body.controls } : {};
        const resource = nativeResourceFrames(graph);
        if (resource) {
          const fraction =
            b.kind === 'goldstorage' || b.kind === 'elixirstorage'
              ? this.storageFill(b.kind === 'goldstorage' ? 'gold' : 'elixir')
              : b.stored /
                Math.max(
                  1,
                  progression.buildings[b.kind].levels[b.level - 1]?.productionCapacity ?? 1,
                );
          controls.resource = Math.round(Math.max(0, Math.min(1, fraction)) * (resource - 1));
        }
        const key = `${packKey(b.kind, variant)}:${ref.scene}`;
        let group = groups.get(key);
        if (!group)
          groups.set(
            key,
            (group = {
              prefix: `village:${packKey(b.kind, variant)}:${ref.scene}`,
              parts: [],
              signature: '',
            }),
          );
        group.parts.push({ graph, name: ref.export, clock, controls });
        // Poses depend only on the integer root frame (see sampleNativeScene) and controls;
        // single-frame exports look the same at every clock.
        const fps = graph.clips[graph.exports[ref.export]]?.fps ?? 1;
        const frame = nativeStaticExport(graph, ref.export)
          ? 0
          : Math.floor((Number.isFinite(clock) ? Math.max(0, clock) : 0) * fps + 1e-9);
        let controlKey = '';
        for (const name in controls) controlKey += `${name}=${controls[name]},`;
        group.signature += `${graphId(graph)}/${ref.export}/${frame}/${controlKey};`;
      }
      if (!groups.size) continue;
      seen.add(b.id);
      this.hidden.delete(b.id);
      const fallback = sprites.get(b.id);
      if (fallback?.visible) fallback.setVisible(false);
      const point = earlyPoint;
      let entries = this.views.get(b.id);
      if (!entries) this.views.set(b.id, (entries = new Map()));
      const used = this.used;
      used.clear();
      let order = 0;
      for (const [name, group] of groups) {
        const key = `${b.kind}:${name}`;
        used.add(key);
        let entry = entries.get(key);
        if (!entry)
          entries.set(key, (entry = { view: new NativeSceneView(this.scene, group.prefix) }));
        const depth = b.id === -1 ? 6600 + order++ * 0.01 : point.y + order++ * 0.01;
        const alpha = b.id === -1 ? 0.72 : b.constructing ? 0.8 : 1;
        const signature = `${group.signature}|${point.x},${point.y},${depth},${alpha},${density}`;
        // Static walls and idle buildings: nothing baked into the view changed, skip the
        // resample, retessellation and object updates entirely. The placement preview (tinted
        // per validity) always renders.
        if (b.id !== -1 && entry.signature === signature) continue;
        const poses: NativeScenePose[] = [];
        for (const part of group.parts) {
          const sampled = nativeScenePoses(part.graph, part.name, part.clock, part.controls, root);
          if (tintedPreview)
            for (const pose of sampled)
              pose.multiply = pose.multiply.map((v, channel) =>
                channel === 1 || channel === 2 ? v * 0.45 : v,
              );
          for (const pose of sampled) poses.push(pose);
        }
        entry.view.render(poses, point.x, point.y, depth, alpha);
        entry.signature = b.id === -1 ? undefined : signature;
        // Tag objects with the building id when the drawn object list changes.
        const objects = entry.view.objects;
        const tagged = entry.tagged;
        if (
          !tagged ||
          tagged.count !== objects.length ||
          tagged.first !== objects[0] ||
          tagged.last !== objects[objects.length - 1]
        ) {
          for (const object of objects)
            if (object.getData('nativeVillage') !== b.id) object.setData('nativeVillage', b.id);
          entry.tagged = {
            first: objects[0],
            last: objects[objects.length - 1],
            count: objects.length,
          };
        }
      }
      for (const [key, entry] of entries)
        if (!used.has(key)) {
          entry.view.destroy();
          entries.delete(key);
        }
    }
    for (const id of this.views.keys()) if (!seen.has(id)) this.drop(id);
  }
}

const DAMAGED = ['ExportNameDamaged'];
const BROKEN = ['ExportNameBroken'];
const TRIGGERED = ['ExportNameTriggered'];
const CONSTRUCTION = ['ExportNameBase', 'ExportNameConstruction'];
const UPGRADING = ['ExportNameBase', 'ExportName', 'ExportNameBuildAnim'];
const IDLE = ['ExportNameBase', 'ExportName'];
