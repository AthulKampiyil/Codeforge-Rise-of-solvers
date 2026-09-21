import { Link, useParams } from "react-router-dom";

import { EmptyState, Modal, Panel, Skeleton, useToast } from "../../../shared/ui/index.js";
import LiveProgress from "../components/LiveProgress.jsx";
import OutcomePreview from "../components/OutcomePreview.jsx";
import ProblemCard from "../components/ProblemCard.jsx";
import { useAttackDetail, useResolveAttack } from "../hooks/useAttacks.js";
import { useState } from "react";

export default function AttackDetailPage() {
  const { attackId } = useParams();
  const toast = useToast();
  const { data: attack, isLoading, error, refetch } = useAttackDetail(attackId);
  const resolveMutation = useResolveAttack();
  const [showAbandonModal, setShowAbandonModal] = useState(false);

  const handleResolve = async (isAbandoned = false) => {
    try {
      await resolveMutation.mutateAsync({ attackId, isAbandoned });
      toast?.show(
        isAbandoned
          ? "Attack abandoned — flat abandon penalty applied."
          : "Battle concluded and trophy deltas recorded to ledger.",
        { variant: isAbandoned ? "warning" : "success" }
      );
      setShowAbandonModal(false);
      refetch();
    } catch (err) {
      toast?.show(err.detail || err.message || "Could not resolve attack.", {
        variant: "danger",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !attack) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <EmptyState
          title="Attack Not Found"
          description="The requested attack record could not be loaded or may have expired."
          actionText="← Back to Attacks"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  const problems = attack.problems || [];
  const solvedCount = problems.filter((p) => p.solved_flag).length;
  const isInProgress = attack.status === "in_progress";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/attack" className="text-xs text-slate-400 hover:text-gold">
              ← Attacks
            </Link>
            <span className="text-xs text-slate-600">/</span>
            <span className="font-mono text-xs text-slate-400">{attack.id.slice(0, 8)}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-100">
            {attack.attacker_username} <span className="text-gold">vs</span> {attack.target_username}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-slate-300 hover:border-gold/50"
          >
            🔄 Sync Status
          </button>
          {isInProgress && (
            <>
              <button
                onClick={() => handleResolve(false)}
                disabled={resolveMutation.isPending}
                className="rounded-md bg-gold px-3.5 py-1.5 text-xs font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {resolveMutation.isPending ? "Resolving…" : "⚔️ Submit & Resolve"}
              </button>
              <button
                onClick={() => setShowAbandonModal(true)}
                className="rounded-md border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10"
              >
                Forfeit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress & Outcome Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <LiveProgress
          solvedCount={solvedCount}
          totalCount={problems.length}
          windowExpiresAt={attack.window_expires_at}
          status={attack.status}
          remainingSeconds={attack.remaining_seconds}
        />

        <OutcomePreview
          attackerUsername={attack.attacker_username}
          targetUsername={attack.target_username}
          attackerDefense={attack.attacker_defense_rating}
          targetDefense={attack.target_defense_rating}
          attackerTrophyDelta={attack.attacker_trophy_delta}
          targetTrophyDelta={attack.target_trophy_delta}
          status={attack.status}
          solvedFraction={attack.solved_fraction}
        />
      </div>

      {/* Curated Problem Set */}
      <Panel
        title="Curated Challenge Problem Set (REQ-4.2)"
        headerAction={
          <span className="text-xs text-slate-400">
            Drawn from target's weakest topics
          </span>
        }
      >
        <p className="mb-4 text-xs text-slate-400">
          Solve these problems on Codeforces with your linked account. Your solutions sync automatically or upon clicking Sync Status.
        </p>

        {problems.length === 0 ? (
          <EmptyState
            title="No Problems Curated"
            description="No specific problems were attached to this attack record."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {problems.map((problem, idx) => (
              <ProblemCard key={problem.id || idx} problem={problem} index={idx} />
            ))}
          </div>
        )}
      </Panel>

      {/* Abandon Confirmation Modal */}
      <Modal
        open={showAbandonModal}
        onClose={() => setShowAbandonModal(false)}
        title="Abandon Battle?"
      >
        <div className="flex flex-col gap-4 text-sm text-slate-300">
          <p>
            Abandoning an attack inside the window applies a flat{" "}
            <strong className="text-danger">-5 Trophy</strong> penalty. The defender's trophies will remain unaffected.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAbandonModal(false)}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-slate-300 hover:bg-panel"
            >
              Cancel
            </button>
            <button
              onClick={() => handleResolve(true)}
              className="rounded-md bg-danger px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Confirm Abandon
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
