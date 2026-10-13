export type UUID = string;
export type ISODate = string;
export interface User { id: UUID; username: string; email: string; is_active: boolean; is_admin: boolean; is_suspended: boolean; created_at: ISODate }
export interface JudgeAccount { id: UUID; judge_type: string; handle: string; verified_flag: boolean; last_sync_at: ISODate | null; created_at: ISODate }
export interface TokenResponse { access_token: string; refresh_token: string; token_type: string; user: User }
export interface JudgeLinkResponse { verification_token: string; message: string; judge_account: JudgeAccount }
export interface PendingJudgeProof { verification_token: string }
export interface SyncStatus { judge_name: string; status: "up_to_date" | "in_progress" | "failed" | "degraded" | "unknown"; last_synced_at: ISODate | null; last_error: string | null; history_state: string; history_rows: number; history_pages: number }
export interface SyncQueuedResponse { status: "queued"; judge_account_id: UUID }
export interface SolvedHistoryItem { problem_id: string; tags: string[]; rating: number | null; solved_at: ISODate; credited: boolean }
export interface SolvedHistoryPage { items: SolvedHistoryItem[]; offset: number; limit: number; total: number }
export interface VillageTopic { id: UUID; name: string; display_name: string; structure_key: string; progress_points: number; level: number; points_to_next_level: number; progress_pct: number }
export interface VillageProfile { user_id: UUID; total_solved: number; average_level: number; topics: VillageTopic[]; defense_rating: number; username?: string | null }
export interface Wallet { coins: number; gold: number; elixir: number; gems: number; builder_capacity: number; rewarded_solves: number }
export interface VillageOutpost { topic_id: UUID; tier: number; next_gold_cost: number | null; next_elixir_cost: number | null }
export interface VillageOutpostsSnapshot { items: VillageOutpost[]; wallet: Wallet }
export interface VillageOutpostUpgradeRequest { idempotency_key: string; expected_tier: number }
export interface VillageOutpostUpgradeResponse extends VillageOutpostsSnapshot { upgraded_topic_id: UUID }
export type OutpostLayoutFacing = "default" | "mirrored";
export interface OutpostLayoutRules {
  coordinate_space: "village-grid";
  min_x: 8;
  min_y: 8;
  max_x_exclusive: 40;
  max_y_exclusive: 40;
  footprint_width: 3;
  footprint_height: 3;
  allowed_facings: OutpostLayoutFacing[];
}
export interface OutpostLayoutItem { topic_id: UUID; topic_key?: string; x: number; y: number; facing: OutpostLayoutFacing }
export interface OutpostLayoutSnapshot { revision: number; rules_version: 1; rules: OutpostLayoutRules; items: OutpostLayoutItem[] }
export interface OutpostLayoutSaveRequest { expected_revision: number; rules_version: 1; idempotency_key: string; items: OutpostLayoutItem[] }
export interface OutpostLayoutSaveResponse { operation_id: UUID; applied_revision: number; replayed: boolean; layout: OutpostLayoutSnapshot }
export interface EconomyLedgerEntry { id: UUID; solved_problem_id: UUID; solve_ordinal: number; coin_delta: number; gold_delta: number; elixir_delta: number; gem_delta: number; created_at: ISODate }
export interface EconomyLedgerPage { items: EconomyLedgerEntry[]; offset: number; limit: number }
export interface CatalogItem { id: UUID; sku: string; display_name: string; slot: string; asset_ref: string; coin_price: number; gem_price: number }
export interface Inventory { items: Array<{ inventory_id: UUID; purchased_at: ISODate; item: CatalogItem }>; equipped: Array<{ slot: string; inventory_id: UUID; catalog_item_id: UUID; updated_at: ISODate }> }
export interface EquippedCosmetic { slot: string; inventory_id: UUID; updated_at: ISODate }
export interface CosmeticPurchase { id: UUID; catalog_item_id: UUID; idempotency_key: string; coin_cost: number; gem_cost: number; created_at: ISODate }
export interface AttackTarget { id: UUID; username: string; defense_rating: number; level?: number | null; relative_strength?: string | null }
export interface Attack { id: UUID; attacker_user_id: UUID; target_user_id: UUID; status: string; score: number; solved_fraction?: number | null; started_at: ISODate; window_expires_at?: ISODate | null; resolved_at?: ISODate | null }
export interface AttackDetail extends Attack { problems: Array<Record<string, unknown>>; attacker_username?: string | null; target_username?: string | null; remaining_seconds?: number | null; pending?: boolean; resolution_state?: string | null; not_before?: ISODate | null }
export interface AttackCooldown { can_attack: boolean; cooldown_minutes: number; next_available_at?: ISODate | null; remaining_seconds?: number | null }
export interface Guild { id: UUID; name: string; description: string | null; created_at: ISODate; updated_at: ISODate }
export interface GuildMembership { guild_id: UUID; user_id: UUID; role: string; joined_at: ISODate; username: string; level: number | string; solved_count: number | string; attack_count: number | string }
export interface GuildDetail extends Guild { memberships: GuildMembership[] }
export interface JoinRequest { id: UUID; guild_id: UUID; user_id: UUID; status: string; created_at: ISODate }
export interface LeadershipTransferRequest { target_user_id: UUID }
export interface LeadershipTransferResponse { previous_leader_user_id: UUID; leader_user_id: UUID }
export interface TerritoryZone { id: UUID; name: string; owning_guild_id: UUID | null; topic_affinity: Record<string, unknown>; description: string | null; created_at: ISODate; updated_at: ISODate; map_polygon?: unknown[] | null; scores?: Record<string, number> | null }
export interface WarRoom { guild_id: string; guild: Record<string, unknown>; contested_zones: Array<Record<string, unknown>>; members: Array<Record<string, unknown>> }
export interface LeagueProfile { user_id: UUID; trophy_count: number; league_tier: string; rank: number; updated_at: ISODate; progress_pct?: number | null; next_tier?: string | null; next_tier_threshold?: number | null; k_factor?: number | null }
export interface TrophyLedgerEntry { id: UUID; user_id: UUID; event_type: string; delta: number; resulting_balance?: number | null; source_ref_id?: string | null; created_at: ISODate }
export interface LeaderboardEntry { user_id: UUID; username: string; trophy_count: number; league_tier: string; rank: number }
export interface Season { season_name: string; season_start: ISODate; season_end: ISODate; current_week: number }
export interface Notification { id: UUID; user_id: UUID; event_type: string; payload: Record<string, unknown> | null; is_read: boolean; created_at: ISODate }
export interface EventEnvelope<T = Record<string, unknown>> { event_type: string; event_id: UUID; version: string; timestamp: ISODate; payload: T }

// M9 admin-config response/request contracts.
export type AdminJsonValue = null | boolean | number | string | AdminJsonValue[] | { [key: string]: AdminJsonValue };
export type AdminConfigValue = string | number | { [key: string]: AdminJsonValue };
export interface AdminConfigEntry { key: string; value: AdminConfigValue; value_type: string; description: string | null; updated_by: UUID | null; updated_at: ISODate }
export interface AdminConfigUpdate { key: string; value: AdminConfigValue; value_type: string; updated_by: UUID | null; updated_at: ISODate }
export interface AdminUser { id: UUID; username: string; email: string; is_admin: boolean; is_suspended: boolean; created_at: ISODate }
export interface AdminAuditLogEntry { id: UUID; admin_user_id: UUID; action: string; target_type: string | null; target_id: string | null; details: Record<string, unknown> | null; created_at: ISODate }
