export default function OutcomePreview({
  attackerUsername,
  targetUsername,
  attackerDefense,
  targetDefense,
  attackerTrophyDelta,
  targetTrophyDelta,
  status,
  solvedFraction,
}) {
  const isResolved = status === "resolved" || status === "completed";
  const isAbandoned = status === "abandoned";

  const getDeltaBadge = (delta) => {
    if (delta > 0) return <span className="font-bold text-success">+{delta} 🏆</span>;
    if (delta < 0) return <span className="font-bold text-danger">{delta} 🏆</span>;
    return <span className="font-bold text-slate-400">0 🏆</span>;
  };

  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {isResolved || isAbandoned ? "Battle Outcome & Trophy Movement" : "Elo Outcome Projection"}
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Attacker Box */}
        <div className="rounded-md border border-border/60 bg-bg/50 p-3">
          <div className="text-xs text-slate-400">Attacker</div>
          <div className="font-semibold text-slate-100">{attackerUsername || "You"}</div>
          <div className="mt-1 text-xs text-slate-400">
            Defense: <span className="font-mono text-slate-300">{attackerDefense || 0}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
            <span className="text-slate-400">Trophy Delta:</span>
            {getDeltaBadge(attackerTrophyDelta ?? 0)}
          </div>
        </div>

        {/* Defender Box */}
        <div className="rounded-md border border-border/60 bg-bg/50 p-3">
          <div className="text-xs text-slate-400">Defender</div>
          <div className="font-semibold text-slate-100">{targetUsername || "Opponent"}</div>
          <div className="mt-1 text-xs text-slate-400">
            Defense: <span className="font-mono text-slate-300">{targetDefense || 0}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
            <span className="text-slate-400">Trophy Delta:</span>
            {getDeltaBadge(targetTrophyDelta ?? 0)}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-400">
        {solvedFraction !== undefined && (
          <div className="flex justify-between py-1">
            <span>Solved Fraction:</span>
            <span className="font-mono text-slate-200">{(solvedFraction * 100).toFixed(0)}%</span>
          </div>
        )}
        <p className="mt-1 text-[11px] text-slate-500">
          * Calculated via SADD §7.3.1.3 Elo formula. Solving ≥ 34% awards victory trophies.
        </p>
      </div>
    </div>
  );
}
