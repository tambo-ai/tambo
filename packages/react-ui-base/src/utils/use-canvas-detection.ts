"use client";

import * as React from "react";

/**
 * Return value of the useCanvasDetection hook.
 */
export interface CanvasDetectionResult {
  /** Whether a canvas space element is present in the DOM. */
  hasCanvasSpace: boolean;
  /** Whether the canvas space is positioned to the left of the reference element. */
  canvasIsOnLeft: boolean;
}

/**
 * Detects the presence and position of a canvas space element relative to a
 * reference element. Re-checks on mount, after a short render delay, and on
 * window resize.
 *
 * @param elementRef - Reference to the element to compare position with
 * @returns Object containing hasCanvasSpace and canvasIsOnLeft
 */
export function useCanvasDetection(
  elementRef: React.RefObject<HTMLElement | null>,
): CanvasDetectionResult {
  const [hasCanvasSpace, setHasCanvasSpace] = React.useState(false);
  const [canvasIsOnLeft, setCanvasIsOnLeft] = React.useState(false);

  React.useEffect(() => {
    const checkCanvas = () => {
      const canvas = document.querySelector('[data-canvas-space="true"]');
      setHasCanvasSpace(!!canvas);

      if (canvas && elementRef.current) {
        const canvasRect = canvas.getBoundingClientRect();
        const elemRect = elementRef.current.getBoundingClientRect();
        setCanvasIsOnLeft(canvasRect.left < elemRect.left);
      }
    };

    checkCanvas();
    // Re-check after initial render cycle to catch canvas elements that mount asynchronously
    const timeoutId = setTimeout(checkCanvas, 100);

    window.addEventListener("resize", checkCanvas);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkCanvas);
    };
  }, [elementRef]);

  return { hasCanvasSpace, canvasIsOnLeft };
}
