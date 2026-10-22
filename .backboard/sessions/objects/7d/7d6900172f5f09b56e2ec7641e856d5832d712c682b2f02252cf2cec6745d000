import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Badge, EmptyState, Panel, Skeleton, useToast } from "../../../shared/ui/index.js";
import CooldownBanner from "../components/CooldownBanner.jsx";
import TargetCard from "../components/TargetCard.jsx";
import { useActiveAttacks, useAttackRealtime, useAttackTargets, useCooldown, useLaunchAttack } from "../hooks/useAttacks.js";

export default function AttackPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { canAttack, remainingSeconds, cooldownMinutes, refetch: refetchCooldown } = useCooldown();
  const { data: targets, isLoading: targetsLoading, error: targetsError, refetch: refetchTargets } = useAttackTargets(15);
  const { data: activeAttacks, isLoading: activeLoading } = useActiveAttacks();
  const launchMutation = useLaunchAttack();

  // Listen for realtime attacks
  useAttackRealtime(
    (payload) => {
      toast?.show(`⚔️ Attack Incoming! ${payload.attacker_username} is attacking your village!`, {
        variant: "warning",
      });
    },
    (payload) => {
      toast?.show(`Battle Resolved — attack ${payload.attack_id.slice(0, 8)} has concluded.`, {
        variant: "info",
      });
      refetchCooldown();
      refetchTargets();
    }
  );

  const handleLaunch = async (targetUserId) => {
    try {
      const attack = await launchMutation.mutateAsync(targetUserId);
      toast?.show("Attack launched! Solve the curated problems before time runs out.", {
        variant: "success",
      });
      navigate(`/attack/${attack.id}`);
    } catch (err) {
      if (err.status === 429) {
        refetchCooldown();
      } else {
        toast?.show(err.detail || err.message || "Failed to launch attack.", {
          variant: "danger",
        });
      }
    }
  };

  const filteredTargets = (targets || []).filter((t) =>
    t.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100">Village Attacks</h1>
          <p className="text-sm text-slate-400">
            Probe opponent villages with targeted challenges to claim Elo trophies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/league"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-gold hover:border-gold/50"
          >
            🏆 View League Standings
          </Link>
        </div>
      </div>

      {/* Cooldown Status Banner */}
      <CooldownBanner
        canAttack={canAttack}
        remainingSeconds={remainingSeconds}
        cooldownMinutes={cooldownMinutes}
      />

      {/* In-Flight / Active Attacks Section */}
      {activeAttacks && activeAttacks.length > 0 && (
        <Panel title="Active In-Flight Battles">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeAttacks.map((atk) => (
              <div
                key={atk.id}
                className="flex items-center justify-between rounded-lg border border-border/80 bg-bg p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      ID: {atk.id.slice(0, 8)}…
                    </span>
                    <Badge variant={atk.status === "in_progress" ? "info" : "neutral"}>
                      {atk.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Started: {new Date(atk.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <Link
                  to={`/attack/${atk.id}`}
                  className="rounded bg-gold/20 px-2.5 py-1 text-xs font-semibold text-gold hover:bg-gold/30"
                >
                  View Battle →
                </Link>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Matchmaking Target Selection */}
      <Panel
        title="Matchmaking Candidates"
        headerAction={
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search solvers…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-md border border-border bg-bg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-gold"
            />
            <button
              onClick={() => refetchTargets()}
              className="rounded border border-border px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
              title="Refresh matchmaking"
            >
              🔄 Refresh
            </button>
          </div>
        }
      >
        <p className="mb-4 text-xs text-slate-400">
          Matched based on SADD §7.3.1.1 tolerance band around your defense rating. Targets in 15m grace or recent 24h attacks are excluded.
        </p>

        {targetsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : targetsError ? (
          <div className="rounded-md border border-danger/40 bg-danger/10 p-4 text-center text-sm text-danger">
            Failed to load matchmaking targets. Please try again.
          </div>
        ) : filteredTargets.length === 0 ? (
          <EmptyState
            title="No Candidates Found"
            description="No matching villages in your tolerance band right now. Tolerance widens automatically as new solvers join."
            actionText="Refresh Matchmaking"
            onAction={() => refetchTargets()}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTargets.map((target) => (
              <TargetCard
                key={target.id}
                target={target}
                canAttack={canAttack}
                onLaunch={handleLaunch}
                isLaunching={launchMutation.isPending}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
