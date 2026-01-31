"use client";

import { ElicitationUI } from "@/components/tambo/elicitation-ui";
import {
  McpPromptButton,
  McpResourceButton,
} from "@/components/tambo/mcp-components";
import { McpConfigModal } from "./mcp-config-modal";
import {
  Tooltip,
  TooltipProvider,
} from "@/components/tambo/suggestions-tooltip";
import { cn } from "@/lib/utils";
import {
  useIsTamboTokenUpdating,
  useTamboThread,
  useTamboThreadInput,
  type StagedImage,
} from "@tambo-ai/react";
import {
  useTamboElicitationContext,
  useTamboMcpPrompt,
  useTamboMcpPromptList,
  useTamboMcpResourceList,
  type TamboElicitationRequest,
  type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import { cva, type VariantProps } from "class-variance-authority";
import {
  ArrowUp,
  AtSign,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Square,
  X,
} from "lucide-react";
import * as React from "react";
import { useDebounce } from "use-debounce";
import {
  getImageItems,
  TextEditor,
  type PromptItem,
  type ResourceItem,
  type TamboEditor,
} from "./text-editor";

// Lazy load DictationButton for code splitting (framework-agnostic alternative to next/dynamic)
// eslint-disable-next-line @typescript-eslint/promise-function-async
const LazyDictationButton = React.lazy(() => import("./dictation-button"));

/**
 * Wrapper component that includes Suspense boundary for the lazy-loaded DictationButton.
 * This ensures the component can be safely used without requiring consumers to add their own Suspense.
 * Also handles SSR by only rendering on the client (DictationButton uses Web Audio APIs).
 */
const DictationButton = () => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <React.Suspense fallback={null}>
      <LazyDictationButton />
    </React.Suspense>
  );
};

/**
 * Provider interface for searching resources (for "@" mentions).
 * Empty query string "" should return all available resources.
 */
export interface ResourceProvider {
  /** Search for resources matching the query */
  search(query: string): Promise<ResourceItem[]>;
}

/**
 * Provider interface for searching and fetching prompts (for "/" commands).
 * Empty query string "" should return all available prompts.
 */
export interface PromptProvider {
  /** Search for prompts matching the query */
  search(query: string): Promise<PromptItem[]>;
  /** Get the full prompt details including text by ID */
  get(id: string): Promise<PromptItem>;
}

/**
 * Removes duplicate resource items based on ID.
 */
const dedupeResourceItems = (resourceItems: ResourceItem[]) => {
  const seen = new Set<string>();
  return resourceItems.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

/**
 * Filters resource items by query string.
 * Empty query returns all items.
 */
const filterResourceItems = (
  resourceItems: ResourceItem[],
  query: string,
): ResourceItem[] => {
  if (query === "") return resourceItems;

  const normalizedQuery = query.toLocaleLowerCase();
  return resourceItems.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  );
};

/**
 * Filters prompt items by query string.
 * Empty query returns all items.
 */
const filterPromptItems = (
  promptItems: PromptItem[],
  query: string,
): PromptItem[] => {
  if (query === "") return promptItems;

  const normalizedQuery = query.toLocaleLowerCase();
  return promptItems.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  );
};

const EXTERNAL_SEARCH_DEBOUNCE_MS = 200;

/**
 * Hook to get a combined resource list that merges MCP resources with an external provider.
 * Returns the combined, filtered resource items.
 *
 * @param externalProvider - Optional external resource provider
 * @param search - Search string to filter resources. For MCP servers, results are filtered locally.
 *                 For registry dynamic sources, the search is passed to listResources(search).
 */
function useCombinedResourceList(
  externalProvider: ResourceProvider | undefined,
  search: string,
): ResourceItem[] {
  const { data: mcpResources } = useTamboMcpResourceList(search);
  const [debouncedSearch] = useDebounce(search, EXTERNAL_SEARCH_DEBOUNCE_MS);

  // Convert MCP resources to ResourceItems
  const mcpItems: ResourceItem[] = React.useMemo(
    () =>
      mcpResources
        ? (
            mcpResources as {
              resource: { uri: string; name?: string };
            }[]
          ).map((entry) => ({
            // Use the full URI (already includes serverKey prefix from MCP hook)
            // When inserted as @{id}, parseResourceReferences will strip serverKey before sending to backend
            id: entry.resource.uri,
            name: entry.resource.name ?? entry.resource.uri,
            icon: React.createElement(AtSign, { className: "w-4 h-4" }),
            componentData: { type: "mcp-resource", data: entry },
          }))
        : [],
    [mcpResources],
  );

  // Track external provider results with state
  const [externalItems, setExternalItems] = React.useState<ResourceItem[]>([]);

  // Fetch external resources when search changes
  React.useEffect(() => {
    if (!externalProvider) {
      setExternalItems([]);
      return;
    }

    let cancelled = false;
    externalProvider
      .search(debouncedSearch)
      .then((items) => {
        if (!cancelled) {
          setExternalItems(items);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch external resources", error);
        if (!cancelled) {
          setExternalItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [externalProvider, debouncedSearch]);

  // Combine and dedupe - MCP resources are already filtered by the hook
  // External items need to be filtered locally
  const combined = React.useMemo(() => {
    const filteredExternal = filterResourceItems(externalItems, search);
    return dedupeResourceItems([...mcpItems, ...filteredExternal]);
  }, [mcpItems, externalItems, search]);

  return combined;
}

/**
 * Hook to get a combined prompt list that merges MCP prompts with an external provider.
 * Returns the combined, filtered prompt items.
 *
 * @param externalProvider - Optional external prompt provider
 * @param search - Search string to filter prompts by name. MCP prompts are filtered via the hook.
 */
function useCombinedPromptList(
  externalProvider: PromptProvider | undefined,
  search: string,
): PromptItem[] {
  // Pass search to MCP hook for filtering
  const { data: mcpPrompts } = useTamboMcpPromptList(search);
  const [debouncedSearch] = useDebounce(search, EXTERNAL_SEARCH_DEBOUNCE_MS);

  // Convert MCP prompts to PromptItems (mark with mcp-prompt: prefix for special handling)
  const mcpItems: PromptItem[] = React.useMemo(
    () =>
      mcpPrompts
        ? (mcpPrompts as { prompt: { name: string } }[]).map((entry) => ({
            id: `mcp-prompt:${entry.prompt.name}`,
            name: entry.prompt.name,
            icon: React.createElement(FileText, { className: "w-4 h-4" }),
            text: "", // Text will be fetched when selected via useTamboMcpPrompt
          }))
        : [],
    [mcpPrompts],
  );

  // Track external provider results with state
  const [externalItems, setExternalItems] = React.useState<PromptItem[]>([]);

  // Fetch external prompts when search changes
  React.useEffect(() => {
    if (!externalProvider) {
      setExternalItems([]);
      return;
    }

    let cancelled = false;
    externalProvider
      .search(debouncedSearch)
      .then((items) => {
        if (!cancelled) {
          setExternalItems(items);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch external prompts", error);
        if (!cancelled) {
          setExternalItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [externalProvider, debouncedSearch]);

  // Combine - MCP prompts are already filtered by the hook
  // External items need to be filtered locally
  const combined = React.useMemo(() => {
    const filteredExternal = filterPromptItems(externalItems, search);
    return [...mcpItems, ...filteredExternal];
  }, [mcpItems, externalItems, search]);

  return combined;
}

/**
 * CSS variants for the message input container
 * @typedef {Object} MessageInputVariants
 * @property {string} default - Default styling
 * @property {string} solid - Solid styling with shadow effects
 * @property {string} bordered - Bordered styling with border emphasis
 */
const messageInputVariants = cva("w-full", {
  variants: {
    variant: {
      default: "",
      solid: [
        "[&>div]:bg-background",
        "[&>div]:border-0",
        "[&>div]:shadow-xl [&>div]:shadow-black/5 [&>div]:dark:shadow-black/20",
        "[&>div]:ring-1 [&>div]:ring-black/5 [&>div]:dark:ring-white/10",
        "[&_textarea]:bg-transparent",
        "[&_textarea]:rounded-lg",
      ].join(" "),
      bordered: [
        "[&>div]:bg-transparent",
        "[&>div]:border-2 [&>div]:border-gray-300 [&>div]:dark:border-zinc-600",
        "[&>div]:shadow-none",
        "[&_textarea]:bg-transparent",
        "[&_textarea]:border-0",
      ].join(" "),
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * @typedef MessageInputContextValue
 * @property {string} value - The current input value
 * @property {function} setValue - Function to update the input value
 * @property {function} submit - Function to submit the message
 * @property {function} handleSubmit - Function to handle form submission
 * @property {boolean} isPending - Whether a submission is in progress
 * @property {Error|null} error - Any error from the submission
 * @property {TamboEditor|null} editorRef - Reference to the TamboEditor instance
 * @property {string | null} submitError - Error from the submission
 * @property {function} setSubmitError - Function to set the submission error
 * @property {string | null} imageError - Error related to image uploads
 * @property {function} setImageError - Function to set the image upload error
 * @property {TamboElicitationRequest | null} elicitation - Current elicitation request (read-only)
 * @property {function} resolveElicitation - Function to resolve the elicitation promise (automatically clears state)
 */
interface MessageInputContextValue {
  value: string;
  setValue: (value: string) => void;
  submit: (options: {
    streamResponse?: boolean;
    resourceNames: Record<string, string>;
  }) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  editorRef: React.RefObject<TamboEditor>;
  submitError: string | null;
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
  imageError: string | null;
  setImageError: React.Dispatch<React.SetStateAction<string | null>>;
  elicitation: TamboElicitationRequest | null;
  resolveElicitation: ((response: TamboElicitationResponse) => void) | null;
}

/**
 * React Context for sharing message input data and functions among sub-components.
 * @internal
 */
const MessageInputContext =
  React.createContext<MessageInputContextValue | null>(null);

/**
 * Hook to access the message input context.
 * Throws an error if used outside of a MessageInput component.
 * @returns {MessageInputContextValue} The message input context value.
 * @throws {Error} If used outside of MessageInput.
 * @internal
 */
const useMessageInputContext = () => {
  const context = React.useContext(MessageInputContext);
  if (!context) {
    throw new Error(
      "MessageInput sub-components must be used within a MessageInput",
    );
  }
  return context;
};

/**
 * Props for the MessageInput component.
 * Extends standard HTMLFormElement attributes.
 */
export interface MessageInputProps extends React.HTMLAttributes<HTMLFormElement> {
  /** Optional styling variant for the input container. */
  variant?: VariantProps<typeof messageInputVariants>["variant"];
  /** Optional ref to forward to the TamboEditor instance. */
  inputRef?: React.RefObject<TamboEditor>;
  /** The child elements to render within the form container. */
  children?: React.ReactNode;
}

/**
 * The root container for a message input component.
 * It establishes the context for its children and handles the form submission.
 * @component MessageInput
 * @example
 * ```tsx
 * <MessageInput variant="solid">
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
const MessageInput = React.forwardRef<HTMLFormElement, MessageInputProps>(
  ({ children, className, variant, ...props }, ref) => {
    return (
      <MessageInputInternal
        ref={ref}
        className={className}
        variant={variant}
        {...props}
      >
        <TooltipProvider>{children}</TooltipProvider>
      </MessageInputInternal>
    );
  },
);
MessageInput.displayName = "MessageInput";

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
 * Internal MessageInput component that uses the TamboThreadInput context
 */
const MessageInputInternal = React.forwardRef<
  HTMLFormElement,
  MessageInputProps
>(({ children, className, variant, inputRef, ...props }, ref) => {
  const {
    value,
    setValue,
    submit,
    isPending,
    error,
    images,
    addImages,
    removeImage,
  } = useTamboThreadInput();
  const { cancel, thread } = useTamboThread();
  const [displayValue, setDisplayValue] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const editorRef = React.useRef<TamboEditor>(null!);
  const dragCounter = React.useRef(0);

  // Use elicitation context (optional)
  const { elicitation, resolveElicitation } = useTamboElicitationContext();

  React.useEffect(() => {
    // On mount, load any stored draft value, but only if current value is empty
    const storedValue = getValueFromSessionStorage(thread.id);
    if (!storedValue) return;
    setValue((value) => value ?? storedValue);
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
      } catch (error) {
        console.error("Failed to submit message:", error);
        setDisplayValue(value);
        // On submit failure, also clear image error
        setImageError(null);
        setSubmitError(
          error instanceof Error
            ? error.message
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
      editorRef,
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
        } catch (error) {
          console.error("Failed to add dropped images:", error);
          setImageError(
            error instanceof Error
              ? error.message
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

  const contextValue = React.useMemo(
    () => ({
      value: displayValue,
      setValue: (newValue: string) => {
        setValue(newValue);
        setDisplayValue(newValue);
      },
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
      resolveElicitation,
    }),
    [
      displayValue,
      setValue,
      submit,
      handleSubmit,
      isPending,
      isSubmitting,
      error,
      inputRef,
      editorRef,
      submitError,
      imageError,
      setImageError,
      elicitation,
      resolveElicitation,
    ],
  );
  return (
    <MessageInputContext.Provider
      value={contextValue as MessageInputContextValue}
    >
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn(messageInputVariants({ variant }), className)}
        data-slot="message-input-form"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        {...props}
      >
        <div
          className={cn(
            "relative flex flex-col rounded-xl bg-background shadow-md p-2 px-3",
            isDragging
              ? "border border-dashed border-emerald-400"
              : "border border-border",
          )}
        >
          {isDragging && (
            <div className="absolute inset-0 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/30 flex items-center justify-center pointer-events-none z-20">
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                Drop files here to add to conversation
              </p>
            </div>
          )}
          {elicitation ? (
            <ElicitationUI
              request={elicitation}
              onResponse={handleElicitationResponse}
            />
          ) : (
            <>
              <MessageInputStagedImages />
              {children}
            </>
          )}
        </div>
      </form>
    </MessageInputContext.Provider>
  );
});
MessageInputInternal.displayName = "MessageInputInternal";
MessageInput.displayName = "MessageInput";

/**
 * Symbol for marking pasted images
 */
const IS_PASTED_IMAGE = Symbol.for("tambo-is-pasted-image");

/** Maximum number of images that can be staged at once */
const MAX_IMAGES = 10;

/**
 * Extend the File interface to include IS_PASTED_IMAGE symbol
 */
declare global {
  interface File {
    [IS_PASTED_IMAGE]?: boolean;
  }
}

/**
 * Props for the MessageInputTextarea component.
 * Extends standard TextareaHTMLAttributes.
 */
export interface MessageInputTextareaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom placeholder text. */
  placeholder?: string;
  /** Resource provider for @ mentions (optional - includes interactables by default) */
  resourceProvider?: ResourceProvider;
  /** Prompt provider for / commands (optional) */
  promptProvider?: PromptProvider;
  /** Callback when a resource is selected from @ mentions (optional) */
  onResourceSelect?: (item: ResourceItem) => void;
}

/**
 * Rich-text textarea component for entering message text with @ mention support.
 * Uses the TipTap-based TextEditor which supports:
 * - @ mention autocomplete for interactables plus optional static items and async fetchers
 * - Keyboard navigation (Enter to submit, Shift+Enter for newline)
 * - Image paste handling via the thread input context
 *
 * **Note:** This component uses refs internally to ensure callbacks stay fresh,
 * so consumers can pass updated providers on each render without worrying about
 * closure issues with the TipTap editor.
 *
 * @component MessageInput.Textarea
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea
 *     placeholder="Type your message..."
 *     resourceProvider={{
 *       search: async (query) => {
 *         // Return custom resources
 *         return [{ id: "foo", name: "Foo" }];
 *       }
 *     }}
 *   />
 * </MessageInput>
 * ```
 */
const MessageInputTextarea = ({
  className,
  placeholder = "What do you want to do?",
  resourceProvider,
  promptProvider,
  onResourceSelect,
  ...props
}: MessageInputTextareaProps) => {
  const { value, setValue, handleSubmit, editorRef, setImageError } =
    useMessageInputContext();
  const { isIdle } = useTamboThread();
  const { addImage, images } = useTamboThreadInput();
  const isUpdatingToken = useIsTamboTokenUpdating();
  // Resource names are extracted from editor at submit time, no need to track in state
  const setResourceNames = React.useCallback(
    (
      _resourceNames:
        | Record<string, string>
        | ((prev: Record<string, string>) => Record<string, string>),
    ) => {
      // No-op - we extract resource names directly from editor at submit time
    },
    [],
  );

  // Track search state for resources (controlled by TextEditor)
  const [resourceSearch, setResourceSearch] = React.useState("");

  // Track search state for prompts (controlled by TextEditor)
  const [promptSearch, setPromptSearch] = React.useState("");

  // Get combined resource list (MCP + external provider), filtered by search
  const resourceItems = useCombinedResourceList(
    resourceProvider,
    resourceSearch,
  );

  // Get combined prompt list (MCP + external provider), filtered by search
  const promptItems = useCombinedPromptList(promptProvider, promptSearch);

  // State for MCP prompt fetching (since we can't call hooks inside get())
  const [selectedMcpPromptName, setSelectedMcpPromptName] = React.useState<
    string | null
  >(null);
  const { data: selectedMcpPromptData } = useTamboMcpPrompt(
    selectedMcpPromptName ?? "",
  );

  // Handle MCP prompt insertion when data is fetched
  React.useEffect(() => {
    if (selectedMcpPromptData && selectedMcpPromptName) {
      const promptMessages = selectedMcpPromptData?.messages;
      if (promptMessages) {
        const promptText = promptMessages
          .map((msg) => {
            if (msg.content?.type === "text") {
              return msg.content.text;
            }
            return "";
          })
          .filter(Boolean)
          .join("\n");

        const editor = editorRef.current;
        if (editor) {
          editor.setContent(promptText);
          setValue(promptText);
          editor.focus("end");
        }
      }
      setSelectedMcpPromptName(null);
    }
  }, [selectedMcpPromptData, selectedMcpPromptName, editorRef, setValue]);

  // Handle prompt selection - check if it's an MCP prompt
  const handlePromptSelect = React.useCallback((item: PromptItem) => {
    if (item.id.startsWith("mcp-prompt:")) {
      const promptName = item.id.replace("mcp-prompt:", "");
      setSelectedMcpPromptName(promptName);
    }
  }, []);

  // Handle image paste - mark as pasted and add to thread
  const pendingImagesRef = React.useRef(0);

  const handleAddImage = React.useCallback(
    async (file: File) => {
      if (images.length + pendingImagesRef.current >= MAX_IMAGES) {
        setImageError(`Max ${MAX_IMAGES} uploads at a time`);
        return;
      }
      setImageError(null);
      pendingImagesRef.current += 1;
      try {
        file[IS_PASTED_IMAGE] = true;
        await addImage(file);
      } finally {
        pendingImagesRef.current -= 1;
      }
    },
    [addImage, images, setImageError],
  );

  return (
    <div
      className={cn("flex-1", className)}
      data-slot="message-input-textarea"
      {...props}
    >
      <TextEditor
        ref={editorRef}
        value={value}
        onChange={setValue}
        onResourceNamesChange={setResourceNames}
        onSubmit={handleSubmit}
        onAddImage={handleAddImage}
        placeholder={placeholder}
        disabled={!isIdle || isUpdatingToken}
        className="bg-background text-foreground"
        onSearchResources={setResourceSearch}
        resources={resourceItems}
        onSearchPrompts={setPromptSearch}
        prompts={promptItems}
        onResourceSelect={onResourceSelect ?? (() => {})}
        onPromptSelect={handlePromptSelect}
      />
    </div>
  );
};
MessageInputTextarea.displayName = "MessageInput.Textarea";

/**
 * Props for the legacy plain textarea message input component.
 * This preserves the original MessageInput.Textarea API for backward compatibility.
 */
export interface MessageInputPlainTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Custom placeholder text. */
  placeholder?: string;
}

/**
 * Legacy textarea-based message input component.
 *
 * This mirrors the previous MessageInput.Textarea implementation using a native
 * `<textarea>` element. It remains available as an opt-in escape hatch for
 * consumers that relied on textarea-specific props or refs.
 */
const MessageInputPlainTextarea = ({
  className,
  placeholder = "What do you want to do?",
  ...props
}: MessageInputPlainTextareaProps) => {
  const { value, setValue, handleSubmit, setImageError } =
    useMessageInputContext();
  const { isIdle } = useTamboThread();
  const { addImage, images } = useTamboThreadInput();
  const isUpdatingToken = useIsTamboTokenUpdating();
  const isPending = !isIdle;
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        await handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const { imageItems, hasText } = getImageItems(e.clipboardData);

    if (imageItems.length === 0) {
      return; // Allow default text paste
    }

    if (!hasText) {
      e.preventDefault(); // Only prevent when image-only paste
    }

    const totalImages = images.length + imageItems.length;
    if (totalImages > MAX_IMAGES) {
      setImageError(`Max ${MAX_IMAGES} uploads at a time`);
      return;
    }
    setImageError(null);

    for (const item of imageItems) {
      try {
        // Mark this image as pasted so we can show "Image 1", "Image 2", etc.
        item[IS_PASTED_IMAGE] = true;
        await addImage(item);
      } catch (error) {
        console.error("Failed to add pasted image:", error);
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={cn(
        "flex-1 p-3 rounded-t-lg bg-background text-foreground resize-none text-sm min-h-[82px] max-h-[40vh] focus:outline-none placeholder:text-muted-foreground/50",
        className,
      )}
      disabled={isPending || isUpdatingToken}
      placeholder={placeholder}
      aria-label="Chat Message Input"
      data-slot="message-input-textarea"
      {...props}
    />
  );
};
MessageInputPlainTextarea.displayName = "MessageInput.PlainTextarea";

/**
 * Props for the MessageInputSubmitButton component.
 * Extends standard ButtonHTMLAttributes.
 */
export interface MessageInputSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional content to display inside the button. */
  children?: React.ReactNode;
}

/**
 * Submit button component for sending messages.
 * Automatically connects to the context to handle submission state.
 * @component MessageInput.SubmitButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <div className="flex justify-end mt-2 p-1">
 *     <MessageInput.SubmitButton />
 *   </div>
 * </MessageInput>
 * ```
 */
const MessageInputSubmitButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputSubmitButtonProps
>(({ className, children, ...props }, ref) => {
  const { isPending } = useMessageInputContext();
  const { cancel, isIdle } = useTamboThread();
  const isUpdatingToken = useIsTamboTokenUpdating();

  // Show cancel button if either:
  // 1. A mutation is in progress (isPending), OR
  // 2. Thread is stuck in a processing state (e.g., after browser refresh during tool execution)
  const showCancelButton = isPending || !isIdle;

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await cancel();
  };

  const buttonClasses = cn(
    "w-10 h-10 bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-50 flex items-center justify-center enabled:cursor-pointer",
    className,
  );

  return (
    <button
      ref={ref}
      type={showCancelButton ? "button" : "submit"}
      disabled={isUpdatingToken}
      onClick={showCancelButton ? handleCancel : undefined}
      className={buttonClasses}
      aria-label={showCancelButton ? "Cancel message" : "Send message"}
      data-slot={
        showCancelButton ? "message-input-cancel" : "message-input-submit"
      }
      {...props}
    >
      {children ??
        (showCancelButton ? (
          <Square className="w-4 h-4" fill="currentColor" />
        ) : (
          <ArrowUp className="w-5 h-5" />
        ))}
    </button>
  );
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";

const MCPIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      color="#000000"
      fill="none"
    >
      <path
        d="M3.49994 11.7501L11.6717 3.57855C12.7762 2.47398 14.5672 2.47398 15.6717 3.57855C16.7762 4.68312 16.7762 6.47398 15.6717 7.57855M15.6717 7.57855L9.49994 13.7501M15.6717 7.57855C16.7762 6.47398 18.5672 6.47398 19.6717 7.57855C20.7762 8.68312 20.7762 10.474 19.6717 11.5785L12.7072 18.543C12.3167 18.9335 12.3167 19.5667 12.7072 19.9572L13.9999 21.2499"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M17.4999 9.74921L11.3282 15.921C10.2237 17.0255 8.43272 17.0255 7.32823 15.921C6.22373 14.8164 6.22373 13.0255 7.32823 11.921L13.4999 5.74939"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};
/**
 * MCP Config Button component for opening the MCP configuration modal.
 * @component MessageInput.McpConfigButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.McpConfigButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpConfigButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
  }
>(({ className, ...props }, ref) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <>
      <Tooltip content="Configure MCP Servers" side="right">
        <button
          ref={ref}
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={buttonClasses}
          aria-label="Open MCP Configuration"
          data-slot="message-input-mcp-config"
          {...props}
        >
          <MCPIcon />
        </button>
      </Tooltip>
      <McpConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
});
MessageInputMcpConfigButton.displayName = "MessageInput.McpConfigButton";

/**
 * Props for the MessageInputError component.
 * Extends standard HTMLParagraphElement attributes.
 */
export type MessageInputErrorProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * Error message component for displaying submission errors.
 * Automatically connects to the context to display any errors.
 * @component MessageInput.Error
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
const MessageInputError = React.forwardRef<
  HTMLParagraphElement,
  MessageInputErrorProps
>(({ className, ...props }, ref) => {
  const { error, submitError, imageError } = useMessageInputContext();

  if (!error && !submitError && !imageError) {
    return null;
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm text-destructive mt-2", className)}
      data-slot="message-input-error"
      {...props}
    >
      {error?.message ?? submitError ?? imageError}
    </p>
  );
});
MessageInputError.displayName = "MessageInput.Error";

/**
 * Props for the MessageInputFileButton component.
 */
export interface MessageInputFileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accept attribute for file input - defaults to image types */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
}

/**
 * File attachment button component for selecting images from file system.
 * @component MessageInput.FileButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.FileButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputFileButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputFileButtonProps
>(({ className, accept = "image/*", multiple = true, ...props }, ref) => {
  const { addImages, images } = useTamboThreadInput();
  const { setImageError } = useMessageInputContext();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    try {
      const totalImages = images.length + files.length;

      if (totalImages > MAX_IMAGES) {
        setImageError(`Max ${MAX_IMAGES} uploads at a time`);
        e.target.value = "";
        return;
      }

      setImageError(null);
      await addImages(files);
    } catch (error) {
      console.error("Failed to add selected files:", error);
    }
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <Tooltip content="Attach Images" side="top">
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={buttonClasses}
        aria-label="Attach Images"
        data-slot="message-input-file-button"
        {...props}
      >
        <Paperclip className="w-4 h-4" />
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </button>
    </Tooltip>
  );
});
MessageInputFileButton.displayName = "MessageInput.FileButton";

/**
 * Props for the MessageInputMcpPromptButton component.
 */
export type MessageInputMcpPromptButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * MCP Prompt picker button component for inserting prompts from MCP servers.
 * Wraps McpPromptButton and connects it to MessageInput context.
 * @component MessageInput.McpPromptButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.FileButton />
 *     <MessageInput.McpPromptButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpPromptButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputMcpPromptButtonProps
>(({ ...props }, ref) => {
  const { setValue, value } = useMessageInputContext();
  return (
    <McpPromptButton
      ref={ref}
      {...props}
      value={value}
      onInsertText={setValue}
    />
  );
});
MessageInputMcpPromptButton.displayName = "MessageInput.McpPromptButton";

/**
 * Props for the MessageInputMcpResourceButton component.
 */
export type MessageInputMcpResourceButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * MCP Resource picker button component for inserting resource references from MCP servers.
 * Wraps McpResourceButton and connects it to MessageInput context.
 * @component MessageInput.McpResourceButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.FileButton />
 *     <MessageInput.McpPromptButton />
 *     <MessageInput.McpResourceButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpResourceButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputMcpResourceButtonProps
>(({ ...props }, ref) => {
  const { setValue, value, editorRef } = useMessageInputContext();

  const insertResourceReference = React.useCallback(
    (id: string, label: string) => {
      const editor = editorRef.current;
      if (editor) {
        editor.insertMention(id, label);
        setValue(editor.getTextWithResourceURIs().text);
        return;
      }
      // Fallback: append to end of plain text value
      const newValue = value ? `${value} ${id}` : id;
      setValue(newValue);
    },
    [editorRef, setValue, value],
  );

  return (
    <McpResourceButton
      ref={ref}
      {...props}
      value={value}
      onInsertResource={insertResourceReference}
    />
  );
});
MessageInputMcpResourceButton.displayName = "MessageInput.McpResourceButton";

/**
 * Props for the ImageContextBadge component.
 */
interface ImageContextBadgeProps {
  image: StagedImage;
  displayName: string;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

/**
 * ContextBadge component that displays a staged image with expandable preview.
 * Shows a compact badge with icon and name by default, expands to show image preview on click.
 *
 * @component
 * @example
 * ```tsx
 * <ImageContextBadge
 *   image={stagedImage}
 *   displayName="Image"
 *   isExpanded={false}
 *   onToggle={() => setExpanded(!expanded)}
 *   onRemove={() => removeImage(image.id)}
 * />
 * ```
 */
const ImageContextBadge: React.FC<ImageContextBadgeProps> = ({
  image,
  displayName,
  isExpanded,
  onToggle,
  onRemove,
}) => (
  <div className="relative group flex-shrink-0">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        "relative flex items-center rounded-lg border overflow-hidden",
        "border-border bg-background hover:bg-muted cursor-pointer",
        "transition-[width,height,padding] duration-200 ease-in-out",
        isExpanded ? "w-40 h-28 p-0" : "w-32 h-9 pl-3 pr-8 gap-2",
      )}
    >
      {isExpanded && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-150",
            "opacity-100 delay-100",
          )}
        >
          <div className="relative w-full h-full">
            <img
              src={image.dataUrl}
              alt={displayName}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-1 left-2 right-2 text-white text-xs font-medium truncate">
              {displayName}
            </div>
          </div>
        </div>
      )}
      <span
        className={cn(
          "flex items-center gap-1.5 text-sm text-foreground truncate leading-none transition-opacity duration-150",
          isExpanded ? "opacity-0" : "opacity-100 delay-100",
        )}
      >
        <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{displayName}</span>
      </span>
    </button>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className="absolute -top-1 -right-1 w-5 h-5 bg-background border border-border text-muted-foreground rounded-full flex items-center justify-center hover:bg-muted hover:text-foreground transition-colors shadow-sm z-10"
      aria-label={`Remove ${displayName}`}
    >
      <X className="w-3 h-3" />
    </button>
  </div>
);

/**
 * Props for the MessageInputStagedImages component.
 */
export type MessageInputStagedImagesProps =
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Component that displays currently staged images with preview and remove functionality.
 * @component MessageInput.StagedImages
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.StagedImages />
 *   <MessageInput.Textarea />
 * </MessageInput>
 * ```
 */
const MessageInputStagedImages = React.forwardRef<
  HTMLDivElement,
  MessageInputStagedImagesProps
>(({ className, ...props }, ref) => {
  const { images, removeImage } = useTamboThreadInput();
  const [expandedImageId, setExpandedImageId] = React.useState<string | null>(
    null,
  );

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-2 pb-2 pt-1 border-b border-border",
        className,
      )}
      data-slot="message-input-staged-images"
      {...props}
    >
      {images.map((image, index) => (
        <ImageContextBadge
          key={image.id}
          image={image}
          displayName={
            image.file?.[IS_PASTED_IMAGE] ? `Image ${index + 1}` : image.name
          }
          isExpanded={expandedImageId === image.id}
          onToggle={() =>
            setExpandedImageId(expandedImageId === image.id ? null : image.id)
          }
          onRemove={() => removeImage(image.id)}
        />
      ))}
    </div>
  );
});
MessageInputStagedImages.displayName = "MessageInput.StagedImages";

/**
 * Convenience wrapper that renders staged images as context badges.
 * Keeps API parity with the web app's MessageInputContexts component.
 */
const MessageInputContexts = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <MessageInputStagedImages
    ref={ref}
    className={cn("pb-2 pt-1 border-b border-border", className)}
    {...props}
  />
));
MessageInputContexts.displayName = "MessageInputContexts";

/**
 * Container for the toolbar components (like submit button and MCP config button).
 * Provides correct spacing and alignment.
 * @component MessageInput.Toolbar
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.McpConfigButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * ```
 */
const MessageInputToolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex justify-between items-center mt-2 p-1 gap-2",
        className,
      )}
      data-slot="message-input-toolbar"
      {...props}
    >
      <div className="flex items-center gap-2">
        {/* Left side - everything except submit button */}
        {React.Children.map(children, (child): React.ReactNode => {
          if (
            React.isValidElement(child) &&
            child.type === MessageInputSubmitButton
          ) {
            return null; // Don't render submit button here
          }
          return child;
        })}
      </div>
      <div className="flex items-center gap-2">
        <DictationButton />
        {/* Right side - only submit button */}
        {React.Children.map(children, (child): React.ReactNode => {
          if (
            React.isValidElement(child) &&
            child.type === MessageInputSubmitButton
          ) {
            return child; // Only render submit button here
          }
          return null;
        })}
      </div>
    </div>
  );
});
MessageInputToolbar.displayName = "MessageInput.Toolbar";

// --- Exports ---
export {
  DictationButton,
  MessageInput,
  MessageInputContexts,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpConfigButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  MessageInputPlainTextarea,
  MessageInputStagedImages,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
  messageInputVariants,
};

// Re-export types from text-editor for convenience
export type { PromptItem, ResourceItem } from "./text-editor";
