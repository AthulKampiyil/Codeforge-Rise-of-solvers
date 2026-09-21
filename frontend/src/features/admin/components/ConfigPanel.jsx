// UC-12: list every game-balance key and edit it in place. A write
// takes effect for every API/worker process immediately — no restart —
// because the backend busts its Redis cache on PUT.
import { useState } from "react";

import { DataTable, Skeleton } from "../../../shared/ui/index.js";
import { useToast } from "../../../shared/ui/index.js";
import { useConfigList, useUpdateConfig } from "../hooks/useAdmin.js";

function ConfigValueEditor({ entry, onSave, isSaving }) {
  const [draft, setDraft] = useState(() =>
    entry.value_type === "dict" ? JSON.stringify(entry.value, null, 0) : String(entry.value)
  );
  const [error, setError] = useState(null);

  function handleSave() {
    setError(null);
    let parsed;
    try {
      if (entry.value_type === "int") {
        parsed = parseInt(draft, 10);
        if (Number.isNaN(parsed)) throw new Error("Not a whole number");
      } else if (entry.value_type === "float") {
        parsed = parseFloat(draft);
        if (Number.isNaN(parsed)) throw new Error("Not a number");
      } else if (entry.value_type === "dict") {
        parsed = JSON.parse(draft);
      } else {
        parsed = draft;
      }
    } catch (e) {
      setError(e.message || "Invalid value");
      return;
    }
    onSave(entry.key, parsed);
  }

  const isDirty = draft !== (entry.value_type === "dict" ? JSON.stringify(entry.value, null, 0) : String(entry.value));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {entry.value_type === "dict" ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            className="w-64 rounded-md border border-border bg-bg px-2 py-1 font-mono text-xs text-slate-100 outline-none focus:border-gold"
          />
        ) : (
          <input
            type={entry.value_type === "int" || entry.value_type === "float" ? "number" : "text"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-36 rounded-md border border-border bg-bg px-2 py-1 font-mono text-xs text-slate-100 outline-none focus:border-gold"
          />
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="rounded-md border border-gold/40 bg-gold/10 px-2 py-1 text-xs font-medium text-gold transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export default function ConfigPanel() {
  const { data: entries, isLoading, isError } = useConfigList();
  const updateConfig = useUpdateConfig();
  const toast = useToast();
  const [savingKey, setSavingKey] = useState(null);

  async function handleSave(key, value) {
    setSavingKey(key);
    try {
      await updateConfig.mutateAsync({ key, value });
      toast.show(`${key} updated`, { variant: "success" });
    } catch (err) {
      toast.show(err.detail || `Failed to update ${key}`, { variant: "danger" });
    } finally {
      setSavingKey(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-danger">Couldn't load game-balance config.</p>;
  }

  return (
    <DataTable
      getRowKey={(row) => row.key}
      emptyMessage="No config keys."
      columns={[
        {
          key: "key",
          header: "Key",
          render: (row) => (
            <div className="flex flex-col">
              <span className="font-mono text-xs text-slate-100">{row.key}</span>
              {row.description && <span className="text-xs text-slate-500">{row.description}</span>}
            </div>
          ),
        },
        { key: "value_type", header: "Type", align: "center" },
        {
          key: "value",
          header: "Value",
          render: (row) => (
            <ConfigValueEditor entry={row} onSave={handleSave} isSaving={savingKey === row.key} />
          ),
        },
      ]}
      rows={entries}
    />
  );
}
