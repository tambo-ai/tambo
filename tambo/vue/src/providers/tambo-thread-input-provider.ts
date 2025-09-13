import { InjectionKey, inject, provide, ref } from "vue";
import { useTamboMutation, UseTamboMutationResult } from "../hooks/vue-query-hooks";
import { useMessageImages, StagedImage } from "../hooks/use-message-images";
import { validateInput } from "../model/validate-input";
import { buildMessageContent } from "../util/message-builder";
import { useTamboThread } from "./tambo-thread-provider";

export const INPUT_ERROR_MESSAGES = {
  EMPTY: "Message cannot be empty",
  NETWORK: "Network error. Please check your connection",
  SERVER: "Server error. Please try again",
  VALIDATION: "Invalid message format",
} as const;

export interface TamboThreadInputContextProps
  extends Omit<
    UseTamboMutationResult<
      void,
      Error,
      | {
          contextKey?: string;
          streamResponse?: boolean;
          forceToolChoice?: string;
          additionalContext?: Record<string, any>;
        }
      | undefined,
      unknown
    >,
    "mutate" | "mutateAsync"
  > {
  value: string;
  setValue: (value: string) => void;
  submit: (options?: {
    contextKey?: string;
    streamResponse?: boolean;
    forceToolChoice?: string;
    additionalContext?: Record<string, any>;
  }) => Promise<void>;
  images: StagedImage[];
  addImage: (file: File) => Promise<void>;
  addImages: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  clearImages: () => void;
}

const TamboThreadInputKey: InjectionKey<TamboThreadInputContextProps> = Symbol("TamboThreadInputContext");

export interface TamboThreadInputProviderProps { contextKey?: string }

export function provideTamboThreadInput(props: TamboThreadInputProviderProps = {}) {
  const { thread, sendThreadMessage } = useTamboThread();
  const inputValue = ref("");
  const imageState = useMessageImages();

  const submit = async ({
    contextKey: submitContextKey,
    streamResponse,
    forceToolChoice,
    additionalContext,
  }: {
    contextKey?: string;
    streamResponse?: boolean;
    forceToolChoice?: string;
    additionalContext?: Record<string, any>;
  } = {}) => {
    if (inputValue.value?.trim()) {
      const validation = validateInput(inputValue.value);
      if (!validation.isValid) {
        throw new Error(
          `Cannot submit message: ${validation.error?.message ?? INPUT_ERROR_MESSAGES.VALIDATION}`,
        );
      }
    }
    if (!inputValue.value.trim() && imageState.images.value.length === 0) {
      throw new Error(INPUT_ERROR_MESSAGES.EMPTY);
    }
    const messageContent = buildMessageContent(inputValue.value, imageState.images.value);
    await sendThreadMessage(inputValue.value || "Image message", {
      threadId: thread.id,
      contextKey: submitContextKey ?? props.contextKey ?? undefined,
      streamResponse,
      forceToolChoice,
      additionalContext,
      content: messageContent,
    });
    inputValue.value = "";
  };

  const { mutateAsync: submitAsync, mutate: _unusedSubmit, ...mutationState } = useTamboMutation({ mutationFn: submit });

  const ctx: TamboThreadInputContextProps = {
    ...mutationState,
    get value() {
      return inputValue.value;
    },
    setValue: (v: string) => {
      inputValue.value = v;
    },
    submit: submitAsync,
    get images() {
      return imageState.images.value;
    },
    addImage: imageState.addImage,
    addImages: imageState.addImages,
    removeImage: imageState.removeImage,
    clearImages: imageState.clearImages,
  } as any;

  provide(TamboThreadInputKey, ctx);
  return ctx;
}

export function useTamboThreadInput() {
  const ctx = inject(TamboThreadInputKey);
  if (!ctx) throw new Error("useTamboThreadInput must be used after provideTamboThreadInput");
  return ctx;
}

