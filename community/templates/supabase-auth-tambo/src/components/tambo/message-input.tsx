"use client";

import { cn } from "@/lib/utils";
import { useTamboThreadInput, useTamboVoice } from "@tambo-ai/react";
import { Loader2, Mic, Send, Square } from "lucide-react";
import * as React from "react";

export interface MessageInputProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSubmit"
> {
  onSubmit?: (value: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  initialInput?: string;
}

export const MessageInput = React.forwardRef<HTMLDivElement, MessageInputProps>(
  (
    { className, onSubmit, placeholder, disabled, initialInput, ...props },
    ref,
  ) => {
    const { value, setValue, submit, isPending } = useTamboThreadInput();
    const {
      startRecording,
      stopRecording,
      isRecording,
      isTranscribing,
      transcript,
    } = useTamboVoice();
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [lastTranscript, setLastTranscript] = React.useState("");

    // Set initial input value when provided
    React.useEffect(() => {
      if (initialInput) {
        setValue(initialInput);
        // Focus textarea
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Move cursor to end
          const len = initialInput.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }
    }, [initialInput, setValue]);

    // Auto-append new transcript to input
    React.useEffect(() => {
      if (transcript && transcript !== lastTranscript) {
        setLastTranscript(transcript);
        setValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    }, [transcript, lastTranscript, setValue]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const handleSubmit = async () => {
      if (!value.trim() || isPending || disabled) return;

      try {
        setError(null);
        await submit({ streamResponse: true });
        if (onSubmit) {
          await onSubmit(value);
        }
        setValue("");
        setLastTranscript("");
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to send message";
        setError(message);
      }
    };

    const handleVoiceToggle = async () => {
      if (isRecording) {
        stopRecording();
        return;
      }

      setLastTranscript("");
      try {
        await startRecording();
      } catch (error) {
        const message =
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "Microphone access denied. Please allow microphone access in browser settings."
            : error instanceof Error
              ? error.message
              : "Failed to start voice recording";

        setError(message);
        setTimeout(() => setError(null), 6000);
      }
    };

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        {error && (
          <div className="mb-3 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative"
        >
          <div className="relative flex items-end gap-2 p-2 rounded-xl border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <textarea
              ref={textareaRef}
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording
                  ? "Listening..."
                  : isTranscribing
                    ? "Transcribing..."
                    : placeholder || "Type a message or use voice..."
              }
              rows={1}
              disabled={isPending || disabled || isRecording || isTranscribing}
              className="flex-1 resize-none bg-transparent text-slate-900 placeholder:text-slate-400 disabled:opacity-50 focus:outline-none px-3 py-3 text-sm max-h-32 min-h-11"
              style={{
                height: "auto",
                minHeight: "44px",
                maxHeight: "128px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />

            <div className="flex items-center gap-1 pb-2 pr-1">
              {/* Voice Input Button */}
              <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={isPending || disabled || isTranscribing}
                className={cn(
                  "p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-md"
                    : "hover:bg-slate-100 text-slate-600",
                )}
                title={isRecording ? "Stop recording" : "Start voice input"}
              >
                {isTranscribing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isRecording ? (
                  <Square className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={
                  !value.trim() ||
                  isPending ||
                  disabled ||
                  isRecording ||
                  isTranscribing
                }
                className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm hover:shadow-md"
                title="Send message"
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {isRecording && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500 text-white text-sm rounded-lg shadow-lg animate-pulse">
              🎤 Recording...
            </div>
          )}
        </form>

        <p className="mt-2 text-xs text-slate-500 text-center">
          Press{" "}
          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700">
            Enter
          </kbd>{" "}
          to send,{" "}
          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700">
            Shift+Enter
          </kbd>{" "}
          for new line
        </p>
      </div>
    );
  },
);

MessageInput.displayName = "MessageInput";
