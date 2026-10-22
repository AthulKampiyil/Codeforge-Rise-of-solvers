// Current user, token storage, and auth actions — every other lane's
// screens read `user` from here via useAuth(). Route guarding lives in
// RequireAuth.jsx in this same folder.
import { createContext, useContext, useEffect, useState, useCallback } from "react";

import { apiClient, clearTokens, getAccessToken, onAuthExpired, setTokens } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await apiClient.get("/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // shared/api/client.js fires this when a refresh attempt fails or a
  // freshly-refreshed token still gets a 401 (REQ-1.6's "on second 401,
  // log out"). Tokens are already cleared by the time this fires.
  useEffect(() => onAuthExpired(() => setUser(null)), []);

  const login = useCallback(async (email, password) => {
    const data = await apiClient.post("/auth/login", { email, password });
    setTokens(data);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (username, email, password) => {
      await apiClient.post("/auth/register", { username, email, password });
      // Registration doesn't itself return tokens — log in immediately
      // after so a new user lands straight in onboarding (SRS 5.4: ≤5
      // steps, under 5 minutes).
      return login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // best-effort — clear local state regardless of network/API errors
    }
    clearTokens();
    setUser(null);
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
