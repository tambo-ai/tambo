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
import { findComponentContent } from "../utils/thread-utils";
import type { TamboComponentContent } from "../types/message";

/**
 * Global stream status flags for a specific component in a message.
 * Represents the aggregate state across all props for this component only.
 * Once a component completes, its status remains stable regardless of other generations.
 */
export interface StreamStatus {
  /** Indicates no tokens have been received for any prop and generation is not active. */
  isPending: boolean;
  /** Indicates active streaming - at least one prop is still streaming. */
  isStreaming: boolean;
  /** Indicates successful completion - component streaming is done AND every prop finished without error. */
  isSuccess: boolean;
  /** Indicates a fatal error occurred in any prop or the stream itself. */
  isError: boolean;
  /** The first fatal error encountered during streaming (if any). */
  streamError?: Error;
}

/**
 * Streaming status flags for individual component props.
 */
export interface PropStatus {
  isPending: boolean;
  isStreaming: boolean;
  isSuccess: boolean;
  error?: Error;
}

/**
 * Streaming status for nested object/array props.
 * Mirrors the shape of the prop value, providing streaming indicators
 * for each nested field.
 */
export interface NestedPropStatus extends PropStatus {
  /** For object props: status of each nested field */
  children?: Record<string, NestedPropStatus>;
  /** For array props: total number of items seen so far */
  totalItems?: number;
  /** For array props: number of items that have finished streaming */
  completedItems?: number;
}

/**
 * Track streaming status for individual props by monitoring their values.
 */
function usePropsStreamingStatus<Props extends object = Record<string, unknown>>(
  props: Props | undefined,
  componentStreamingState: TamboComponentContent["streamingState"] | undefined,
): Partial<Record<keyof Props, PropStatus>> {
  const [startedProps, setStartedProps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!props) return;
    setStartedProps((prev) => {
      let changed = false;
      const newStarted = new Set(prev);
      for (const [key, value] of Object.entries(props)) {
        const hasContent = value !== undefined && value !== null && value !== "";
        if (hasContent && !newStarted.has(key)) {
          newStarted.add(key);
          changed = true;
        }
      }
      return changed ? newStarted : prev;
    });
  }, [props]);

  return useMemo(() => {
    if (!props) return {} as Record<keyof Props, PropStatus>;
    const isStreamingDone = componentStreamingState === "done";
    const isComponentStreaming = componentStreamingState === "streaming";
    const result = {} as Record<keyof Props, PropStatus>;
    for (const key of Object.keys(props)) {
      const hasStarted = startedProps.has(key);
      const isComplete = hasStarted && isStreamingDone;
      result[key as keyof Props] = {
        isPending: !hasStarted && !isComplete,
        isStreaming: hasStarted && !isComplete && isComponentStreaming,
        isSuccess: isComplete,
        error: undefined,
      };
    }
    return result;
  }, [props, startedProps, componentStreamingState]);
}

/**
 * Build nested streaming status for complex prop values.
 * Recursively walks object and array values to provide per-field status.
 *
 * @param value - The current prop value
 * @param parentStatus - The flat PropStatus for the parent prop
 * @param isStreamingDone - Whether the component has finished streaming
 * @param maxDepth - Maximum recursion depth (default: 3)
 */
function buildNestedStatus(
  value: unknown,
  parentStatus: PropStatus,
  isStreamingDone: boolean,
  depth: number = 0,
  maxDepth: number = 3,
): NestedPropStatus {
  const base: NestedPropStatus = { ...parentStatus };

  if (depth >= maxDepth) return base;

  // Handle arrays
  if (Array.isArray(value)) {
    base.totalItems = value.length;
    base.completedItems = isStreamingDone
      ? value.length
      : Math.max(0, value.length - 1); // Last item may still be streaming

    if (value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
      const children: Record<string, NestedPropStatus> = {};
      for (let i = 0; i < value.length; i++) {
        const itemDone = isStreamingDone || i < value.length - 1;
        const itemStatus: PropStatus = {
          isPending: false,
          isStreaming: !itemDone && parentStatus.isStreaming,
          isSuccess: itemDone,
          error: undefined,
        };
        children[String(i)] = buildNestedStatus(
          value[i],
          itemStatus,
          itemDone,
          depth + 1,
          maxDepth,
        );
      }
      base.children = children;
    }
    return base;
  }

  // Handle objects
  if (typeof value === "object" && value !== null) {
    const children: Record<string, NestedPropStatus> = {};
    const entries = Object.entries(value as Record<string, unknown>);

    for (const [key, fieldValue] of entries) {
      const hasContent =
        fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
      const fieldStatus: PropStatus = {
        isPending: !hasContent && !isStreamingDone,
        isStreaming: hasContent && !isStreamingDone && parentStatus.isStreaming,
        isSuccess: hasContent && isStreamingDone,
        error: undefined,
      };
      children[key] = buildNestedStatus(
        fieldValue,
        fieldStatus,
        isStreamingDone,
        depth + 1,
        maxDepth,
      );
    }
    base.children = children;
    return base;
  }

  return base;
}

/**
 * Build nested prop status for all props.
 */
function useNestedPropStatus<Props extends object = Record<string, unknown>>(
  props: Props | undefined,
  flatPropStatus: Partial<Record<keyof Props, PropStatus>>,
  componentStreamingState: TamboComponentContent["streamingState"] | undefined,
): Partial<Record<keyof Props, NestedPropStatus>> {
  const isStreamingDone = componentStreamingState === "done";

  return useMemo(() => {
    if (!props) return {} as Record<keyof Props, NestedPropStatus>;

    const result = {} as Record<keyof Props, NestedPropStatus>;
    for (const [key, value] of Object.entries(props)) {
      const flatStatus = flatPropStatus[key as keyof Props];
      if (flatStatus) {
        result[key as keyof Props] = buildNestedStatus(
          value,
          flatStatus,
          isStreamingDone,
        );
      }
    }
    return result;
  }, [props, flatPropStatus, isStreamingDone]);
}

/**
 * Derives global StreamStatus from component streaming state and individual prop statuses.
 */
function deriveGlobalStreamStatus<Props extends object>(
  componentStreamingState: TamboComponentContent["streamingState"] | undefined,
  propStatus: Partial<Record<keyof Props, PropStatus>>,
  hasComponent: boolean,
  streamError?: Error,
): StreamStatus {
  const propStatuses: PropStatus[] = Object.values(propStatus).filter(
    (p): p is PropStatus => p !== undefined,
  );
  const isStreamError = !!streamError;
  const allPropsSuccessful =
    propStatuses.length > 0 && propStatuses.every((p) => p.isSuccess);
  const isComponentStreaming = componentStreamingState === "streaming";
  const anyPropStreaming = propStatuses.some((p) => p.isStreaming);
  const firstError = streamError ?? propStatuses.find((p) => p.error)?.error;

  return {
    isPending:
      !hasComponent ||
      (!isStreamError &&
        !isComponentStreaming &&
        !allPropsSuccessful &&
        propStatuses.every((p) => p.isPending)),
    isStreaming: !isStreamError && (isComponentStreaming || anyPropStreaming),
    isSuccess: allPropsSuccessful && !isStreamError,
    isError: isStreamError || propStatuses.some((p) => p.error),
    streamError: firstError,
  };
}

/**
 * Track streaming status for Tambo component props.
 *
 * Returns:
 * - `streamStatus` - Global streaming status for the entire component
 * - `propStatus` - Flat per-prop streaming status
 * - `nestedPropStatus` - Nested streaming status for object/array props,
 *   with `children` for nested fields and `completedItems`/`totalItems` for arrays
 */
export function useTamboStreamStatus<
  Props extends object = Record<string, unknown>,
>(): {
  streamStatus: StreamStatus;
  propStatus: Partial<Record<keyof Props, PropStatus>>;
  nestedPropStatus: Partial<Record<keyof Props, NestedPropStatus>>;
} {
  const { componentId, threadId } = useComponentContent();
  const streamState = useStreamState();
  const initialComponentIdRef = useRef(componentId);

  useEffect(() => {
    if (componentId !== initialComponentIdRef.current) {
      console.error(
        `useTamboStreamStatus: componentId changed from "${initialComponentIdRef.current}" to "${componentId}". ` +
          "This indicates a bug in the component tree or incorrect provider usage.",
      );
      initialComponentIdRef.current = componentId;
    }
  }, [componentId]);

  const threadState = streamState.threadMap[threadId];
  const streamErrorMessage = threadState?.streaming.error?.message;
  const componentContent = findComponentContent(
    streamState,
    threadId,
    componentId,
  );
  const componentProps =
    (componentContent?.props as Props | undefined) ?? ({} as Props);
  const componentStreamingState = componentContent?.streamingState;
  const propStatus = usePropsStreamingStatus(
    componentProps,
    componentStreamingState,
  );

  const nestedPropStatus = useNestedPropStatus(
    componentProps,
    propStatus,
    componentStreamingState,
  );

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
  }, [componentStreamingState, propStatus, componentContent, streamErrorMessage]);

  return { streamStatus, propStatus, nestedPropStatus };
}
