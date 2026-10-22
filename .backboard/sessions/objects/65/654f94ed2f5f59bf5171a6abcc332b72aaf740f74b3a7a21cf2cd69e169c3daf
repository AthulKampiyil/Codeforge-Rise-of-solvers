// Bordered container — the base surface every screen is built from.
export default function Panel({ title, actions, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-border bg-panel ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          {title && (
            <h2 className="font-display text-sm uppercase tracking-wide text-slate-300">{title}</h2>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
