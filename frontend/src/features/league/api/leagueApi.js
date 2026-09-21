import { apiClient } from "../../../shared/api/client.js";

/**
 * Fetch authenticated user's current league profile and progression (REQ-7.4).
 */
export function getMyLeagueProfile() {
  return apiClient.get("/league/me");
}

/**
 * Fetch leaderboard standings with global or guild scope (REQ-7.5).
 */
export function getLeaderboard({ scope = "global", limit = 50, offset = 0 } = {}) {
  return apiClient.get(`/league/leaderboard?scope=${scope}&limit=${limit}&offset=${offset}`);
}

/**
 * Fetch authenticated user's append-only trophy audit ledger (SADD App. D).
 */
export function getTrophyLedger(limit = 50) {
  return apiClient.get(`/league/ledger?limit=${limit}`);
}
