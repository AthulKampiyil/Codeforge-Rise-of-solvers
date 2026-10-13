import { ApiError, getAccessToken } from "./client";
import { notificationsApi, villageApi } from "./api";
import { realtimeClient } from "./realtime";
import type { EventEnvelope, OutpostLayoutItem, OutpostLayoutRules, OutpostLayoutSaveRequest, OutpostLayoutSaveResponse, OutpostLayoutSnapshot, VillageOutpostUpgradeResponse, VillageOutpostsSnapshot, VillageProfile, Wallet } from "./types";

export interface CPVillageSnapshot {
  village: VillageProfile | null;
  wallet: Wallet | null;
  outposts?: VillageOutpostsSnapshot | null;
  layout: OutpostLayoutSnapshot | null;
  loading: boolean;
  stale: boolean;
  error: Error | null;
  updatedAt: number | null;
}
const INITIAL: CPVillageSnapshot = { village: null, wallet: null, outposts: null, layout: null, loading: false, stale: true, error: null, updatedAt: null };
export const CP_VILLAGE_STATE_EVENT = "codeforge:village-state";

/** Client snapshot only: backend APIs remain truth; no local save or simulation. */
export class CPVillageStore {
  private snapshot: CPVillageSnapshot = { ...INITIAL };
  private listeners = new Set<(snapshot: Readonly<CPVillageSnapshot>) => void>();
  private generation = 0;
  private realtimeGeneration = 0;
  private stopRealtime?: () => void;
  private activeSession: string | null = null;
  private pendingOutpostUpgrades = new Map<string, { expectedTier: number; idempotencyKey: string; promise?: Promise<VillageOutpostUpgradeResponse> }>();
  private snapshotVersion = 0;
  private layoutVersion = 0;
  private layoutReadGeneration = 0;
  private pendingLayoutSave?: { session: string; request: OutpostLayoutSaveRequest; signature: string; promise?: Promise<OutpostLayoutSaveResponse> };

  getSnapshot = (): Readonly<CPVillageSnapshot> => this.snapshot;
  subscribe = (listener: (snapshot: Readonly<CPVillageSnapshot>) => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Start only against the current bearer session; tokens remain owned by the shared client. */
  async start(): Promise<Readonly<CPVillageSnapshot>> {
    const token = getAccessToken();
    if (!token) { if (this.activeSession !== null) this.stop(); return this.snapshot; }
    const session = sessionFingerprint(token);
    if (session === this.activeSession) return this.snapshot;
    this.generation++;
    this.snapshotVersion++;
    this.layoutVersion++;
    this.layoutReadGeneration++;
    this.activeSession = session;
    this.pendingOutpostUpgrades.clear();
    this.pendingLayoutSave = undefined;
    this.stopRealtime?.();
    this.stopRealtime = undefined;
    realtimeClient.disconnect();
    this.publish({ ...INITIAL });
    void this.startRealtime().catch((cause) => {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      this.publish({ ...this.snapshot, stale: true, error });
    });
    return this.refresh();
  }

  async refresh(): Promise<Readonly<CPVillageSnapshot>> {
    const token = getAccessToken();
    if (!token) { this.stop(); return this.snapshot; }
    const session = sessionFingerprint(token);
    if (session !== this.activeSession) return this.start();
    const generation = ++this.generation;
    const layoutGeneration = ++this.layoutReadGeneration;
    this.publish({ ...this.snapshot, loading: true, stale: true, error: null });
    try {
      const [village, wallet, outposts, layout] = await Promise.all([
        villageApi.me(),
        villageApi.wallet(),
        villageApi.outposts().then((result) => isOutpostsSnapshot(result) ? result : null, () => null),
        villageApi.outpostLayout().then((result) => {
          if (!isOutpostLayoutSnapshot(result)) throw new TypeError("Invalid outpost layout snapshot");
          return result;
        }),
      ]);
      if (generation !== this.generation || layoutGeneration !== this.layoutReadGeneration || session !== this.activeSession || session !== sessionFingerprint(getAccessToken() ?? "")) return this.snapshot;
      if (this.snapshot.layout && layout.revision < this.snapshot.layout.revision)
        throw new TypeError("Outpost layout revision regressed");
      this.snapshotVersion++;
      this.layoutVersion++;
      this.publish({ village, wallet, outposts, layout, loading: false, stale: false, error: null, updatedAt: Date.now() });
    } catch (cause) {
      if (generation !== this.generation || layoutGeneration !== this.layoutReadGeneration || session !== this.activeSession || session !== sessionFingerprint(getAccessToken() ?? "")) return this.snapshot;
      const error = cause instanceof Error ? cause : new Error(String(cause));
      this.publish({ ...this.snapshot, loading: false, stale: true, error });
    }
    return this.snapshot;
  }

  /** Save a validated complete layout; ambiguous retries keep their exact body and key. */
  async saveOutpostLayout(draftItems: readonly OutpostLayoutItem[]): Promise<OutpostLayoutSaveResponse> {
    const token = getAccessToken();
    const session = this.activeSession;
    if (!token || !session || session !== sessionFingerprint(token)) throw new Error("No active village session");
    const layout = this.snapshot.layout;
    if (!layout) throw new Error("Outpost layout is unavailable");
    const items = normalizeLayoutItems(draftItems, layout.rules);
    const signature = JSON.stringify(items);
    let pending = this.pendingLayoutSave;
    if (pending && pending.session !== session) {
      this.pendingLayoutSave = undefined;
      pending = undefined;
    }
    if (pending && pending.signature !== signature)
      throw new Error("Retry or resolve the pending outpost layout save before editing it");
    if (!pending) {
      const immutableItems = items.map((item) => Object.freeze({ ...item }));
      pending = {
        session,
        signature,
        request: Object.freeze({
          expected_revision: layout.revision,
          rules_version: layout.rules_version,
          idempotency_key: createIdempotencyKey(),
          items: immutableItems,
        }),
      };
      this.pendingLayoutSave = pending;
    }
    if (pending.promise) return pending.promise;

    const requestLayoutVersion = this.layoutVersion;
    const request = pending.request;
    const operation = villageApi.saveOutpostLayout(request).then(async (response) => {
      this.assertActiveSession(session);
      if (!isOutpostLayoutSaveResponse(response)) throw new TypeError("Invalid outpost layout save response");
      if (this.layoutVersion !== requestLayoutVersion ||
        (this.snapshot.layout !== null && response.layout.revision < this.snapshot.layout.revision)) {
        await this.refreshOutpostLayout(session);
        if (this.pendingLayoutSave === pending) this.pendingLayoutSave = undefined;
        return response;
      }
      // The PUT response is the authoritative new revision; invalidate older pending GETs.
      this.generation++;
      this.layoutReadGeneration++;
      this.layoutVersion++;
      this.publish({ ...this.snapshot, layout: response.layout, loading: false, stale: false, error: null, updatedAt: Date.now() });
      if (this.pendingLayoutSave === pending) this.pendingLayoutSave = undefined;
      return response;
    }).catch(async (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        await this.refreshOutpostLayout(session);
        if (this.pendingLayoutSave === pending) this.pendingLayoutSave = undefined;
      }
      throw error;
    }).finally(() => {
      if (pending?.promise === operation) pending.promise = undefined;
    });
    pending.promise = operation;
    return operation;
  }

  private async refreshOutpostLayout(session: string): Promise<void> {
    if (session !== this.activeSession || session !== sessionFingerprint(getAccessToken() ?? "")) return;
    const generation = ++this.layoutReadGeneration;
    try {
      const layout = await villageApi.outpostLayout();
      if (generation !== this.layoutReadGeneration || session !== this.activeSession || session !== sessionFingerprint(getAccessToken() ?? "")) return;
      if (!isOutpostLayoutSnapshot(layout)) throw new TypeError("Invalid outpost layout snapshot");
      if (this.snapshot.layout && layout.revision < this.snapshot.layout.revision)
        throw new TypeError("Outpost layout revision regressed");
      this.layoutVersion++;
      this.publish({ ...this.snapshot, layout, updatedAt: Date.now() });
    } catch (cause) {
      if (generation !== this.layoutReadGeneration || session !== this.activeSession || session !== sessionFingerprint(getAccessToken() ?? "")) return;
      const error = cause instanceof Error ? cause : new Error(String(cause));
      this.publish({ ...this.snapshot, stale: true, error });
    }
  }

  private assertActiveSession(session: string): void {
    if (session !== this.activeSession || session !== sessionFingerprint(getAccessToken() ?? ""))
      throw new Error("Village session changed during outpost layout save");
  }

  /** Upgrade an outpost; failed/ambiguous calls retain their idempotency key for retry. */
  async upgradeOutpost(topicId: string): Promise<VillageOutpostUpgradeResponse> {
    const token = getAccessToken();
    const session = this.activeSession;
    if (!token || !session || session !== sessionFingerprint(token)) throw new Error("No active village session");
    const outpost = this.snapshot.outposts?.items.find((item) => item.topic_id === topicId);
    if (!outpost) throw new Error("Outpost data is unavailable");

    let pending = this.pendingOutpostUpgrades.get(topicId);
    if (!pending) {
      pending = { expectedTier: outpost.tier, idempotencyKey: createIdempotencyKey() };
      this.pendingOutpostUpgrades.set(topicId, pending);
    }
    if (pending.promise) return pending.promise;

    const requestSnapshotVersion = this.snapshotVersion;
    const operation = villageApi.upgradeOutpost(topicId, {
      idempotency_key: pending.idempotencyKey,
      expected_tier: pending.expectedTier,
    }).then(async (response) => {
      if (session !== this.activeSession || session !== sessionFingerprint(getAccessToken() ?? ""))
        throw new Error("Village session changed during outpost upgrade");
      if (response.upgraded_topic_id !== topicId || !isOutpostsSnapshot(response))
        throw new TypeError("Invalid outpost upgrade response");
      if (this.snapshotVersion !== requestSnapshotVersion) {
        // A completed refresh is newer evidence than this late mutation response.
        if (this.activeSession === session && session === sessionFingerprint(getAccessToken() ?? ""))
          await this.refresh();
        this.pendingOutpostUpgrades.delete(topicId);
        return response;
      }
      // Invalidate any in-flight read so it cannot overwrite this atomic purchase result.
      this.generation++;
      this.snapshotVersion++;
      this.publish({
        ...this.snapshot,
        wallet: response.wallet,
        outposts: { items: response.items, wallet: response.wallet },
        loading: false,
        stale: false,
        error: null,
        updatedAt: Date.now(),
      });
      this.pendingOutpostUpgrades.delete(topicId);
      return response;
    }).catch(async (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        // Keep the old key reserved until the authoritative tier refresh completes.
        if (this.activeSession === session && session === sessionFingerprint(getAccessToken() ?? ""))
          await this.refresh();
        if (this.pendingOutpostUpgrades.get(topicId) === pending)
          this.pendingOutpostUpgrades.delete(topicId);
      }
      throw error;
    }).finally(() => {
      if (pending?.promise === operation) pending.promise = undefined;
    });
    pending.promise = operation;
    return operation;
  }

  /** Realtime messages are invalidation hints; refetch authoritative backend snapshots. */
  async startRealtime(): Promise<() => void> {
    this.stopRealtime?.();
    const generation = ++this.realtimeGeneration;
    if (!getAccessToken()) return () => undefined;
    realtimeClient.connect();
    const unsubscribe = await notificationsApi.subscribe((event) => this.onRealtimeEvent(event));
    if (generation !== this.realtimeGeneration) { unsubscribe(); return () => undefined; }
    this.stopRealtime = unsubscribe;
    return () => {
      if (this.stopRealtime === unsubscribe) this.stopRealtime = undefined;
      unsubscribe();
    };
  }

  stop(): void {
    if (this.activeSession === null && this.snapshot.village === null && this.snapshot.wallet === null && !this.snapshot.loading && this.snapshot.error === null) return;
    this.generation++;
    this.snapshotVersion++;
    this.layoutVersion++;
    this.layoutReadGeneration++;
    this.realtimeGeneration++;
    this.stopRealtime?.();
    this.stopRealtime = undefined;
    realtimeClient.disconnect();
    this.activeSession = null;
    this.pendingOutpostUpgrades.clear();
    this.pendingLayoutSave = undefined;
    this.publish({ ...INITIAL });
  }

  private onRealtimeEvent(event: EventEnvelope): void {
    if (["VILLAGE_UPDATED", "SYNC_STATUS_CHANGED", "ATTACK_RESOLVED", "OUTPOST_UPDATED", "OUTPOSTS_UPDATED", "OUTPOST_UPGRADED", "OUTPOST_LAYOUT_UPDATED"].includes(event.event_type)) void this.refresh();
  }

  private publish(snapshot: CPVillageSnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener(this.snapshot);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CP_VILLAGE_STATE_EVENT, { detail: this.snapshot }));
  }
}

/** Prefer stable subject/session claims so access-token rotation is not mistaken for account change. */
function sessionFingerprint(token: string): string {
  try {
    const payload = token.split(".")[1];
    if (!payload) return token;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { sub?: unknown; sid?: unknown };
    if (decoded.sub != null || decoded.sid != null) return `${String(decoded.sub ?? "")}:${String(decoded.sid ?? "")}`;
  } catch { /* opaque tokens fall back to exact token identity */ }
  return token;
}

export const cpVillageStore = new CPVillageStore();
/** App-level command seam for HUD callers; store owns session checks and retry idempotency. */
export const upgradeVillageOutpost = (topicId: string) => cpVillageStore.upgradeOutpost(topicId);
/** App-level command seam for layout editors; pending retries reuse one immutable PUT request. */
export const saveOutpostLayout = (items: readonly OutpostLayoutItem[]) => cpVillageStore.saveOutpostLayout(items);

function isOutpostsSnapshot(value: VillageOutpostsSnapshot | VillageOutpostUpgradeResponse): value is VillageOutpostsSnapshot & { upgraded_topic_id?: string } {
  const wallet = value?.wallet;
  return Array.isArray(value?.items) && value.items.every((item) =>
    typeof item.topic_id === "string" && Number.isSafeInteger(item.tier) && item.tier >= 0 &&
    item.tier <= 5 &&
    validOutpostCost(item.next_gold_cost, item.tier) &&
    validOutpostCost(item.next_elixir_cost, item.tier),
  ) && !!wallet && [wallet.coins, wallet.gems, wallet.gold, wallet.elixir, wallet.rewarded_solves, wallet.builder_capacity].every(Number.isFinite);
}

function validOutpostCost(cost: number | null, tier: number): boolean {
  return (typeof cost === "number" && Number.isFinite(cost) && cost >= 0) || (tier === 5 && cost === null);
}

function createIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `outpost-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isOutpostLayoutSnapshot(value: OutpostLayoutSnapshot): boolean {
  const rules = value?.rules;
  return Number.isSafeInteger(value?.revision) && value.revision >= 0 && value.rules_version === 1 &&
    rules?.coordinate_space === "village-grid" && rules.min_x === 8 && rules.min_y === 8 &&
    rules.max_x_exclusive === 40 && rules.max_y_exclusive === 40 &&
    rules.footprint_width === 3 && rules.footprint_height === 3 &&
    Array.isArray(rules.allowed_facings) && rules.allowed_facings.length === 2 &&
    rules.allowed_facings[0] === "default" && rules.allowed_facings[1] === "mirrored" &&
    validateLayoutItems(value.items, rules);
}

function isOutpostLayoutSaveResponse(value: OutpostLayoutSaveResponse): boolean {
  return typeof value?.operation_id === "string" && value.operation_id.length > 0 &&
    Number.isSafeInteger(value.applied_revision) && value.applied_revision >= 0 &&
    typeof value.replayed === "boolean" && isOutpostLayoutSnapshot(value.layout) &&
    value.applied_revision <= value.layout.revision;
}

function validateLayoutItems(items: readonly OutpostLayoutItem[], rules: OutpostLayoutRules): boolean {
  if (!Array.isArray(items) || items.length !== 8) return false;
  const topicIds = new Set<string>();
  return items.every((item) => {
    if (!item || typeof item.topic_id !== "string" || topicIds.has(item.topic_id) ||
      !Number.isSafeInteger(item.x) || !Number.isSafeInteger(item.y) ||
      !rules.allowed_facings.includes(item.facing)) return false;
    topicIds.add(item.topic_id);
    return item.x >= rules.min_x && item.y >= rules.min_y &&
      item.x + rules.footprint_width <= rules.max_x_exclusive &&
      item.y + rules.footprint_height <= rules.max_y_exclusive;
  });
}

function normalizeLayoutItems(items: readonly OutpostLayoutItem[], rules: OutpostLayoutRules): OutpostLayoutItem[] {
  if (!validateLayoutItems(items, rules)) throw new TypeError("Invalid outpost layout draft");
  return items.map(({ topic_id, x, y, facing }) => ({ topic_id, x, y, facing }));
}
