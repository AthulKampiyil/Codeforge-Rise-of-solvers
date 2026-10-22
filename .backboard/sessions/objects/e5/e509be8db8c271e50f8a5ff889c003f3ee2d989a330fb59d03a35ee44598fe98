import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getAttackDetail,
  getAttackTargets,
  getCooldownStatus,
  getMyActiveAttacks,
  launchAttack,
  resolveAttack,
} from "../api/attacksApi.js";

/**
 * Hook to fetch matchmaking candidate targets.
 */
export function useAttackTargets(limit = 10) {
  return useQuery({
    queryKey: ["attacks", "targets", limit],
    queryFn: () => getAttackTargets(limit),
    refetchInterval: 30000,
  });
}

/**
 * Hook to track attack cooldown status with local 1-second countdown ticker.
 */
export function useCooldown() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["attacks", "cooldown"],
    queryFn: getCooldownStatus,
    refetchInterval: 15000,
  });

  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (query.data) {
      if (query.data.next_available_at) {
        const diff = Math.max(
          0,
          Math.floor((new Date(query.data.next_available_at).getTime() - Date.now()) / 1000)
        );
        setRemainingSeconds(diff);
      } else {
        setRemainingSeconds(query.data.remaining_seconds || 0);
      }
    }
  }, [query.data]);

  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          queryClient.invalidateQueries({ queryKey: ["attacks", "cooldown"] });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, queryClient]);

  const canAttack = remainingSeconds === 0 && (query.data ? query.data.can_attack : true);

  return {
    ...query,
    canAttack,
    remainingSeconds,
    nextAvailableAt: query.data?.next_available_at,
    cooldownMinutes: query.data?.cooldown_minutes || 60,
  };
}

/**
 * Hook to fetch detailed attack view for /attack/:id.
 */
export function useAttackDetail(attackId) {
  return useQuery({
    queryKey: ["attacks", "detail", attackId],
    queryFn: () => getAttackDetail(attackId),
    enabled: Boolean(attackId),
    refetchInterval: (query) => {
      // Auto-poll while attack is in progress
      return query.state.data?.status === "in_progress" ? 10000 : false;
    },
  });
}

/**
 * Hook to fetch active user attacks.
 */
export function useActiveAttacks() {
  return useQuery({
    queryKey: ["attacks", "active"],
    queryFn: getMyActiveAttacks,
    refetchInterval: 15000,
  });
}

/**
 * Hook to launch a new attack.
 */
export function useLaunchAttack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId) => launchAttack(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attacks"] });
    },
  });
}

/**
 * Hook to resolve an attack.
 */
export function useResolveAttack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attackId, isAbandoned }) => resolveAttack(attackId, isAbandoned),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attacks", "detail", variables.attackId] });
      queryClient.invalidateQueries({ queryKey: ["attacks"] });
      queryClient.invalidateQueries({ queryKey: ["league"] });
    },
  });
}

/**
 * Hook for live realtime updates (ATTACK_INCOMING, ATTACK_RESOLVED).
 */
export function useAttackRealtime(onIncomingAttack, onAttackResolved) {
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleRealtimeMessage(event) {
      try {
        const data = event.detail || JSON.parse(event.data);
        if (data.type === "ATTACK_INCOMING") {
          queryClient.invalidateQueries({ queryKey: ["attacks"] });
          if (onIncomingAttack) onIncomingAttack(data.payload);
        } else if (data.type === "ATTACK_RESOLVED") {
          queryClient.invalidateQueries({ queryKey: ["attacks"] });
          queryClient.invalidateQueries({ queryKey: ["league"] });
          if (onAttackResolved) onAttackResolved(data.payload);
        }
      } catch {
        // ignore non-json messages
      }
    }

    window.addEventListener("codeforge:realtime", handleRealtimeMessage);
    return () => window.removeEventListener("codeforge:realtime", handleRealtimeMessage);
  }, [queryClient, onIncomingAttack, onAttackResolved]);
}
