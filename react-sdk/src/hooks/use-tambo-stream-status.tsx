"use client";
import { useEffect, useMemo, useState } from "react";
import { GenerationStage } from "../model/generate-component-response";
import { useTamboGenerationStage } from "../providers/tambo-thread-provider";
import { useTamboCurrentMessage } from "./use-current-message";

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
   * Indicates active streaming - either generation is streaming OR at least one prop is still streaming.
   * Use this to show loading animations or skeleton states during data transmission.
   */
  isStreaming: boolean;

  /**
   * Indicates successful completion - generation is complete AND every prop finished without error.
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
      "useTamboStreamStatus can only be used in browser contexts. " +
        "This hook is not compatible with SSR/SSG. " +
        "Consider wrapping it in useEffect or using dynamic imports.",
    );
  }
}

/**
 * Track streaming status for individual props by monitoring their values.
 * Monitors when props receive their first token and when they complete streaming.
 * Maintains stable state per message - once props complete for a message, they stay complete.
 * @template Props - The type of the component props being tracked
 * @param props - The current component props object
 * @param generationStage - The current generation stage from the LLM
 * @param messageId - The ID of the current message to track component-specific state
 * @returns A record mapping each prop key to its PropStatus
 */
function usePropsStreamingStatus<Props extends Record<string, any>>(
  props: Props | undefined,
  generationStage: GenerationStage,
  messageId: string,
): Record<keyof Props, PropStatus> {
  const [propTracking, setPropTracking] = useState<
    Record<
      string,
      {
        hasStarted: boolean;
        isComplete: boolean;
        error?: Error;
        messageId: string;
      }
    >
  >({});

  /** Reset tracking only when the message changes */
  useEffect(() => {
    setPropTracking((prev) => {
      // If we have tracking data for a different message, reset
      const hasOldMessageData = Object.values(prev).some(
        (track) => track.messageId && track.messageId !== messageId,
      );
      return hasOldMessageData ? {} : prev;
    });
  }, [messageId]);

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
         * 2. Generation is complete (for the final prop)
         */
        const hasFollowingPropStarted = propsStartingNow.some(
          (startingKey) => startingKey !== key,
        );
        const isGenerationComplete =
          generationStage === GenerationStage.COMPLETE;
        const isComplete =
          current.hasStarted &&
          (hasFollowingPropStarted || isGenerationComplete) &&
          !current.isComplete;

        // Once a prop is complete for this message, it stays complete
        if (current.isComplete && current.messageId === messageId) {
          // Skip - already complete for this message
          return;
        }

        if (justStarted || isComplete) {
          updated[key] = {
            ...current,
            hasStarted: justStarted ? true : current.hasStarted,
            isComplete: isComplete ? true : current.isComplete,
            messageId,
          };
          hasChanges = true;
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [props, generationStage, messageId]);

  /** Convert tracking state to PropStatus objects */
  return useMemo(() => {
    if (!props) return {} as Record<keyof Props, PropStatus>;

    const result = {} as Record<keyof Props, PropStatus>;

    Object.keys(props).forEach((key) => {
      const tracking = propTracking[key] || {
        hasStarted: false,
        isComplete: false,
        messageId: "",
      };

      // If this prop is complete for this message, it stays complete
      const isCompleteForThisMessage =
        tracking.isComplete && tracking.messageId === messageId;

      // Only consider generation stage if this prop isn't already complete for this message
      const isGenerationStreaming =
        !isCompleteForThisMessage &&
        generationStage === GenerationStage.STREAMING_RESPONSE;

      result[key as keyof Props] = {
        isPending: !tracking.hasStarted && !isCompleteForThisMessage,
        isStreaming:
          tracking.hasStarted &&
          !isCompleteForThisMessage &&
          isGenerationStreaming,
        isSuccess: isCompleteForThisMessage,
        error: tracking.error,
      };
    });

    return result;
  }, [props, propTracking, generationStage, messageId]);
}

/**
 * Derives global StreamStatus from generation stage and individual prop statuses.
 * Aggregates individual prop states into a unified stream status.
 * @template Props - The type of the component props
 * @param generationStage - The current generation stage from the LLM
 * @param propStatus - Status record for each individual prop
 * @param hasComponent - Whether a component exists in the current message
 * @param generationError - Any error from the generation process itself
 * @returns The aggregated StreamStatus for the entire component
 */
function deriveGlobalStreamStatus<Props extends Record<string, any>>(
  generationStage: GenerationStage,
  propStatus: Record<keyof Props, PropStatus>,
  hasComponent: boolean,
  generationError?: Error,
): StreamStatus {
  const propStatuses = Object.values(propStatus);

  // If all props are already successful, the component is complete regardless of generation stage
  const allPropsSuccessful =
    propStatuses.length > 0 && propStatuses.every((p) => p.isSuccess);

  // Only consider generation stage if not all props are complete
  const isGenerationStreaming =
    !allPropsSuccessful &&
    generationStage === GenerationStage.STREAMING_RESPONSE;
  const isGenerationError = generationStage === GenerationStage.ERROR;

  /** Find first error from generation or any prop */
  const firstError =
    generationError ?? propStatuses.find((p) => p.error)?.error;

  return {
    /** isPending: no component yet OR (has component but no props have started) */
    isPending:
      !hasComponent ||
      (!isGenerationStreaming &&
        !allPropsSuccessful &&
        propStatuses.every((p) => p.isPending)),

    /** isStreaming: any prop is streaming (generation stage doesn't matter if props are complete) */
    isStreaming: propStatuses.some((p) => p.isStreaming),

    /** isSuccess: all props successful (component is stable once all props complete) */
    isSuccess: allPropsSuccessful,

    /** isError: generation error OR any prop error */
    isError:
      isGenerationError ||
      propStatuses.some((p) => p.error) ||
      !!generationError,

    streamError: firstError,
  };
}

/**
 * Track streaming status for Tambo component props.
 *
 * **Important**: Props update repeatedly during streaming and may be partial.
 * Use `propStatus.<field>?.isSuccess` before treating a prop as complete.
 *
 * Pair with `useTamboComponentState` to disable inputs while streaming.
 * @see {@link https://docs.tambo.co/concepts/streaming/streaming-best-practices}
 * @template Props - Component props type
 * @returns `streamStatus` (overall) and `propStatus` (per-prop) flags
 * @throws {Error} When used during SSR/SSG
 * @example
 * ```tsx
 * // Wait for entire stream
 * const { streamStatus } = useTamboStreamStatus();
 * if (!streamStatus.isSuccess) return <Spinner />;
 * return <Card {...props} />;
 * ```
 * @example
 * ```tsx
 * // Highlight in-flight props
 * const { propStatus } = useTamboStreamStatus<Props>();
 * <h2 className={propStatus.title.isStreaming ? "animate-pulse" : ""}>
 *   {title}
 * </h2>
 * ```
 */
export function useTamboStreamStatus<
  Props extends Record<string, any> = Record<string, any>,
>(): {
  streamStatus: StreamStatus;
  propStatus: Record<keyof Props, PropStatus>;
} {
  /** SSR Guard - ensure client-side only execution */
  assertClientSide();

  const { generationStage } = useTamboGenerationStage();
  const message = useTamboCurrentMessage();

  /** Get the current component props from the message */
  const componentProps = (message?.component?.props as Props) || ({} as Props);

  /** Track per-prop streaming status */
  const propStatus = usePropsStreamingStatus(
    componentProps,
    generationStage,
    message?.id ?? "",
  );

  /** Derive global stream status from prop statuses and generation stage */
  const streamStatus = useMemo(() => {
    const generationError = message?.error
      ? new Error(message.error)
      : undefined;
    const hasComponent = !!message?.component;
    return deriveGlobalStreamStatus(
      generationStage,
      propStatus,
      hasComponent,
      generationError,
    );
  }, [generationStage, propStatus, message]);

  return {
    streamStatus,
    propStatus,
  };
}
