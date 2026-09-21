import { Badge } from "../../../shared/ui/index.js";

export default function SeasonHeader() {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-gold/30 bg-gradient-to-r from-panel via-panel to-gold/10 p-6 sm:flex-row sm:items-center">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">Season III · Week 7</Badge>
          <span className="text-xs text-slate-400">12 Days Remaining</span>
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
          Grand League Standings
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Climb through Bronze to Legend tiers by launching targeted village attacks and defending your territory.
        </p>
      </div>

      <div className="flex items-center gap-6 border-t border-border/40 pt-4 sm:border-0 sm:pt-0">
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Prize Pool</div>
          <div className="font-mono text-lg font-bold text-gold">50,000 ⭐</div>
        </div>
      </div>
    </div>
  );
}
