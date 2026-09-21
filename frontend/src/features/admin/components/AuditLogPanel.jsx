// NFR-3.5: browse the admin_audit_log trail — every config change and
// moderation action, who did it, and what changed.
import { DataTable, Skeleton } from "../../../shared/ui/index.js";
import { useAuditLog } from "../hooks/useAdmin.js";

function formatDetails(entry) {
  if (!entry.details) return "—";
  if (entry.action === "set_config") {
    return `${JSON.stringify(entry.details.old_value)} → ${JSON.stringify(entry.details.new_value)}`;
  }
  if (entry.action === "suspend_user") {
    return entry.details.reason;
  }
  return JSON.stringify(entry.details);
}

export default function AuditLogPanel() {
  const { data: entries, isLoading, isError } = useAuditLog();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-danger">Couldn't load the audit log.</p>;
  }

  return (
    <DataTable
      getRowKey={(row) => row.id}
      emptyMessage="No administrative actions yet."
      columns={[
        {
          key: "created_at",
          header: "When",
          render: (row) => (
            <span className="font-mono text-xs text-slate-400">
              {new Date(row.created_at).toLocaleString()}
            </span>
          ),
        },
        { key: "action", header: "Action" },
        {
          key: "target",
          header: "Target",
          render: (row) => (
            <span className="font-mono text-xs">
              {row.target_type ? `${row.target_type}:${row.target_id}` : "—"}
            </span>
          ),
        },
        { key: "details", header: "Details", render: formatDetails },
      ]}
      rows={entries}
    />
  );
}
