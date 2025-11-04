"use client";

import { useContextAttachment } from "@/components/ui/tambo/context-attachment-provider";
import { cn } from "@/lib/utils";
import { useMessageThreadPanel } from "@/providers/message-thread-panel-provider";
import type { Suggestion } from "@tambo-ai/react";
import { Sparkles } from "lucide-react";
import { useCallback, useMemo, useState, type MouseEvent } from "react";

interface EditableHintProps {
  /** Suggestions to display when clicked */
  suggestions: Suggestion[];
  /** Description text shown in the hover popover */
  description: string;
  /** Optional className for styling */
  className?: string;
  /** Optional name for the context badge. Defaults to first 3 words of description */
  componentName?: string;
}

/**
 * Inline sparkle button that opens Tambo AI panel with custom suggestions.
 * Shows a popover on hover and adds a context badge when clicked.
 *
 * Requires `ContextAttachmentProvider` and `MessageThreadPanelProvider`.
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
  const { setIsOpen } = useMessageThreadPanel();
  const { setCustomSuggestions, addContextAttachment } =
    useContextAttachment() ?? {};
  const [showPopover, setShowPopover] = useState(false);

  // Generate a component name from description if not provided
  const contextName = useMemo(() => {
    if (componentName) return componentName;
    // Extract first 3 words from description
    const words = description.split(" ").slice(0, 3);
    return words.join(" ");
  }, [componentName, description]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCustomSuggestions?.(suggestions);
      addContextAttachment?.({
        name: contextName,
      });
      setIsOpen(true);
    },
    [
      suggestions,
      contextName,
      setCustomSuggestions,
      addContextAttachment,
      setIsOpen,
    ],
  );

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        className={cn(
          "inline-flex items-center justify-center ml-2 p-1 rounded-md",
          "text-muted-foreground hover:text-primary",
          "hover:bg-accent transition-colors duration-200",
          "cursor-pointer",
          className,
        )}
        aria-label={description}
      >
        <Sparkles className="h-4 w-4" />
      </button>

      {/* Hover popover */}
      {showPopover && (
        <div
          className={cn(
            "absolute left-0 top-full mt-2 z-50",
            "px-3 py-2 text-sm rounded-lg whitespace-nowrap",
            "bg-popover text-popover-foreground border shadow-md",
            "animate-in fade-in-0 zoom-in-95 duration-200",
          )}
        >
          <p className="font-medium">Edit with tambo</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      )}
    </span>
  );
}
