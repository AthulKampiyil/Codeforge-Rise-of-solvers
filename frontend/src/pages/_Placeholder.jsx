// One per unbuilt route (docs/WORK_SPLIT_50.md §3). A lane replaces its
// own placeholder usage in routes/index.jsx with its real page and
// never touches the router itself — that's what keeps four branches
// from fighting over the same file.
import { Panel } from "../shared/ui/index.js";

export default function PlaceholderPage({ title, owner, figure }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Panel title={title}>
        <p className="text-sm text-slate-400">Coming soon.</p>
        {owner && <p className="mt-2 text-xs text-slate-500">Owner: {owner}</p>}
        {figure && <p className="text-xs text-slate-500">Wireframe: {figure}</p>}
      </Panel>
    </div>
  );
}
