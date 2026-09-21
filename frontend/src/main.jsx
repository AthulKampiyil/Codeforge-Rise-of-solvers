// App entrypoint — router + providers.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import { queryClient } from "./shared/api/queryClient.js";
import { AuthProvider } from "./shared/auth/AuthContext.jsx";
import { ToastProvider } from "./shared/ui/index.js";
import { router } from "./routes/index.jsx";
import "./index.css";
import "./wireframe.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
