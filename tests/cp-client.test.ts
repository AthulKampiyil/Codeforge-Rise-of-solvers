import { afterEach, describe, expect, it, vi } from "vitest";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, apiClient, clearTokens, setTokens } from "../src/cp/client";
import { attacksApi, authApi, villageApi } from "../src/cp/api";
import { realtimeClient } from "../src/cp/realtime";
import type { EconomyLedgerEntry, EquippedCosmetic, GuildMembership, TerritoryZone, TrophyLedgerEntry } from "../src/cp/types";
const data = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key),
} });
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
afterEach(() => { realtimeClient.disconnect(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); clearTokens(); });

describe("CP API client", () => {
  it("refreshes once then retries a request with the new bearer token", async () => {
    setTokens({ access_token: "expired", refresh_token: "old-refresh" });
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValueOnce(response({ detail: "expired" }, 401));
    fetchMock.mockResolvedValueOnce(response({ access_token: "fresh", refresh_token: "new-refresh", user: {} }));
    fetchMock.mockResolvedValueOnce(response({ ok: true }));
    await expect(apiClient.get("/private")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
    expect(new Headers(fetchMock.mock.calls[2][1]?.headers).get("Authorization")).toBe("Bearer fresh");
    expect(data.get(REFRESH_TOKEN_KEY)).toBe("new-refresh");
  });
  it("does not replay a 401 mutation after credentials switch accounts during refresh", async () => {
    setTokens({ access_token: "user-one-access", refresh_token: "user-one-refresh" });
    let finishRefresh!: (value: Response) => void;
    const pendingRefresh = new Promise<Response>((resolve) => { finishRefresh = resolve; });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).endsWith("/auth/refresh")) return pendingRefresh;
      return response({ detail: "expired" }, 401);
    });
    const mutation = apiClient.post("/village/outposts/topic/upgrade", { idempotency_key: "k" });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    setTokens({ access_token: "user-two-access", refresh_token: "user-two-refresh" });
    finishRefresh(response({ access_token: "user-one-fresh", refresh_token: "user-one-new-refresh" }));
    await expect(mutation).rejects.toMatchObject({ code: "session_changed" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(data.get(ACCESS_TOKEN_KEY)).toBe("user-two-access");
    expect(data.get(REFRESH_TOKEN_KEY)).toBe("user-two-refresh");
  });
  it("clears tokens after logout", async () => {
    setTokens({ access_token: "access", refresh_token: "refresh" });
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => response({ message: "Logged out" }));
    await authApi.logout("refresh");
    expect(data.has(ACCESS_TOKEN_KEY)).toBe(false); expect(data.has(REFRESH_TOKEN_KEY)).toBe(false);
  });
  it("preserves local tokens when server logout fails", async () => {
    setTokens({ access_token: "access", refresh_token: "refresh" });
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => response({ detail: "unavailable" }, 503));
    await expect(authApi.logout("refresh")).rejects.toMatchObject({ status: 503 });
    expect(data.get(ACCESS_TOKEN_KEY)).toBe("access");
    expect(data.get(REFRESH_TOKEN_KEY)).toBe("refresh");
  });
  it("maps endpoint methods and query values to router paths and parses queued sync responses", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => String(input).includes("platform_sync")
      ? response({ status: "queued", judge_account_id: "account-1" }, 202)
      : response([]));
    await expect(villageApi.sync()).resolves.toEqual({ status: "queued", judge_account_id: "account-1" });
    await attacksApi.targets(4);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/api/platform_sync/sync?judge=codeforces", "/api/attacks/targets?limit=4"]);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST"); expect(fetchMock.mock.calls[1][1]?.method).toBe("GET");
  });
  it("maps outpost reads and upgrades to the typed village endpoints", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => response({ items: [], wallet: {} }));
    await villageApi.outposts();
    await villageApi.upgradeOutpost("topic/one", { idempotency_key: "stable-key", expected_tier: 2 });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/village/outposts",
      "/api/village/outposts/topic%2Fone/upgrade",
    ]);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("GET");
    expect(fetchMock.mock.calls[1][1]?.method).toBe("POST");
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ idempotency_key: "stable-key", expected_tier: 2 });
  });
  it("maps required outpost layout GET and PUT routes", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => response({}));
    await villageApi.outpostLayout();
    await villageApi.saveOutpostLayout({ expected_revision: 4, rules_version: 1, idempotency_key: "layout-key", items: [] });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/village/outposts/layout",
      "/api/village/outposts/layout",
    ]);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("GET");
    expect(fetchMock.mock.calls[1][1]?.method).toBe("PUT");
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ expected_revision: 4, rules_version: 1, idempotency_key: "layout-key", items: [] });
  });
  it("preserves per-account history progress in sync status overview", async () => {
    const progress = { judge_name: "codeforces", status: "in_progress", last_synced_at: null, last_error: null, history_state: "running", history_rows: 237, history_pages: 2 };
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => String(input).includes("judge-accounts")
      ? response([{ id: "account-1", judge_type: "codeforces", handle: "solver", verified_flag: true, last_sync_at: null, created_at: "now" }])
      : response([progress]));
    await expect(villageApi.syncOverview()).resolves.toEqual([progress]);
  });
  it("sends websocket heartbeats and stops them when the socket closes", () => {
    vi.useFakeTimers();
    setTokens({ access_token: "ws-token", refresh_token: "refresh" });
    let current: MockSocket | undefined;
    class MockSocket {
      static OPEN = 1;
      readyState = 1;
      onopen?: () => void;
      onclose?: (event: CloseEvent) => void;
      onmessage?: (event: MessageEvent) => void;
      onerror?: () => void;
      send = vi.fn();
      close = vi.fn(() => this.onclose?.({} as CloseEvent));
      constructor(readonly url: string) { current = this; }
    }
    vi.stubGlobal("WebSocket", MockSocket);
    realtimeClient.connect();
    current?.onopen?.();
    vi.advanceTimersByTime(20_000);
    expect(current?.send).toHaveBeenCalledWith("ping");
    const socket = current;
    socket?.onclose?.({} as CloseEvent);
    const sent = socket?.send.mock.calls.length;
    vi.advanceTimersByTime(20_000);
    expect(socket?.send).toHaveBeenCalledTimes(sent ?? 0);
    realtimeClient.disconnect();
  });
  it("exposes response fields matching backend guild and ledger contracts", () => {
    const membership: GuildMembership = { guild_id: "g", user_id: "u", role: "member", joined_at: "now", username: "solver", level: 3, solved_count: 12, attack_count: 1 };
    const zone: TerritoryZone = { id: "z", name: "zone", owning_guild_id: null, topic_affinity: {}, description: null, created_at: "now", updated_at: "now", scores: { guild: 2.5 } };
    const economy: EconomyLedgerEntry = { id: "e", solved_problem_id: "p", solve_ordinal: 1, coin_delta: 10, gold_delta: 0, elixir_delta: 0, gem_delta: 0, created_at: "now" };
    const trophy: TrophyLedgerEntry = { id: "t", user_id: "u", event_type: "attack", delta: 5, resulting_balance: 25, source_ref_id: null, created_at: "now" };
    const equipped: EquippedCosmetic | null = null;
    expect([membership.username, zone.scores?.guild, economy.coin_delta, trophy.resulting_balance, equipped]).toEqual(["solver", 2.5, 10, 25, null]);
  });
});
