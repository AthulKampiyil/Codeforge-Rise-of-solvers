import { useEffect, useState } from "react";
import { Badge, ProgressBar } from "../../../shared/ui/index.js";

function formatDuration(seconds) {
  if (seconds <= 0) return "Expired";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  return `${m}m ${s}s`;
}

export default function LiveProgress({ solvedCount, totalCount, windowExpiresAt, status, remainingSeconds: initialRemaining }) {
  const [secondsLeft, setSecondsLeft] = useState(initialRemaining || 0);

  useEffect(() => {
    if (windowExpiresAt) {
      const diff = Math.max(0, Math.floor((new Date(windowExpiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    } else if (initialRemaining) {
      setSecondsLeft(initialRemaining);
    }
  }, [windowExpiresAt, initialRemaining]);

  useEffect(() => {
    if (secondsLeft <= 0 || status !== "in_progress") return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, status]);

  const percentage = totalCount > 0 ? (solvedCount / totalCount) * 100 : 0;
  const isExpired = secondsLeft <= 0 && status === "in_progress";

  const getStatusBadge = () => {
    switch (status) {
      case "in_progress":
        return isExpired ? <Badge variant="warning">Window Expired</Badge> : <Badge variant="info">In Progress</Badge>;
      case "resolved":
      case "completed":
        return <Badge variant="success">Resolved</Badge>;
      case "abandoned":
        return <Badge variant="danger">Abandoned</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Attack Progress
          </span>
          <div className="mt-1 font-mono text-xl font-bold text-slate-100">
            Solved {solvedCount} / {totalCount}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {getStatusBadge()}
          {status === "in_progress" && (
            <span className="font-mono text-xs text-gold">
              ⏳ {formatDuration(secondsLeft)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar
          value={percentage}
          max={100}
          variant={percentage >= 34 ? "success" : "warning"}
        />
        <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
          <span>0/3 Solved</span>
          <span className="text-gold">Threshold: 1/3 (34%)</span>
          <span>3/3 Solved</span>
        </div>
      </div>
    </div>
  );
}
