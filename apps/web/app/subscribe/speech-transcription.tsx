"use client";

import { Button } from "@/components/ui/button";
import { useTamboThreadInput } from "@tambo-ai/react";
import { Mic, StopCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

interface SpeechTranscriptionProps {
  contextKey: string | undefined;
  isProcessing?: boolean;
  processingStage?: string | null;
}

export function SpeechTranscription({
  contextKey,
  isProcessing = false,
  processingStage = null,
}: SpeechTranscriptionProps): JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioDetected, setAudioDetected] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { setValue, submit, isPending } = useTamboThreadInput();

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition({
    transcribing: true,
    clearTranscriptOnListen: true,
  });

  // Initialize speech recognition on mount
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;

    return () => {
      SpeechRecognition.stopListening().catch(console.error);
    };
  }, [browserSupportsSpeechRecognition]);

  // Improved audio detection logic based on transcript changes
  useEffect(() => {
    if (!listening) return;

    // If we have a transcript, show audio detected
    if (transcript) {
      setAudioDetected(true);
      // Show transcript whenever we detect speech
      setShowTranscript(true);

      // Use a longer timeout for better UX
      const timeout = setTimeout(() => {
        setAudioDetected(false);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [transcript, listening]);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      resetTranscript();
      setShowTranscript(false);
      setHasInteracted(true);
      setAudioDetected(false);

      // Request microphone permission
      const permission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      permission.getTracks().forEach((track) => track.stop()); // Clean up

      await SpeechRecognition.startListening({
        continuous: true,
        language: "en-US",
        interimResults: true,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start recording",
      );
    }
  }, [resetTranscript]);

  const stopListening = useCallback(async () => {
    try {
      // Always stop listening first
      await SpeechRecognition.stopListening();

      // Only proceed with submission if we have content and context
      if (transcript && contextKey && !isPending) {
        // Use a direct prompt that explicitly requests each field
        setValue(
          `Return the SubscribeForm component with the values extracted from the transcript.
          
          For fields that aren't clearly mentioned in the transcript, keep the values from the previous messages.
          
          Transcript: "${transcript}"`,
        );

        await submit({ streamResponse: true });
      } else if (!transcript) {
        // Provide feedback if no transcript was detected
        setError("No speech detected. Please try recording again.");
      }

      resetTranscript();
      setShowTranscript(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop recording");
      // Ensure speech recognition is stopped even if there's an error
      await SpeechRecognition.stopListening();
    }
  }, [transcript, contextKey, setValue, submit, resetTranscript, isPending]);

  const toggleTranscript = useCallback(() => {
    setShowTranscript((prev) => !prev);
  }, []);

  if (!contextKey) {
    return (
      <div className="text-center text-sm text-red-500">
        <p>No context key provided, cannot process speech.</p>
      </div>
    );
  }

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="text-center text-sm text-red-500">
        <p>Speech recognition is not supported in your browser.</p>
        <p className="mt-2">Please use Chrome, Edge, or Safari.</p>
      </div>
    );
  }

  if (!isMicrophoneAvailable) {
    return (
      <div className="text-center text-sm text-red-500">
        <p>Microphone access is required.</p>
        <p className="mt-2">
          Please check your browser settings and ensure microphone permissions
          are granted.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Recording Status Indicator */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          {listening ? (
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full bg-red-500 ${audioDetected ? "animate-ping" : "animate-pulse"}`}
              />
              <p className="text-sm font-medium text-red-500">
                Recording in progress{" "}
                {transcript ? "(Speech detected)" : "(No speech detected yet)"}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ready to record
              </p>
            </div>
          )}

          {listening && (
            <button
              onClick={toggleTranscript}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 ml-auto underline transition-colors"
              type="button"
              aria-label={
                showTranscript ? "Hide transcript" : "Show transcript"
              }
            >
              {showTranscript ? "Hide transcript" : "Show transcript"}
            </button>
          )}
        </div>
      </div>
      {/* Processing Status Message */}
      {isProcessing && processingStage && (
        <p className="text-xs text-center text-blue-600 dark:text-blue-400 animate-pulse">
          {processingStage}
        </p>
      )}

      {/* Transcribed Text */}
      {showTranscript && listening && (
        <div className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-900 dark:text-gray-100 break-words whitespace-pre-wrap">
            {transcript || "Waiting for speech..."}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 w-full">
        {!listening ? (
          <Button
            onClick={startListening}
            variant="outline"
            size="lg"
            className={`flex-1 flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all ${!hasInteracted ? "animate-pulse border-red-400 dark:border-red-600" : ""}`}
            disabled={isPending || isProcessing}
            type="button"
          >
            <Mic
              className={`w-5 h-5 ${!hasInteracted ? "text-red-500 dark:text-red-400" : ""}`}
            />
            <span className="hidden sm:inline">
              {isProcessing ? "Processing..." : "Start Recording"}
            </span>
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Button
              onClick={stopListening}
              variant={isPending || isProcessing ? "outline" : "destructive"}
              size="lg"
              className={`flex-1 flex items-center justify-center gap-2 transition-all ${audioDetected ? "bg-red-600 animate-pulse" : ""}`}
              disabled={isPending || isProcessing}
              type="button"
            >
              <StopCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Stop</span>
              <span className="hidden sm:inline">&amp;</span>
              <span className="hidden sm:inline">Submit</span>
              <span className="inline sm:hidden">Stop</span>
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
      )}

      {listening && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
          Pressing &quot;Stop&quot; will automatically update the form with your
          recording
        </p>
      )}
    </div>
  );
}
