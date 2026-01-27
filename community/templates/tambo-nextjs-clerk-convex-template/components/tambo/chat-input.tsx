"use client";

import { useTamboThread } from "@tambo-ai/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

/**
 * Chat input component for sending messages to Tambo AI.
 * Supports multi-line input and keyboard shortcuts.
 */
export function TamboChatInput() {
  const { sendThreadMessage, isIdle } = useTamboThread();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = !isIdle;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");

    try {
      await sendThreadMessage(message);
    } catch {
      toast.error("Failed to send message. Please try again.");
      setInput(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message or paste images..."
          className="min-h-[40px] max-h-[120px] resize-none pr-10 text-sm bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-ring/50"
          disabled={isLoading}
          rows={1}
        />
      </div>
      <Button
        onClick={() => void handleSubmit()}
        disabled={!input.trim() || isLoading}
        size="icon"
        className="h-10 w-10 shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <SendHorizontal className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
