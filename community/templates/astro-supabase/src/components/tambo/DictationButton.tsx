import { useTamboThreadInput, useTamboVoice } from "@tambo-ai/react";
import { useEffect, useState } from "react";

/**
 * Button for dictating speech into the message input.
 * Uses the useTamboVoice hook for speech-to-text.
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

  if (isTranscribing) {
    return (
      <div className="p-2 rounded-md">
        <svg
          className="h-5 w-5 animate-spin text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-2">
      {transcriptionError && (
        <span className="text-sm text-red-500">{transcriptionError}</span>
      )}
      {isRecording ? (
        <button
          type="button"
          onClick={handleStopRecording}
          aria-label="Stop dictation"
          title="Stop"
          className="p-2 rounded-md cursor-pointer hover:bg-muted transition-colors"
        >
          <svg
            className="h-4 w-4 text-red-500 fill-current animate-pulse"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleStartRecording}
          aria-label="Start dictation"
          title="Dictate"
          className="p-2 rounded-md cursor-pointer hover:bg-muted transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
