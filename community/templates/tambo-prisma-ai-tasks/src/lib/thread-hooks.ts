import { useEffect, useMemo, useState } from "react";
import { createThread } from "@/app/actions/thread";
import { addMessage } from "@/app/actions/message";

export type HistoryPosition = "left" | "right";

export type PositioningResult = {
  isLeftPanel: boolean;
  historyPosition: HistoryPosition;
};

/* -------------------------------------------------------------------------- */
/*                              UI HELPER HOOKS                               */
/* -------------------------------------------------------------------------- */

export function useMergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref && typeof ref === "object") {
        (ref as React.MutableRefObject<T>).current = value;
      }
    });
  };
}

export function useCanvasDetection(
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [hasCanvasSpace, setHasCanvasSpace] = useState(false);
  const [canvasIsOnLeft, setCanvasIsOnLeft] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setHasCanvasSpace(width > 1024);
      setCanvasIsOnLeft(width > 1280);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);

  return { hasCanvasSpace, canvasIsOnLeft };
}

export function usePositioning(
  _threadId: string | undefined,
  canvasIsOnLeft: boolean,
  hasCanvasSpace: boolean,
): PositioningResult {
  return useMemo<PositioningResult>(() => {
    if (!hasCanvasSpace) {
      return {
        isLeftPanel: false,
        historyPosition: "right",
      };
    }

    return {
      isLeftPanel: canvasIsOnLeft,
      historyPosition: canvasIsOnLeft ? "right" : "left",
    };
  }, [canvasIsOnLeft, hasCanvasSpace]);
}

/* -------------------------------------------------------------------------- */
/*                            MESSAGE HELPERS                                 */
/* -------------------------------------------------------------------------- */

export function checkHasContent(content?: unknown) {
  if (typeof content === "string") {
    return content.trim().length > 0;
  }

  if (content && typeof content === "object") {
    return true; // tool results, structured responses
  }

  return false;
}

export function getSafeContent(content?: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (content && typeof content === "object") {
    return JSON.stringify(content, null, 2);
  }

  return "";
}

export function getMessageImages(content?: unknown[] | null): string[] {
  if (!Array.isArray(content)) return [];

  // Template intentionally does not render images yet.
  // This helper exists for future extension.
  return [];
}

/* -------------------------------------------------------------------------- */
/*                       PRISMA-BACKED THREAD LOGIC                            */
/* -------------------------------------------------------------------------- */

export function useThread() {
  const [threadId, setThreadId] = useState<string | null>(null);

  async function startThread() {
    const thread = await createThread();
    setThreadId(thread.id);
    return thread.id;
  }

  async function persistMessage(role: string, content: string) {
    if (!threadId) return;
    await addMessage(threadId, role, content);
  }

  return {
    threadId,
    startThread,
    persistMessage,
  };
}
