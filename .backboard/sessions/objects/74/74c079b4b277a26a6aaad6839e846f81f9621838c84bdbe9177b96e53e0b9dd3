import { apiClient } from "../../../shared/api/client.js";

/**
 * Fetch viable attack targets from matchmaking tolerance band (REQ-4.1).
 */
export function getAttackTargets(limit = 10) {
  return apiClient.get(`/attacks/targets?limit=${limit}`);
}

/**
 * Check durable cooldown status backed by Postgres (REQ-4.4).
 */
export function getCooldownStatus() {
  return apiClient.get("/attacks/cooldown");
}

/**
 * Launch an attack against target user (REQ-4.1).
 */
export function launchAttack(targetUserId) {
  return apiClient.post("/attacks", { target_user_id: targetUserId });
}

/**
 * Get full attack details with problem set and progress (REQ-4.2).
 */
export function getAttackDetail(attackId) {
  return apiClient.get(`/attacks/${attackId}`);
}

/**
 * Get active/recent attacks launched by current user.
 */
export function getMyActiveAttacks() {
  return apiClient.get("/attacks/active");
}

/**
 * Explicitly resolve attack on-demand (REQ-4.3).
 */
export function resolveAttack(attackId, isAbandoned = false) {
  return apiClient.post(`/attacks/${attackId}/resolve?is_abandoned=${isAbandoned}`);
}
