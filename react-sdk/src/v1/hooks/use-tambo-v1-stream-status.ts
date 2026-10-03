"use client";

/**
 * useTamboStreamStatus - Stream Status Hook
 *
 * Provides granular streaming status for components being rendered,
 * allowing UI to respond to prop-level streaming states.
 *
 * Must be used within a component rendered via the component renderer.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useComponentContent } from "../utils/component-renderer";
import { useStreamState } from "../providers/tambo-v1-stream-context";
import { findComponentContent } from "@tambo-ai/client";
import type { TamboComponentContent } from "../types/message";

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

/** Status for a prop, including nested fields or progressively streamed array items. */
export type PropStatusNode<Value> = PropStatus &
  (NonNullable<Value> extends readonly (infer Item)[]
    ? { completedItems: Item[]; streamingItems: Item[] }
    : NonNullable<Value> extends object
      ? {
          fields?: {
            [Key in keyof NonNullable<Value>]?: PropStatusNode<
              NonNullable<Value>[Key]
            >;
          };
        }
      : Record<never, never>);

/** Mirrors the component's prop shape with streaming status at each field. */
export type PropStatusMap<Props extends object> = {
  [Key in keyof Props]?: PropStatusNode<Props[Key]>;
};

/** Records paths that have received content, including paths inside objects. */
function collectStartedPaths(
  value: unknown,
  path: string[],
  addPath: (path: string[]) => void,
): void {
  if (value === undefined || value === null || value === "") return;

  addPath(path);
  // Array items are exposed through completedItems/streamingItems, not child
  // statuses. Walking each item on every token adds work with no benefit.
  if (Array.isArray(value)) return;
  if (typeof value === "object") {
    Object.entries(value).forEach(([key, child]) =>
      collectStartedPaths(child, [...path, key], addPath),
    );
  }
}

/**
 * Derives a nested status tree from the parsed props and component lifecycle.
 * @returns Status flags and any child field or array item status.
 */
function createPropStatus(
  value: unknown,
  path: string[],
  started: Set<string>,
  isStreamingDone: boolean,
  isComponentStreaming: boolean,
): PropStatus & Record<string, unknown> {
  const hasStarted = started.has(JSON.stringify(path));
  const isComplete = hasStarted && isStreamingDone;
  const status: PropStatus & Record<string, unknown> = {
    isPending: !hasStarted,
    isStreaming: hasStarted && !isComplete && isComponentStreaming,
    isSuccess: isComplete,
    error: undefined,
  };

  if (Array.isArray(value)) {
    if (isStreamingDone) {
      return { ...status, completedItems: [...value], streamingItems: [] };
    }
    if (isComponentStreaming) {
      return {
        ...status,
        completedItems: value.slice(0, -1),
        streamingItems: value.slice(-1),
      };
    }
    return {
      ...status,
      // A cancelled or failed run can leave the component marked "streaming".
      // Once the run stops, no trailing item is still in progress.
      completedItems: [...value],
      streamingItems: [],
    };
  }

  if (value && typeof value === "object") {
    const children = Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        createPropStatus(
          child,
          [...path, key],
          started,
          isStreamingDone,
          isComponentStreaming,
        ),
      ]),
    );
    return { ...status, fields: children };
  }

  return status;
}

/**
 * Track streaming status for individual props by monitoring their values.
 * Monitors when props receive their first token and when they complete streaming.
 * @template Props - The type of the component props being tracked
 * @param props - The current component props object
 * @param componentStreamingState - The current streaming state of the component
 * @param isRunActive - Whether the thread's current run can still receive updates
 * @returns A status tree with nested object statuses under `fields`
 */
function usePropsStreamingStatus<Props extends object>(
  props: Props | undefined,
  componentStreamingState: TamboComponentContent["streamingState"] | undefined,
  isRunActive: boolean,
): PropStatusMap<Props> {
  /** Track which props have received content */
  const [startedProps, setStartedProps] = useState(new Set<string>());

  /** Update started props when content arrives */
  useEffect(() => {
    if (!props) return;

    setStartedProps((prev) => {
      let newStarted: Set<string> | undefined;
      const addPath = (path: string[]) => {
        const key = JSON.stringify(path);
        if (prev.has(key)) return;
        newStarted ??= new Set(prev);
        newStarted.add(key);
      };

      for (const [key, value] of Object.entries(props)) {
        collectStartedPaths(value, [key], addPath);
      }
      return newStarted ?? prev;
    });
  }, [props]);

  /** Derive prop statuses from started props and streaming state */
  return useMemo(() => {
    if (!props) return {};

    const isStreamingDone = componentStreamingState === "done";
    const isComponentStreaming =
      componentStreamingState === "streaming" && isRunActive;

    const statusByProp: PropStatusMap<Props> = {};
    for (const [key, value] of Object.entries(props)) {
      Object.assign(statusByProp, {
        [key]: createPropStatus(
          value,
          [key],
          startedProps,
          isStreamingDone,
          isComponentStreaming,
        ),
      });
    }
    return statusByProp;
  }, [props, startedProps, componentStreamingState, isRunActive]);
}

/**
 * Derives global StreamStatus from component streaming state and individual prop statuses.
 * Aggregates individual prop states into a unified stream status.
 * @template Props - The type of the component props
 * @param componentStreamingState - The current streaming state of the component
 * @param propStatus - Status record for each individual prop
 * @param hasComponent - Whether a component exists in the current message
 * @param isRunActive - Whether the thread's current run can still receive updates
 * @param streamError - Any error from the streaming process itself
 * @returns The aggregated StreamStatus for the entire component
 */
function deriveGlobalStreamStatus(
  componentStreamingState: TamboComponentContent["streamingState"] | undefined,
  propStatus: Partial<Record<string, PropStatus>>,
  hasComponent: boolean,
  isRunActive: boolean,
  streamError?: Error,
): StreamStatus {
  const propStatuses: PropStatus[] = Object.values(propStatus).filter(
    (p): p is PropStatus => p !== undefined,
  );
  const isStreamError = !!streamError;

  // If all props are already successful, the component is complete regardless of streaming state
  const allPropsSuccessful =
    propStatuses.length > 0 && propStatuses.every((p) => p.isSuccess);

  // Component is streaming if streamingState is "streaming" (even before props start)
  const isComponentStreaming =
    componentStreamingState === "streaming" && isRunActive;
  const anyPropStreaming = propStatuses.some((p) => p.isStreaming);

  /** Find first error from stream or any prop */
  const firstError = streamError ?? propStatuses.find((p) => p.error)?.error;

  return {
    /** isPending: no component yet OR (not streaming, not error, not success, and all props pending) */
    isPending:
      !hasComponent ||
      (!isStreamError &&
        !isComponentStreaming &&
        !allPropsSuccessful &&
        propStatuses.every((p) => p.isPending)),

    /** isStreaming: component is streaming OR any prop is streaming (but not if error) */
    isStreaming: !isStreamError && (isComponentStreaming || anyPropStreaming),

    /** isSuccess: all props successful and no error */
    isSuccess: allPropsSuccessful && !isStreamError,

    /** isError: stream error OR any prop error */
    isError: isStreamError || propStatuses.some((p) => p.error),

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
 * @see {@link https://docs.tambo.co/concepts/generative-interfaces/component-state}
 * @template Props - Component props type
 * @returns `streamStatus` (overall) and `propStatus` (per-prop) flags
 * @throws {Error} When used outside a rendered component
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
 * <h2 className={propStatus.title?.isStreaming ? "animate-pulse" : ""}>
 *   {title}
 * </h2>
 * ```
 */
export function useTamboStreamStatus<
  Props extends object = Record<string, unknown>,
>(): {
  streamStatus: StreamStatus;
  propStatus: PropStatusMap<Props>;
} {
  const { componentId, threadId } = useComponentContent();
  const streamState = useStreamState();

  /**
   * Error if componentId changes - this indicates the provider hierarchy is broken.
   * The componentId should remain stable for the lifetime of the component.
   * If this fires, the ComponentRenderer is likely being used incorrectly,
   * or the component tree is being remounted in unexpected ways.
   */
  const initialComponentIdRef = useRef(componentId);
  useEffect(() => {
    if (componentId !== initialComponentIdRef.current) {
      console.error(
        `useTamboStreamStatus: componentId changed from "${initialComponentIdRef.current}" to "${componentId}". ` +
          "This indicates a bug in the component tree or incorrect provider usage. " +
          "The componentId must remain stable for the component's lifetime. " +
          "Check that ComponentRenderer is not being remounted unexpectedly.",
      );
      initialComponentIdRef.current = componentId;
    }
  }, [componentId]);

  /** Get the current thread state */
  const threadState = streamState.threadMap[threadId];
  const isRunActive =
    threadState?.streaming.status === "streaming" ||
    threadState?.streaming.status === "waiting";

  /** Get error message from stream state if any */
  const streamErrorMessage = threadState?.streaming.error?.message;

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
    isRunActive,
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
      isRunActive,
      streamError,
    );
  }, [
    componentStreamingState,
    propStatus,
    componentContent,
    isRunActive,
    streamErrorMessage,
  ]);

  return {
    streamStatus,
    propStatus,
  };
}
