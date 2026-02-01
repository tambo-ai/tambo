"use client";

import { useTamboThreadInput, useTamboVoice } from "@tambo-ai/react";
import { Loader2, Mic, Square } from "lucide-react";
import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

/**
 * Inner component that uses the voice hook.
 * Separated to allow proper SSR handling.
 */
function DictationButtonInner() {
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
    if (recordingDuration >= 500 && transcript.trim().length > 0) {
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
      <TooltipProvider>
        <Tooltip content="Microphone access required">
          <button
            type="button"
            disabled
            className="h-10 w-10 shrink-0 rounded-md cursor-not-allowed opacity-50 flex items-center justify-center"
            aria-label="Microphone access denied"
          >
            <Mic className="h-4 w-4" />
          </button>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isTranscribing) {
    return (
      <div className="h-10 w-10 shrink-0 rounded-md flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      {transcriptionError && (
        <span className="text-xs text-destructive absolute -top-6 left-0">
          {transcriptionError}
        </span>
      )}
      {isRecording ? (
        <Tooltip content="Stop recording">
          <button
            type="button"
            onClick={handleStopRecording}
            aria-label="Stop dictation"
            className="h-10 w-10 shrink-0 rounded-md cursor-pointer hover:bg-muted transition-colors flex items-center justify-center"
          >
            <Square className="h-4 w-4 text-destructive fill-current animate-pulse" />
          </button>
        </Tooltip>
      ) : (
        <Tooltip content="Start voice input">
          <button
            type="button"
            onClick={handleStartRecording}
            aria-label="Start dictation"
            className="h-10 w-10 shrink-0 rounded-md cursor-pointer hover:bg-muted transition-colors flex items-center justify-center"
          >
            <Mic className="h-4 w-4" />
          </button>
        </Tooltip>
      )}
    </TooltipProvider>
  );
}

// Helper for useSyncExternalStore to detect client-side rendering
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Button for dictating speech into the message input.
 * Uses Tambo AI's voice transcription feature.
 * Wrapped to handle SSR - Web Workers are not available on the server.
 */
export function DictationButton() {
  // useSyncExternalStore is React's recommended way to handle hydration-safe client detection
  // This avoids the "setState in effect" lint warning
  const isClient = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  // Return placeholder on server to avoid Worker SSR issues
  if (!isClient) {
    return (
      <div className="h-10 w-10 shrink-0 rounded-md flex items-center justify-center">
        <Mic className="h-4 w-4 opacity-50" />
      </div>
    );
  }

  return <DictationButtonInner />;
}
