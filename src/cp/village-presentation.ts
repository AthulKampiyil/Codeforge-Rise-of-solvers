import type { VillageProfile, VillageTopic } from "./types";

export const CP_VILLAGE_TOPIC_SLOTS = [
  // Deliberately spread across the clearing so each art footprint and its nameplate reads.
  // Coordinates remain stable per topic; response order never changes the village layout.
  { id: "cp-topic-arrays", slug: "arrays", title: "Arrays", artKind: "barracks", texture: "/assets/buildings/barracks.webp", x: -4, y: -3 },
  { id: "cp-topic-strings", slug: "strings", title: "Strings", artKind: "camp", texture: "/assets/buildings/camp.webp", x: -1, y: -5 },
  { id: "cp-topic-math", slug: "math", title: "Math", artKind: "blacksmith", texture: "/assets/buildings/blacksmith.webp", x: 3, y: -4 },
  { id: "cp-topic-greedy", slug: "greedy", title: "Greedy", artKind: "wizardtower", texture: "/assets/buildings/wizardtower.webp", x: -6, y: -1 },
  { id: "cp-topic-graphs", slug: "graphs", title: "Graphs", artKind: "archertower", texture: "/assets/buildings/archertower.webp", x: 6, y: 1 },
  { id: "cp-topic-trees", slug: "trees", title: "Trees", artKind: "laboratory", texture: "/assets/buildings/laboratory.webp", x: -5, y: 4 },
  { id: "cp-topic-dynamic-programming", slug: "dynamic-programming", title: "Dynamic Programming", artKind: "cannon", texture: "/assets/buildings/cannon.webp", x: 0, y: 6 },
  { id: "cp-topic-data-structures", slug: "data-structures", title: "Data Structures", artKind: "builder", texture: "/assets/buildings/builder.webp", x: 5, y: 4 },
] as const;

const TOPIC_ALIASES: Readonly<Record<string, (typeof CP_VILLAGE_TOPIC_SLOTS)[number]["slug"]>> = {
  array: "arrays", arrays: "arrays", string: "strings", strings: "strings",
  math: "math", mathematics: "math", greedy: "greedy", "greedy algorithms": "greedy",
  graph: "graphs", graphs: "graphs", "graph theory": "graphs", tree: "trees", trees: "trees",
  dp: "dynamic-programming", "dynamic programming": "dynamic-programming", "dynamic-programming": "dynamic-programming",
  "data structure": "data-structures", "data structures": "data-structures", "data-structures": "data-structures",
};

export interface PresentedTopic { slotId: string; topic: VillageTopic | null; topicId: string | null; cpLevel: number; visualTier: number; progressPoints: number; progressPct: number }
export interface TopicStructurePresentation { earnedTier: number; artLevel: number; scale: number; earned: boolean }
export interface UnknownVillageTopic { id: string; name: string; displayName: string; cpLevel: number }
export interface VillagePresentation { slots: PresentedTopic[]; unknownTopics: UnknownVillageTopic[] }
export type TopicOutpostFacing = "default" | "mirrored";
export interface TopicOutpostLayoutItem {
  topic_id: string;
  topic_key: (typeof CP_VILLAGE_TOPIC_SLOTS)[number]["slug"];
  x: number;
  y: number;
  facing: TopicOutpostFacing;
}
export interface TopicOutpostLayoutRules {
  min_x: 8; min_y: 8; max_x_exclusive: 40; max_y_exclusive: 40;
  footprint_width: 3; footprint_height: 3; allowed_facings: readonly TopicOutpostFacing[];
}
export interface TopicOutpostLayout {
  revision: number;
  rules_version: 1;
  rules: TopicOutpostLayoutRules;
  items: TopicOutpostLayoutItem[];
}
export const TOPIC_OUTPOST_LAYOUT_RULES: TopicOutpostLayoutRules = {
  min_x: 8, min_y: 8, max_x_exclusive: 40, max_y_exclusive: 40,
  footprint_width: 3, footprint_height: 3, allowed_facings: ["default", "mirrored"],
};

/** Earned solve progress controls the structure itself, independently of purchased outpost tier. */
export function topicStructurePresentation(cpLevel: number): TopicStructurePresentation {
  const earnedTier = Number.isFinite(cpLevel) ? Math.max(0, Math.min(5, Math.floor(cpLevel))) : 0;
  return {
    earnedTier,
    // Level zero uses the family base art in a muted, smaller state; each earned tier above it
    // selects the matching original building art level when that texture is available.
    artLevel: Math.max(1, earnedTier),
    scale: 0.30 + earnedTier * 0.025,
    earned: earnedTier > 0,
  };
}
export const TOPIC_OUTPOST_DEFAULT_POSITIONS: Readonly<Record<(typeof CP_VILLAGE_TOPIC_SLOTS)[number]["slug"], { x: number; y: number }>> = {
  arrays: { x: 18, y: 20 }, strings: { x: 23, y: 17 }, math: { x: 28, y: 18 }, greedy: { x: 15, y: 23 },
  graphs: { x: 33, y: 25 }, trees: { x: 17, y: 30 }, "dynamic-programming": { x: 24, y: 33 }, "data-structures": { x: 31, y: 30 },
};

/** Strictly validate the versioned wire layout before it reaches the model or editor. */
export function isValidTopicOutpostLayout(
  value: unknown,
  expectedTopicIds?: Readonly<Record<string, string>>,
): value is TopicOutpostLayout {
  if (!value || typeof value !== "object") return false;
  const layout = value as Partial<TopicOutpostLayout>;
  const rules = layout.rules;
  if (
    !Number.isSafeInteger(layout.revision) || layout.revision! < 0 || layout.rules_version !== 1 ||
    !rules || rules.min_x !== 8 || rules.min_y !== 8 || rules.max_x_exclusive !== 40 || rules.max_y_exclusive !== 40 ||
    rules.footprint_width !== 3 || rules.footprint_height !== 3 ||
    !Array.isArray(rules.allowed_facings) || rules.allowed_facings.length !== 2 ||
    rules.allowed_facings[0] !== "default" || rules.allowed_facings[1] !== "mirrored" ||
    !Array.isArray(layout.items) || layout.items.length !== CP_VILLAGE_TOPIC_SLOTS.length
  ) return false;
  const keys = new Set<string>();
  const ids = new Set<string>();
  for (const item of layout.items) {
    if (!item || typeof item.topic_key !== "string" || typeof item.topic_id !== "string" || !item.topic_id) return false;
    if (!CP_VILLAGE_TOPIC_SLOTS.some((slot) => slot.slug === item.topic_key) || keys.has(item.topic_key) || ids.has(item.topic_id)) return false;
    if (expectedTopicIds && Object.hasOwn(expectedTopicIds, item.topic_key) && expectedTopicIds[item.topic_key] !== item.topic_id) return false;
    if (!Number.isSafeInteger(item.x) || !Number.isSafeInteger(item.y) ||
      item.x < 8 || item.y < 8 || item.x + 3 > 40 || item.y + 3 > 40 ||
      (item.facing !== "default" && item.facing !== "mirrored")) return false;
    for (const previous of layout.items.slice(0, layout.items.indexOf(item)))
      if (item.x < previous.x + 3 && item.x + 3 > previous.x && item.y < previous.y + 3 && item.y + 3 > previous.y) return false;
    keys.add(item.topic_key);
    ids.add(item.topic_id);
  }
  return keys.size === CP_VILLAGE_TOPIC_SLOTS.length;
}

const canonical = (value: string | null | undefined) => (value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
const validNumber = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;
const safeCpLevel = (topic: VillageTopic | undefined) => topic ? validNumber(topic.level) : 0;

/** Allowlist topics into eight stable building slots; response order never affects slot IDs. */
export function mapVillageProfile(profile: VillageProfile): VillagePresentation {
  const known = new Map<string, VillageTopic[]>();
  const unknown: VillageTopic[] = [];
  for (const topic of Array.isArray(profile?.topics) ? profile.topics : []) {
    const slug = [topic.name, topic.structure_key, topic.display_name].map(canonical).map((key) => TOPIC_ALIASES[key]).find(Boolean);
    if (!slug) { unknown.push(topic); continue; }
    const entries = known.get(slug) ?? [];
    entries.push(topic);
    known.set(slug, entries);
  }
  const slots = CP_VILLAGE_TOPIC_SLOTS.map((slot): PresentedTopic => {
    const topic = (known.get(slot.slug) ?? []).slice().sort((a, b) => a.id.localeCompare(b.id))[0] ?? null;
    const cpLevel = safeCpLevel(topic ?? undefined);
    return {
      slotId: slot.id, topic, topicId: topic?.id ?? null, cpLevel,
      visualTier: Math.min(5, Math.max(0, Math.floor(cpLevel))),
      progressPoints: topic ? validNumber(topic.progress_points) : 0,
      progressPct: topic ? Math.min(100, Math.max(0, validNumber(topic.progress_pct))) : 0,
    };
  });
  const unknownTopics = unknown.slice().sort((a, b) => a.id.localeCompare(b.id)).map((topic) => ({
    id: topic.id, name: topic.name, displayName: topic.display_name || topic.name || "Unmapped topic", cpLevel: safeCpLevel(topic),
  }));
  return { slots, unknownTopics };
}
