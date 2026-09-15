// Hardened fetch wrapper — base URL from env, Authorization injection,
// and 401 -> refresh -> retry once -> on second 401, log out (REQ-1.6).
// Every authenticated call in every lane should go through this instead
// of calling fetch() directly.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const ACCESS_TOKEN_KEY = "codeforge.accessToken";
const REFRESH_TOKEN_KEY = "codeforge.refreshToken";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens({ access_token, refresh_token }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(status, code, detail) {
    super(detail || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

// Dispatched only when a session that WAS authenticated turns out to be
// dead (refresh failed, or a freshly-refreshed token still got a 401).
// shared/auth/AuthContext listens for this to clear its user state and
// redirect — kept as an event because this module sits outside the
// React tree and shouldn't reach into the router directly.
const AUTH_EXPIRED_EVENT = "codeforge:auth-expired";

function notifyAuthExpired() {
  clearTokens();
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

export function onAuthExpired(handler) {
  window.addEventListener(AUTH_EXPIRED_EVENT, handler);
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler);
}

// Coalesces concurrent 401s (e.g. several queries firing at once) into
// a single /auth/refresh call instead of one per failed request.
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh_token = getRefreshToken();
      if (!refresh_token) {
        throw new ApiError(401, "no_refresh_token", "Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token }),
      });
      if (!response.ok) {
        throw new ApiError(response.status, "refresh_failed", "Session expired");
      }

      const data = await response.json();
      setTokens(data);
      return data.access_token;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * request("/village/me") -> parsed JSON body (or null for 204).
 * Throws ApiError on any non-2xx response.
 */
export async function request(path, { skipAuthRetry = false, ...options } = {}) {
  const accessToken = getAccessToken();
  const headers = {
    ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    if (!skipAuthRetry && getRefreshToken()) {
      try {
        await refreshAccessToken();
      } catch {
        notifyAuthExpired();
        throw new ApiError(401, "session_expired", "Your session has expired. Please log in again.");
      }
      return request(path, { ...options, skipAuthRetry: true });
    }
    if (skipAuthRetry) {
      // Second 401 in a row, even against a freshly refreshed token —
      // the session is genuinely gone.
      notifyAuthExpired();
    }
    // No refresh token and not a retry: a plain auth failure (e.g. bad
    // login credentials) rather than an expired session — let the
    // caller handle the thrown ApiError below without logging anyone out.
  }

  if (!response.ok) {
    let body = {};
    try {
      body = await response.json();
    } catch {
      // non-JSON error body — fall through with an empty detail
    }
    throw new ApiError(response.status, body.code, body.detail);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) =>
    request(path, { ...options, method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: (path, body, options) =>
    request(path, { ...options, method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: (path, body, options) =>
    request(path, { ...options, method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};
