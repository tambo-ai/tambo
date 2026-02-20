"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
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
export interface MessageInputRootRenderProps extends Record<string, unknown> {
  isDragging: boolean;
  isSubmitting: boolean;
  hasError: boolean;
}

type MessageInputRootComponentProps = useRender.ComponentProps<
  "form",
  MessageInputRootRenderProps
>;

export interface MessageInputRootProps extends MessageInputRootComponentProps {
  /** Optional ref to forward to the TamboEditor instance */
  inputRef?: React.RefObject<TamboEditor | null>;
}

/**
 * Root component for the MessageInput compound component.
 * Provides context and handles form submission.
 */
export const MessageInputRoot = React.forwardRef<
  HTMLFormElement,
  MessageInputRootProps
>(({ inputRef, ...props }, ref) => {
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
  const [displayValue, setDisplayValue] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const editorRef = React.useRef<TamboEditor | null>(null);
  const dragCounter = React.useRef(0);
  // Tracks whether a submission is in-flight. Used to prevent the display-value
  // sync effect from restoring the old input text when `currentThreadId` changes
  // mid-submission (e.g. placeholder → real thread ID migration).
  const submittingRef = React.useRef(false);
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
    setValue((currentValue) => currentValue ?? storedValue);
  }, [setValue, currentThreadId]);

  React.useEffect(() => {
    // While a submission is in-flight, displayValue has been intentionally
    // cleared. Don't overwrite it when currentThreadId changes (e.g.
    // placeholder → real thread ID migration triggers this effect).
    if (submittingRef.current) return;

    setDisplayValue(value);
    storeValueInSessionStorage(currentThreadId, value);
    if (value && editorRef.current) {
      editorRef.current.focus();
    }
  }, [value, currentThreadId]);

  const submitMessage = React.useCallback(async () => {
    if ((!value.trim() && images.length === 0) || isSubmitting) return;

    // Clear any previous errors
    setSubmitError(null);
    setImageError(null);
    setDisplayValue("");
    storeValueInSessionStorage(currentThreadId);
    submittingRef.current = true;
    setIsSubmitting(true);

    const imageIdsAtSubmitTime = images.map((image) => image.id);

    try {
      await submit();
      setValue("");
      // Clear only the images that were staged when submission started so
      // any images added while the request was in-flight are preserved.
      if (imageIdsAtSubmitTime.length > 0) {
        imageIdsAtSubmitTime.forEach((id) => removeImage(id));
      }
      // Refocus the editor after a successful submission
      setTimeout(() => {
        editorRef.current?.focus();
      }, 0);
    } catch (submitErr) {
      console.error("Failed to submit message:", submitErr);
      setDisplayValue(value);
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
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    value,
    submit,
    setValue,
    setDisplayValue,
    setSubmitError,
    cancel,
    isSubmitting,
    images,
    removeImage,
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

  // Memoize setValue wrapper to prevent context value recreation on every render
  const handleSetValue = React.useCallback(
    (newValue: string) => {
      setValue(newValue);
      setDisplayValue(newValue);
    },
    [setValue],
  );

  const contextValue = React.useMemo<MessageInputContextValue>(
    () => ({
      value: displayValue,
      setValue: handleSetValue,
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
      displayValue,
      handleSetValue,
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

  const { render, ...componentProps } = props;
  const renderProps: MessageInputRootRenderProps = {
    isDragging,
    isSubmitting,
    hasError: !!(error || submitError || imageError),
  };

  return (
    <MessageInputContext.Provider value={contextValue}>
      {useRender({
        defaultTagName: "form",
        ref,
        render,
        state: renderProps,
        props: mergeProps(componentProps, {
          onSubmit: handleSubmit,
          onDragEnter: handleDragEnter,
          onDragLeave: handleDragLeave,
          onDragOver: handleDragOver,
          onDrop: handleDrop,
          "data-slot": "message-input-root",
          "data-state": isDragging ? "dragging" : undefined,
          "data-pending": isSubmitting || undefined,
        }),
      })}
    </MessageInputContext.Provider>
  );
});
MessageInputRoot.displayName = "MessageInput.Root";
