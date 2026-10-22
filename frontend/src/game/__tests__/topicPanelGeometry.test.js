import { describe, it, expect } from "vitest";

import {
  computeTopicCloseButtonRect,
  TOPIC_CLOSE_HIT_HEIGHT,
  TOPIC_CLOSE_HIT_WIDTH,
} from "../topicPanelGeometry";

const baseArgs = {
  panelX: 856,
  panelY: 20,
  panelScaleX: 1,
  panelScaleY: 1,
  localX: 292,
  localY: 16,
  zoomX: 1,
  zoomY: 1,
  originX: 600,
  originY: 300,
};

describe("computeTopicCloseButtonRect", () => {
  it("keeps the hit target centred on the glyph when the camera is not zoomed", () => {
    const rect = computeTopicCloseButtonRect(baseArgs);

    // Glyph centre in viewport space.
    expect(rect.x + rect.width / 2).toBe(856 + 292);
    expect(rect.y + rect.height / 2).toBe(20 + 16);
    expect(rect.width).toBe(TOPIC_CLOSE_HIT_WIDTH);
    expect(rect.height).toBe(TOPIC_CLOSE_HIT_HEIGHT);
  });

  it("follows the camera zoom around the viewport centre", () => {
    const rect = computeTopicCloseButtonRect({ ...baseArgs, zoomX: 0.5, zoomY: 0.5 });

    // 0.5 * (1148 - 600) + 600
    expect(rect.x + rect.width / 2).toBeCloseTo(874, 6);
    // 0.5 * (36 - 300) + 300
    expect(rect.y + rect.height / 2).toBeCloseTo(168, 6);
    // The target keeps its minimum click size instead of shrinking further.
    expect(rect.width).toBe(30);
    expect(rect.height).toBe(30);
  });

  it("follows the panel intro tween scale", () => {
    const rect = computeTopicCloseButtonRect({ ...baseArgs, panelScaleX: 0.95, panelScaleY: 0.95 });

    expect(rect.x + rect.width / 2).toBeCloseTo(856 + 292 * 0.95, 6);
    expect(rect.y + rect.height / 2).toBeCloseTo(20 + 16 * 0.95, 6);
  });

  it("keeps a minimum click size when the camera is zoomed far out", () => {
    const rect = computeTopicCloseButtonRect({ ...baseArgs, zoomX: 0.1, zoomY: 0.1 });

    expect(rect.width).toBe(30);
    expect(rect.height).toBe(30);
    // Still centred on the glyph: 0.1 * (1148 - 600) + 600
    expect(rect.x + rect.width / 2).toBeCloseTo(654.8, 6);
  });

  it("offsets by the camera viewport position", () => {
    const rect = computeTopicCloseButtonRect({ ...baseArgs, cameraX: 40, cameraY: 10 });

    expect(rect.x + rect.width / 2).toBe(856 + 292 + 40);
    expect(rect.y + rect.height / 2).toBe(20 + 16 + 10);
  });
});
