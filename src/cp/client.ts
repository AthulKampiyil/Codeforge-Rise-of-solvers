export const ACCESS_TOKEN_KEY = "codeforge.accessToken";
export const REFRESH_TOKEN_KEY = "codeforge.refreshToken";
export interface Tokens { access_token: string; refresh_token: string; token_type?: string }
export interface RequestOptions extends Omit<RequestInit, "body"> { body?: unknown; skipAuthRetry?: boolean; auth?: boolean }
interface RequestSession { generation: number; identity: string }

function statusMessage(status: number): string {
  if (status === 0) return "Cannot reach the server. Check your connection and try again.";
  if (status === 401) return "Your session ended. Sign in to continue.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "That could not be found.";
  if (status === 408 || status === 429) return "The server is busy. Please wait a moment and try again.";
  if (status >= 500) return "The server could not complete that request. Please try again.";
  return `That request was rejected (status ${status}).`;
}

export class ApiError extends Error {
  constructor(readonly status: number, readonly detail?: unknown, readonly code?: string) {
    super(typeof detail === "string" ? detail : statusMessage(status));
    this.name = "ApiError";
  }
}

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL?.trim() || "/api").replace(/\/$/, "");
}
export const getAccessToken = () => globalThis.localStorage?.getItem(ACCESS_TOKEN_KEY) ?? null;
export const getRefreshToken = () => globalThis.localStorage?.getItem(REFRESH_TOKEN_KEY) ?? null;
export function setTokens(tokens: Tokens): void {
  generation++;
  globalThis.localStorage?.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  globalThis.localStorage?.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}
let generation = 0;
let refreshPromise: { generation: number; identity: string; promise: Promise<Tokens> } | undefined;
const tokenSessionIdentity = (accessToken: string | null, refreshToken: string | null): string => {
  const claimsIdentity = (token: string | null): string | null => {
    if (!token) return null;
    try {
      const payload = token.split(".")[1];
      if (!payload) return null;
      const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { sub?: unknown; sid?: unknown };
      if (claims.sub != null || claims.sid != null) return `${String(claims.sub ?? "")}:${String(claims.sid ?? "")}`;
    } catch { /* opaque tokens use exact-token identity below */ }
    return null;
  };
  return claimsIdentity(accessToken) ?? claimsIdentity(refreshToken) ?? accessToken ?? refreshToken ?? "";
};
const currentSessionIdentity = () => tokenSessionIdentity(getAccessToken(), getRefreshToken());
function captureRequestSession(): RequestSession { return { generation, identity: currentSessionIdentity() }; }
function assertRequestSession(session: RequestSession): void {
  if (session.generation !== generation || session.identity !== currentSessionIdentity())
    throw new ApiError(401, "Session changed", "session_changed");
}
export function clearTokens(): void {
  generation++;
  globalThis.localStorage?.removeItem(ACCESS_TOKEN_KEY);
  globalThis.localStorage?.removeItem(REFRESH_TOKEN_KEY);
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === ACCESS_TOKEN_KEY || event.key === REFRESH_TOKEN_KEY || event.key === null) generation++;
  });
}
const expiredEvent = "codeforge:auth-expired";
export function onAuthExpired(handler: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(expiredEvent, handler);
  return () => window.removeEventListener(expiredEvent, handler);
}
function expireSession(): void {
  clearTokens();
  if (typeof window !== "undefined") window.dispatchEvent(new Event(expiredEvent));
}
async function refreshAccessToken(session: RequestSession): Promise<Tokens> {
  assertRequestSession(session);
  const current = refreshPromise;
  if (current?.generation === session.generation && current.identity === session.identity) return current.promise;

  const refresh_token = getRefreshToken();
  if (!refresh_token) throw new ApiError(401, "Not authenticated", "no_refresh_token");
  const entry = { generation: session.generation, identity: session.identity, promise: Promise.resolve({} as Tokens) };
  entry.promise = (async () => {
    assertRequestSession(session);
    const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token }),
    });
    if (!response.ok) throw new ApiError(response.status, "Session expired", "refresh_failed");
    const tokens = await response.json() as Tokens;
    assertRequestSession(session);
    if (getRefreshToken() !== refresh_token || typeof tokens.access_token !== "string" || typeof tokens.refresh_token !== "string")
      throw new ApiError(401, "Session changed", "session_changed");
    // Internal refresh rotates credentials within the already-validated bound session.
    globalThis.localStorage?.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    globalThis.localStorage?.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    return tokens;
  })();
  refreshPromise = entry;
  try {
    return await entry.promise;
  } finally {
    if (refreshPromise === entry) refreshPromise = undefined;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return requestBound<T>(path, options, captureRequestSession());
}

async function requestBound<T>(path: string, options: RequestOptions, session: RequestSession): Promise<T> {
  const { skipAuthRetry = false, auth = true, ...init } = options;
  const headers = new Headers(init.headers);
  const token = auth ? getAccessToken() : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init, headers,
    body: init.body === undefined ? undefined : init.body instanceof FormData ? init.body : JSON.stringify(init.body),
  });
  if (response.status === 401 && auth && !skipAuthRetry && getRefreshToken()) {
    assertRequestSession(session);
    let tokens: Tokens;
    try { tokens = await refreshAccessToken(session); }
    catch (error) {
      if (session.generation !== generation || session.identity !== currentSessionIdentity())
        throw new ApiError(401, "Session changed", "session_changed");
      expireSession();
      throw error instanceof ApiError
        ? new ApiError(401, "Your session has expired. Please log in again.", "session_expired")
        : error;
    }
    session.identity = tokenSessionIdentity(tokens.access_token, tokens.refresh_token);
    assertRequestSession(session);
    return requestBound<T>(path, { ...options, skipAuthRetry: true }, session);
  }
  if (response.status === 401 && auth && skipAuthRetry) {
    assertRequestSession(session);
    expireSession();
  }
  if (!response.ok) {
    let payload: { detail?: unknown; code?: string } = {};
    try { payload = await response.json() as typeof payload; } catch { /* empty/non-JSON error */ }
    throw new ApiError(response.status, payload.detail, payload.code);
  }
  if (response.status === 204) return null as T;
  return await response.json() as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
};
