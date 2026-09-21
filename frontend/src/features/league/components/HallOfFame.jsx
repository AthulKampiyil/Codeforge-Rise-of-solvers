export default function HallOfFame() {
  const pastChampions = [
    { season: "Season II", winner: "ByteKnights", mvp: "tourist_fan", trophies: "3,420 🏆", starGuild: "Algorithm Guild" },
    { season: "Season I", winner: "BitShift Empire", mvp: "graph_master", trophies: "3,150 🏆", starGuild: "Binary Treehouse" },
  ];

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-slate-100">
          🏛️ Hall of Fame (Past Seasons)
        </h3>
        <span className="text-xs text-slate-400">Historical Standings</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {pastChampions.map((c) => (
          <div
            key={c.season}
            className="flex flex-col justify-between rounded-lg border border-border/70 bg-bg/50 p-3.5"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gold">{c.season}</span>
                <span className="rounded bg-gold/10 px-2 py-0.5 font-mono text-[10px] text-gold">
                  CHAMPIONS
                </span>
              </div>
              <div className="mt-2 font-display text-sm font-bold text-slate-200">
                {c.winner}
              </div>
              <div className="text-xs text-slate-400">
                MVP: <span className="text-slate-300 font-medium">{c.mvp}</span> · {c.starGuild}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
              <span className="text-slate-400">Winning Trophies:</span>
              <span className="font-mono font-bold text-gold">{c.trophies}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
