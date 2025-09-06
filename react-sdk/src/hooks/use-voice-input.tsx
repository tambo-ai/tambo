"use client";
import { useCallback, useRef, useState } from "react";
import { useTamboThreadInput } from "../providers/tambo-thread-input-provider";
import { useTamboVoiceInput } from "../providers/tambo-voice-input-provider";

export type VoiceInputState =
  | "idle"
  | "requesting_permission"
  | "permission_denied"
  | "recording"
  | "transcribing"
  | "error";

export type PermissionState = "unknown" | "granted" | "denied";

export interface UseVoiceInputResult {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearError: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
  state: VoiceInputState;
  error: Error | null;
  isSupported: boolean;
  permissionState: PermissionState;
}

/**
 * Hook for managing voice input functionality.
 * Handles audio recording, transcription via backend API, and text input integration.
 * @returns Voice input controls and state
 * @example
 * ```tsx
 * const { startRecording, stopRecording, isRecording } = useVoiceInput();
 *
 * return (
 *   <button onClick={isRecording ? stopRecording : startRecording}>
 *     {isRecording ? 'Stop' : 'Start'} Recording
 *   </button>
 * );
 * ```
 */
export const useVoiceInput = (): UseVoiceInputResult => {
  const { value, setValue } = useTamboThreadInput();
  const { isEnabled } = useTamboVoiceInput();

  const [state, setState] = useState<VoiceInputState>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [permissionState, setPermissionState] =
    useState<PermissionState>("unknown");
  const [permissionRequestCount, setPermissionRequestCount] = useState(0);

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
        formData.append("response_format", "text");

        // Send to backend for transcription
        // Use the current window origin for the API route
        const baseUrl =
          typeof window !== "undefined"
            ? window.location.origin
            : "https://api.tambo.ai";
        const response = await fetch(`${baseUrl}/api/v1/audio/transcriptions`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Transcription failed: ${response.statusText}`);
        }

        const data = await response.json();
        const transcribedText = data.text ?? "";

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

    // Clear previous error states and always try to request permission
    setState("requesting_permission");
    setError(null);
    setPermissionRequestCount((prev) => prev + 1);

    // Reset permission state to unknown before each attempt
    setPermissionState("unknown");

    try {
      // Always try to request microphone permission directly without pre-checking
      // This allows for fresh prompts in incognito mode and after permission resets
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Permission granted successfully
      setPermissionState("granted");
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
        setPermissionState("denied");
        setState("permission_denied");
        // Only show browser settings guidance after several attempts
        if (permissionRequestCount > 3) {
          setError(
            new Error(
              "Microphone access blocked. Click the 🔒 icon in your address bar to enable microphone access.",
            ),
          );
        } else {
          setError(
            new Error("Microphone permission denied. Click to try again."),
          );
        }
      } else if (
        errorMessage.name === "NotFoundError" ||
        errorMessage.name === "DevicesNotFoundError"
      ) {
        setError(new Error("No microphone found"));
        setState("error");
      } else {
        setError(errorMessage);
        setState("error");
      }

      cleanup();
    }
  }, [
    isSupported,
    isEnabled,
    state,
    cleanup,
    transcribeAudio,
    permissionRequestCount,
  ]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      // State will be updated in the onstop handler
    }
  }, [state]);

  const clearError = useCallback(() => {
    setError(null);
    setState("idle");
    setPermissionState("unknown");
    // Reset the permission request count to allow fresh attempts
    setPermissionRequestCount(0);
  }, []);

  return {
    startRecording,
    stopRecording,
    clearError,
    isRecording: state === "recording",
    isTranscribing: state === "transcribing",
    state,
    error,
    isSupported,
    permissionState,
  };
};
