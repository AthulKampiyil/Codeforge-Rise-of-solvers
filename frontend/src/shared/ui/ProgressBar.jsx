// Labelled progress bar — topic influence bars, XP-style meters.
//
// Accent classes are looked up from a literal map (never interpolated
// into a template string) because Tailwind's JIT compiler only
// generates classes it can find as whole strings in the source.
const ACCENT_BAR = {
  gold: "bg-gold",
  success: "bg-success",
  danger: "bg-danger",
  info: "bg-info",
};

export default function ProgressBar({ label, value, max = 100, accent = "gold", suffix }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex flex-col gap-1">
      {(label || suffix) && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          {label && <span>{label}</span>}
          {suffix && <span className="font-mono">{suffix}</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg/80" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${ACCENT_BAR[accent] ?? ACCENT_BAR.gold}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
