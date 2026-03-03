import { useCallback, useRef } from "react";

const MIN_HEIGHT = 150;
const MAX_HEIGHT_RATIO = 0.8;

interface DragState {
  isDragging: boolean;
  startY: number;
  startHeight: number;
  rafId: number | null;
}

export interface UseResizeOptions {
  height: number;
  onHeightChange: (height: number) => void;
}

export interface UseResizeReturn {
  handlePointerDown: (e: React.PointerEvent) => void;
}

/**
 * Drag-to-resize hook using Pointer Events with setPointerCapture.
 * Uses rAF throttling and useRef for drag state to avoid re-renders per pointer event.
 * @param options - Current height and height change callback
 * @returns Pointer event handler to attach to the resize handle
 */
export const useResize = ({
  height,
  onHeightChange,
}: UseResizeOptions): UseResizeReturn => {
  const dragState = useRef<DragState>({
    isDragging: false,
    startY: 0,
    startHeight: 0,
    rafId: null,
  });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      dragState.current = {
        isDragging: true,
        startY: e.clientY,
        startHeight: height,
        rafId: null,
      };

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!dragState.current.isDragging) {
          return;
        }

        if (dragState.current.rafId !== null) {
          cancelAnimationFrame(dragState.current.rafId);
        }

        dragState.current.rafId = requestAnimationFrame(() => {
          const delta = dragState.current.startY - moveEvent.clientY;
          const maxHeight = window.innerHeight * MAX_HEIGHT_RATIO;
          const newHeight = Math.min(
            maxHeight,
            Math.max(MIN_HEIGHT, dragState.current.startHeight + delta),
          );
          onHeightChange(newHeight);
        });
      };

      const handlePointerUp = () => {
        dragState.current.isDragging = false;
        if (dragState.current.rafId !== null) {
          cancelAnimationFrame(dragState.current.rafId);
        }
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerup", handlePointerUp);
      };

      target.addEventListener("pointermove", handlePointerMove);
      target.addEventListener("pointerup", handlePointerUp);
    },
    [height, onHeightChange],
  );

  return { handlePointerDown };
};
