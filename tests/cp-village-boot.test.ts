import { afterEach, describe, expect, it, vi } from "vitest";
import { CPVillageStore } from "../src/cp/store";
import type { OutpostLayoutItem } from "../src/cp/types";

let accessToken: string | null = null;
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => key === "codeforge.accessToken" ? accessToken : null,
} });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const outposts = (gold: number, tier: number) => ({
  items: [{ topic_id: "topic-one", tier, next_gold_cost: tier === 5 ? null : 100, next_elixir_cost: tier === 5 ? null : 50 }],
  wallet: { coins: 10, gems: 2, gold, elixir: 80, rewarded_solves: 3, builder_capacity: 4 },
});
const layoutSnapshot = (revision = 1) => ({
  revision,
  rules_version: 1 as const,
  rules: {
    coordinate_space: "village-grid" as const,
    min_x: 8 as const, min_y: 8 as const,
    max_x_exclusive: 40 as const, max_y_exclusive: 40 as const,
    footprint_width: 3 as const, footprint_height: 3 as const,
    allowed_facings: ["default", "mirrored"] as ["default", "mirrored"],
  },
  items: Array.from({ length: 8 }, (_, index) => ({
    topic_id: `topic-${index}`,
    x: 8 + (index % 4) * 8,
    y: 8 + Math.floor(index / 4) * 8,
    facing: "default" as const,
  })),
});
afterEach(() => { accessToken = null; vi.restoreAllMocks(); });

describe("CP village boot store lifecycle", () => {
  it("starts authenticated snapshots, replaces old account state, and clears on stop/logout", async () => {
    accessToken = "session-one";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const auth = new Headers(init?.headers).get("Authorization");
      const userId = auth === "Bearer session-two" ? "user-two" : "user-one";
      if (String(input).endsWith("/village/me")) {
        return json({ user_id: userId, username: userId, total_solved: 0, average_level: 0, topics: [], defense_rating: 0 });
      }
      if (String(input).endsWith("/economy/wallet")) return json({ coins: userId === "user-two" ? 20 : 10, gems: 0, rewarded_solves: 0 });
      if (String(input).endsWith("/village/outposts")) return json(outposts(userId === "user-two" ? 20 : 10, 0));
      if (String(input).endsWith("/village/outposts/layout")) return json(layoutSnapshot());
      throw new Error(`Unexpected request: ${String(input)}`);
    });

    const store = new CPVillageStore();
    await store.start();
    expect(store.getSnapshot().village?.user_id).toBe("user-one");
    expect(store.getSnapshot().wallet?.coins).toBe(10);
    expect(store.getSnapshot().outposts?.items[0]?.topic_id).toBe("topic-one");
    expect(store.getSnapshot().layout?.revision).toBe(1);

    accessToken = "session-two";
    await store.start();
    expect(store.getSnapshot().village?.user_id).toBe("user-two");
    expect(store.getSnapshot().wallet?.coins).toBe(20);
    expect(store.getSnapshot().outposts?.wallet.gold).toBe(20);
    expect(store.getSnapshot().layout?.revision).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(8);

    accessToken = null;
    await store.start();
    expect(store.getSnapshot().village).toBeNull();
    expect(store.getSnapshot().wallet).toBeNull();
    expect(store.getSnapshot().outposts).toBeNull();
    expect(store.getSnapshot().layout).toBeNull();
    expect(store.getSnapshot().stale).toBe(true);
  });

  it("reuses an ambiguous upgrade idempotency key and publishes its wallet/outposts atomically", async () => {
    accessToken = "upgrade-session";
    let postAttempts = 0;
    const requestBodies: Array<{ idempotency_key: string; expected_tier: number }> = [];
    const store = new CPVillageStore();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const path = String(input);
      if (path.endsWith("/village/me"))
        return json({ user_id: "user-one", username: "one", total_solved: 0, average_level: 0, topics: [], defense_rating: 0 });
      if (path.endsWith("/economy/wallet")) return json(outposts(100, 0).wallet);
      if (path.endsWith("/village/outposts")) return json(outposts(100, 0));
      if (path.endsWith("/village/outposts/layout")) return json(layoutSnapshot());
      if (path.endsWith("/village/outposts/topic-one/upgrade")) {
        postAttempts++;
        requestBodies.push(JSON.parse(String(init?.body)) as typeof requestBodies[number]);
        if (postAttempts === 1) throw new Error("response lost after request");
        return json({ ...outposts(60, 1), upgraded_topic_id: "topic-one" });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    await store.start();
    const published: Array<{ gold?: number; tier?: number }> = [];
    store.subscribe((snapshot) => published.push({ gold: snapshot.wallet?.gold, tier: snapshot.outposts?.items[0]?.tier }));

    await expect(store.upgradeOutpost("topic-one")).rejects.toThrow("response lost after request");
    await expect(store.upgradeOutpost("topic-one")).resolves.toMatchObject({ upgraded_topic_id: "topic-one" });

    expect(postAttempts).toBe(2);
    expect(requestBodies[1]).toEqual(requestBodies[0]);
    expect(requestBodies[0]?.expected_tier).toBe(0);
    expect(store.getSnapshot().wallet?.gold).toBe(60);
    expect(store.getSnapshot().outposts?.wallet.gold).toBe(60);
    expect(store.getSnapshot().outposts?.items[0]?.tier).toBe(1);
    expect(published.at(-1)).toEqual({ gold: 60, tier: 1 });
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/upgrade"))).toHaveLength(2);
  });

  it("keeps the authenticated village snapshot usable when the optional outpost endpoint is unavailable", async () => {
    accessToken = "optional-outposts-session";
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const path = String(input);
      if (path.endsWith("/village/me"))
        return json({ user_id: "user-one", username: "one", total_solved: 0, average_level: 0, topics: [], defense_rating: 0 });
      if (path.endsWith("/economy/wallet")) return json({ coins: 10, gems: 0, rewarded_solves: 0 });
      if (path.endsWith("/village/outposts")) return json({ detail: "not deployed" }, 404);
      if (path.endsWith("/village/outposts/layout")) return json(layoutSnapshot());
      throw new Error(`Unexpected request: ${path}`);
    });
    const store = new CPVillageStore();
    await store.start();
    expect(store.getSnapshot().village?.user_id).toBe("user-one");
    expect(store.getSnapshot().stale).toBe(false);
    expect(store.getSnapshot().outposts).toBeNull();
  });

  it("accepts null costs only for tier-five outposts", async () => {
    accessToken = "tier-five-session";
    let tier = 5;
    let invalidNullCosts = false;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const path = String(input);
      if (path.endsWith("/village/me"))
        return json({ user_id: "user-one", username: "one", total_solved: 0, average_level: 0, topics: [], defense_rating: 0 });
      if (path.endsWith("/economy/wallet")) return json(outposts(10, 0).wallet);
      if (path.endsWith("/village/outposts")) {
        const snapshot = outposts(10, tier);
        if (invalidNullCosts) snapshot.items[0]!.next_gold_cost = null;
        return json(snapshot);
      }
      if (path.endsWith("/village/outposts/layout")) return json(layoutSnapshot());
      throw new Error(`Unexpected request: ${path}`);
    });
    const store = new CPVillageStore();
    await store.start();
    expect(store.getSnapshot().outposts?.items[0]).toMatchObject({ tier: 5, next_gold_cost: null, next_elixir_cost: null });
    tier = 4;
    invalidNullCosts = true;
    await store.refresh();
    expect(store.getSnapshot().stale).toBe(false);
    expect(store.getSnapshot().outposts).toBeNull();
  });

  it("retires a pending key on a 409, refreshes tier, and retries with a new key", async () => {
    accessToken = "conflict-session";
    let tier = 0;
    const bodies: Array<{ idempotency_key: string; expected_tier: number }> = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const path = String(input);
      if (path.endsWith("/village/me"))
        return json({ user_id: "user-one", username: "one", total_solved: 0, average_level: 0, topics: [], defense_rating: 0 });
      if (path.endsWith("/economy/wallet")) return json(outposts(100, tier).wallet);
      if (path.endsWith("/village/outposts")) return json(outposts(100, tier));
      if (path.endsWith("/village/outposts/layout")) return json(layoutSnapshot());
      if (path.endsWith("/village/outposts/topic-one/upgrade")) {
        bodies.push(JSON.parse(String(init?.body)) as typeof bodies[number]);
        if (bodies.length === 1) {
          tier = 1;
          return json({ code: "tier_conflict" }, 409);
        }
        tier = 2;
        return json({ ...outposts(80, tier), upgraded_topic_id: "topic-one" });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const store = new CPVillageStore();
    await store.start();
    await expect(store.upgradeOutpost("topic-one")).rejects.toMatchObject({ status: 409 });
    expect(store.getSnapshot().outposts?.items[0]?.tier).toBe(1);
    await store.upgradeOutpost("topic-one");
    expect(bodies[0]?.expected_tier).toBe(0);
    expect(bodies[1]?.expected_tier).toBe(1);
    expect(bodies[1]?.idempotency_key).not.toBe(bodies[0]?.idempotency_key);
  });

  it("does not let a late upgrade response overwrite a newer completed refresh", async () => {
    accessToken = "late-response-session";
    let latest = outposts(100, 0);
    let finishUpgrade!: (value: Response) => void;
    const delayedUpgrade = new Promise<Response>((resolve) => { finishUpgrade = resolve; });
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const path = String(input);
      if (path.endsWith("/village/me"))
        return json({ user_id: "user-one", username: "one", total_solved: 0, average_level: 0, topics: [], defense_rating: 0 });
      if (path.endsWith("/economy/wallet")) return json(latest.wallet);
      if (path.endsWith("/village/outposts")) return json(latest);
      if (path.endsWith("/village/outposts/layout")) return json(layoutSnapshot());
      if (path.endsWith("/village/outposts/topic-one/upgrade")) return delayedUpgrade;
      throw new Error(`Unexpected request: ${path}`);
    });
    const store = new CPVillageStore();
    await store.start();
    const upgrade = store.upgradeOutpost("topic-one");
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(5));
    latest = outposts(60, 2);
    await store.refresh();
    finishUpgrade(json({ ...outposts(70, 1), upgraded_topic_id: "topic-one" }));
    await upgrade;
    expect(store.getSnapshot().wallet?.gold).toBe(60);
    expect(store.getSnapshot().outposts?.items[0]?.tier).toBe(2);
  });

  it("fails the authenticated snapshot closed when required layout GET is unavailable", async () => {
    accessToken = "missing-layout-session";
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const path = String(input);
      if (path.endsWith("/village/me")) return json({ user_id: "u", username: "u", total_solved: 0, average_level: 0, topics: [], defense_rating: 0 });
      if (path.endsWith("/economy/wallet")) return json(outposts(10, 0).wallet);
      if (path.endsWith("/village/outposts")) return json(outposts(10, 0));
      if (path.endsWith("/village/outposts/layout")) return json({ detail: "not ready" }, 503);
      throw new Error(`Unexpected request: ${path}`);
    });
    const store = new CPVillageStore();
    const snapshot = await store.start();
    expect(snapshot.stale).toBe(true);
    expect(snapshot.layout).toBeNull();
  });

  it("retains the immutable layout PUT body and idempotency key after an ambiguous failure", async () => {
    accessToken = "layout-retry-session";
    let attempts = 0;
    const bodies: Array<{ expected_revision: number; rules_version: number; idempotency_key: string; items: Array<{ topic_id: string; x: number; y: number; facing: string }> }> = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const path = String(input);
      if (path.endsWith("/village/me")) return json({ user_id: "u", username: "u", total_solved: 0, average_level: 0, topics: [], defense_rating: 0 });
      if (path.endsWith("/economy/wallet")) return json(outposts(10, 0).wallet);
      if (path.endsWith("/village/outposts")) return json(outposts(10, 0));
      if (path.endsWith("/village/outposts/layout") && init?.method !== "PUT") return json(layoutSnapshot());
      if (path.endsWith("/village/outposts/layout") && init?.method === "PUT") {
        attempts++;
        bodies.push(JSON.parse(String(init.body)) as typeof bodies[number]);
        if (attempts === 1) throw new Error("lost response");
        const request = bodies.at(-1)!;
        return json({ operation_id: "layout-op", applied_revision: 2, replayed: true, layout: { ...layoutSnapshot(2), items: request.items } });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const store = new CPVillageStore();
    await store.start();
    const draft = layoutSnapshot().items.map((item, index) => ({ ...item, ...(index === 0 ? { x: 12 } : {}) }));
    await expect(store.saveOutpostLayout(draft)).rejects.toThrow("lost response");
    draft[0]!.x = 20;
    const retryDraft = layoutSnapshot().items.map((item, index) => ({ ...item, ...(index === 0 ? { x: 12 } : {}) }));
    await store.saveOutpostLayout(retryDraft);
    expect(bodies[1]).toEqual(bodies[0]);
    expect(bodies[0]?.expected_revision).toBe(1);
    expect(bodies[0]?.items[0]?.x).toBe(12);
    expect(store.getSnapshot().layout?.revision).toBe(2);
  });

  it("retires a layout idempotency key on 409, fetches conflict state, and retries against its revision", async () => {
    accessToken = "layout-conflict-session";
    let revision = 1;
    const bodies: Array<{ expected_revision: number; rules_version: number; idempotency_key: string; items: OutpostLayoutItem[] }> = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const path = String(input);
      if (path.endsWith("/village/me")) return json({ user_id: "u", username: "u", total_solved: 0, average_level: 0, topics: [], defense_rating: 0 });
      if (path.endsWith("/economy/wallet")) return json(outposts(10, 0).wallet);
      if (path.endsWith("/village/outposts")) return json(outposts(10, 0));
      if (path.endsWith("/village/outposts/layout") && init?.method !== "PUT") return json(layoutSnapshot(revision));
      if (path.endsWith("/village/outposts/layout") && init?.method === "PUT") {
        bodies.push(JSON.parse(String(init.body)) as typeof bodies[number]);
        if (bodies.length === 1) {
          revision = 2;
          return json({ code: "revision_conflict" }, 409);
        }
        revision = 3;
        return json({ operation_id: "layout-op", applied_revision: 3, replayed: false, layout: { ...layoutSnapshot(3), items: bodies[1]!.items } });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const store = new CPVillageStore();
    await store.start();
    const draft = layoutSnapshot().items;
    await expect(store.saveOutpostLayout(draft)).rejects.toMatchObject({ status: 409 });
    expect(store.getSnapshot().layout?.revision).toBe(2);
    await store.saveOutpostLayout(draft);
    expect(bodies[0]?.expected_revision).toBe(1);
    expect(bodies[1]?.expected_revision).toBe(2);
    expect(bodies[1]?.idempotency_key).not.toBe(bodies[0]?.idempotency_key);
  });

  it("does not overwrite a newer layout refresh with a late successful PUT response", async () => {
    accessToken = "layout-late-response-session";
    let currentLayout = layoutSnapshot(1);
    let finishPut!: (value: Response) => void;
    const delayedPut = new Promise<Response>((resolve) => { finishPut = resolve; });
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const path = String(input);
      if (path.endsWith("/village/me")) return json({ user_id: "u", username: "u", total_solved: 0, average_level: 0, topics: [], defense_rating: 0 });
      if (path.endsWith("/economy/wallet")) return json(outposts(10, 0).wallet);
      if (path.endsWith("/village/outposts")) return json(outposts(10, 0));
      if (path.endsWith("/village/outposts/layout") && init?.method !== "PUT") return json(currentLayout);
      if (path.endsWith("/village/outposts/layout") && init?.method === "PUT") return delayedPut;
      throw new Error(`Unexpected request: ${path}`);
    });
    const store = new CPVillageStore();
    await store.start();
    const draft = layoutSnapshot().items;
    const save = store.saveOutpostLayout(draft);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(5));
    currentLayout = layoutSnapshot(3);
    await store.refresh();
    finishPut(json({ operation_id: "late-op", applied_revision: 2, replayed: false, layout: { ...layoutSnapshot(2), items: draft } }));
    await save;
    expect(store.getSnapshot().layout?.revision).toBe(3);
  });

  it("isolates a late layout save response from a switched account", async () => {
    accessToken = "layout-account-one";
    let finishPut!: (value: Response) => void;
    const delayedPut = new Promise<Response>((resolve) => { finishPut = resolve; });
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const path = String(input);
      const accountTwo = new Headers(init?.headers).get("Authorization") === "Bearer layout-account-two";
      if (path.endsWith("/village/me")) return json({ user_id: accountTwo ? "two" : "one", username: "u", total_solved: 0, average_level: 0, topics: [], defense_rating: 0 });
      if (path.endsWith("/economy/wallet")) return json(outposts(10, 0).wallet);
      if (path.endsWith("/village/outposts")) return json(outposts(10, 0));
      if (path.endsWith("/village/outposts/layout") && init?.method !== "PUT") return json(layoutSnapshot(accountTwo ? 7 : 1));
      if (path.endsWith("/village/outposts/layout") && init?.method === "PUT") return delayedPut;
      throw new Error(`Unexpected request: ${path}`);
    });
    const store = new CPVillageStore();
    await store.start();
    const save = store.saveOutpostLayout(layoutSnapshot().items);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(5));

    accessToken = "layout-account-two";
    await store.start();
    finishPut(json({ operation_id: "old-account-op", applied_revision: 2, replayed: false, layout: { ...layoutSnapshot(2) } }));

    await expect(save).rejects.toThrow("Village session changed");
    expect(store.getSnapshot().village?.user_id).toBe("two");
    expect(store.getSnapshot().layout?.revision).toBe(7);
  });
});
