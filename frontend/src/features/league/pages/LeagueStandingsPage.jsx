import { useState } from "react";

import { useAuth } from "../../../shared/auth/AuthContext.jsx";
import { Panel, Skeleton } from "../../../shared/ui/index.js";
import HallOfFame from "../components/HallOfFame.jsx";
import PodiumCard from "../components/PodiumCard.jsx";
import SeasonHeader from "../components/SeasonHeader.jsx";
import StandingsTable from "../components/StandingsTable.jsx";
import TierProgressCard from "../components/TierProgressCard.jsx";
import TrophyLedgerModal from "../components/TrophyLedgerModal.jsx";
import { useLeaderboard, useLeagueRealtime, useMyLeagueProfile } from "../hooks/useLeague.js";

export default function LeagueStandingsPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState("global");
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  const { data: myProfile, isLoading: profileLoading } = useMyLeagueProfile();
  const { data: leaderboard, isLoading: leaderboardLoading, refetch } = useLeaderboard(scope, 50, 0);

  // Realtime updates on tier changed
  useLeagueRealtime(() => {
    refetch();
  });

  const entries = leaderboard || [];
  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      {/* Season Header Chip & Banner */}
      <SeasonHeader />

      {/* Solver's Tier Progression & Division Status */}
      {profileLoading ? (
        <Skeleton className="h-32" />
      ) : (
        <TierProgressCard
          profile={myProfile}
          onOpenLedger={() => setIsLedgerOpen(true)}
        />
      )}

      {/* Top 3 Podium (SRS Fig 3.3) */}
      <div className="grid gap-4 md:grid-cols-3">
        {leaderboardLoading ? (
          <>
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
          </>
        ) : (
          <>
            <PodiumCard rank={2} entry={top2} />
            <PodiumCard rank={1} entry={top1} />
            <PodiumCard rank={3} entry={top3} />
          </>
        )}
      </div>

      {/* Full Standings Ranked Table (SRS Fig 3.3) */}
      <Panel title="League Standings & Territory Power">
        <StandingsTable
          entries={entries}
          currentUserId={user?.id}
          currentScope={scope}
          onScopeChange={(newScope) => setScope(newScope)}
        />
      </Panel>

      {/* Past Seasons Hall of Fame */}
      <HallOfFame />

      {/* Trophy Ledger History Modal */}
      <TrophyLedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
      />
    </div>
  );
}
