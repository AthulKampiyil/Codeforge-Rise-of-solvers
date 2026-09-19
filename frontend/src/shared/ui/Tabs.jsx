// Controlled tab strip — Guild ROSTER / TECH / DIPLOMACY, etc.
// tabs: [{ key, label }]
export default function Tabs({ tabs, activeKey, onChange }) {
  return (
    <div className="flex gap-1 border-b border-border" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors ${
              isActive
                ? "border-gold text-gold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
