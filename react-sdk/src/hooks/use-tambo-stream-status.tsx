"use client";
import { useEffect, useMemo, useState } from "react";
import { GenerationStage } from "../model/generate-component-response";
import { useTamboThread } from "../providers/tambo-thread-provider";
import { useTamboCurrentMessage } from "./use-current-message";

/** Global stream flags */
export interface StreamStatus {
  isPending: boolean; // no token for any prop yet AND not generating
  isStreaming: boolean; // generation streaming OR ≥1 prop still streaming
  isSuccess: boolean; // generation complete AND every prop finished without error
  isError: boolean; // a fatal error occurred in any prop or the stream
  streamError?: Error; // first fatal error (undefined if none)
}

/** Per-prop flags */
export interface PropStatus {
  isPending: boolean; // no token for prop
  isStreaming: boolean; // ≥1 token for the prop, but not complete
  isSuccess: boolean; // prop has finished streaming successfully
  isError: boolean; // if there is an error during the stream
  error?: Error; // the error (undefined if none)
}

/**
 * SSR Guard - throws during server-side rendering
 */
function assertClientSide() {
  if (typeof window === "undefined") {
    throw new Error(
      "useTamboStreamStatus can only be used in browser contexts. " +
        "This hook is not compatible with SSR/SSG. " +
        "Consider wrapping it in useEffect or using dynamic imports."
    );
  }
}

/**
 * Track streaming status for individual props by monitoring their values
 */
function usePropsStreamingStatus<Props extends Record<string, any>>(
  props: Props | undefined,
  generationStage: GenerationStage
): Record<keyof Props, PropStatus> {
  const [propTracking, setPropTracking] = useState<
    Record<string, { hasStarted: boolean; isComplete: boolean; error?: Error }>
  >({});

  // Reset tracking when generation starts fresh
  useEffect(() => {
    if (generationStage === GenerationStage.IDLE || generationStage === GenerationStage.CHOOSING_COMPONENT) {
      setPropTracking({});
    }
  }, [generationStage]);

  // Track when props start streaming (receive first token) and when they complete
  useEffect(() => {
    if (!props) return;

    setPropTracking((prev) => {
      const updated = { ...prev };
      let hasChanges = false;

      Object.entries(props).forEach(([key, value]) => {
        const current = prev[key] || { hasStarted: false, isComplete: false };
        
        // A prop starts streaming when it has a non-empty value for the first time
        const hasContent = value !== undefined && value !== null && value !== "";
        const justStarted = hasContent && !current.hasStarted;
        
        // A prop is complete when generation is done and it has content
        const isGenerationComplete = generationStage === GenerationStage.COMPLETE;
        const isComplete = isGenerationComplete && hasContent && !current.isComplete;

        if (justStarted || isComplete) {
          updated[key] = {
            ...current,
            hasStarted: justStarted ? true : current.hasStarted,
            isComplete: isComplete ? true : current.isComplete,
          };
          hasChanges = true;
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [props, generationStage]);

  // Convert tracking state to PropStatus objects
  return useMemo(() => {
    if (!props) return {} as Record<keyof Props, PropStatus>;

    const result = {} as Record<keyof Props, PropStatus>;

    Object.keys(props).forEach((key) => {
      const tracking = propTracking[key] || { hasStarted: false, isComplete: false };
      const isGenerationStreaming = generationStage === GenerationStage.STREAMING_RESPONSE;
      
      result[key as keyof Props] = {
        isPending: !tracking.hasStarted && !isGenerationStreaming,
        isStreaming: tracking.hasStarted && !tracking.isComplete && (isGenerationStreaming || !tracking.isComplete),
        isSuccess: tracking.isComplete && !tracking.error,
        isError: !!tracking.error,
        error: tracking.error,
      };
    });

    return result;
  }, [props, propTracking, generationStage]);
}

/**
 * Derives global StreamStatus from generation stage and individual prop statuses
 */
function deriveGlobalStreamStatus<Props extends Record<string, any>>(
  generationStage: GenerationStage,
  propStatus: Record<keyof Props, PropStatus>,
  generationError?: Error
): StreamStatus {
  const propStatuses = Object.values(propStatus) as PropStatus[];
  const isGenerationStreaming = generationStage === GenerationStage.STREAMING_RESPONSE;
  const isGenerationComplete = generationStage === GenerationStage.COMPLETE;
  const isGenerationError = generationStage === GenerationStage.ERROR;

  // Find first error
  const firstError = generationError || propStatuses.find(p => p.error)?.error;

  return {
    // isPending: no generation activity AND all props pending
    isPending: !isGenerationStreaming && !isGenerationComplete && propStatuses.every(p => p.isPending),
    
    // isStreaming: generation is streaming OR any prop is streaming
    isStreaming: isGenerationStreaming || propStatuses.some(p => p.isStreaming),
    
    // isSuccess: generation complete AND all props successful (and at least one prop exists)
    isSuccess: 
      isGenerationComplete && 
      !isGenerationError && 
      propStatuses.length > 0 && 
      propStatuses.every(p => p.isSuccess),
    
    // isError: generation error OR any prop error
    isError: isGenerationError || propStatuses.some(p => p.isError) || !!generationError,
    
    streamError: firstError,
  };
}

/**
 * Hook that exposes per-prop and global streaming status for tambo-ai components.
 * 
 * Provides streaming readiness flags so consumers can show loaders, skeletons, 
 * or errors while LLM-generated props stream in.
 * 
 * @throws {Error} When used during SSR/SSG
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
 * const { propStatus } = useTamboStreamStatus<Props>();
 * <h2 className={propStatus.title.isStreaming ? "animate-pulse" : ""}>
 *   {title}
 * </h2>
 * ```
 */
export function useTamboStreamStatus<Props extends Record<string, any> = Record<string, any>>(): {
  streamStatus: StreamStatus;
  propStatus: Record<keyof Props, PropStatus>;
} {
  // SSR Guard
  assertClientSide();

  const { generationStage } = useTamboThread();
  const message = useTamboCurrentMessage();
  
  // Get the current component props from the message
  const componentProps = (message?.component?.props as Props) || ({} as Props);
  
  // Track per-prop streaming status
  const propStatus = usePropsStreamingStatus(componentProps, generationStage);
  
  // Derive global stream status
  const streamStatus = useMemo(() => {
    const generationError = message?.error ? new Error(message.error.message || "Generation error") : undefined;
    return deriveGlobalStreamStatus(generationStage, propStatus, generationError);
  }, [generationStage, propStatus, message?.error]);

  return {
    streamStatus,
    propStatus,
  };
}