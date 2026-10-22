const PODIUM_STYLES = {
  1: {
    badge: "👑 1st Place",
    border: "border-gold/60",
    bg: "bg-gradient-to-b from-gold/15 to-panel",
    text: "text-gold",
    crown: "text-2xl",
  },
  2: {
    badge: "🥈 2nd Place",
    border: "border-slate-400/60",
    bg: "bg-gradient-to-b from-slate-400/10 to-panel",
    text: "text-slate-300",
    crown: "text-xl",
  },
  3: {
    badge: "🥉 3rd Place",
    border: "border-amber-700/60",
    bg: "bg-gradient-to-b from-amber-700/10 to-panel",
    text: "text-amber-600",
    crown: "text-lg",
  },
};

export default function PodiumCard({ rank, entry }) {
  if (!entry) return null;

  const style = PODIUM_STYLES[rank] || PODIUM_STYLES[1];

  return (
    <div className={`relative flex flex-col items-center justify-between rounded-xl border p-5 text-center shadow-lg transition-transform hover:-translate-y-1 ${style.border} ${style.bg}`}>
      <div className="absolute -top-3 rounded-full border border-border bg-bg px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-200 shadow">
        {style.badge}
      </div>

      <div className="mt-3 flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-panel text-xl font-bold text-slate-100 shadow-inner">
          {entry.username ? entry.username.slice(0, 2).toUpperCase() : "CF"}
        </div>
        <h3 className="mt-3 font-semibold text-slate-100">{entry.username}</h3>
        <span className="text-xs uppercase text-slate-400">
          {entry.league_tier}
        </span>
      </div>

      <div className="mt-4 flex w-full items-center justify-around border-t border-border/40 pt-3 text-xs">
        <div>
          <div className="text-[10px] text-slate-400 uppercase">Trophies</div>
          <div className={`font-mono font-bold ${style.text}`}>
            {entry.trophy_count} 🏆
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 uppercase">Stars</div>
          <div className="font-mono font-bold text-slate-200">
            ⭐ {Math.floor(entry.trophy_count / 100)}
          </div>
        </div>
      </div>
    </div>
  );
}
