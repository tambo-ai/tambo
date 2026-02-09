/**
 * Return value of the getPositioning function.
 */
export interface PositioningResult {
  /** Whether this panel should be treated as a left panel. */
  isLeftPanel: boolean;
  /** Which side the thread history sidebar should appear on. */
  historyPosition: "left" | "right";
}

/**
 * Calculates panel side and history sidebar position based on an explicit
 * position value and canvas layout. Pure function — not a React hook.
 *
 * @param position - Which side this panel is on ("left" or "right", defaults to "left")
 * @param canvasIsOnLeft - Whether the canvas is positioned to the left
 * @param hasCanvasSpace - Whether a canvas space element exists
 * @returns Object with isLeftPanel and historyPosition values
 */
export function getPositioning(
  position: "left" | "right" = "left",
  canvasIsOnLeft = false,
  hasCanvasSpace = false,
): PositioningResult {
  const isLeftPanel = position === "left";

  const historyPosition: "left" | "right" =
    !isLeftPanel || (hasCanvasSpace && canvasIsOnLeft) ? "right" : "left";

  return { isLeftPanel, historyPosition };
}
