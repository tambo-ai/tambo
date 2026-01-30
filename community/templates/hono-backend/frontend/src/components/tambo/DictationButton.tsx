import { useTamboVoice } from "@tambo-ai/react";
import { Mic, MicOff } from "lucide-react";

/**
 * DictationButton component for voice input
 * Uses the useTamboVoice hook for speech-to-text transcription
 */
export const DictationButton = () => {
  const { isListening, toggleListening, isSupported } = useTamboVoice();

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-3 rounded-lg transition-all border-2 ${
        isListening
          ? "bg-red-500 border-red-600 text-white hover:bg-red-600"
          : "bg-secondary border-border text-secondary-foreground hover:bg-accent"
      }`}
      title={isListening ? "Stop recording" : "Start voice input"}
    >
      {isListening ? (
        <div className="relative">
          <MicOff className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
};
