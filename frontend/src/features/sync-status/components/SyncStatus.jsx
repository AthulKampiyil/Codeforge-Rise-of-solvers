import React, { useCallback, useEffect, useState } from "react";
import { getSyncStatus, requestSync } from "../api/syncApi";
import "./sync-status.css";

const COOLDOWN = Number(import.meta.env.VITE_ONDEMAND_SYNC_COOLDOWN_SECONDS || 300);

export function SyncStatus({ onRefresh }) {
  const [status, setStatus] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Re-read rather than assume: a successful sync writes a new SyncLog row
  // (and bumps last_sync_at), so the label and "Last sync" clock below are
  // only correct if they come back from the server after every attempt.
  const loadStatus = useCallback(
    () => getSyncStatus().then((rows) => setStatus(rows[0] || null)).catch(() => {}),
    [],
  );

  useEffect(() => { loadStatus(); }, [loadStatus]);
  useEffect(() => { if (!remaining) return undefined; const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [remaining]);

  const degraded = status?.status === "degraded";
  const failed = status?.status === "failed";
  const label = degraded ? "Codeforces degraded" : status?.status === "failed" ? "Account sync failed" : status?.status === "up_to_date" ? "Synced" : "Sync pending";

  const refresh = async () => {
    if (remaining || loading) return;
    setLoading(true);
    setError(null);
    try {
      await requestSync();
      setRemaining(COOLDOWN);
      await loadStatus();
      onRefresh?.();
    } catch (err) {
      // 429 is the expected cooldown, not a fault — reflect it in the button
      // and stay quiet. Everything else (404 no linked judge, 502 judge
      // failure) is a real failure the user needs to see, otherwise the
      // button looks dead.
      if (err.status === 429) {
        setRemaining(err.retryAfter ?? COOLDOWN);
      } else if (err.status === 404) {
        setError("No linked judge account");
      } else if (err.status === 502) {
        setError("Judge sync failed");
      } else {
        setError(err.message || "Sync failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const busy = remaining > 0 || loading;
  const buttonText = loading
    ? "Syncing…"
    : remaining
      ? `Refresh in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
      : "Refresh";

  return (
    <div className={`sync-status ${degraded ? "sync-degraded" : failed ? "sync-failed" : ""}`}>
      <span className="sync-dot" />
      {label}
      {status?.last_synced_at && <time>Last sync {new Date(status.last_synced_at).toLocaleTimeString()}</time>}
      {error && <span className="sync-error">{error}</span>}
      <button disabled={busy} onClick={refresh}>{buttonText}</button>
    </div>
  );
}
