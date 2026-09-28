import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";

import { AuthProvider, useAuth } from "../AuthContext.jsx";
import { apiClient, getAccessToken, getRefreshToken, setTokens } from "../../api/client.js";

// The provider owns auth state; the HTTP layer is already covered by
// client.test.js. Mocking apiClient here keeps this suite about the
// context's own contract: who is the current user, and when.
vi.mock("../../api/client.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    apiClient: { get: vi.fn(), post: vi.fn() },
  };
});

function wrapper({ children }) {
  return createElement(AuthProvider, null, children);
}

async function mountAuth() {
  const view = renderHook(() => useAuth(), { wrapper });
  // The provider resolves the boot /auth/me lookup on mount; wait for it so
  // assertions never race the initial isLoading pass.
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

const ALICE = { id: "u-1", username: "alice", email: "alice@example.com" };

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    apiClient.get.mockReset();
    apiClient.post.mockReset();
  });

  describe("boot /auth/me", () => {
    it("loads the current user when a token is present", async () => {
      setTokens({ access_token: "acc-1", refresh_token: "ref-1" });
      apiClient.get.mockResolvedValue(ALICE);

      const { result } = await mountAuth();

      expect(apiClient.get).toHaveBeenCalledWith("/auth/me");
      expect(result.current.user).toEqual(ALICE);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("skips the request entirely when there is no token", async () => {
      const { result } = await mountAuth();

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("falls back to a signed-out state when /auth/me fails", async () => {
      setTokens({ access_token: "expired", refresh_token: "ref-1" });
      apiClient.get.mockRejectedValue(new Error("401"));

      const { result } = await mountAuth();

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("login", () => {
    it("stores the tokens and adopts the returned user", async () => {
      const { result } = await mountAuth();
      apiClient.post.mockResolvedValue({ user: ALICE, access_token: "acc-2", refresh_token: "ref-2" });

      await act(async () => {
        await result.current.login("alice@example.com", "supersecret123");
      });

      expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
        email: "alice@example.com",
        password: "supersecret123",
      });
      expect(result.current.user).toEqual(ALICE);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("propagates a rejected login and stays signed out", async () => {
      const { result } = await mountAuth();
      apiClient.post.mockRejectedValue(new Error("bad credentials"));

      await expect(
        act(async () => {
          await result.current.login("alice@example.com", "wrong");
        })
      ).rejects.toThrow("bad credentials");

      expect(result.current.user).toBeNull();
    });
  });

  describe("register", () => {
    it("registers then logs in, so onboarding can start immediately", async () => {
      const { result } = await mountAuth();
      apiClient.post
        .mockResolvedValueOnce({ id: "u-1" }) // POST /auth/register
        .mockResolvedValueOnce({ user: ALICE, access_token: "acc-3", refresh_token: "ref-3" }); // POST /auth/login

      await act(async () => {
        await result.current.register("alice", "alice@example.com", "supersecret123");
      });

      expect(apiClient.post).toHaveBeenNthCalledWith(1, "/auth/register", {
        username: "alice",
        email: "alice@example.com",
        password: "supersecret123",
      });
      expect(apiClient.post).toHaveBeenNthCalledWith(2, "/auth/login", {
        email: "alice@example.com",
        password: "supersecret123",
      });
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("logout", () => {
    it("clears the user and the stored tokens", async () => {
      setTokens({ access_token: "acc-1", refresh_token: "ref-1" });
      apiClient.get.mockResolvedValue(ALICE);
      apiClient.post.mockResolvedValue(null);
      const { result } = await mountAuth();

      await act(async () => {
        await result.current.logout();
      });

      expect(apiClient.post).toHaveBeenCalledWith("/auth/logout");
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    it("still signs out locally when the logout call fails", async () => {
      setTokens({ access_token: "acc-1", refresh_token: "ref-1" });
      apiClient.get.mockResolvedValue(ALICE);
      apiClient.post.mockRejectedValue(new Error("network down"));
      const { result } = await mountAuth();

      await act(async () => {
        await result.current.logout();
      });

      // Leaving tokens behind after a failed logout would keep the next
      // page load claiming to be signed in.
      expect(result.current.isAuthenticated).toBe(false);
      expect(getAccessToken()).toBeNull();
    });
  });

  it("signs the user out when the api layer reports an expired session", async () => {
    setTokens({ access_token: "acc-1", refresh_token: "ref-1" });
    apiClient.get.mockResolvedValue(ALICE);
    render(createElement(AuthProvider, null, createElement(Probe, null)));

    await screen.findByText("alice");

    // client.js dispatches this when a refresh fails or a retried request
    // 401s again (REQ-1.6). Dispatching the real event is what a dead
    // session looks like from the provider's side.
    await act(async () => {
      window.dispatchEvent(new Event("codeforge:auth-expired"));
    });

    await screen.findByText("signed-out");
  });

  it("throws a useful error when useAuth is used outside the provider", () => {
    function Orphan() {
      useAuth();
      return null;
    }

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(createElement(Orphan))).toThrow(/must be used within an AuthProvider/);
    spy.mockRestore();
  });
});

function Probe() {
  const { user, isLoading } = useAuth();
  if (isLoading) return createElement("span", null, "loading");
  return createElement("span", null, user ? user.username : "signed-out");
}
