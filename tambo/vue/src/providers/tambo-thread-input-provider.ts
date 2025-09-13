import { defineComponent, h, inject, provide, ref } from "vue";
import { useTamboMutation } from "../composables/vue-query-hooks";
import { useMessageImages, type StagedImage } from "../composables/use-message-images";
import { ThreadInputError } from "../model/thread-input-error";
import { validateInput } from "../model/validate-input";
import { buildMessageContent } from "../util/message-builder";
import { TAMBO_THREAD_CTX } from "./injection-keys";

export const INPUT_ERROR_MESSAGES = {
  EMPTY: "Message cannot be empty",
  NETWORK: "Network error. Please check your connection",
  SERVER: "Server error. Please try again",
  VALIDATION: "Invalid message format",
} as const;

export interface TamboThreadInputContextProps {
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
  isPending: boolean;
  isError: boolean;
  error?: Error | null;
}

export interface TamboThreadInputProviderProps { contextKey?: string }

const TAMBO_THREAD_INPUT_CTX = Symbol("TAMBO_THREAD_INPUT_CTX") as import("vue").InjectionKey<TamboThreadInputContextProps>;

export const TamboThreadInputProvider = defineComponent<TamboThreadInputProviderProps>({
  name: "TamboThreadInputProvider",
  props: { contextKey: { type: String, required: false } },
  setup(props, { slots }) {
    const thread = inject(TAMBO_THREAD_CTX)!;
    const inputValue = ref("");
    const imageState = useMessageImages();

    async function submit({ contextKey, streamResponse, forceToolChoice, additionalContext }: { contextKey?: string; streamResponse?: boolean; forceToolChoice?: string; additionalContext?: Record<string, any> } = {}) {
      if (inputValue.value?.trim()) {
        const validation = validateInput(inputValue.value);
        if (!validation.isValid) {
          throw new ThreadInputError(
            `Cannot submit message: ${validation.error ?? INPUT_ERROR_MESSAGES.VALIDATION}`,
            { cause: validation.error as any } as any,
          );
        }
      }
      if (!inputValue.value.trim() && imageState.images.value.length === 0) {
        throw new ThreadInputError(INPUT_ERROR_MESSAGES.EMPTY, { cause: "No text or images to send" } as any);
      }
      const messageContent = buildMessageContent(inputValue.value, imageState.images.value);
      await thread.sendThreadMessage(inputValue.value || "Image message", {
        threadId: thread.thread.id,
        contextKey: contextKey ?? props.contextKey ?? undefined,
        streamResponse,
        forceToolChoice,
        additionalContext,
        content: messageContent as any,
      });
      inputValue.value = "";
    }

    const { mutateAsync: submitAsync, isPending, isError, error } = useTamboMutation<void, Error, Parameters<typeof submit>[0]>({ mutationFn: submit });

    const value: TamboThreadInputContextProps = {
      value: inputValue.value,
      setValue: (v: string) => (inputValue.value = v),
      submit: submitAsync,
      images: imageState.images.value,
      addImage: imageState.addImage,
      addImages: imageState.addImages,
      removeImage: imageState.removeImage,
      clearImages: imageState.clearImages,
      isPending,
      isError,
      error: error as any,
    } as any;

    provide(TAMBO_THREAD_INPUT_CTX, value);
    return () => (slots.default ? slots.default() : h("div"));
  },
});

export function useTamboThreadInput() {
  const ctx = (await import("vue")).inject(TAMBO_THREAD_INPUT_CTX);
  if (!ctx) throw new Error("useTamboThreadInput must be used within a TamboThreadInputProvider");
  return ctx;
}

