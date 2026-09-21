// Every route declared up front (docs/WORK_SPLIT_50.md §3) so a lane
// only ever replaces its own placeholder element here — nobody edits
// this file's structure after the seed commit lands.
import { createBrowserRouter } from "react-router-dom";

import App from "../App.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import RegisterPage from "../features/auth/pages/RegisterPage.jsx";
import OnboardingPage from "../features/auth/pages/OnboardingPage.jsx";
import AdminPage from "../features/admin/pages/AdminPage.jsx";
import PlaceholderPage from "../pages/_Placeholder.jsx";
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
            <PlaceholderPage title="Village" owner="Niranjan" figure="Fig 3.1" />
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
            <PlaceholderPage title="Village" owner="Niranjan" figure="Fig 3.1" />
          </RequireAuth>
        ),
      },
      {
        path: "war-map",
        element: (
          <RequireAuth>
            <PlaceholderPage title="War Map" owner="Athul" figure="Fig 3.1" />
          </RequireAuth>
        ),
      },
      {
        path: "guild",
        element: (
          <RequireAuth>
            <PlaceholderPage title="Guild" owner="Athul" figure="Fig 3.2" />
          </RequireAuth>
        ),
      },
      {
        path: "guild/browse",
        element: (
          <RequireAuth>
            <PlaceholderPage title="Browse Guilds" owner="Athul" />
          </RequireAuth>
        ),
      },
      {
        path: "attack",
        element: (
          <RequireAuth>
            <PlaceholderPage title="Attacks" owner="Hari" />
          </RequireAuth>
        ),
      },
      {
        path: "attack/:attackId",
        element: (
          <RequireAuth>
            <PlaceholderPage title="Attack Detail" owner="Hari" />
          </RequireAuth>
        ),
      },
      {
        path: "league",
        element: (
          <RequireAuth>
            <PlaceholderPage title="Standings" owner="Hari" figure="Fig 3.3" />
          </RequireAuth>
        ),
      },
      {
        path: "war-room/:guildId",
        element: (
          <RequireAuth>
            <PlaceholderPage title="War Room" owner="Deferred past 50% (docs/WORK_SPLIT_50.md)" />
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
