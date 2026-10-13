import { afterEach, describe, expect, it, vi } from "vitest";
import { guildApi } from "../src/cp/api";
import type { LeadershipTransferResponse } from "../src/cp/types";

const response = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { "Content-Type": "application/json" } });
afterEach(() => vi.restoreAllMocks());

describe("guild leadership transfer API", () => {
  it("posts encoded guild IDs and the backend request shape with a typed response", async () => {
    const transfer: LeadershipTransferResponse = {
      previous_leader_user_id: "former-leader",
      leader_user_id: "new-leader",
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => response(transfer));

    const result = await guildApi.transferLeadership("guild/one", "new-leader");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/guilds/guild%2Fone/leader-transfer");
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ target_user_id: "new-leader" });
    expect(result).toEqual(transfer);
    const typedResult: LeadershipTransferResponse = result;
    expect(typedResult.previous_leader_user_id).toBe("former-leader");
    expect(typedResult.leader_user_id).toBe("new-leader");
  });
});
