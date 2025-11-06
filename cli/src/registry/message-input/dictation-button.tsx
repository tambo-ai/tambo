import { Tooltip } from "@/components/tambo/suggestions-tooltip";
import { useTamboThreadInput, useTamboVoice } from "@tambo-ai/react";
import { Loader2Icon, Mic, Square } from "lucide-react";
import React, { useEffect, useState } from "react";

/**
 * Button for dictating speech into the message input.
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
  const { value, setValue } = useTamboThreadInput();
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
      setValue(value + " " + transcript);
    }
  }, [transcript, lastProcessedTranscript, value, setValue]);

  if (isTranscribing) {
    return (
      <div className="p-2 rounded-md">
        <Loader2Icon className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-2">
      <span className="text-sm text-red-500">{transcriptionError}</span>
      {isRecording ? (
        <Tooltip content="Stop">
          <button
            type="button"
            onClick={handleStopRecording}
            className="p-2 rounded-md cursor-pointer hover:bg-gray-100"
          >
            <Square className="h-4 w-4 text-red-500 fill-current animate-pulse" />
          </button>
        </Tooltip>
      ) : (
        <Tooltip content="Dictate">
          <button
            type="button"
            onClick={handleStartRecording}
            className="p-2 rounded-md cursor-pointer hover:bg-gray-100"
          >
            <Mic className="h-5 w-5" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
