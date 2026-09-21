// Root layout — full top nav, frozen after the seed commit (docs/
// WORK_SPLIT_50.md §6). Every lane adds screens under routes/index.jsx,
// never here.
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "./shared/auth/AuthContext.jsx";

const NAV_LINKS = [
  { to: "/village", label: "Village" },
  { to: "/war-map", label: "War Map" },
  { to: "/guild", label: "Guild" },
  { to: "/league", label: "Season" },
  { to: "/attack", label: "Events" },
];

function navLinkClassName({ isActive }) {
  return `text-xs font-medium uppercase tracking-wide transition-colors ${
    isActive ? "text-gold" : "text-slate-400 hover:text-slate-100"
  }`;
}

export default function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-panel px-6 py-3">
        <NavLink to="/" className="font-display text-lg tracking-wide text-slate-100">
          CODEFORGE
        </NavLink>

        {isAuthenticated && (
          <nav className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClassName}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="font-mono text-xs text-slate-400">{user?.username}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-medium uppercase tracking-wide text-slate-400 hover:text-danger"
              >
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/login" className="text-xs font-medium uppercase tracking-wide text-gold">
              Sign in
            </NavLink>
          )}
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
