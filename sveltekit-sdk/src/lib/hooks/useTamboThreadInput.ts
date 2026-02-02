import { getContext } from "svelte";
import { TAMBO_INPUT_KEY, TAMBO_THREAD_KEY } from "../context.js";
import type { InputStore } from "../stores/input.svelte.js";
import type { ThreadStore } from "../stores/thread.svelte.js";

export interface TamboThreadInputContext extends InputStore {
  /** @deprecated Use stagedImages instead */
  readonly images: InputStore["stagedImages"];
  submit(): Promise<void>;
}

/**
 * Get the thread input store from context with submit functionality.
 *
 * Provides access to input value, staged images, and methods for
 * managing user input state and submitting messages.
 *
 * Must be called within a component that is a descendant of TamboProvider.
 * @returns The input store with submit method
 * @throws Error if called outside of TamboProvider
 */
export function useTamboThreadInput(): TamboThreadInputContext {
  const maybeInputStore = getContext<InputStore | undefined>(TAMBO_INPUT_KEY);
  const maybeThreadStore = getContext<ThreadStore | undefined>(
    TAMBO_THREAD_KEY,
  );

  if (!maybeInputStore) {
    throw new Error("useTamboThreadInput must be used within a TamboProvider");
  }

  if (!maybeThreadStore) {
    throw new Error("useTamboThreadInput must be used within a TamboProvider");
  }

  // Capture in const after narrowing for use in closures
  const inputStore = maybeInputStore;
  const threadStore = maybeThreadStore;

  async function submit(): Promise<void> {
    const value = inputStore.value.trim();
    if (!value && inputStore.stagedImages.length === 0) {
      return;
    }

    const images = [...inputStore.stagedImages];

    // Clear input before sending
    inputStore.clear();
    inputStore.setSubmitting(true);

    try {
      await threadStore.sendMessage(value, images);
    } finally {
      inputStore.setSubmitting(false);
    }
  }

  return {
    get value() {
      return inputStore.value;
    },
    get stagedImages() {
      return inputStore.stagedImages;
    },
    // Alias for backwards compatibility
    get images() {
      return inputStore.stagedImages;
    },
    get isSubmitting() {
      return inputStore.isSubmitting;
    },
    setValue: inputStore.setValue,
    clear: inputStore.clear,
    addImage: inputStore.addImage,
    addImages: inputStore.addImages,
    removeImage: inputStore.removeImage,
    clearImages: inputStore.clearImages,
    setSubmitting: inputStore.setSubmitting,
    submit,
  };
}
