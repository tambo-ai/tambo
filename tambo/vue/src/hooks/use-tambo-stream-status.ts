import { computed, reactive, ref, watch } from "vue";
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
  const propTracking = reactive<Record<string, { hasStarted: boolean; isComplete: boolean; error?: Error; messageId: string }>>({});

  watch(
    () => messageId,
    () => {
      const hasOldMessageData = Object.values(propTracking).some(
        (track) => track.messageId && track.messageId !== messageId,
      );
      if (hasOldMessageData) {
        for (const key of Object.keys(propTracking)) delete propTracking[key];
      }
    },
  );

  watch(
    () => [props, generationStage, messageId],
    () => {
      if (!props) return;
      const propsStartingNow: string[] = [];
      Object.entries(props).forEach(([key, value]) => {
        const current = propTracking[key] || { hasStarted: false, isComplete: false };
        const hasContent = value !== undefined && value !== null && value !== "";
        const justStarted = hasContent && !current.hasStarted;
        if (justStarted) propsStartingNow.push(key);
      });
      Object.entries(props).forEach(([key, value]) => {
        const current = propTracking[key] || { hasStarted: false, isComplete: false };
        const hasContent = value !== undefined && value !== null && value !== "";
        const justStarted = hasContent && !current.hasStarted;
        const hasFollowingPropStarted = propsStartingNow.some((startingKey) => startingKey !== key);
        const isGenerationComplete = generationStage === GenerationStage.COMPLETE;
        const isComplete = current.hasStarted && (hasFollowingPropStarted || isGenerationComplete) && !current.isComplete;
        if (current.isComplete && current.messageId === messageId) return;
        if (justStarted || isComplete) {
          propTracking[key] = {
            ...current,
            hasStarted: justStarted ? true : current.hasStarted,
            isComplete: isComplete ? true : current.isComplete,
            messageId,
          };
        }
      });
    },
    { deep: true },
  );

  const result = {} as Record<keyof Props, PropStatus>;
  if (props) {
    Object.keys(props).forEach((key) => {
      const tracking = propTracking[key] || { hasStarted: false, isComplete: false, messageId: "" };
      const isCompleteForThisMessage = tracking.isComplete && tracking.messageId === messageId;
      const isGenerationStreaming = !isCompleteForThisMessage && generationStage === GenerationStage.STREAMING_RESPONSE;
      (result as any)[key] = {
        isPending: !tracking.hasStarted && !isCompleteForThisMessage,
        isStreaming: tracking.hasStarted && !isCompleteForThisMessage && isGenerationStreaming,
        isSuccess: isCompleteForThisMessage,
        error: tracking.error,
      };
    });
  }
  return result;
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
    isPending:
      !hasComponent || (!isGenerationStreaming && !allPropsSuccessful && propStatuses.every((p) => p.isPending)),
    isStreaming: propStatuses.some((p) => p.isStreaming),
    isSuccess: allPropsSuccessful,
    isError: isGenerationError || propStatuses.some((p) => p.error) || !!generationError,
    streamError: firstError,
  };
}

export function useTamboStreamStatus<
  Props extends Record<string, any> = Record<string, any>,
>(): { streamStatus: StreamStatus; propStatus: Record<keyof Props, PropStatus> } {
  const { generationStage } = useTamboGenerationStage();
  const message = useTamboCurrentMessage();
  const componentProps = ((message as any)?.component?.props as Props) || ({} as Props);
  const propStatus = usePropsStreamingStatus(componentProps, generationStage, (message as any)?.id ?? "");
  const streamStatus = computed(() => {
    const generationError = (message as any)?.error ? new Error((message as any).error) : undefined;
    const hasComponent = !!(message as any)?.component;
    return deriveGlobalStreamStatus(generationStage, propStatus, hasComponent, generationError);
  });
  return { streamStatus: streamStatus.value, propStatus };
}

