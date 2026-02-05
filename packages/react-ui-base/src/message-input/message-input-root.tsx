"use client";

import { Slot } from "@radix-ui/react-slot";
import {
  useIsTamboTokenUpdating,
  useTamboThread,
  useTamboThreadInput,
} from "@tambo-ai/react";
import {
  useTamboElicitationContext,
  type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import {
  MAX_IMAGES,
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
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
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
>(({ asChild, children, inputRef, ...props }, ref) => {
  const {
    value,
    setValue,
    submit,
    isPending,
    error,
    images,
    addImages,
    addImage,
    removeImage,
  } = useTamboThreadInput();
  const { cancel, thread, isIdle } = useTamboThread();
  const [displayValue, setDisplayValue] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const editorRef = React.useRef<TamboEditor | null>(null);
  const dragCounter = React.useRef(0);
  const isUpdatingToken = useIsTamboTokenUpdating();

  // Use elicitation context (optional)
  const { elicitation, resolveElicitation } = useTamboElicitationContext();

  React.useEffect(() => {
    // On mount, load any stored draft value, but only if current value is empty
    const storedValue = getValueFromSessionStorage(thread.id);
    if (!storedValue) return;
    setValue((currentValue) => currentValue ?? storedValue);
  }, [setValue, thread.id]);

  React.useEffect(() => {
    setDisplayValue(value);
    storeValueInSessionStorage(thread.id, value);
    if (value && editorRef.current) {
      editorRef.current.focus();
    }
  }, [value, thread.id]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if ((!value.trim() && images.length === 0) || isSubmitting) return;

      // Clear any previous errors
      setSubmitError(null);
      setImageError(null);
      setDisplayValue("");
      storeValueInSessionStorage(thread.id);
      setIsSubmitting(true);

      // Extract resource names directly from editor at submit time to ensure we have the latest
      let latestResourceNames: Record<string, string> = {};
      const editor = editorRef.current;
      if (editor) {
        const extracted = editor.getTextWithResourceURIs();
        latestResourceNames = extracted.resourceNames;
      }

      const imageIdsAtSubmitTime = images.map((image) => image.id);

      try {
        await submit({
          streamResponse: true,
          resourceNames: latestResourceNames,
        });
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
        setIsSubmitting(false);
      }
    },
    [
      value,
      submit,
      setValue,
      setDisplayValue,
      setSubmitError,
      cancel,
      isSubmitting,
      images,
      removeImage,
      thread.id,
    ],
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
      submit,
      handleSubmit,
      isPending: isPending ?? isSubmitting,
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
      submit,
      handleSubmit,
      isPending,
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

  const Comp = asChild ? Slot : "form";

  return (
    <MessageInputContext.Provider value={contextValue}>
      <Comp
        ref={ref}
        onSubmit={handleSubmit}
        data-slot="message-input-root"
        data-state={isDragging ? "dragging" : undefined}
        data-pending={isPending || isSubmitting || undefined}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        {...props}
      >
        {children}
      </Comp>
    </MessageInputContext.Provider>
  );
});
MessageInputRoot.displayName = "MessageInput.Root";
