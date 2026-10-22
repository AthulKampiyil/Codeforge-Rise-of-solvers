// Generic ranked/data table — Standings, Guild roster, admin lists.
//
// columns: [{ key, header, align?: "left" | "right" | "center", render?: (row) => node }]
import EmptyState from "./EmptyState.jsx";

// Literal map, not string interpolation — see ProgressBar.jsx for why.
const ALIGN_CLASS = { left: "text-left", right: "text-right", center: "text-center" };

export default function DataTable({ columns, rows, getRowKey, highlightRowKey, emptyMessage = "Nothing here yet." }) {
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-slate-400">
            {columns.map((col) => (
              <th key={col.key} className={`px-3 py-2 ${ALIGN_CLASS[col.align] ?? ALIGN_CLASS.left}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const key = getRowKey ? getRowKey(row) : i;
            const isHighlighted = highlightRowKey != null && key === highlightRowKey;
            return (
              <tr
                key={key}
                className={`border-b border-border/60 ${
                  isHighlighted ? "bg-gold/10" : "hover:bg-bg/40"
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-3 py-2 ${ALIGN_CLASS[col.align] ?? ALIGN_CLASS.left}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
