import { Badge } from "../../../shared/ui/index.js";

export default function TargetCard({ target, canAttack, onLaunch, isLaunching }) {
  const getStrengthBadge = (strength) => {
    switch (strength) {
      case "weaker":
        return <Badge variant="success">Favorable Target</Badge>;
      case "stronger":
        return <Badge variant="danger">Challenging (+Elo)</Badge>;
      case "even":
      default:
        return <Badge variant="neutral">Even Match</Badge>;
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-lg border border-border bg-panel p-4 transition-all hover:border-gold/50">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-100">{target.username}</h3>
            {target.level !== undefined && (
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-300">
                Lvl {target.level}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <span>🛡️ Defense: <strong className="text-slate-200">{target.defense_rating}</strong></span>
          </div>
        </div>
        <div>
          {getStrengthBadge(target.relative_strength)}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
        <span className="text-xs text-slate-400">3 Curated Problems</span>
        <button
          onClick={() => onLaunch(target.id)}
          disabled={!canAttack || isLaunching}
          className="rounded-md bg-gold px-3.5 py-1.5 text-xs font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLaunching ? "Launching…" : "⚔️ Launch Attack"}
        </button>
      </div>
    </div>
  );
}
