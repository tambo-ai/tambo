"use client";

import { ElicitationUI } from "~/components/tambo/elicitation-ui";
import {
    McpPromptButton,
} from "~/components/tambo/mcp-components";
import { McpConfigModal } from "~/components/tambo/mcp-config-modal";
import {
    Tooltip,
    TooltipProvider,
} from "~/components/tambo/suggestions-tooltip";
import { cn } from "~/lib/utils";
import {
    useIsTamboTokenUpdating,
    useTamboThread,
    useTamboThreadInput,
    TamboThreadProvider,
} from "@tambo-ai/react";
import {
    useTamboElicitationContext,
    type TamboElicitationRequest,
    type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import { cva, type VariantProps } from "class-variance-authority";
import {
    ArrowUp,
    Paperclip,
    Square,
    X,
} from "lucide-react";
import * as React from "react";
import { Suspense } from "react";

const DictationButton = React.lazy(() => import("./dictation-button"));

/**
 * CSS variants for the message input container
 * @typedef {Object} MessageInputVariants
 * @property {string} default - Default styling
 * @property {string} solid - Solid styling with shadow effects
 * @property {string} bordered - Bordered styling with border emphasis
 */
export const messageInputVariants = cva("w-full", {
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
 * @property {string|undefined} contextKey - The thread context key
 * @property {HTMLTextAreaElement|null} textareaRef - Reference to the textarea element
 * @property {string | null} submitError - Error from the submission
 * @property {function} setSubmitError - Function to set the submission error
 * @property {TamboElicitationRequest | null} elicitation - Current elicitation request (read-only)
 * @property {function} resolveElicitation - Function to resolve the elicitation promise (automatically clears state)
 */
interface MessageInputContextValue {
    value: string;
    setValue: (value: string) => void;
    submit: (options: {
        contextKey?: string;
        streamResponse?: boolean;
    }) => Promise<void>;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    isPending: boolean;
    error: Error | null;
    contextKey?: string;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    submitError: string | null;
    setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
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
export interface MessageInputProps
    extends React.HTMLAttributes<HTMLFormElement> {
    /** The context key identifying which thread to send messages to. */
    contextKey?: string;
    /** Optional styling variant for the input container. */
    variant?: VariantProps<typeof messageInputVariants>["variant"];
    /** Optional ref to forward to the textarea element. */
    inputRef?: React.RefObject<HTMLTextAreaElement>;
    /** The child elements to render within the form container. */
    children?: React.ReactNode;
}

/**
 * The root container for a message input component.
 * It establishes the context for its children and handles the form submission.
 * @component MessageInput
 * @example
 * ```tsx
 * <MessageInput contextKey="my-thread" variant="solid">
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
// Define local interface for File with ID (from Tambo SDK internals)
interface StagedFile extends File {
    id?: string;
    file?: File;
}

export const MessageInput = React.forwardRef<HTMLFormElement, MessageInputProps>(
    ({ children, className, contextKey, variant, inputRef, ...props }, ref) => {
        const content = (
            <MessageInputInternal
                ref={ref}
                className={className}
                contextKey={contextKey}
                variant={variant}
                inputRef={inputRef}
                {...props}
            >
                <TooltipProvider>{children}</TooltipProvider>
            </MessageInputInternal>
        );

        if (contextKey) {
            return (
                <TamboThreadProvider contextKey={contextKey}>
                    {content}
                </TamboThreadProvider>
            );
        }

        return content;
    },
);
MessageInput.displayName = "MessageInput";



/**
 * Internal MessageInput component that uses the TamboThreadInput context
 */
const MessageInputInternal = React.forwardRef<
    HTMLFormElement,
    MessageInputProps
>(({ children, className, contextKey, variant, inputRef, ...props }, ref) => {
    const {
        value,
        setValue,
        submit,
        isPending,
        error,
        images,
        addImages,
        clearImages,
    } = useTamboThreadInput();
    const { cancel } = useTamboThread();
    const [displayValue, setDisplayValue] = React.useState("");
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const dragCounter = React.useRef(0);

    // Use elicitation context (optional)
    const { elicitation, resolveElicitation } = useTamboElicitationContext();

    React.useEffect(() => {
        setDisplayValue(value);
        if (value && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [value]);

    const handleSubmit = React.useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if ((!value.trim() && images.length === 0) || isSubmitting) return;

            setSubmitError(null);
            setDisplayValue("");
            setIsSubmitting(true);

            // Clear images in next tick for immediate UI feedback
            if (images.length > 0) {
                setTimeout(() => clearImages(), 0);
            }

            try {
                await submit({
                    streamResponse: true,
                });
                setValue("");
                // Images are cleared automatically by the TamboThreadInputProvider
                setTimeout(() => {
                    textareaRef.current?.focus();
                }, 0);
            } catch (error) {
                console.error("Failed to submit message:", error);
                setDisplayValue(value);
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
            contextKey,
            setValue,
            setDisplayValue,
            setSubmitError,
            cancel,
            isSubmitting,
            images,
            clearImages,
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
                try {
                    await addImages(files);
                } catch (error) {
                    console.error("Failed to add dropped images:", error);
                }
            }
        },
        [addImages],
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
            contextKey,
            textareaRef: inputRef ?? textareaRef,
            submitError,
            setSubmitError,
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
            contextKey,
            inputRef,
            textareaRef,
            submitError,
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
const IS_PASTED_IMAGE = Symbol("is-pasted-image");

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
export interface MessageInputTextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Custom placeholder text. */
    placeholder?: string;
}

/**
 * Textarea component for entering message text.
 * Automatically connects to the context to handle value changes and key presses.
 * @component MessageInput.Textarea
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea placeholder="Type your message..." />
 * </MessageInput>
 * ```
 */
export const MessageInputTextarea = ({
    className,
    placeholder = "What do you want to do?",
    ...props
}: MessageInputTextareaProps) => {
    const { value, setValue, textareaRef, handleSubmit } =
        useMessageInputContext();
    const { isIdle } = useTamboThread();
    const { addImage } = useTamboThreadInput();
    const isUpdatingToken = useIsTamboTokenUpdating();
    const isPending = !isIdle;

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
        const items = Array.from(e.clipboardData.items);
        const imageItems = items.filter((item) => item.type.startsWith("image/"));

        // Allow default paste if there is text, even when images exist
        const hasText = e.clipboardData.getData("text/plain").length > 0;

        if (imageItems.length === 0) {
            return; // Allow default text paste
        }

        if (!hasText) {
            e.preventDefault(); // Only prevent when image-only paste
        }

        for (const item of imageItems) {
            const file = item.getAsFile();
            if (file) {
                try {
                    // Mark this file as pasted so we can show "Image 1", "Image 2", etc.
                    file[IS_PASTED_IMAGE] = true;
                    await addImage(file);
                } catch (error) {
                    console.error("Failed to add pasted image:", error);
                }
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
MessageInputTextarea.displayName = "MessageInput.Textarea";

/**
 * Props for the MessageInputSubmitButton component.
 * Extends standard ButtonHTMLAttributes.
 */
export interface MessageInputSubmitButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
export const MessageInputSubmitButton = React.forwardRef<
    HTMLButtonElement,
    MessageInputSubmitButtonProps
>(({ className, children, ...props }, ref) => {
    const { isPending } = useMessageInputContext();
    const { cancel } = useTamboThread();
    const isUpdatingToken = useIsTamboTokenUpdating();

    const handleCancel = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await cancel();
    };

    const buttonClasses = cn(
        "w-10 h-10 bg-black/80 text-white rounded-lg hover:bg-black/70 disabled:opacity-50 flex items-center justify-center enabled:cursor-pointer",
        className,
    );

    return (
        <button
            ref={ref}
            type={isPending ? "button" : "submit"}
            disabled={isUpdatingToken}
            onClick={isPending ? handleCancel : undefined}
            className={buttonClasses}
            aria-label={isPending ? "Cancel message" : "Send message"}
            data-slot={isPending ? "message-input-cancel" : "message-input-submit"}
            {...props}
        >
            {children ??
                (isPending ? (
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
export const MessageInputMcpConfigButton = React.forwardRef<
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
export const MessageInputError = React.forwardRef<
    HTMLParagraphElement,
    MessageInputErrorProps
>(({ className, ...props }, ref) => {
    const { error, submitError } = useMessageInputContext();

    if (!error && !submitError) {
        return null;
    }

    return (
        <p
            ref={ref}
            className={cn("text-sm text-destructive mt-2", className)}
            data-slot="message-input-error"
            {...props}
        >
            {error?.message ?? submitError}
        </p>
    );
});
MessageInputError.displayName = "MessageInput.Error";

/**
 * Props for the MessageInputFileButton component.
 */
export interface MessageInputFileButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
export const MessageInputFileButton = React.forwardRef<
    HTMLButtonElement,
    MessageInputFileButtonProps
>(({ className, accept = "image/*", multiple = true, ...props }, ref) => {
    const { addImages } = useTamboThreadInput();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        try {
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
export const MessageInputMcpPromptButton = React.forwardRef<
    HTMLButtonElement,
    MessageInputMcpPromptButtonProps
>(({ className, value: _val, ...props }, ref) => {
    const { value, setValue } = useMessageInputContext();

    const handleSelect = (prompt: string) => {
        setValue(prompt);
    };

    return (
        <McpPromptButton
            onInsertText={handleSelect}
            value={value as string}
            className={cn(
                "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                className,
            )}
            ref={ref}
            {...props}
        />
    );
});
MessageInputMcpPromptButton.displayName = "MessageInput.McpPromptButton";

/**
 * Props for the MessageInputDictationButton component.
 */
export type MessageInputDictationButtonProps =
    React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Dictation button component for speech-to-text input.
 * Dynamically loaded since it requires browser APIs.
 * @component MessageInput.DictationButton
 */
export const MessageInputDictationButton = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    return (
        <div ref={ref} className={className} {...props}>
            <Suspense
                fallback={
                    <div className="w-10 h-10 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
                    </div>
                }
            >
                <DictationButton />
            </Suspense>
        </div>
    );
});
MessageInputDictationButton.displayName = "MessageInput.DictationButton";

/**
 * Container specifically for displaying staged images (images selected but not yet sent)
 * @component MessageInput.StagedImages
 */
export const MessageInputStagedImages = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const { images, removeImage } = useTamboThreadInput();

    if (images.length === 0) {
        return null;
    }

    return (
        <div
            ref={ref}
            className={cn("flex flex-wrap gap-2 mb-2 px-1", className)}
            data-slot="message-input-staged-images"
            {...props}
        >
            {images.map((file, index) => {
                // Cast to StagedFile to access custom properties safely
                const stagedFile = file as unknown as StagedFile;
                const isPasted = stagedFile[IS_PASTED_IMAGE];
                const rawFile = stagedFile.file ?? file;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const imageUrl = URL.createObjectURL(rawFile as any);

                // Revoke object URL when component unmounts to avoid memory leaks
                // Note: In a real app we might want a custom hook for this
                return (
                    <div
                        key={index}
                        className="group relative w-20 h-20 rounded-lg overflow-hidden border border-border"
                    >
                        <img
                            src={imageUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onLoad={() => URL.revokeObjectURL(imageUrl)}
                        />
                        {isPasted && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                                Pasted Image {index + 1}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => stagedFile.id && removeImage(stagedFile.id)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
});
MessageInputStagedImages.displayName = "MessageInput.StagedImages";

/**
 * Props for the MessageInputToolbar component.
 * Extends standard HTMLDivElement attributes.
 */
export type MessageInputToolbarProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Toolbar container for input actions (files, MCP, submit, etc.)
 * @component MessageInput.Toolbar
 */
export const MessageInputToolbar = React.forwardRef<
    HTMLDivElement,
    MessageInputToolbarProps
>(({ className, children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "flex items-center justify-between mt-2 pt-2 border-t border-border/50",
                className,
            )}
            data-slot="message-input-toolbar"
            {...props}
        >
            {children}
        </div>
    );
});
MessageInputToolbar.displayName = "MessageInput.Toolbar";
