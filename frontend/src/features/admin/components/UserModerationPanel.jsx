// UC-11: search users and suspend/unsuspend them. Suspension bites
// immediately — get_current_active_user rejects the user's next
// request on every gated endpoint (attacks, guild, judge linking).
import { useState } from "react";

import { Badge, DataTable, Modal, Skeleton, useToast } from "../../../shared/ui/index.js";
import { useSuspendUser, useUnsuspendUser, useUserList } from "../hooks/useAdmin.js";

export default function UserModerationPanel() {
  const [search, setSearch] = useState("");
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [reason, setReason] = useState("");

  const { data: users, isLoading, isError } = useUserList({ search: search || undefined });
  const suspendUser = useSuspendUser();
  const unsuspendUser = useUnsuspendUser();
  const toast = useToast();

  async function confirmSuspend() {
    try {
      await suspendUser.mutateAsync({ userId: suspendTarget.id, reason });
      toast.show(`${suspendTarget.username} suspended`, { variant: "success" });
      setSuspendTarget(null);
      setReason("");
    } catch (err) {
      toast.show(err.detail || "Couldn't suspend user", { variant: "danger" });
    }
  }

  async function handleUnsuspend(user) {
    try {
      await unsuspendUser.mutateAsync(user.id);
      toast.show(`${user.username} unsuspended`, { variant: "success" });
    } catch (err) {
      toast.show(err.detail || "Couldn't unsuspend user", { variant: "danger" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Search username or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xs rounded-md border border-border bg-bg px-3 py-2 text-sm text-slate-100 outline-none focus:border-gold"
      />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : isError ? (
        <p className="text-sm text-danger">Couldn't load users.</p>
      ) : (
        <DataTable
          getRowKey={(row) => row.id}
          emptyMessage="No users match."
          columns={[
            { key: "username", header: "Username" },
            { key: "email", header: "Email" },
            {
              key: "status",
              header: "Status",
              align: "center",
              render: (row) =>
                row.is_suspended ? (
                  <Badge variant="danger">Suspended</Badge>
                ) : row.is_admin ? (
                  <Badge variant="gold">Admin</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                ),
            },
            {
              key: "actions",
              header: "",
              align: "right",
              render: (row) =>
                row.is_suspended ? (
                  <button
                    type="button"
                    onClick={() => handleUnsuspend(row)}
                    className="rounded-md border border-success/40 bg-success/10 px-2 py-1 text-xs font-medium text-success hover:opacity-90"
                  >
                    Unsuspend
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSuspendTarget(row)}
                    className="rounded-md border border-danger/40 bg-danger/10 px-2 py-1 text-xs font-medium text-danger hover:opacity-90"
                  >
                    Suspend
                  </button>
                ),
            },
          ]}
          rows={users}
        />
      )}

      <Modal open={Boolean(suspendTarget)} onClose={() => setSuspendTarget(null)} title="Suspend user">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-300">
            Suspend <span className="font-mono text-slate-100">{suspendTarget?.username}</span>? They will
            be locked out of attacks, guild actions, and judge linking until unsuspended.
          </p>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Reason (recorded in the audit log)</span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
              className="rounded-md border border-border bg-bg px-3 py-2 text-slate-100 outline-none focus:border-gold"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSuspendTarget(null)}
              className="rounded-md border border-border px-3 py-2 text-sm text-slate-300 hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmSuspend}
              disabled={!reason.trim() || suspendUser.isPending}
              className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-medium text-danger hover:opacity-90 disabled:opacity-40"
            >
              {suspendUser.isPending ? "Suspending…" : "Suspend"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
