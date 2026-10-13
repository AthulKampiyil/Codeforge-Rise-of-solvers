import { describe, expect, it } from "vitest";
import { resolveControlPanelTab, resolveVillageReturnPath } from "../src/cp/ui";

describe("CP village return routing", () => {
  const origin = "https://example.test";

  it("opens only an allowlisted control-panel tab from CP routes", () => {
    expect(resolveControlPanelTab("?cp=1&tab=guild&return=%2F")).toBe("guild");
    expect(resolveControlPanelTab("?cp=1&tab=admin")).toBe("admin");
    expect(resolveControlPanelTab("?cp=1&tab=not-a-tab")).toBe("village");
    expect(resolveControlPanelTab("?tab=guild")).toBe("village");
  });

  it("accepts only the requested same-origin root when CP return mode is present", () => {
    expect(resolveVillageReturnPath("?cp=1&return=%2F", origin)).toBe("/");
    expect(resolveVillageReturnPath("?cp=1&return=%2F%3Ffrom%3Dcp", origin)).toBe("/?from=cp");
  });

  it("keeps explicit CP visits and rejects non-root or cross-origin destinations", () => {
    expect(resolveVillageReturnPath("", origin)).toBeNull();
    expect(resolveVillageReturnPath("?return=%2F", origin)).toBeNull();
    expect(resolveVillageReturnPath("?cp=1&return=%2Faccount", origin)).toBeNull();
    expect(resolveVillageReturnPath("?cp=1&return=https%3A%2F%2Fevil.test%2F", origin)).toBeNull();
    expect(resolveVillageReturnPath("?cp=1&return=%2F%2Fevil.test", origin)).toBeNull();
  });
});
