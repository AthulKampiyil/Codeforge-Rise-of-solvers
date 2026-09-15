const API = import.meta.env.VITE_API_URL || "";
export async function getSyncStatus() {
  const response = await fetch(`${API}/platform_sync/status`, { credentials: "include" });
  if (!response.ok) throw new Error("Unable to load sync status");
  return response.json();
}

export async function requestSync() {
  const response = await fetch(`${API}/platform_sync/sync`, {
    method: "POST", credentials: "include",
  });
  if (!response.ok) {
    const error = new Error("Sync request failed");
    error.status = response.status;
    try {
      const body = await response.json();
      error.retryAfter = body.detail?.retry_after_seconds;
    } catch {
      // The status code is still useful when the server has no JSON body.
    }
    throw error;
  }
  return response.json();
}
