"use client";

import { memo, useEffect, type FormEvent, type KeyboardEvent } from "react";
import {
  useTamboThreadInput,
  useTamboSuggestions,
  useTamboVoice,
  type Suggestion,
} from "@tambo-ai/react";
import { ArrowUp, Loader2, Sparkles, Mic, Square } from "lucide-react";

/**
 * Input component for sending messages and handling voice input.
 * Includes features for suggestion chips, voice recording, and text submission.
 */
export const InputForm = memo(function InputForm() {
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { suggestions, accept } = useTamboSuggestions({ maxSuggestions: 4 });
  const {
    startRecording,
    stopRecording,
    isRecording,
    transcript,
    isTranscribing,
  } = useTamboVoice();

  // Sync transcript to input value
  useEffect(() => {
    if (transcript) {
      setValue(transcript);
    }
  }, [transcript, setValue]);

  const handleSubmit = async (
    e?: FormEvent<HTMLFormElement | HTMLTextAreaElement>,
  ) => {
    e?.preventDefault();
    if (!value.trim() || isPending) return;

    await submit({ streamResponse: true });
    setValue("");
  };

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    await accept({ suggestion, shouldSubmit: true });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        handleSubmit();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Suggested Queries */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-2 min-h-[40px]">
        {suggestions.length > 0 && (
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-2 flex items-center gap-1.5">
            <Sparkles size={12} className="text-zinc-300" />
            Next Steps
          </div>
        )}
        {suggestions.map((suggestion, i) => (
          <button
            key={suggestion.id || i}
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isPending}
            className="text-[11px] px-4 py-2 rounded-xl bg-white border border-zinc-100 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 transition-all disabled:opacity-50 hover:shadow-sm active:scale-95 animate-fade-in"
          >
            {suggestion.title}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative group max-w-3xl mx-auto"
      >
        <div className="flex gap-2 items-center bg-zinc-50/50 border border-zinc-200 rounded-[28px] px-3 py-2 transition-all focus-within:bg-white focus-within:border-zinc-900 focus-within:ring-4 focus-within:ring-zinc-100 hover:border-zinc-300 shadow-sm">
          <div className="flex-shrink-0 ml-1">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2.5 rounded-full transition-all active:scale-90 ${
                isRecording
                  ? "bg-red-100 text-red-600 animate-pulse"
                  : "hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900"
              }`}
              title={isRecording ? "Stop Recording" : "Voice Input"}
            >
              {isRecording ? (
                <Square size={18} fill="currentColor" />
              ) : (
                <Mic size={18} />
              )}
            </button>
          </div>

          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isTranscribing ? "Transcribing..." : "Ask Tambo anything..."
            }
            className="flex-1 resize-none bg-transparent border-0 focus:ring-0 text-zinc-900 placeholder-zinc-400 min-h-[48px] max-h-32 py-3 px-2 text-[15px] leading-relaxed font-medium"
            rows={1}
            disabled={isPending || isTranscribing}
            style={{ minHeight: "48px" }}
          />

          <button
            type="submit"
            disabled={isPending || !value.trim() || isTranscribing}
            className={`
                            flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300
                            ${
                              isPending || !value.trim() || isTranscribing
                                ? "bg-zinc-100 text-zinc-300"
                                : "bg-zinc-900 text-white shadow-lg shadow-zinc-200 hover:bg-black hover:scale-105 active:scale-95"
                            }
                        `}
          >
            {isPending || isTranscribing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowUp className="w-5 h-5" strokeWidth={3} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
});
