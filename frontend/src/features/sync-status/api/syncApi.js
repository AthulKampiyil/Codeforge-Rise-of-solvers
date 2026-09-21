import { apiClient, ApiError } from "../../../shared/api/client.js";

export function getSyncStatus() {
  return apiClient.get("/platform_sync/status");
}

export async function requestSync() {
  try {
    return await apiClient.post("/platform_sync/sync");
  } catch (err) {
    if (err instanceof ApiError) {
      const error = new Error("Sync request failed");
      error.status = err.status;
      // 429's body is {"detail": {"code": "sync_cooldown", "retry_after_seconds": N}} —
      // client.js's ApiError already unwraps the outer "detail" for us.
      error.retryAfter = err.detail?.retry_after_seconds;
      throw error;
    }
    throw err;
  }
}
