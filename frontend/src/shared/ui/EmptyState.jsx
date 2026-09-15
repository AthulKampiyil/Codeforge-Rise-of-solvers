// Placeholder for an empty list/table — "no attacks yet", "no results".
export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-10 text-center">
      <p className="font-display text-sm text-slate-300">{title}</p>
      {description && <p className="text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
