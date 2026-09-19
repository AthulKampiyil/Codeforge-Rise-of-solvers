import { Badge } from "../../../shared/ui/index.js";

export default function ProblemCard({ problem, index }) {
  const isSolved = problem.solved_flag;

  return (
    <div className={`flex flex-col justify-between rounded-lg border p-4 transition-all ${
      isSolved
        ? "border-success/40 bg-success/5"
        : "border-border bg-panel hover:border-border/80"
    }`}>
      <div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-slate-400">
            PROBLEM #{index + 1} ({problem.problem_ext_id})
          </span>
          {isSolved ? (
            <Badge variant="success">✓ Solved</Badge>
          ) : (
            <Badge variant="neutral">Pending Solve</Badge>
          )}
        </div>

        <h4 className="mt-2 text-base font-semibold text-slate-100">
          {problem.problem_name || `Challenge ${problem.problem_ext_id}`}
        </h4>

        <div className="mt-2 flex items-center gap-2">
          {problem.rating && (
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-info">
              Rating: {problem.rating}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-border/40 pt-3">
        {problem.problem_url ? (
          <a
            href={problem.problem_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:underline"
          >
            <span>Open on Codeforces</span>
            <span>↗</span>
          </a>
        ) : (
          <span className="text-xs text-slate-500">Problem link unavailable</span>
        )}
      </div>
    </div>
  );
}
