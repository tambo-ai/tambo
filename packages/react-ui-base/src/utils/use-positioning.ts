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
 * Checks whether a className string contains the standalone "right" class.
 *
 * @param className - The className string to check
 * @returns true if the className contains "right", false otherwise
 */
export function hasRightClass(className?: string): boolean {
  if (!className) {
    return false;
  }
  return className.split(" ").some((cls) => cls === "right");
}

/**
 * Calculates panel side and history sidebar position based on className and
 * canvas layout. Pure function — not a React hook.
 *
 * @param className - Component's className string (presence of "right" class determines side)
 * @param canvasIsOnLeft - Whether the canvas is positioned to the left
 * @param hasCanvasSpace - Whether a canvas space element exists
 * @returns Object with isLeftPanel and historyPosition values
 */
export function getPositioning(
  className?: string,
  canvasIsOnLeft = false,
  hasCanvasSpace = false,
): PositioningResult {
  const isRightClass = hasRightClass(className);
  const isLeftPanel = !isRightClass;

  const historyPosition: "left" | "right" =
    isRightClass || (hasCanvasSpace && canvasIsOnLeft) ? "right" : "left";

  return { isLeftPanel, historyPosition };
}
