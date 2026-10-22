import React, { useEffect, useState } from "react";
import { getSyncStatus, requestSync } from "../api/syncApi";
import "./sync-status.css";

const COOLDOWN = Number(import.meta.env.VITE_ONDEMAND_SYNC_COOLDOWN_SECONDS || 300);

export function SyncStatus({ onRefresh }) {
  const [status, setStatus] = useState(null);
  const [remaining, setRemaining] = useState(0);
  useEffect(() => { getSyncStatus().then((rows) => setStatus(rows[0] || null)).catch(() => {}); }, []);
  useEffect(() => { if (!remaining) return undefined; const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [remaining]);
  const degraded = status?.status === "degraded";
  const failed = status?.status === "failed";
  const label = degraded ? "Codeforces degraded" : status?.status === "failed" ? "Account sync failed" : status?.status === "up_to_date" ? "Synced" : "Sync pending";
  const refresh = async () => {
    if (remaining) return;
    try { await requestSync(); setRemaining(COOLDOWN); onRefresh?.(); }
    catch (error) { if (error.status === 429) setRemaining(error.retryAfter ?? COOLDOWN); }
  };
  return <div className={`sync-status ${degraded ? "sync-degraded" : failed ? "sync-failed" : ""}`}><span className="sync-dot" />{label}{status?.last_synced_at && <time>Last sync {new Date(status.last_synced_at).toLocaleTimeString()}</time>}<button disabled={remaining > 0} onClick={refresh}>{remaining ? `Refresh in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` : "Refresh"}</button></div>;
}
