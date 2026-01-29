"use client";

import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Loader2 } from "lucide-react";
import { useRef, useEffect } from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Lazy load DictationButton to avoid SSR issues (uses browser APIs like Worker)
const LazyDictationButton = dynamic(
  () =>
    import("./dictation-button").then((mod) => ({
      default: mod.DictationButton,
    })),
  {
    ssr: false,
    loading: () => null,
  },
);

/**
 * Chat input component for sending messages to Tambo AI.
 * Supports multi-line input, keyboard shortcuts, and voice dictation.
 */
export function TamboChatInput() {
  const { sendThreadMessage, isIdle } = useTamboThread();
  const { value, setValue } = useTamboThreadInput();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = !isIdle;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = async () => {
    if (!value.trim() || isLoading) return;

    const message = value.trim();
    setValue("");

    try {
      await sendThreadMessage(message);
    } catch {
      toast.error("Failed to send message. Please try again.");
      setValue(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2 flex flex-col gap-2">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message or paste images..."
        className="min-h-[40px] max-h-[120px] resize-none border-0 p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        disabled={isLoading}
        rows={1}
      />
      <div className="flex items-center justify-end gap-2 pt-1">
        <LazyDictationButton />
        <Button
          onClick={() => void handleSubmit()}
          disabled={!value.trim() || isLoading}
          size="icon"
          className="h-9 w-9 shrink-0 rounded-lg"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
