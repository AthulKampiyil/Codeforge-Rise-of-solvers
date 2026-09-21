// Every route declared up front (docs/WORK_SPLIT_50.md §3) so a lane
// only ever replaces its own placeholder element here — nobody edits
// this file's structure after the seed commit lands.
import { createBrowserRouter } from "react-router-dom";

import App from "../App.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import RegisterPage from "../features/auth/pages/RegisterPage.jsx";
import OnboardingPage from "../features/auth/pages/OnboardingPage.jsx";
import AdminPage from "../features/admin/pages/AdminPage.jsx";
import { VillageDashboard } from "../features/village/components/VillageDashboard.jsx";
import WarMap from "../features/war-room/components/WarMap.jsx";
import GuildDashboard from "../features/guild-territory/components/GuildDashboard.jsx";
import WarRoom from "../features/war-room/components/WarRoom.jsx";
import AttackPage from "../features/attacks/pages/AttackPage.jsx";
import AttackDetailPage from "../features/attacks/pages/AttackDetailPage.jsx";
import LeagueStandingsPage from "../features/league/pages/LeagueStandingsPage.jsx";
import RequireAuth from "../shared/auth/RequireAuth.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <VillageDashboard />
          </RequireAuth>
        ),
      },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      {
        path: "onboarding",
        element: (
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        ),
      },
      {
        path: "village",
        element: (
          <RequireAuth>
            <VillageDashboard />
          </RequireAuth>
        ),
      },
      {
        path: "war-map",
        element: (
          <RequireAuth>
            <WarMap />
          </RequireAuth>
        ),
      },
      {
        path: "guild",
        element: (
          <RequireAuth>
            <GuildDashboard />
          </RequireAuth>
        ),
      },
      {
        path: "guild/browse",
        element: (
          <RequireAuth>
            <GuildDashboard />
          </RequireAuth>
        ),
      },
      {
        path: "attack",
        element: (
          <RequireAuth>
            <AttackPage />
          </RequireAuth>
        ),
      },
      {
        path: "attack/:attackId",
        element: (
          <RequireAuth>
            <AttackDetailPage />
          </RequireAuth>
        ),
      },
      {
        path: "league",
        element: (
          <RequireAuth>
            <LeagueStandingsPage />
          </RequireAuth>
        ),
      },
      {
        path: "war-room/:guildId",
        element: (
          <RequireAuth>
            <WarRoom />
          </RequireAuth>
        ),
      },
      {
        path: "admin",
        element: (
          <RequireAuth adminOnly>
            <AdminPage />
          </RequireAuth>
        ),
      },
    ],
  },
]);
