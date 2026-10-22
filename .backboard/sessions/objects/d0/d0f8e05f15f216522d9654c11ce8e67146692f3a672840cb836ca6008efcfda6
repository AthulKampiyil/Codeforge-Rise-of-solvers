import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  apiClient,
  ApiError,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  onAuthExpired,
  request,
} from "../client.js";

describe("apiClient & token management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("stores and clears tokens in localStorage", () => {
    setTokens({ access_token: "acc-123", refresh_token: "ref-456" });
    expect(getAccessToken()).toBe("acc-123");
    expect(getRefreshToken()).toBe("ref-456");

    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("sends Authorization header when access token is present", async () => {
    setTokens({ access_token: "token-abc", refresh_token: "ref-xyz" });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ hello: "world" }),
    });

    const data = await apiClient.get("/test-endpoint");
    expect(data).toEqual({ hello: "world" });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/test-endpoint"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-abc",
        }),
      })
    );
  });

  it("handles 204 No Content by returning null", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const data = await apiClient.delete("/resource/1");
    expect(data).toBeNull();
  });

  it("throws ApiError on HTTP error status with JSON body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ code: "not_found", detail: "Item does not exist" }),
    });

    // Catch the single rejection rather than re-issuing the request: the
    // mock above is a one-shot, so a second call would fall through to the
    // real network and raise a TypeError that is not an ApiError, which
    // would skip these assertions and pass vacuously.
    const err = await apiClient.get("/missing").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.code).toBe("not_found");
    expect(err.detail).toBe("Item does not exist");
  });

  describe("401 -> refresh -> retry flow (REQ-1.6)", () => {
    it("successfully refreshes token and retries request on 401", async () => {
      setTokens({ access_token: "expired-token", refresh_token: "valid-refresh" });

      const fetchSpy = vi.spyOn(globalThis, "fetch")
        // 1st request -> 401 unauthorized
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ code: "token_expired" }),
        })
        // 2nd request -> /auth/refresh returns new tokens
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ access_token: "fresh-access", refresh_token: "fresh-refresh" }),
        })
        // 3rd request -> retried original request succeeds with 200
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: "retried_ok" }),
        });

      const result = await apiClient.get("/village/me");
      expect(result).toEqual({ success: true, data: "retried_ok" });

      // Verify tokens were refreshed in storage
      expect(getAccessToken()).toBe("fresh-access");
      expect(getRefreshToken()).toBe("fresh-refresh");

      // Verify retried call used the newly refreshed token
      expect(fetchSpy).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining("/village/me"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fresh-access",
          }),
        })
      );
    });

    it("coalesces concurrent 401 requests into a single refresh call", async () => {
      setTokens({ access_token: "expired", refresh_token: "refresh-token" });

      let refreshCalls = 0;

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
        const path = String(url);
        if (path.includes("/auth/refresh")) {
          refreshCalls += 1;
          return {
            ok: true,
            status: 200,
            json: async () => ({ access_token: "new-token", refresh_token: "new-refresh" }),
          };
        }
        if (path.includes("/res1") || path.includes("/res2")) {
          // If called without new-token, return 401; otherwise return 200
          if (getAccessToken() === "new-token") {
            return {
              ok: true,
              status: 200,
              json: async () => ({ ok: true }),
            };
          }
          return {
            ok: false,
            status: 401,
            json: async () => ({ code: "expired" }),
          };
        }
        return { ok: false, status: 500 };
      });

      // Fire 2 concurrent requests
      const [r1, r2] = await Promise.all([
        apiClient.get("/res1"),
        apiClient.get("/res2"),
      ]);

      expect(r1).toEqual({ ok: true });
      expect(r2).toEqual({ ok: true });
      // Only 1 refresh request was sent
      expect(refreshCalls).toBe(1);
    });

    it("triggers onAuthExpired and clears tokens when refresh fails", async () => {
      setTokens({ access_token: "expired", refresh_token: "bad-refresh" });

      const expiredHandler = vi.fn();
      const unsub = onAuthExpired(expiredHandler);

      vi.spyOn(globalThis, "fetch")
        // 1st request -> 401
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ code: "unauthorized" }),
        })
        // refresh call -> 401 failure
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ code: "refresh_revoked" }),
        });

      await expect(apiClient.get("/village/me")).rejects.toThrow(ApiError);
      expect(expiredHandler).toHaveBeenCalled();
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();

      unsub();
    });

    it("triggers onAuthExpired when retried request returns second 401", async () => {
      setTokens({ access_token: "token1", refresh_token: "ref1" });

      const expiredHandler = vi.fn();
      const unsub = onAuthExpired(expiredHandler);

      vi.spyOn(globalThis, "fetch")
        // 1st request -> 401
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ code: "unauthorized" }),
        })
        // refresh call -> 200
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ access_token: "token2", refresh_token: "ref2" }),
        })
        // 2nd request (retry) -> still 401
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ code: "unauthorized" }),
        });

      await expect(apiClient.get("/village/me")).rejects.toThrow(ApiError);
      expect(expiredHandler).toHaveBeenCalled();
      expect(getAccessToken()).toBeNull();

      unsub();
    });
  });
});
