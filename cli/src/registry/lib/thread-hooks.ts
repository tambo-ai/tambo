import * as React from "react";
import { useEffect, useState } from "react";

/**
 * Custom hook to merge multiple refs into one callback ref
 * @param refs - Array of refs to merge
 * @returns A callback ref that updates all provided refs
 */
export function useMergedRef<T>(...refs: React.Ref<T>[]) {
  return React.useCallback(
    (element: T) => {
      for (const ref of refs) {
        if (!ref) continue;

        if (typeof ref === "function") {
          ref(element);
        } else {
          // This cast is safe because we're just updating the .current property
          (ref as React.MutableRefObject<T>).current = element;
        }
      }
    },
    [refs],
  );
}

/**
 * Custom hook to detect canvas space presence and position
 * @param elementRef - Reference to the component to compare position with
 * @returns Object containing hasCanvasSpace and canvasIsOnLeft
 */
export function useCanvasDetection(
  elementRef: React.RefObject<HTMLElement | null>,
) {
  const [hasCanvasSpace, setHasCanvasSpace] = useState(false);
  const [canvasIsOnLeft, setCanvasIsOnLeft] = useState(false);

  useEffect(() => {
    const checkCanvas = () => {
      const canvas = document.querySelector('[data-canvas-space="true"]');
      setHasCanvasSpace(!!canvas);

      if (canvas && elementRef.current) {
        // Check if canvas appears before this component in the DOM
        const canvasRect = canvas.getBoundingClientRect();
        const elemRect = elementRef.current.getBoundingClientRect();
        setCanvasIsOnLeft(canvasRect.left < elemRect.left);
      }
    };

    // Check on mount and after a short delay to ensure DOM is fully rendered
    checkCanvas();
    const timeoutId = setTimeout(checkCanvas, 100);

    // Re-check on window resize
    window.addEventListener("resize", checkCanvas);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkCanvas);
    };
  }, [elementRef]);

  return { hasCanvasSpace, canvasIsOnLeft };
}

/**
 * Utility to check if a className string contains the "right" class
 * @param className - The className string to check
 * @returns true if the className contains "right", false otherwise
 */
export function hasRightClass(className?: string): boolean {
  return className ? /(?:^|\s)right(?:\s|$)/i.test(className) : false;
}

/**
 * Hook to calculate sidebar and history positions based on className and canvas position
 * @param className - Component's className string
 * @param canvasIsOnLeft - Whether the canvas is on the left
 * @returns Object with isLeftPanel and historyPosition values
 */
export function usePositioning(
  className?: string,
  canvasIsOnLeft = false,
  hasCanvasSpace = false,
) {
  const isRightClass = hasRightClass(className);
  const isLeftPanel = !isRightClass;

  // Determine history position
  // If panel has right class, history should be on right
  // If canvas is on left, history should be on right
  // Otherwise, history should be on left
  const historyPosition: "left" | "right" = isRightClass
    ? "right"
    : hasCanvasSpace && canvasIsOnLeft
      ? "right"
      : "left";

  return { isLeftPanel, historyPosition };
}
