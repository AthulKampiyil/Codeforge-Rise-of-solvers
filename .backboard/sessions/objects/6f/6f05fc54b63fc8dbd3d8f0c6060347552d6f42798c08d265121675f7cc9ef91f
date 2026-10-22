// A single labelled number — SOLVED / ATTACKS / STARS style stat row (Fig 3.1).
const ACCENTS = {
  default: "text-slate-100",
  gold: "text-gold",
  success: "text-success",
  danger: "text-danger",
  info: "text-info",
};

export default function StatTile({ label, value, accent = "default" }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-bg/60 px-3 py-2">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`font-mono text-xl font-semibold ${ACCENTS[accent] ?? ACCENTS.default}`}>
        {value}
      </span>
    </div>
  );
}
