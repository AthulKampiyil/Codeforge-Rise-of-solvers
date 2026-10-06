import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { VillageDashboard } from "../components/VillageDashboard.jsx";
import * as syncApi from "../../sync-status/api/syncApi";
import * as villageApi from "../api/villageApi";

// The Phaser canvas can't boot in jsdom, so hand VillageDashboard a stub
// scene — it's explicitly built to accept one via SceneComponent.
function StubScene() {
  return <div data-testid="village-scene" />;
}

vi.mock("../../sync-status/api/syncApi");
vi.mock("../api/villageApi");
// VillageDashboard statically imports Phaser and VillageScene; Phaser runs
// canvas feature-detection at module scope, which throws in jsdom (no canvas
// backend). Neither is reachable from the sync button, so stub them out —
// the dashboard takes a SceneComponent prop precisely so it can render
// without booting the real canvas.
vi.mock("phaser", () => ({ default: class {} }));
vi.mock("../../../game/VillageScene", () => ({ default: class {} }));

function mockVillage() {
  villageApi.getVillage.mockResolvedValue({ username: "solver", topics: [] });
  villageApi.getTrophies.mockResolvedValue({ trophy_count: 3 });
  syncApi.getSyncStatus.mockResolvedValue([{ status: "up_to_date", last_synced_at: "2026-09-29T10:00:00Z" }]);
}

afterEach(() => {
  vi.clearAllMocks();
});

// useRealtimeEvent calls useQueryClient, so the dashboard needs the same
// QueryClientProvider main.jsx gives it in the real app.
function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <VillageDashboard SceneComponent={StubScene} />
    </QueryClientProvider>,
  );
}

describe("VillageDashboard sync button", () => {
  // Regression: SyncStatus was written with a working API layer and a working
  // cooldown handler, but nothing ever rendered it, so the Refresh button did
  // not exist anywhere in the running app.
  it("renders the on-demand sync Refresh button", async () => {
    mockVillage();
    renderDashboard();
    expect(await screen.findByRole("button", { name: /refresh/i })).toBeTruthy();
  });

  it("calls requestSync and re-reads status plus village data on click", async () => {
    mockVillage();
    syncApi.requestSync.mockResolvedValue({ status: "up_to_date" });
    renderDashboard();
    const button = await screen.findByRole("button", { name: /refresh/i });
    fireEvent.click(button);
    await waitFor(() => expect(syncApi.requestSync).toHaveBeenCalledTimes(1));
    // A successful sync writes new topic levels and trophies server-side, so
    // both have to be re-fetched or the sidebar keeps showing pre-sync data.
    await waitFor(() => expect(villageApi.getVillage.mock.calls.length).toBeGreaterThan(1));
    await waitFor(() => expect(villageApi.getTrophies.mock.calls.length).toBeGreaterThan(1));
    // And the status label must come from the server, not a stale guess.
    await waitFor(() => expect(syncApi.getSyncStatus.mock.calls.length).toBeGreaterThan(1));
  });

  it("disables the button and counts down from the server's 429 retry_after", async () => {
    mockVillage();
    const error = new Error("Sync request failed");
    error.status = 429;
    error.retryAfter = 42;
    syncApi.requestSync.mockRejectedValue(error);
    renderDashboard();
    const button = await screen.findByRole("button", { name: /refresh/i });
    fireEvent.click(button);
    // Uses the server's 42s, not the client default, so the countdown can't
    // drift out of step with the real cooldown window.
    expect(await screen.findByRole("button", { name: "Refresh in 0:42" })).toBeTruthy();
    expect(button.disabled).toBe(true);
  });

  it("surfaces a non-cooldown failure instead of failing silently", async () => {
    mockVillage();
    const error = new Error("Sync request failed");
    error.status = 502;
    syncApi.requestSync.mockRejectedValue(error);
    renderDashboard();
    fireEvent.click(await screen.findByRole("button", { name: /refresh/i }));
    // Previously every non-429 error was swallowed, making the button look dead.
    expect(await screen.findByText("Judge sync failed")).toBeTruthy();
  });
});
