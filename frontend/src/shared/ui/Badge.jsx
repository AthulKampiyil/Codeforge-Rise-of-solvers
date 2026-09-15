// Small status pill — league tier, sync status, attack state, etc.
const VARIANTS = {
  default: "border-border bg-bg/60 text-slate-300",
  gold: "border-gold/40 bg-gold/10 text-gold",
  success: "border-success/40 bg-success/10 text-success",
  danger: "border-danger/40 bg-danger/10 text-danger",
  info: "border-info/40 bg-info/10 text-info",
};

export default function Badge({ children, variant = "default" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
        VARIANTS[variant] ?? VARIANTS.default
      }`}
    >
      {children}
    </span>
  );
}
