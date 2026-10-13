import { describe, expect, it, vi } from "vitest";
import { CP_VILLAGE_TOPIC_SLOTS, mapVillageProfile } from "../src/cp/village-presentation";
import type { VillageProfile, VillageTopic } from "../src/cp/types";
import { CPVillageStore } from "../src/cp/store";

const slugs = ["arrays", "strings", "math", "greedy", "graphs", "trees", "dynamic-programming", "data-structures"];
function topic(name: string, level: number, id = name): VillageTopic {
  return { id, name, display_name: name, structure_key: name, progress_points: 12, level, points_to_next_level: 4, progress_pct: 75 };
}
function profile(topics: VillageTopic[]): VillageProfile {
  return { user_id: "u1", username: "solver", total_solved: 12, average_level: 1, topics, defense_rating: 1 };
}

describe("CP village presentation mapping", () => {
  it("maps allowlisted seed slugs to fixed slots independent of response order", () => {
    const topics = slugs.map((slug) => topic(slug, 2));
    const forward = mapVillageProfile(profile(topics));
    const reversed = mapVillageProfile(profile([...topics].reverse()));
    expect(forward.slots).toHaveLength(8);
    expect(forward.slots.map(({ slotId, topicId }) => [slotId, topicId])).toEqual(reversed.slots.map(({ slotId, topicId }) => [slotId, topicId]));
    expect(forward.slots.map((slot) => slot.topic?.name)).toEqual(slugs);
    expect(new Set(CP_VILLAGE_TOPIC_SLOTS.map((slot) => slot.id)).size).toBe(8);
  });

  it("keeps backend level separate from clamped visual tier and tolerates zero, high, unknown, and invalid numbers", () => {
    const mapped = mapVillageProfile(profile([
      topic("arrays", 0), topic("strings", 99), topic("not-in-allowlist", Number.NaN, "unknown"),
    ]));
    expect(mapped.slots.find((slot) => slot.topic?.name === "arrays")).toMatchObject({ cpLevel: 0, visualTier: 0 });
    expect(mapped.slots.find((slot) => slot.topic?.name === "strings")).toMatchObject({ cpLevel: 99, visualTier: 5 });
    expect(mapped.unknownTopics).toEqual([{ id: "unknown", name: "not-in-allowlist", displayName: "not-in-allowlist", cpLevel: 0 }]);
    expect(JSON.stringify(mapped)).not.toContain("NaN");
    expect(mapped.slots.every((slot) => Number.isFinite(slot.cpLevel) && Number.isFinite(slot.visualTier) && Number.isFinite(slot.progressPct))).toBe(true);
  });

  it("projects missing allowlisted topics as locked slots and uses stable original building art", () => {
    const mapped = mapVillageProfile(profile([topic("arrays", 7)]));
    expect(CP_VILLAGE_TOPIC_SLOTS.map(({ slug, artKind }) => [slug, artKind])).toEqual([
      ["arrays", "barracks"], ["strings", "camp"], ["math", "blacksmith"], ["greedy", "wizardtower"],
      ["graphs", "archertower"], ["trees", "laboratory"], ["dynamic-programming", "cannon"], ["data-structures", "builder"],
    ]);
    expect(mapped.slots.find((slot) => slot.slotId === "cp-topic-arrays")).toMatchObject({ cpLevel: 7, visualTier: 5 });
    expect(mapped.slots.find((slot) => slot.slotId === "cp-topic-strings")).toMatchObject({ topic: null, topicId: null, cpLevel: 0, visualTier: 0 });
  });

  it("ignores late refresh responses after the store session is stopped", async () => {
    const values = new Map([["codeforge.accessToken", "access"]]);
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null } });
    let resolveFirst!: (response: Response) => void;
    let resolveSecond!: (response: Response) => void;
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }));
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
    const store = new CPVillageStore();
    const pending = store.refresh();
    store.stop();
    resolveFirst(new Response(JSON.stringify(profile([])), { status: 200 }));
    resolveSecond(new Response(JSON.stringify({ coins: 5, gems: 0, rewarded_solves: 0 }), { status: 200 }));
    await pending;
    expect(store.getSnapshot().village).toBeNull();
    expect(store.getSnapshot().stale).toBe(true);
    fetchMock.mockRestore();
  });
});
