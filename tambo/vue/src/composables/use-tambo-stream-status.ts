import { computed, reactive } from "vue";
import { GenerationStage } from "../model/generate-component-response";
import { useTamboGenerationStage } from "../providers/tambo-thread-provider";
import { useTamboCurrentMessage } from "./use-current-message";

export interface StreamStatus {
  isPending: boolean;
  isStreaming: boolean;
  isSuccess: boolean;
  isError: boolean;
  streamError?: Error;
}

export interface PropStatus {
  isPending: boolean;
  isStreaming: boolean;
  isSuccess: boolean;
  error?: Error;
}

function usePropsStreamingStatus<Props extends Record<string, any>>(
  props: Props | undefined,
  generationStage: GenerationStage,
  messageId: string,
): Record<keyof Props, PropStatus> {
  const state = reactive<Record<string, { hasStarted: boolean; isComplete: boolean; error?: Error; messageId: string }>>({});
  // Note: Vue reactivity for in-message prop streaming would be driven by re-renders of message props
  // Consumers should pass reactive props for accurate tracking.

  // Compute on demand; here we map current props to statuses.
  const result: Record<string, PropStatus> = {};
  if (!props) return result as Record<keyof Props, PropStatus>;
  const keys = Object.keys(props);
  const allStatuses: PropStatus[] = [];
  for (const key of keys) {
    const tracking = state[key] || { hasStarted: false, isComplete: false, messageId: "" };
    const value = (props as any)[key];
    const hasContent = value !== undefined && value !== null && value !== "";
    if (hasContent && !tracking.hasStarted) {
      state[key] = { ...tracking, hasStarted: true, messageId };
    }
    const isCompleteForThisMessage = tracking.isComplete && tracking.messageId === messageId;
    const isGenerationStreaming = !isCompleteForThisMessage && generationStage === GenerationStage.STREAMING_RESPONSE;
    const status: PropStatus = {
      isPending: !tracking.hasStarted && !isCompleteForThisMessage,
      isStreaming: tracking.hasStarted && !isCompleteForThisMessage && isGenerationStreaming,
      isSuccess: isCompleteForThisMessage,
      error: tracking.error,
    };
    result[key] = status;
    allStatuses.push(status);
  }
  return result as Record<keyof Props, PropStatus>;
}

function deriveGlobalStreamStatus<Props extends Record<string, any>>(
  generationStage: GenerationStage,
  propStatus: Record<keyof Props, PropStatus>,
  hasComponent: boolean,
  generationError?: Error,
): StreamStatus {
  const propStatuses = Object.values(propStatus) as PropStatus[];
  const allPropsSuccessful = propStatuses.length > 0 && propStatuses.every((p) => p.isSuccess);
  const isGenerationStreaming = !allPropsSuccessful && generationStage === GenerationStage.STREAMING_RESPONSE;
  const isGenerationError = generationStage === GenerationStage.ERROR;
  const firstError = generationError ?? propStatuses.find((p) => p.error)?.error;
  return {
    isPending: !hasComponent || (!isGenerationStreaming && !allPropsSuccessful && propStatuses.every((p) => p.isPending)),
    isStreaming: propStatuses.some((p) => p.isStreaming),
    isSuccess: allPropsSuccessful,
    isError: isGenerationError || propStatuses.some((p) => p.error) || !!generationError,
    streamError: firstError,
  };
}

export function useTamboStreamStatus<Props extends Record<string, any> = Record<string, any>>(): {
  streamStatus: StreamStatus;
  propStatus: Record<keyof Props, PropStatus>;
} {
  const { generationStage } = useTamboGenerationStage();
  const message = useTamboCurrentMessage();
  const componentProps = ((message as any)?.component?.props as Props) || ({} as Props);
  const propStatus = usePropsStreamingStatus(componentProps, generationStage as any, (message as any)?.id ?? "");
  const streamStatus = computed(() => {
    const generationError = (message as any)?.error ? new Error((message as any).error) : undefined;
    const hasComponent = !!(message as any)?.component;
    return deriveGlobalStreamStatus(generationStage as any, propStatus, hasComponent, generationError);
  });
  return { streamStatus: streamStatus.value, propStatus };
}

