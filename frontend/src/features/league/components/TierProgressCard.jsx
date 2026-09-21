import { Badge, ProgressBar } from "../../../shared/ui/index.js";

const TIER_COLORS = {
  bronze: "text-amber-600 border-amber-600/30 bg-amber-600/10",
  silver: "text-slate-300 border-slate-300/30 bg-slate-300/10",
  gold: "text-gold border-gold/30 bg-gold/10",
  platinum: "text-teal-400 border-teal-400/30 bg-teal-400/10",
  diamond: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  legend: "text-rose-400 border-rose-400/30 bg-rose-400/10",
};

export default function TierProgressCard({ profile, onOpenLedger }) {
  if (!profile) return null;

  const tier = (profile.league_tier || "bronze").toLowerCase();
  const colorClass = TIER_COLORS[tier] || TIER_COLORS.bronze;

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl border text-2xl font-bold uppercase shadow-inner ${colorClass}`}>
            {tier === "legend" ? "👑" : tier === "diamond" ? "💎" : tier === "platinum" ? "🛡️" : "🏆"}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Your Division
              </span>
              <span className="font-mono text-xs text-slate-400">
                Rank #{profile.rank || 1}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl font-bold uppercase text-slate-100">
                {profile.league_tier} League
              </h2>
              <span className="font-mono text-base font-bold text-gold">
                {profile.trophy_count} 🏆
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-border/60 bg-bg/50 px-3 py-1.5 text-center">
            <div className="text-[10px] uppercase text-slate-400">Elo K-Factor</div>
            <div className="font-mono text-sm font-semibold text-slate-200">
              K = {profile.k_factor || 32}
            </div>
          </div>
          <button
            onClick={onOpenLedger}
            className="rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/20"
          >
            📜 Trophy Ledger
          </button>
        </div>
      </div>

      {/* Progress Bar to Next Tier */}
      {profile.next_tier && (
        <div className="mt-5 border-t border-border/40 pt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Progress to <strong className="uppercase text-slate-200">{profile.next_tier}</strong>
            </span>
            <span className="font-mono text-slate-300">
              {profile.trophy_count} / {profile.next_tier_threshold} 🏆 ({profile.progress_pct || 0}%)
            </span>
          </div>
          <ProgressBar value={profile.progress_pct || 0} max={100} variant="gold" />
        </div>
      )}
    </div>
  );
}
