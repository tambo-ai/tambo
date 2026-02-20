"use client";

import {
  useIsTamboTokenUpdating,
  useTambo,
  useTamboThreadInput,
} from "@tambo-ai/react";
import {
  useTamboElicitationContext,
  type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import { MAX_IMAGES } from "./constants";
import {
  MessageInputContext,
  type MessageInputContextValue,
  type TamboEditor,
} from "./message-input-context";

const STORAGE_KEY = "tambo.components.messageInput.draft";

const getStorageKey = (key: string) => `${STORAGE_KEY}.${key}`;

const storeValueInSessionStorage = (key: string, value?: string) => {
  const storageKey = getStorageKey(key);
  if (value === undefined) {
    sessionStorage.removeItem(storageKey);
    return;
  }

  sessionStorage.setItem(storageKey, JSON.stringify({ rawQuery: value }));
};

const getValueFromSessionStorage = (key: string): string => {
  const storedValue = sessionStorage.getItem(getStorageKey(key)) ?? "";
  try {
    const parsed = JSON.parse(storedValue);
    return parsed.rawQuery ?? "";
  } catch {
    return "";
  }
};

/**
 * Props for the MessageInput.Root component.
 */
export interface MessageInputRootProps extends React.HTMLAttributes<HTMLFormElement> {
  /** Optional ref to forward to the TamboEditor instance */
  inputRef?: React.RefObject<TamboEditor | null>;
  /** The child elements to render within the form container */
  children?: React.ReactNode;
}

/**
 * Root component for the MessageInput compound component.
 * Provides context and handles form submission.
 */
export const MessageInputRoot = React.forwardRef<
  HTMLFormElement,
  MessageInputRootProps
>(({ children, inputRef, ...props }, ref) => {
  const {
    value,
    setValue,
    submit,
    error,
    images,
    addImages,
    addImage,
    removeImage,
  } = useTamboThreadInput();
  const { cancelRun: cancel, currentThreadId, isIdle } = useTambo();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const editorRef = React.useRef<TamboEditor | null>(null);
  const dragCounter = React.useRef(0);
  const isUpdatingToken = useIsTamboTokenUpdating();

  // Use elicitation context (optional)
  const { elicitation, resolveElicitation } = useTamboElicitationContext();

  // Reset local submit state when switching threads so the new thread
  // isn't blocked by an in-flight submit from the previous thread.
  React.useEffect(() => {
    setIsSubmitting(false);
  }, [currentThreadId]);

  React.useEffect(() => {
    // On mount, load any stored draft value, but only if current value is empty
    const storedValue = getValueFromSessionStorage(currentThreadId);
    if (!storedValue) return;
    setValue((currentValue) =>
      currentValue.length > 0 ? currentValue : storedValue,
    );
  }, [setValue, currentThreadId]);

  React.useEffect(() => {
    if (isSubmitting) return;
    storeValueInSessionStorage(currentThreadId, value);
    if (value && editorRef.current && !editorRef.current.isFocused()) {
      editorRef.current.focus("end");
    }
  }, [value, currentThreadId, isSubmitting]);

  const submitMessage = React.useCallback(async () => {
    // Input remains editable during generation/loading, but submission must wait
    // until the thread is idle and auth token refresh is complete.
    if (isUpdatingToken || !isIdle || isSubmitting) return;
    if (!value.trim() && images.length === 0) return;

    // Clear any previous errors
    setSubmitError(null);
    setImageError(null);
    storeValueInSessionStorage(currentThreadId);
    setIsSubmitting(true);

    try {
      await submit();
      // Refocus the editor after a successful submission
      setTimeout(() => {
        editorRef.current?.focus();
      }, 0);
    } catch (submitErr) {
      console.error("Failed to submit message:", submitErr);
      // On submit failure, also clear image error
      setImageError(null);
      setSubmitError(
        submitErr instanceof Error
          ? submitErr.message
          : "Failed to send message. Please try again.",
      );

      // Cancel the thread to reset loading state
      await cancel();
    } finally {
      setIsSubmitting(false);
    }
  }, [
    value,
    submit,
    setSubmitError,
    cancel,
    isSubmitting,
    isIdle,
    isUpdatingToken,
    images,
    currentThreadId,
  ]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await submitMessage();
    },
    [submitMessage],
  );

  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasImages = Array.from(e.dataTransfer.items).some((item) =>
        item.type.startsWith("image/"),
      );
      if (hasImages) {
        setIsDragging(true);
      }
    }
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (files.length > 0) {
        const totalImages = images.length + files.length;
        if (totalImages > MAX_IMAGES) {
          setImageError(`Max ${MAX_IMAGES} uploads at a time`);
          return;
        }
        setImageError(null); // Clear previous error
        try {
          await addImages(files);
        } catch (dropErr) {
          console.error("Failed to add dropped images:", dropErr);
          setImageError(
            dropErr instanceof Error
              ? dropErr.message
              : "Failed to add images. Please try again.",
          );
        }
      }
    },
    [addImages, images, setImageError],
  );

  const handleElicitationResponse = React.useCallback(
    (response: TamboElicitationResponse) => {
      // Calling resolveElicitation automatically clears the elicitation state
      if (resolveElicitation) {
        resolveElicitation(response);
      }
    },
    [resolveElicitation],
  );

  const contextValue = React.useMemo<MessageInputContextValue>(
    () => ({
      value,
      setValue,
      submitMessage,
      submit,
      handleSubmit,
      isPending: isSubmitting,
      error,
      editorRef: inputRef ?? editorRef,
      submitError,
      setSubmitError,
      imageError,
      setImageError,
      elicitation,
      resolveElicitation: handleElicitationResponse,
      isIdle,
      cancel,
      images: images,
      addImages,
      addImage,
      removeImage,
      isUpdatingToken,
      isDragging,
    }),
    [
      value,
      setValue,
      submitMessage,
      submit,
      handleSubmit,
      isSubmitting,
      error,
      inputRef,
      submitError,
      imageError,
      elicitation,
      handleElicitationResponse,
      isIdle,
      cancel,
      images,
      addImages,
      addImage,
      removeImage,
      isUpdatingToken,
      isDragging,
    ],
  );

  return (
    <MessageInputContext.Provider value={contextValue}>
      <form
        ref={ref}
        onSubmit={handleSubmit}
        data-slot="message-input-root"
        data-state={isDragging ? "dragging" : undefined}
        data-pending={isSubmitting || undefined}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        {...props}
      >
        {children}
      </form>
    </MessageInputContext.Provider>
  );
});
MessageInputRoot.displayName = "MessageInput.Root";
