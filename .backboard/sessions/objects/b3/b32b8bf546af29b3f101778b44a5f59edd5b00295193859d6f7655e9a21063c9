// UC-11/UC-12 admin console. RequireAuth's adminOnly guard (routes/index.jsx)
// already keeps a non-admin from reaching this page; every call it makes
// is also require_admin-gated server-side.
import { useState } from "react";

import { Panel, Tabs } from "../../../shared/ui/index.js";
import AuditLogPanel from "../components/AuditLogPanel.jsx";
import ConfigPanel from "../components/ConfigPanel.jsx";
import UserModerationPanel from "../components/UserModerationPanel.jsx";

const TABS = [
  { key: "config", label: "Game Balance" },
  { key: "users", label: "Users" },
  { key: "audit", label: "Audit Log" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("config");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-2xl text-slate-100">Admin</h1>
      <p className="mt-1 text-sm text-slate-400">
        Tune game balance at runtime and moderate accounts. Every change here is audited.
      </p>

      <Panel className="mt-6">
        <Tabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />
        <div className="mt-4">
          {activeTab === "config" && <ConfigPanel />}
          {activeTab === "users" && <UserModerationPanel />}
          {activeTab === "audit" && <AuditLogPanel />}
        </div>
      </Panel>
    </div>
  );
}
