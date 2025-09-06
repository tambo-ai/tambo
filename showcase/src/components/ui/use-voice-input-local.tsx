"use client";
import { useCallback, useRef, useState } from "react";
import { useTamboThreadInput } from "@tambo-ai/react";

// Local provider for testing
interface VoiceInputContextProps {
  isEnabled: boolean;
}

const VoiceInputContext = React.createContext<VoiceInputContextProps>({
  isEnabled: true,
});
import React from "react";

export const VoiceInputProvider: React.FC<{
  children: React.ReactNode;
  enabled?: boolean;
}> = ({ children, enabled = true }) => (
  <VoiceInputContext.Provider value={{ isEnabled: enabled }}>
    {children}
  </VoiceInputContext.Provider>
);

export const useVoiceInputContext = () => React.useContext(VoiceInputContext);

export type VoiceInputState =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "transcribing"
  | "error";

export interface UseVoiceInputResult {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
  state: VoiceInputState;
  error: Error | null;
  isSupported: boolean;
}

export const useVoiceInput = (): UseVoiceInputResult => {
  const { value, setValue } = useTamboThreadInput();
  const { isEnabled } = useVoiceInputContext();

  const [state, setState] = useState<VoiceInputState>("idle");
  const [error, setError] = useState<Error | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if browser supports necessary APIs
  const isSupported =
    typeof window !== "undefined" &&
    "mediaDevices" in navigator &&
    "getUserMedia" in navigator.mediaDevices &&
    typeof MediaRecorder !== "undefined";

  const cleanup = useCallback(() => {
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear the media recorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }

    // Clear chunks
    chunksRef.current = [];
  }, []);

  const transcribeAudio = useCallback(
    async (audioBlob: Blob) => {
      setState("transcribing");
      setError(null);

      try {
        // Create FormData for multipart upload
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("model", "gpt-4o-mini-transcribe");
        formData.append("response_format", "json");

        // Send to local API route for transcription
        const response = await fetch(`/api/v1/audio/transcriptions`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Transcription failed: ${response.statusText}`,
          );
        }

        const data = await response.json();
        const transcribedText = data.text || "";

        if (transcribedText) {
          // Append transcribed text to existing input
          setValue(value + (value ? " " : "") + transcribedText);
        }

        setState("idle");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err : new Error("Transcription failed");
        setError(errorMessage);
        setState("error");
        console.error("Transcription error:", errorMessage);
      }
    },
    [value, setValue],
  );

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError(new Error("Voice input is not supported in this browser"));
      setState("error");
      return;
    }

    if (!isEnabled) {
      setError(new Error("Voice input is disabled"));
      setState("error");
      return;
    }

    if (state === "recording" || state === "transcribing") {
      return; // Already recording or processing
    }

    setState("requesting_permission");
    setError(null);

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Check for webm support, fallback to other formats
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg;codecs=opus";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        cleanup();

        // Only transcribe if we have audio data
        if (audioBlob.size > 0) {
          await transcribeAudio(audioBlob);
        } else {
          setState("idle");
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError(new Error("Recording failed"));
        setState("error");
        cleanup();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setState("recording");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err : new Error("Failed to start recording");

      // Handle specific error cases
      if (
        errorMessage.name === "NotAllowedError" ||
        errorMessage.name === "PermissionDeniedError"
      ) {
        setError(new Error("Microphone permission denied"));
      } else if (
        errorMessage.name === "NotFoundError" ||
        errorMessage.name === "DevicesNotFoundError"
      ) {
        setError(new Error("No microphone found"));
      } else {
        setError(errorMessage);
      }

      setState("error");
      cleanup();
    }
  }, [isSupported, isEnabled, state, cleanup, transcribeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      // State will be updated in the onstop handler
    }
  }, [state]);

  return {
    startRecording,
    stopRecording,
    isRecording: state === "recording",
    isTranscribing: state === "transcribing",
    state,
    error,
    isSupported,
  };
};
