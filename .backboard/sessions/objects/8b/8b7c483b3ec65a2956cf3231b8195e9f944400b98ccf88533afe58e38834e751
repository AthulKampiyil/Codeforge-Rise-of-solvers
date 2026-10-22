import { Badge } from "../../../shared/ui/index.js";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function CooldownBanner({ canAttack, remainingSeconds, cooldownMinutes }) {
  if (canAttack) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚔️</span>
          <span className="font-medium">Ready for Battle!</span>
          <span className="text-slate-300">— Your forces are assembled. Select a target to strike.</span>
        </div>
        <Badge variant="success">Attacks Available</Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-gold/40 bg-panel px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="animate-pulse text-xl">⏳</span>
        <div>
          <div className="font-semibold text-slate-100">Attack Cooldown Active</div>
          <div className="text-xs text-slate-400">
            Regrouping forces. Standard cooldown is {cooldownMinutes} minutes.
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-base font-bold text-gold">
          {formatTime(remainingSeconds)}
        </span>
        <Badge variant="warning">On Cooldown</Badge>
      </div>
    </div>
  );
}
