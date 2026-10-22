import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { realtimeClient, useRealtimeEvent } from "../client.js";

function wrapperFactory(client) {
  return function wrapper({ children }) {
    return createElement(
      QueryClientProvider,
      { client },
      children
    );
  };
}

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

describe("useRealtimeEvent", () => {
  let queryClient;

  beforeEach(() => {
    queryClient = makeClient();
  });

  afterEach(() => {
    // realtimeClient is a module-level singleton shared with the running
    // app; never leave a listener attached across tests.
    realtimeClient.listeners.clear();
    realtimeClient.shouldReconnect = true;
  });

  it("invokes the handler for a matching event type", () => {
    const handler = vi.fn();
    renderHook(() => useRealtimeEvent("VILLAGE_UPDATED", handler), {
      wrapper: wrapperFactory(queryClient),
    });

    act(() => {
      realtimeClient.notifyListeners("VILLAGE_UPDATED", {
        event_type: "VILLAGE_UPDATED",
        payload: { new_level: 3 },
      });
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      { event_type: "VILLAGE_UPDATED", payload: { new_level: 3 } },
      queryClient
    );
  });

  it("ignores events of other types", () => {
    const handler = vi.fn();
    renderHook(() => useRealtimeEvent("VILLAGE_UPDATED", handler), {
      wrapper: wrapperFactory(queryClient),
    });

    act(() => {
      realtimeClient.notifyListeners("TERRITORY_ZONE_CHANGED", { event_type: "TERRITORY_ZONE_CHANGED" });
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("unsubscribes on unmount so a stale screen stops receiving events", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useRealtimeEvent("VILLAGE_UPDATED", handler), {
      wrapper: wrapperFactory(queryClient),
    });

    expect(realtimeClient.listeners.get("VILLAGE_UPDATED")?.size).toBe(1);

    unmount();

    expect(realtimeClient.listeners.get("VILLAGE_UPDATED")?.size).toBe(0);

    act(() => {
      realtimeClient.notifyListeners("VILLAGE_UPDATED", { event_type: "VILLAGE_UPDATED" });
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("resubscribes when the event type changes", () => {
    const handler = vi.fn();
    const { rerender } = renderHook(
      ({ eventType }) => useRealtimeEvent(eventType, handler),
      {
        wrapper: wrapperFactory(queryClient),
        initialProps: { eventType: "VILLAGE_UPDATED" },
      }
    );

    rerender({ eventType: "ATTACK_INCOMING" });

    act(() => {
      realtimeClient.notifyListeners("VILLAGE_UPDATED", { event_type: "VILLAGE_UPDATED" });
      realtimeClient.notifyListeners("ATTACK_INCOMING", { event_type: "ATTACK_INCOMING" });
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].event_type).toBe("ATTACK_INCOMING");
  });

  it("re-invokes the latest handler without needing a manual reconnect", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ handler }) => useRealtimeEvent("VILLAGE_UPDATED", handler), {
      wrapper: wrapperFactory(queryClient),
      initialProps: { handler: first },
    });

    rerender({ handler: second });

    act(() => {
      realtimeClient.notifyListeners("VILLAGE_UPDATED", { event_type: "VILLAGE_UPDATED" });
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  describe("with no handler supplied", () => {
    it.each([
      ["VILLAGE_UPDATED", ["village"]],
      ["TERRITORY_ZONE_CHANGED", ["territory"]],
      ["ATTACK_INCOMING", ["attacks"]],
      ["ATTACK_RESOLVED", ["attacks"]],
      ["LEAGUE_TIER_CHANGED", ["league"]],
    ])("%s invalidates the %s cache", (eventType, queryKey) => {
      const invalidate = vi.spyOn(queryClient, "invalidateQueries");

      renderHook(() => useRealtimeEvent(eventType, undefined), {
        wrapper: wrapperFactory(queryClient),
      });

      act(() => {
        realtimeClient.notifyListeners(eventType, { event_type: eventType });
      });

      expect(invalidate).toHaveBeenCalledWith({ queryKey });
    });

    it("does not touch any cache for an unmapped event type", () => {
      const invalidate = vi.spyOn(queryClient, "invalidateQueries");

      renderHook(() => useRealtimeEvent("SOMETHING_ELSE", undefined), {
        wrapper: wrapperFactory(queryClient),
      });

      act(() => {
        realtimeClient.notifyListeners("SOMETHING_ELSE", { event_type: "SOMETHING_ELSE" });
      });

      expect(invalidate).not.toHaveBeenCalled();
    });
  });

  describe("realtimeClient subscribe/notify", () => {
    it("notifies every subscriber of a type exactly once", () => {
      const a = vi.fn();
      const b = vi.fn();
      const offA = realtimeClient.subscribe("VILLAGE_UPDATED", a);
      realtimeClient.subscribe("VILLAGE_UPDATED", b);

      realtimeClient.notifyListeners("VILLAGE_UPDATED", { n: 1 });

      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);

      offA();
      realtimeClient.notifyListeners("VILLAGE_UPDATED", { n: 2 });

      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(2);
    });

    it("unsubscribing twice is harmless", () => {
      const handler = vi.fn();
      const off = realtimeClient.subscribe("VILLAGE_UPDATED", handler);

      off();
      expect(() => off()).not.toThrow();
    });

    it("unsubscribing a type that was never subscribed is a no-op", () => {
      expect(() => realtimeClient.unsubscribe("NEVER_SEEN", vi.fn())).not.toThrow();
    });
  });
});
