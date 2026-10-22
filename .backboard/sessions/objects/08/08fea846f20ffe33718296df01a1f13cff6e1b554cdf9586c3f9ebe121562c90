import { useState } from "react";
import { Badge, Tabs } from "../../../shared/ui/index.js";

const SCOPE_TABS = [
  { key: "global", label: "Global Solvers" },
  { key: "guild", label: "Guild Standings" },
];

export default function StandingsTable({
  entries = [],
  currentUserId,
  currentScope = "global",
  onScopeChange,
}) {
  const [activeTab, setActiveTab] = useState(currentScope);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onScopeChange) onScopeChange(tabId);
  };

  const getTierBadge = (tier) => {
    const t = (tier || "bronze").toLowerCase();
    switch (t) {
      case "legend":
        return <Badge variant="danger">Legend</Badge>;
      case "diamond":
        return <Badge variant="info">Diamond</Badge>;
      case "platinum":
        return <Badge variant="neutral">Platinum</Badge>;
      case "gold":
        return <Badge variant="warning">Gold</Badge>;
      case "silver":
        return <Badge variant="neutral">Silver</Badge>;
      case "bronze":
      default:
        return <Badge variant="neutral">Bronze</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Tabs tabs={SCOPE_TABS} activeKey={activeTab} onChange={handleTabChange} />
        <span className="text-xs text-slate-400">
          Rankings update dynamically on attack resolution
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3 pl-4 pr-2">RNK</th>
              <th className="px-3 py-3">SOLVER</th>
              <th className="px-3 py-3">TIER</th>
              <th className="px-3 py-3 text-center">INFLUENCE</th>
              <th className="px-3 py-3 text-center">TERRITORIES</th>
              <th className="px-3 py-3 text-right">STARS (TROPHIES)</th>
              <th className="px-3 py-3 text-center">WINS</th>
              <th className="px-3 py-3 text-center">LOSSES</th>
              <th className="py-3 pl-3 pr-4 text-center">STREAK</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-slate-200">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                  No standings records found for this scope.
                </td>
              </tr>
            ) : (
              entries.map((row) => {
                const isCurrentUser = row.user_id === currentUserId;
                const stars = Math.floor(row.trophy_count / 100);

                return (
                  <tr
                    key={row.user_id}
                    className={`transition-colors ${
                      isCurrentUser
                        ? "border-l-4 border-gold bg-gold/10 font-semibold text-slate-100"
                        : "hover:bg-bg/40"
                    }`}
                  >
                    {/* RNK */}
                    <td className="py-3 pl-4 pr-2 font-mono text-xs font-bold">
                      {row.rank === 1 ? "🥇 1" : row.rank === 2 ? "🥈 2" : row.rank === 3 ? "🥉 3" : `#${row.rank}`}
                    </td>

                    {/* SOLVER */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span>{row.username}</span>
                        {isCurrentUser && (
                          <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>

                    {/* TIER */}
                    <td className="px-3 py-3">
                      {getTierBadge(row.league_tier)}
                    </td>

                    {/* INFLUENCE (Athul's data -> '—') */}
                    <td className="px-3 py-3 text-center font-mono text-xs text-slate-500">
                      {row.influence !== undefined ? row.influence : "—"}
                    </td>

                    {/* TERRITORIES (Athul's data -> '—') */}
                    <td className="px-3 py-3 text-center font-mono text-xs text-slate-500">
                      {row.territories !== undefined ? row.territories : "—"}
                    </td>

                    {/* STARS (TROPHIES) */}
                    <td className="px-3 py-3 text-right font-mono font-bold text-gold">
                      {row.trophy_count} 🏆{" "}
                      <span className="text-xs text-slate-400 font-normal">({stars}⭐)</span>
                    </td>

                    {/* WINS */}
                    <td className="px-3 py-3 text-center font-mono text-xs text-success">
                      {row.wins !== undefined ? row.wins : "—"}
                    </td>

                    {/* LOSSES */}
                    <td className="px-3 py-3 text-center font-mono text-xs text-danger">
                      {row.losses !== undefined ? row.losses : "—"}
                    </td>

                    {/* STREAK */}
                    <td className="py-3 pl-3 pr-4 text-center font-mono text-xs text-slate-300">
                      {row.streak !== undefined ? `${row.streak}🔥` : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
