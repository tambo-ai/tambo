import { useTamboThreadInput, useTamboVoice } from "@tambo-ai/react";
import { Loader2Icon, Mic, Square } from "lucide-react";
import React, { useEffect, useState } from "react";

/**
 * Tooltip component for button hints
 */
const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
}> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap pointer-events-none">
          {content}
        </div>
      )}
    </div>
  );
};

/**
 * Button for dictating speech into the message input.
 * Uses the useTamboVoice hook to handle speech-to-text transcription.
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
        <Loader2Icon className="h-5 w-5 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-2">
      {transcriptionError && (
        <span className="text-xs text-red-500">{transcriptionError}</span>
      )}
      {isRecording ? (
        <Tooltip content="Stop recording">
          <button
            type="button"
            onClick={handleStopRecording}
            aria-label="Stop dictation"
            className="p-2 rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <Square className="h-4 w-4 text-red-500 fill-current animate-pulse" />
          </button>
        </Tooltip>
      ) : (
        <Tooltip content="Voice input (press Mic)">
          <button
            type="button"
            onClick={handleStartRecording}
            aria-label="Start dictation"
            className="p-2 rounded-md cursor-pointer hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
          >
            <Mic className="h-5 w-5" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
