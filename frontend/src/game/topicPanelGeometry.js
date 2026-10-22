export const TOPIC_PANEL_WIDTH = 320;
export const TOPIC_PANEL_HEIGHT = 175;
export const TOPIC_PANEL_MARGIN = 24;
export const TOPIC_PANEL_TOP = 20;

// Size of the invisible DOM hit target that sits on top of the drawn "✕".
// These are panel-local units, so they scale with the panel and the camera.
export const TOPIC_CLOSE_HIT_WIDTH = 56;
export const TOPIC_CLOSE_HIT_HEIGHT = 52;

// The camera can be zoomed far out, which would shrink the hit target below a
// comfortable click size, so the target keeps a minimum size in screen pixels.
export const TOPIC_CLOSE_MIN_SIZE = 30;

/**
 * Computes the on-screen rectangle of the topic panel's close button.
 *
 * The panel is a container pinned to the viewport (`scrollFactor(0)`), so the
 * camera only applies its zoom, around the centre of the viewport. The glyph
 * also lives inside a container that is scaled by the panel intro tween, so
 * its local offset is scaled as well.
 *
 * @param {object} params
 * @param {number} params.panelX       Panel position inside the viewport (game units).
 * @param {number} params.panelY       Panel position inside the viewport (game units).
 * @param {number} params.panelScaleX  Panel container scale on the x axis.
 * @param {number} params.panelScaleY  Panel container scale on the y axis.
 * @param {number} params.localX       Close glyph centre in panel-local units.
 * @param {number} params.localY       Close glyph centre in panel-local units.
 * @param {number} params.zoomX        Camera zoom on the x axis.
 * @param {number} params.zoomY        Camera zoom on the y axis.
 * @param {number} params.originX      Camera viewport origin on the x axis (pixels).
 * @param {number} params.originY      Camera viewport origin on the y axis (pixels).
 * @param {number} [params.cameraX]    Camera viewport position on the x axis (pixels).
 * @param {number} [params.cameraY]    Camera viewport position on the y axis (pixels).
 * @param {number} [params.hitWidth]   Hit target width in panel-local units.
 * @param {number} [params.hitHeight]  Hit target height in panel-local units.
 * @param {number} [params.minSize]    Minimum hit target size in screen pixels.
 * @returns {{x: number, y: number, width: number, height: number}|null}
 */
export function computeTopicCloseButtonRect({
  panelX,
  panelY,
  panelScaleX,
  panelScaleY,
  localX,
  localY,
  zoomX,
  zoomY,
  originX,
  originY,
  cameraX = 0,
  cameraY = 0,
  hitWidth = TOPIC_CLOSE_HIT_WIDTH,
  hitHeight = TOPIC_CLOSE_HIT_HEIGHT,
  minSize = TOPIC_CLOSE_MIN_SIZE,
}) {
  const scaleX = Math.abs(panelScaleX) || 1;
  const scaleY = Math.abs(panelScaleY) || 1;

  // Panel-local glyph centre -> viewport space, then through the camera matrix.
  const worldX = panelX + localX * scaleX;
  const worldY = panelY + localY * scaleY;

  const screenX = zoomX * (worldX - originX) + cameraX + originX;
  const screenY = zoomY * (worldY - originY) + cameraY + originY;

  const width = Math.max(minSize, hitWidth * scaleX * zoomX);
  const height = Math.max(minSize, hitHeight * scaleY * zoomY);

  return {
    x: screenX - width / 2,
    y: screenY - height / 2,
    width,
    height,
  };
}
