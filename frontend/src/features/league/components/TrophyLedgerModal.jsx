import { Modal, Skeleton } from "../../../shared/ui/index.js";
import { useTrophyLedger } from "../hooks/useLeague.js";

const EVENT_LABELS = {
  attack_win: { label: "Attack Victory", icon: "⚔️", color: "text-success" },
  attack_loss: { label: "Attack Defeat", icon: "💔", color: "text-danger" },
  successful_defense: { label: "Defense Successful", icon: "🛡️", color: "text-success" },
  failed_defense: { label: "Village Breached", icon: "💥", color: "text-danger" },
  attack_abandoned: { label: "Attack Forfeited", icon: "🏳️", color: "text-danger" },
  practice_milestone: { label: "Practice Milestone", icon: "🎯", color: "text-gold" },
};

export default function TrophyLedgerModal({ isOpen, onClose }) {
  const { data: ledger, isLoading, error } = useTrophyLedger(50);

  return (
    <Modal open={isOpen} onClose={onClose} title="📜 Trophy Audit Ledger (SADD App. D)">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-slate-400">
          Append-only immutable record of every trophy mutation and resulting balance.
        </p>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
            Failed to load trophy audit ledger history.
          </div>
        ) : !ledger || ledger.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No trophy transactions recorded yet. Launch an attack to start your ledger!
          </div>
        ) : (
          <div className="max-h-96 divide-y divide-border/50 overflow-y-auto rounded-lg border border-border bg-bg/50">
            {ledger.map((entry) => {
              const meta = EVENT_LABELS[entry.event_type] || {
                label: entry.event_type,
                icon: "🪙",
                color: entry.delta >= 0 ? "text-success" : "text-danger",
              };

              return (
                <div key={entry.id} className="flex items-center justify-between p-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{meta.icon}</span>
                    <div>
                      <div className="font-semibold text-slate-200">{meta.label}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {new Date(entry.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-mono font-bold ${entry.delta > 0 ? "text-success" : entry.delta < 0 ? "text-danger" : "text-slate-300"}`}>
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta} 🏆
                    </div>
                    {entry.resulting_balance !== null && entry.resulting_balance !== undefined && (
                      <div className="text-[10px] text-slate-400">
                        Bal: <span className="font-mono text-slate-300">{entry.resulting_balance}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-slate-300 hover:bg-bg"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
