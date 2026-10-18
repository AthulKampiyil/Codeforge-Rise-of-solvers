import { apiClient, clearTokens, setTokens } from "./client";
import type { Attack, AttackCooldown, AttackDetail, AttackTarget, CatalogItem, CosmeticPurchase, EconomyLedgerPage, EquippedCosmetic, EventEnvelope, Guild, GuildDetail, Inventory, JoinRequest, JudgeAccount, JudgeLinkResponse, PendingJudgeProof, LeaderboardEntry, LeadershipTransferRequest, LeadershipTransferResponse, LeagueProfile, Notification, OutpostLayoutSaveRequest, OutpostLayoutSaveResponse, OutpostLayoutSnapshot, Season, SolvedHistoryPage, SyncQueuedResponse, SyncStatus, TerritoryZone, TokenResponse, TrophyLedgerEntry, User, VillageOutpostUpgradeRequest, VillageOutpostUpgradeResponse, VillageOutpostsSnapshot, VillageProfile, Wallet, WarRoom } from "./types";
const query = (values: Record<string, string | number | boolean | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined) params.set(key, String(value)); });
  const text = params.toString(); return text ? `?${text}` : "";
};
const pathId = (value: string) => encodeURIComponent(value);

export const authApi = {
  register: (input: { username: string; email: string; password: string }) => apiClient.post<User>("/auth/register", input, { auth: false }),
  login: (input: { email: string; password: string }) => apiClient.post<TokenResponse>("/auth/login", input, { auth: false }).then((tokens) => { setTokens(tokens); return tokens; }),
  refresh: (refresh_token: string) => apiClient.post<TokenResponse>("/auth/refresh", { refresh_token }, { auth: false }).then((tokens) => { setTokens(tokens); return tokens; }),
  // Keep the local session intact on a failed server logout so callers can retry.
  logout: (refresh_token?: string) => apiClient.post<{ message: string }>("/auth/logout", refresh_token ? { refresh_token } : undefined).then((result) => { clearTokens(); return result; }),
  me: () => apiClient.get<User>("/auth/me"),
  linkCodeforces: (handle: string) => apiClient.post<JudgeLinkResponse>("/auth/judge-accounts", { judge_type: "codeforces", handle }),
  linkJudge: (judge_type: string, handle: string) => apiClient.post<JudgeLinkResponse>("/auth/judge-accounts", { judge_type, handle }),
  verifyJudge: (judgeAccountId: string) => apiClient.post<{ message: string; judge_account: JudgeAccount }>(`/auth/judge-accounts/${pathId(judgeAccountId)}/verify`),
  judgeAccounts: () => apiClient.get<JudgeAccount[]>("/auth/judge-accounts"),
  pendingJudgeProof: (judgeAccountId: string) => apiClient.get<PendingJudgeProof>(`/auth/judge-accounts/${pathId(judgeAccountId)}/pending-proof`),
  unlinkJudge: (judgeType: string) => apiClient.delete<{ message: string }>(`/auth/judge-accounts/${pathId(judgeType)}`),
};

export const villageApi = {
  me: () => apiClient.get<VillageProfile>("/village/me"),
  outpostLayout: () => apiClient.get<OutpostLayoutSnapshot>("/village/outposts/layout"),
  saveOutpostLayout: (input: OutpostLayoutSaveRequest) => apiClient.put<OutpostLayoutSaveResponse>("/village/outposts/layout", input),
  outposts: () => apiClient.get<VillageOutpostsSnapshot>("/village/outposts"),
  upgradeOutpost: (topicId: string, input: VillageOutpostUpgradeRequest) => apiClient.post<VillageOutpostUpgradeResponse>(`/village/outposts/${pathId(topicId)}/upgrade`, input),
  syncStatus: () => apiClient.get<SyncStatus[]>("/platform_sync/status"),
  /** `/platform_sync/status` only includes SyncLog rows; linked judges with no log are omitted. */
  syncOverview: async (): Promise<SyncStatus[]> => {
    const [accounts, statuses] = await Promise.all([authApi.judgeAccounts(), villageApi.syncStatus()]);
    const byJudge = new Map(statuses.map((status) => [status.judge_name, status]));
    return accounts.map((account) => ({
      judge_name: account.judge_type, status: "unknown" as const, last_synced_at: account.last_sync_at, last_error: null,
      history_state: "pending", history_rows: 0, history_pages: 0,
      ...byJudge.get(account.judge_type),
    }));
  },
  sync: (judge = "codeforces") => apiClient.post<SyncQueuedResponse>(`/platform_sync/sync${query({ judge })}`),
  solvedHistory: (offset = 0, limit = 50, topic?: string) => apiClient.get<SolvedHistoryPage>(`/platform_sync/problems${query({ offset, limit, topic })}`),
  wallet: () => apiClient.get<Wallet>("/economy/wallet"),
  ledger: (offset = 0, limit = 50) => apiClient.get<EconomyLedgerPage>(`/economy/ledger${query({ offset, limit })}`),
  catalog: () => apiClient.get<CatalogItem[]>("/economy/catalog"),
  inventory: () => apiClient.get<Inventory>("/economy/inventory"),
  purchase: (catalog_item_id: string, idempotency_key: string) => apiClient.post<CosmeticPurchase>("/economy/purchases", { catalog_item_id, idempotency_key }),
  equip: (slot: string, inventory_id: string | null) => apiClient.put<EquippedCosmetic | null>(`/economy/equipment/${pathId(slot)}`, { inventory_id }),
};
export const attacksApi = {
  targets: (limit = 10) => apiClient.get<AttackTarget[]>(`/attacks/targets${query({ limit })}`),
  launch: (target_user_id: string) => apiClient.post<Attack>("/attacks", { target_user_id }),
  cooldown: () => apiClient.get<AttackCooldown>("/attacks/cooldown"), active: () => apiClient.get<Attack[]>("/attacks/active"),
  detail: (attackId: string) => apiClient.get<AttackDetail>(`/attacks/${pathId(attackId)}`),
  resolve: (attackId: string, is_abandoned = false) => apiClient.post<AttackDetail>(`/attacks/${pathId(attackId)}/resolve${query({ is_abandoned })}`),
};
export const guildApi = {
  create: (name: string, description?: string) => apiClient.post<Guild>("/guilds", { name, description }), list: () => apiClient.get<Guild[]>("/guilds"),
  me: () => apiClient.get<GuildDetail | null>("/guilds/me"), detail: (guildId: string) => apiClient.get<GuildDetail>(`/guilds/${pathId(guildId)}`),
  requestJoin: (guildId: string) => apiClient.post<JoinRequest>(`/guilds/${pathId(guildId)}/join-requests`),
  joinRequests: (guildId: string) => apiClient.get<JoinRequest[]>(`/guilds/${pathId(guildId)}/join-requests`),
  approveJoin: (guildId: string, requestId: string) => apiClient.post<JoinRequest>(`/guilds/${pathId(guildId)}/join-requests/${pathId(requestId)}/approve`),
  rejectJoin: (guildId: string, requestId: string) => apiClient.post<JoinRequest>(`/guilds/${pathId(guildId)}/join-requests/${pathId(requestId)}/reject`),
  removeMember: (guildId: string, userId: string) => apiClient.delete<{ message: string }>(`/guilds/${pathId(guildId)}/members/${pathId(userId)}`),
  transferLeadership: (guildId: string, targetUserId: string) => apiClient.post<LeadershipTransferResponse>(`/guilds/${pathId(guildId)}/leader-transfer`, { target_user_id: targetUserId } satisfies LeadershipTransferRequest),
  leave: (guildId: string) => apiClient.post<{ message: string }>(`/guilds/${pathId(guildId)}/leave`),
  territories: () => apiClient.get<TerritoryZone[]>("/guilds/territory/zones"),
  warRoom: (guildId: string) => apiClient.get<WarRoom>(`/war_room/${pathId(guildId)}`),
};
export const leagueApi = {
  me: () => apiClient.get<LeagueProfile>("/league/me"),
  leaderboard: (scope: "global" | "guild" = "global", limit = 50, offset = 0) => apiClient.get<LeaderboardEntry[]>(`/league/leaderboard${query({ scope, limit, offset })}`),
  ledger: (limit = 50) => apiClient.get<TrophyLedgerEntry[]>(`/league/ledger${query({ limit })}`), season: () => apiClient.get<Season>("/league/season"),
};
export const notificationsApi = {
  history: (limit = 50) => apiClient.get<Notification[]>(`/notifications${query({ limit })}`),
  unreadCount: () => apiClient.get<{ unread_count: number }>("/notifications/unread-count"),
  markRead: (notificationId: string) => apiClient.post<{ message: string }>(`/notifications/${pathId(notificationId)}/read`),
  subscribe: (handler: (event: EventEnvelope) => void) => import("./realtime").then(({ realtimeClient }) => realtimeClient.subscribeAll(handler)),
};
