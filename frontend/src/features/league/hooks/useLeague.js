import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getLeaderboard, getMyLeagueProfile, getTrophyLedger } from "../api/leagueApi.js";

/**
 * Hook to retrieve user's league profile, tier, rank, and progression.
 */
export function useMyLeagueProfile() {
  return useQuery({
    queryKey: ["league", "me"],
    queryFn: getMyLeagueProfile,
    refetchInterval: 30000,
  });
}

/**
 * Hook to retrieve leaderboard entries.
 */
export function useLeaderboard(scope = "global", limit = 50, offset = 0) {
  return useQuery({
    queryKey: ["league", "leaderboard", scope, limit, offset],
    queryFn: () => getLeaderboard({ scope, limit, offset }),
    refetchInterval: 30000,
  });
}

/**
 * Hook to retrieve user's trophy audit ledger entries.
 */
export function useTrophyLedger(limit = 50) {
  return useQuery({
    queryKey: ["league", "ledger", limit],
    queryFn: () => getTrophyLedger(limit),
  });
}

/**
 * Realtime hook for LEAGUE_TIER_CHANGED.
 */
export function useLeagueRealtime(onTierChanged) {
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleRealtimeMessage(event) {
      try {
        const data = event.detail || JSON.parse(event.data);
        if (data.type === "LEAGUE_TIER_CHANGED") {
          queryClient.invalidateQueries({ queryKey: ["league"] });
          if (onTierChanged) onTierChanged(data.payload);
        }
      } catch {
        // ignore
      }
    }

    window.addEventListener("codeforge:realtime", handleRealtimeMessage);
    return () => window.removeEventListener("codeforge:realtime", handleRealtimeMessage);
  }, [queryClient, onTierChanged]);
}
