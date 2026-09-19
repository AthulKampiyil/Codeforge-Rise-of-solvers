// Shared shell for Login/Register — dark CODEVILLE panel, minimal by
// design since neither screen is in the wireframe (docs/lanes/ashar-
// auth-platform.md §3): match the panel/border treatment from Fig 3.2.
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-panel p-6 shadow-xl">
        <h1 className="font-display text-2xl text-slate-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>}
      </div>
    </div>
  );
}
