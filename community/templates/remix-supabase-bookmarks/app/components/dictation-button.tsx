import { useTamboThreadInput, useTamboVoice } from "@tambo-ai/react";
import { Loader2, Mic, Square } from "lucide-react";
import { useEffect, useRef } from "react";

/**
 * Button for dictating speech into the message input.
 *
 * @returns The dictation button component
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
  const lastProcessedTranscriptRef = useRef<string>("");

  const handleStartRecording = () => {
    lastProcessedTranscriptRef.current = "";
    startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  useEffect(() => {
    if (transcript && transcript !== lastProcessedTranscriptRef.current) {
      lastProcessedTranscriptRef.current = transcript;
      setValue((prev) => prev + " " + transcript);
    }
  }, [transcript, setValue]);

  if (isTranscribing) {
    return (
      <div className="p-2 rounded-md">
        <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-2">
      {transcriptionError && (
        <span className="text-xs text-red-500">{transcriptionError}</span>
      )}
      {isRecording ? (
        <button
          type="button"
          onClick={handleStopRecording}
          aria-label="Stop dictation"
          className="p-2 rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
          title="Stop"
        >
          <Square className="h-4 w-4 text-red-500 fill-current animate-pulse" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleStartRecording}
          aria-label="Start dictation"
          className="p-2 rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
          title="Dictate"
        >
          <Mic className="h-4 w-4 text-slate-600" />
        </button>
      )}
    </div>
  );
}
