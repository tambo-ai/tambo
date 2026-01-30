"use client";

import { Tooltip } from "@/components/tambo/suggestions-tooltip";
import { useTamboThreadInput, useTamboVoice } from "@tambo-ai/react";
import { Loader2Icon, Mic, Square } from "lucide-react";
import React, { useEffect, useState } from "react";

/**
 * Tactical Dictation Button
 * Voice logic unchanged — ops-grade UI shell
 */
export default function DictationButton() {
  const {
    startRecording,
    stopRecording,
    isRecording,
    isTranscribing,
    transcript,
    transcriptionError,
  } = useTamboVoice();

  const { setValue } = useTamboThreadInput();
  const [lastProcessedTranscript, setLastProcessedTranscript] =
    useState<string>("");

  const handleStartRecording = () => {
    setLastProcessedTranscript("");
    startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  useEffect(() => {
    if (transcript && transcript !== lastProcessedTranscript) {
      setLastProcessedTranscript(transcript);
      setValue((prev) => prev + " " + transcript);
    }
  }, [transcript, lastProcessedTranscript, setValue]);

  /* ---------- TRANSCRIBING STATE ---------- */
  if (isTranscribing) {
    return (
      <div className="flex items-center justify-center border border-border bg-secondary px-2 py-2">
        <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Error */}
      {transcriptionError && (
        <span className="text-xs text-destructive tracking-wide">
          {transcriptionError}
        </span>
      )}

      {isRecording ? (
        <Tooltip content="Stop transmission">
          <button
            type="button"
            onClick={handleStopRecording}
            aria-label="Stop dictation"
            className="
              flex items-center justify-center
              h-10 w-10
              rounded-full
              border border-destructive
              bg-[#0c0e12]
              hover:bg-[#14161b]
              transition-colors
            "
          >
            <Square className="h-4 w-4 text-destructive fill-current" />
          </button>
        </Tooltip>
      ) : (
        <Tooltip content="Voice input">
          <button
            type="button"
            onClick={handleStartRecording}
            aria-label="Start dictation"
            className="
              flex items-center justify-center
              h-10 w-10
              rounded-md
              border border-primary
              bg-primary
              text-primary-foreground
              hover:opacity-90
              transition-opacity
            "
          >
            <Mic className="h-4 w-4" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
