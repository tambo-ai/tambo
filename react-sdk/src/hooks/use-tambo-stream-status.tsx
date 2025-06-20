"use client";
import { useEffect, useState } from "react";
import { GenerationStage } from "../model/generate-component-response";
import { useTamboThread } from "../providers";
import { useTamboCurrentMessage } from "./use-current-message";

/** Global stream flags */
export interface StreamStatus {
  isPending: boolean; // no token for any prop yet
  isStreaming: boolean; // ≥1 prop still streaming
  isSuccess: boolean; // every prop finished without error
  isError: boolean; // a fatal error occurred in any prop or the stream
  streamError?: Error; // first fatal error (undefined if none)
}

/** Per-prop flags */
export interface PropStatus {
  isPending: boolean; // no token for prop
  isStreaming: boolean; // ≥1 token for the prop, next props has <1 token
  isSuccess: boolean; // next prop has > 1 token
  isError: boolean; // if there is an error during the stream
  error?: Error; // the error (undefined if none)
}

/**
 * Hook that exposes streaming readiness flags for tambo-ai components.
 * 
 * Surfaces per-prop and global streaming status so consumers can show 
 * loaders, skeletons, or errors while LLM-generated props stream in.
 * 
 * @throws {Error} During SSR/SSG - use only in browser contexts or wrap in useEffect/dynamic import
 * @returns Object containing streamStatus (global) and propStatus (per-prop) flags
 * 
 * @example
 * ```tsx
 * // Wait for entire stream
 * const { streamStatus } = useTamboStreamStatus();
 * if (!streamStatus.isSuccess) return <Spinner />;
 * return <Card {...props} />;
 * ```
 * 
 * @example
 * ```tsx
 * // Highlight in-flight props
 * const { propStatus } = useTamboStreamStatus<{ title: string }>();
 * <h2 className={propStatus.title.isStreaming ? "animate-pulse" : ""}>
 *   {title}
 * </h2>
 * ```
 */
export function useTamboStreamStatus<Props = unknown>(): {
  streamStatus: StreamStatus;
  propStatus: Record<keyof Props, PropStatus>;
} {
  // SSR Guard
  if (typeof window === "undefined") {
    throw new Error(
      "useTamboStreamStatus cannot be used during SSR/SSG. Use only in browser contexts or wrap in useEffect/dynamic import."
    );
  }

  const { streaming, generationStage } = useTamboThread();
  const message = useTamboCurrentMessage();
  
  const [propStatus, setPropStatus] = useState<Record<keyof Props, PropStatus>>({} as Record<keyof Props, PropStatus>);
  const [streamError, setStreamError] = useState<Error | undefined>();

  // Track prop streaming states
  useEffect(() => {
    if (!message?.componentProps) {
      return;
    }

    const newPropStatus = {} as Record<keyof Props, PropStatus>;
    const props = message.componentProps as Props;

    // Analyze each prop to determine its streaming status
    Object.keys(props).forEach((key) => {
      const propKey = key as keyof Props;
      const propValue = props[propKey];
      
      // Determine prop status based on value and streaming state
      const hasValue = propValue !== undefined && propValue !== null && propValue !== "";
      const isCurrentlyStreaming = streaming && generationStage === GenerationStage.STREAMING_RESPONSE;
      
      // For simplicity, we'll consider a prop to be:
      // - isPending: if no value and not streaming yet
      // - isStreaming: if has partial value and currently streaming
      // - isSuccess: if has complete value and not streaming
      // - isError: if there's a stream error
      
      newPropStatus[propKey] = {
        isPending: !hasValue && !isCurrentlyStreaming,
        isStreaming: hasValue && isCurrentlyStreaming,
        isSuccess: hasValue && !isCurrentlyStreaming && generationStage === GenerationStage.COMPLETE,
        isError: generationStage === GenerationStage.ERROR,
        error: generationStage === GenerationStage.ERROR ? streamError : undefined,
      };
    });

    setPropStatus(newPropStatus);
  }, [message?.componentProps, streaming, generationStage, streamError]);

  // Handle stream errors
  useEffect(() => {
    if (generationStage === GenerationStage.ERROR && !streamError) {
      setStreamError(new Error("Stream generation failed"));
    }
  }, [generationStage, streamError]);

  // Calculate global stream status based on prop statuses
  const streamStatus: StreamStatus = (() => {
    const propStatusValues = Object.values(propStatus) as PropStatus[];
    
    if (propStatusValues.length === 0) {
      // No props to track
      return {
        isPending: true,
        isStreaming: false,
        isSuccess: false,
        isError: false,
        streamError: undefined,
      };
    }

    // Apply derivation rules from the specification
    const isPending = propStatusValues.every(prop => prop.isPending);
    const isStreaming = propStatusValues.some(prop => prop.isStreaming);
    const isSuccess = propStatusValues.every(prop => prop.isSuccess);
    const isError = propStatusValues.some(prop => prop.isError) || !!streamError;

    return {
      isPending,
      isStreaming,
      isSuccess,
      isError,
      streamError: isError ? (streamError || propStatusValues.find(prop => prop.error)?.error) : undefined,
    };
  })();

  return {
    streamStatus,
    propStatus,
  };
}