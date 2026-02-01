"use client";

import { useTamboThreadInput, useTamboVoice } from "@tambo-ai/react";
import { Loader2, Mic, Square } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Common placeholder phrases that transcription APIs sometimes return
const PLACEHOLDER_PHRASES = [
  "have a nice day",
  "thank you",
  "goodbye",
  "hello",
  "hi there",
];

const isValidTranscript = (text: string): boolean => {
  if (!text || text.trim().length === 0) return false;

  const normalized = text.trim().toLowerCase();

  // Reject if it's a known placeholder phrase
  if (PLACEHOLDER_PHRASES.some((phrase) => normalized === phrase)) {
    return false;
  }

  // Reject if it's too short (likely noise or placeholder)
  if (normalized.length < 3) {
    return false;
  }

  return true;
};

/**
 * Button for dictating speech into the message input.
 * Uses Tambo AI's voice transcription feature.
 */
export function DictationButton() {
  const {
    startRecording,
    stopRecording,
    isRecording,
    isTranscribing,
    transcript,
    transcriptionError,
    mediaAccessError,
  } = useTamboVoice();
  const { setValue } = useTamboThreadInput();
  const lastProcessedTranscriptRef = useRef("");
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(
    null,
  );
  const [recordingStopTime, setRecordingStopTime] = useState<number | null>(
    null,
  );

  const handleStartRecording = () => {
    lastProcessedTranscriptRef.current = "";
    setRecordingStartTime(Date.now());
    setRecordingStopTime(null);
    startRecording();
  };

  const handleStopRecording = () => {
    if (recordingStartTime) {
      setRecordingStopTime(Date.now());
    }
    stopRecording();
  };

  // Append transcript to input when it's ready
  useEffect(() => {
    if (!transcript || transcript === lastProcessedTranscriptRef.current) {
      return;
    }

    // Only add transcript if it's valid and recording was long enough
    const recordingDuration =
      recordingStartTime && recordingStopTime
        ? recordingStopTime - recordingStartTime
        : 0;

    // Require at least 500ms of recording to avoid accidental clicks
    if (recordingDuration >= 500 && isValidTranscript(transcript)) {
      setValue((prev) => prev + " " + transcript.trim());
    }

    // Update last processed transcript
    lastProcessedTranscriptRef.current = transcript;

    // Reset tracking state asynchronously to avoid setState in effect
    if (recordingStartTime !== null || recordingStopTime !== null) {
      queueMicrotask(() => {
        setRecordingStartTime(null);
        setRecordingStopTime(null);
      });
    }
  }, [transcript, setValue, recordingStartTime, recordingStopTime]);

  // Show error if microphone access fails
  if (mediaAccessError) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled
            className="h-10 w-10 shrink-0 rounded-md cursor-not-allowed opacity-50 flex items-center justify-center"
            aria-label="Microphone access denied"
          >
            <Mic className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Microphone access required</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Show loading spinner while transcribing
  if (isTranscribing) {
    return (
      <div className="h-10 w-10 shrink-0 rounded-md flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {transcriptionError && (
        <span className="text-xs text-destructive absolute -top-6 left-0">
          {transcriptionError}
        </span>
      )}
      {isRecording ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleStopRecording}
              aria-label="Stop dictation"
              className="h-10 w-10 shrink-0 rounded-md cursor-pointer hover:bg-muted transition-colors flex items-center justify-center"
            >
              <Square className="h-4 w-4 text-destructive fill-current animate-pulse" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Stop recording</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleStartRecording}
              aria-label="Start dictation"
              className="h-10 w-10 shrink-0 rounded-md cursor-pointer hover:bg-muted transition-colors flex items-center justify-center"
            >
              <Mic className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Start voice input</p>
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
}
