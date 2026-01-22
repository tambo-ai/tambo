"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useMessageThreadPanel } from "@/providers/message-thread-panel-provider";
import { useTambo, useTamboCurrentComponent } from "@tambo-ai/react";
import { MessageGenerationStage } from "@tambo-ai/ui-registry/components/message-suggestions";
import { Bot, ChevronDown, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface EditWithTamboButtonProps {
  /** Custom icon component */
  icon?: React.ReactNode;
  /** Custom tooltip text */
  tooltip?: string;
  /** Description for tooltip. Falls back to interactable component description if not provided */
  description?: string;
  /** Optional className for the button */
  className?: string;
  /** Optional callback to open the thread panel/chat interface. Uses useMessageThreadPanel by default if not provided */
  onOpenThread?: () => void;
}

/**
 * Inline "Edit with Tambo" button and floating popover for interactable components.
 * When clicked, opens a floating popover with a prompt input. Sends messages to Tambo
 * with the interactable component in context and displays only the latest reply.
 *
 * Must be used within a component wrapped with `withInteractable`.
 *
 * @example
 * ```tsx
 * const MyInteractableForm = withInteractable(MyForm, {
 *   componentName: "MyForm",
 *   description: "A form component",
 * });
 *
 * function MyForm() {
 *   return (
 *     <div>
 *       <EditWithTamboButton />
 *     </div>
 *   );
 * }
 * ```
 */
export function EditWithTamboButton({
  icon,
  tooltip = "Edit with tambo",
  description,
  className,
  onOpenThread: onOpenThreadProp,
}: EditWithTamboButtonProps) {
  const component = useTamboCurrentComponent();
  const { sendThreadMessage, isIdle, setInteractableSelected } = useTambo();
  const { setIsOpen: setThreadPanelOpen, editorRef } = useMessageThreadPanel();

  const [prompt, setPrompt] = useState("");
  // NOTE: Using isIdle from useTambo() instead of tracking error/pending state locally.
  // The useTambo() hook already manages generation state and error handling through sendThreadMessage,
  // so tracking them separately here would cause states to get out of sync or mask errors.
  const [isOpen, setIsOpen] = useState(false);
  const [sendMode, setSendMode] = useState<"send" | "thread">("send");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shouldCloseOnComplete, setShouldCloseOnComplete] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onOpenThread = useMemo(
    () => onOpenThreadProp ?? (() => setThreadPanelOpen(true)),
    [onOpenThreadProp, setThreadPanelOpen],
  );
  const isGenerating = !isIdle;

  // If no component, the current component is not an interactable - don't render.
  if (!component) {
    return null;
  }

  // If in a Tambo thread (message with threadId), don't show the button
  if (component.threadId) {
    return null;
  }

  // Close popover when generation completes
  useEffect(() => {
    if (shouldCloseOnComplete && !isGenerating) {
      setShouldCloseOnComplete(false);
      setIsOpen(false);
      setPrompt("");
    }
  }, [shouldCloseOnComplete, isGenerating]);

  const handleSend = useCallback(async () => {
    if (!prompt.trim() || isGenerating) {
      return;
    }

    setShouldCloseOnComplete(true);

    await sendThreadMessage(prompt.trim(), {
      streamResponse: true,
      additionalContext: {
        inlineEdit: {
          componentId: component.interactableId,
          instruction:
            "The user wants to edit this specific component inline. Please update the component's props to fulfill the user's request.",
        },
      },
    });

    // Clear the prompt after successful send
    setPrompt("");
  }, [prompt, isGenerating, component, sendThreadMessage]);

  const handleSendInThread = useCallback(() => {
    if (!prompt.trim()) {
      return;
    }

    // Save the message before clearing
    const messageToInsert = prompt.trim();

    const componentName = component?.componentName ?? "Unknown Component";
    const interactableId = component?.interactableId ?? "";
    if (interactableId) {
      setInteractableSelected(interactableId, true);
    }

    // Open the thread panel first
    onOpenThread();

    // Clear the prompt and close the modal
    setPrompt("");
    setIsOpen(false);

    // Insert @mention + user query into the editor
    const editor = editorRef.current;
    if (editor) {
      // Check if mention already exists to avoid duplicates
      if (editor.hasMention(interactableId)) {
        // If mention exists, just append the user query
        editor.appendText(" " + messageToInsert);
      } else {
        // Insert @mention (which adds a space after), then append the user query
        editor.insertMention(interactableId, componentName);
        editor.appendText(messageToInsert);
      }
    }
  }, [prompt, component, setInteractableSelected, onOpenThread, editorRef]);

  const handleMainAction = useCallback(() => {
    if (sendMode === "thread") {
      handleSendInThread();
    } else {
      void handleSend();
    }
  }, [sendMode, handleSendInThread, handleSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleMainAction();
      }
    },
    [handleMainAction],
  );

  return (
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip
          content={
            <div className="space-y-1">
              <p className="font-medium">{tooltip}</p>
              <p className="text-xs opacity-70 text-foreground">
                {description ?? component.description}
              </p>
            </div>
          }
          side="bottom"
          align="start"
          className="bg-popover text-popover-foreground border shadow-md px-3 py-2 text-sm rounded-lg"
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center ml-2 p-1 rounded-md",
                "text-muted-foreground/60 hover:text-primary",
                "hover:bg-accent transition-colors duration-200",
                "cursor-pointer",
                isOpen && "text-primary bg-accent",
                className,
              )}
              aria-label={tooltip}
            >
              {icon ?? <Bot className="h-3.5 w-3.5" />}
            </button>
          </PopoverTrigger>
        </Tooltip>

        <PopoverContent
          className="w-[450px] max-w-[calc(100vw-2rem)] p-4 space-y-4"
          align="start"
          side="bottom"
          sideOffset={8}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            textareaRef.current?.focus();
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm">{tooltip}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {component.componentName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setPrompt("");
              }}
              className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Prompt input */}
          <div className="space-y-3">
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to change..."
              className="min-h-[80px] resize-none"
              disabled={isGenerating}
            />
            <div className="flex items-center justify-between">
              {/* Helper text or generation status */}
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <MessageGenerationStage className="px-0 py-0" />
                  <button
                    type="button"
                    onClick={onOpenThread}
                    className="text-xs text-primary hover:text-primary/80 underline transition-colors"
                  >
                    View in thread
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Cmd/Ctrl + Enter to send
                </p>
              )}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleMainAction}
                  disabled={!prompt.trim() || isGenerating}
                  className={cn(
                    "h-9 px-3 text-sm font-medium",
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-colors flex items-center gap-1",
                    "rounded-l-md border-r border-primary-foreground/20",
                  )}
                >
                  {isGenerating && <>Sending...</>}
                  {!isGenerating &&
                    (sendMode === "thread" ? "Send in Thread" : "Send")}
                </button>
                <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={!prompt.trim() || isGenerating}
                      className={cn(
                        "h-9 px-2 text-sm font-medium",
                        "bg-primary text-primary-foreground",
                        "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-colors rounded-r-md",
                        "flex items-center justify-center",
                      )}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-40 p-1"
                    align="end"
                    side="bottom"
                    sideOffset={4}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSendMode("send");
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-2 py-1.5 text-left text-sm rounded-sm",
                        "hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer",
                        "focus:bg-accent focus:text-accent-foreground outline-none",
                        sendMode === "send" &&
                          "bg-accent text-accent-foreground",
                      )}
                    >
                      Send
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSendMode("thread");
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-2 py-1.5 text-left text-sm rounded-sm",
                        "hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer",
                        "focus:bg-accent focus:text-accent-foreground outline-none",
                        sendMode === "thread" &&
                          "bg-accent text-accent-foreground",
                      )}
                    >
                      Send in Thread
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
