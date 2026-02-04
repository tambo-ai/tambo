"use client";

/**
 * useTamboV1StreamStatus - Stream Status Hook for v1 API
 *
 * Provides granular streaming status for components being rendered,
 * allowing UI to respond to prop-level streaming states.
 *
 * Must be used within a component rendered via the component renderer.
 */

import { useEffect, useMemo, useState } from "react";
import { useV1ComponentContent } from "../utils/component-renderer";
import { useStreamState } from "../providers/tambo-v1-stream-context";
import type { V1ComponentContent } from "../types/message";

/**
 * Global stream status flags for a specific component in a message.
 * Represents the aggregate state across all props for this component only.
 * Once a component completes, its status remains stable regardless of other generations.
 */
export interface StreamStatus {
  /**
   * Indicates no tokens have been received for any prop and generation is not active.
   * Useful for showing initial loading states before any data arrives.
   */
  isPending: boolean;

  /**
   * Indicates active streaming - at least one prop is still streaming.
   * Use this to show loading animations or skeleton states during data transmission.
   */
  isStreaming: boolean;

  /**
   * Indicates successful completion - component streaming is done AND every prop finished without error.
   * Safe to render the final component when this is true.
   */
  isSuccess: boolean;

  /**
   * Indicates a fatal error occurred in any prop or the stream itself.
   * Check streamError for details about what went wrong.
   */
  isError: boolean;

  /**
   * The first fatal error encountered during streaming (if any).
   * Will be undefined if no errors occurred.
   */
  streamError?: Error;
}

/**
 * Streaming status flags for individual component props.
 * Tracks the state of each prop as it streams from the LLM.
 */
export interface PropStatus {
  /**
   * Indicates no tokens have been received for this specific prop yet.
   * The prop value is still undefined, null, or empty string.
   */
  isPending: boolean;

  /**
   * Indicates at least one token has been received but streaming is not complete.
   * The prop has partial content that may still be updating.
   */
  isStreaming: boolean;

  /**
   * Indicates this prop has finished streaming successfully.
   * The prop value is complete and stable.
   */
  isSuccess: boolean;

  /**
   * The error that occurred during streaming (if any).
   * Will be undefined if no error occurred for this prop.
   */
  error?: Error;
}

/**
 * SSR Guard - throws during server-side rendering.
 * Ensures the hook is only used in browser contexts.
 * @throws {Error} When called during server-side rendering
 */
function assertClientSide() {
  if (typeof window === "undefined") {
    throw new Error(
      "useTamboV1StreamStatus can only be used in browser contexts. " +
        "This hook is not compatible with SSR/SSG. " +
        "Consider wrapping it in useEffect or using dynamic imports.",
    );
  }
}

/**
 * Find a component content block by ID in a specific thread.
 * @param streamState - The current stream state
 * @param threadId - The thread ID to search in
 * @param componentId - The component ID to find
 * @returns The component content block, or undefined if not found
 */
function findComponentContent(
  streamState: ReturnType<typeof useStreamState>,
  threadId: string,
  componentId: string,
): V1ComponentContent | undefined {
  const threadState = streamState.threadMap[threadId];
  if (!threadState) {
    return undefined;
  }

  for (const message of threadState.thread.messages) {
    for (const content of message.content) {
      if (content.type === "component" && content.id === componentId) {
        return content;
      }
    }
  }
  return undefined;
}

/**
 * Track streaming status for individual props by monitoring their values.
 * Monitors when props receive their first token and when they complete streaming.
 * Maintains stable state per component - once props complete, they stay complete.
 * @template Props - The type of the component props being tracked
 * @param props - The current component props object
 * @param componentStreamingState - The current streaming state of the component
 * @param componentId - The ID of the current component to track component-specific state
 * @returns A record mapping each prop key to its PropStatus
 */
function usePropsStreamingStatus<Props extends object>(
  props: Props | undefined,
  componentStreamingState: V1ComponentContent["streamingState"] | undefined,
  componentId: string,
): Record<keyof Props, PropStatus> {
  const [propTracking, setPropTracking] = useState<
    Record<
      string,
      {
        hasStarted: boolean;
        isComplete: boolean;
        error?: Error;
        componentId: string;
      }
    >
  >({});

  /** Reset tracking only when the component changes */
  useEffect(() => {
    setPropTracking((prev) => {
      // If we have tracking data for a different component, reset
      const hasOldComponentData = Object.values(prev).some(
        (track) => track.componentId && track.componentId !== componentId,
      );
      return hasOldComponentData ? {} : prev;
    });
  }, [componentId]);

  /** Track when props start streaming (receive first token) and when they complete */
  useEffect(() => {
    if (!props) return;

    setPropTracking((prev) => {
      const updated = { ...prev };
      let hasChanges = false;

      // First pass: identify which props are starting now
      const propsStartingNow: string[] = [];
      Object.entries(props).forEach(([key, value]) => {
        const current = prev[key] || {
          hasStarted: false,
          isComplete: false,
        };

        /** A prop starts streaming when it has a non-empty value for the first time */
        const hasContent =
          value !== undefined && value !== null && value !== "";
        const justStarted = hasContent && !current.hasStarted;

        if (justStarted) {
          propsStartingNow.push(key);
        }
      });

      // Second pass: update tracking and mark previous props as complete
      Object.entries(props).forEach(([key, value]) => {
        const current = prev[key] || {
          hasStarted: false,
          isComplete: false,
        };

        /** A prop starts streaming when it has a non-empty value for the first time */
        const hasContent =
          value !== undefined && value !== null && value !== "";
        const justStarted = hasContent && !current.hasStarted;

        /**
         * A prop is complete when it has started and either:
         * 1. A following prop has started, OR
         * 2. Component streaming is done (for the final prop)
         */
        const hasFollowingPropStarted = propsStartingNow.some(
          (startingKey) => startingKey !== key,
        );
        const isComponentStreamingDone = componentStreamingState === "done";
        const isComplete =
          current.hasStarted &&
          (hasFollowingPropStarted || isComponentStreamingDone) &&
          !current.isComplete;

        // Once a prop is complete for this component, it stays complete
        if (current.isComplete && current.componentId === componentId) {
          // Skip - already complete for this component
          return;
        }

        if (justStarted || isComplete) {
          updated[key] = {
            ...current,
            hasStarted: justStarted ? true : current.hasStarted,
            isComplete: isComplete ? true : current.isComplete,
            componentId,
          };
          hasChanges = true;
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [props, componentStreamingState, componentId]);

  /** Convert tracking state to PropStatus objects */
  return useMemo(() => {
    if (!props) return {} as Record<keyof Props, PropStatus>;

    const result = {} as Record<keyof Props, PropStatus>;

    Object.keys(props).forEach((key) => {
      const tracking = propTracking[key] || {
        hasStarted: false,
        isComplete: false,
        componentId: "",
      };

      // If this prop is complete for this component, it stays complete
      const isCompleteForThisComponent =
        tracking.isComplete && tracking.componentId === componentId;

      // Only consider streaming state if this prop isn't already complete for this component
      const isComponentStreaming =
        !isCompleteForThisComponent && componentStreamingState === "streaming";

      result[key as keyof Props] = {
        isPending: !tracking.hasStarted && !isCompleteForThisComponent,
        isStreaming:
          tracking.hasStarted &&
          !isCompleteForThisComponent &&
          isComponentStreaming,
        isSuccess: isCompleteForThisComponent,
        error: tracking.error,
      };
    });

    return result;
  }, [props, propTracking, componentStreamingState, componentId]);
}

/**
 * Derives global StreamStatus from component streaming state and individual prop statuses.
 * Aggregates individual prop states into a unified stream status.
 * @template Props - The type of the component props
 * @param componentStreamingState - The current streaming state of the component
 * @param propStatus - Status record for each individual prop
 * @param hasComponent - Whether a component exists in the current message
 * @param streamError - Any error from the streaming process itself
 * @returns The aggregated StreamStatus for the entire component
 */
function deriveGlobalStreamStatus(
  componentStreamingState: V1ComponentContent["streamingState"] | undefined,
  propStatus: Record<string, PropStatus>,
  hasComponent: boolean,
  streamError?: Error,
): StreamStatus {
  const propStatuses: PropStatus[] = Object.values(propStatus);

  // If all props are already successful, the component is complete regardless of streaming state
  const allPropsSuccessful =
    propStatuses.length > 0 && propStatuses.every((p) => p.isSuccess);

  // Only consider streaming state if not all props are complete
  const isComponentStreaming =
    !allPropsSuccessful && componentStreamingState === "streaming";
  const isStreamError = !!streamError;

  /** Find first error from stream or any prop */
  const firstError = streamError ?? propStatuses.find((p) => p.error)?.error;

  return {
    /** isPending: no component yet OR (has component but no props have started) */
    isPending:
      !hasComponent ||
      (!isComponentStreaming &&
        !allPropsSuccessful &&
        propStatuses.every((p) => p.isPending)),

    /** isStreaming: any prop is streaming (component streaming state doesn't matter if props are complete) */
    isStreaming: propStatuses.some((p) => p.isStreaming),

    /** isSuccess: all props successful (component is stable once all props complete) */
    isSuccess: allPropsSuccessful,

    /** isError: stream error OR any prop error */
    isError: isStreamError || propStatuses.some((p) => p.error),

    streamError: firstError,
  };
}

/**
 * Track streaming status for Tambo v1 component props.
 *
 * **Important**: Props update repeatedly during streaming and may be partial.
 * Use `propStatus.<field>?.isSuccess` before treating a prop as complete.
 *
 * Pair with `useTamboV1ComponentState` to disable inputs while streaming.
 * @see {@link https://docs.tambo.co/concepts/generative-interfaces/component-state}
 * @template Props - Component props type
 * @returns `streamStatus` (overall) and `propStatus` (per-prop) flags
 * @throws {Error} When used during SSR/SSG
 * @throws {Error} When used outside a rendered component
 * @example
 * ```tsx
 * // Wait for entire stream
 * const { streamStatus } = useTamboV1StreamStatus();
 * if (!streamStatus.isSuccess) return <Spinner />;
 * return <Card {...props} />;
 * ```
 * @example
 * ```tsx
 * // Highlight in-flight props
 * const { propStatus } = useTamboV1StreamStatus<Props>();
 * <h2 className={propStatus.title.isStreaming ? "animate-pulse" : ""}>
 *   {title}
 * </h2>
 * ```
 */
export function useTamboV1StreamStatus<
  Props extends object = Record<string, unknown>,
>(): {
  streamStatus: StreamStatus;
  propStatus: Record<keyof Props, PropStatus>;
} {
  /** SSR Guard - ensure client-side only execution */
  assertClientSide();

  const { componentId, threadId } = useV1ComponentContent();
  const streamState = useStreamState();

  /** Get the current thread state */
  const threadState = streamState.threadMap[threadId];

  /** Get error message from stream state if any */
  const streamErrorMessage =
    threadState?.streaming.status === "error"
      ? threadState?.streaming.error?.message
      : undefined;

  /** Find the component content block */
  const componentContent = findComponentContent(
    streamState,
    threadId,
    componentId,
  );

  /** Get the current component props */
  const componentProps =
    (componentContent?.props as Props | undefined) ?? ({} as Props);

  /** Get the component streaming state */
  const componentStreamingState = componentContent?.streamingState;

  /** Track per-prop streaming status */
  const propStatus = usePropsStreamingStatus(
    componentProps,
    componentStreamingState,
    componentId,
  );

  /** Derive global stream status from prop statuses and component streaming state */
  const streamStatus = useMemo(() => {
    const hasComponent = !!componentContent;
    const streamError = streamErrorMessage
      ? new Error(streamErrorMessage)
      : undefined;
    return deriveGlobalStreamStatus(
      componentStreamingState,
      propStatus,
      hasComponent,
      streamError,
    );
  }, [
    componentStreamingState,
    propStatus,
    componentContent,
    streamErrorMessage,
  ]);

  return {
    streamStatus,
    propStatus,
  };
}
