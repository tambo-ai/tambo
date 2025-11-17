"use client";

import { hasExistingMention } from "@/components/ui/tambo/text-editor";
import { cn } from "@/lib/utils";
import { useMessageThreadPanel } from "@/providers/message-thread-panel-provider";
import { useTamboContextAttachment, type Suggestion } from "@tambo-ai/react";
import { Bot } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

interface EditableHintProps {
  /** Suggestions to display when clicked */
  suggestions: Suggestion[];
  /** Description text shown in the hover popover */
  description: string;
  /** Optional className for styling */
  className?: string;
  /** Optional name for the component. If not provided, will try to auto-detect from interactable components */
  componentName?: string;
}

/**
 * Inline AI hint button that opens Tambo AI panel with custom suggestions.
 * Shows a popover on hover and inserts @ComponentName into the editor when clicked.
 *
 * Requires `TamboContextAttachmentProvider` and `MessageThreadPanelProvider`.
 *
 * @example
 * ```tsx
 * <h2>
 *   API Keys
 *   <EditableHint
 *     suggestions={[{ id: "1", title: "Add Analytics", detailedSuggestion: "..." }]}
 *     description="Enhance API key management"
 *   />
 * </h2>
 * ```
 */
export function EditableHint({
  suggestions,
  description,
  className,
  componentName,
}: EditableHintProps) {
  const { setIsOpen, editorRef } = useMessageThreadPanel();
  const { setCustomSuggestions, addContextAttachment } =
    useTamboContextAttachment();
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get component name: use prop if provided, otherwise fallback to description
  // The componentName prop should match the name used in withInteractable config
  const contextName = useMemo(() => {
    if (componentName) return componentName;

    // Fallback: extract first 3 words from description
    const words = description.split(" ").slice(0, 3);
    return words.join(" ");
  }, [componentName, description]);

  // Calculate popover position when shown
  useEffect(() => {
    if (showPopover && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 8, // 8px spacing
        left: rect.left,
      });
      setIsPositioned(true);
    } else {
      setIsPositioned(false);
    }
  }, [showPopover]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCustomSuggestions(suggestions);
      addContextAttachment({
        name: contextName,
      });
      setIsOpen(true);

      // Insert @ComponentName into the editor after panel opens
      setTimeout(() => {
        const editor = editorRef.current;
        if (editor) {
          // Check if mention already exists to avoid duplicates
          if (hasExistingMention(editor, contextName)) {
            // Just focus the editor if mention already exists
            editor.commands.focus();
            return;
          }

          // Insert mention using TipTap's Mention extension
          // The mention node structure: { type: 'mention', attrs: { id: string, label: string } }
          editor
            .chain()
            .focus()
            .insertContent([
              {
                type: "mention",
                attrs: {
                  id: contextName,
                  label: contextName,
                },
              },
              {
                type: "text",
                text: " ",
              },
            ])
            .run();
        }
      }, 350); // Wait for panel animation to complete
    },
    [
      suggestions,
      contextName,
      setCustomSuggestions,
      addContextAttachment,
      setIsOpen,
      editorRef,
    ],
  );

  return (
    <>
      <span className="inline-flex items-center">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleClick}
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
          className={cn(
            "inline-flex items-center justify-center ml-2 p-1 rounded-md",
            "text-muted-foreground/60 hover:text-primary",
            "hover:bg-accent transition-colors duration-200",
            "cursor-pointer",
            className,
          )}
          aria-label={description}
        >
          <Bot className="h-3.5 w-3.5" />
        </button>
      </span>

      {/* Hover popover - rendered in portal */}
      {showPopover &&
        isPositioned &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={cn(
              "fixed z-50",
              "px-3 py-2 text-sm rounded-lg whitespace-nowrap",
              "bg-popover text-popover-foreground border shadow-md",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              "pointer-events-none",
            )}
            style={{
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
            }}
          >
            <p className="font-medium">Edit with tambo</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>,
          document.body,
        )}
    </>
  );
}
