import { useCallback, useEffect, useState } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { useTamboClient } from "../providers/tambo-client-provider";
import { useTamboMutation } from "./react-query-hooks";

/**
 * Exposes functionality to record speech and transcribe it using the Tambo API.
 * @returns An object with:
 * - startRecording: A function to start recording audio and reset the current transcript.
 * - stopRecording: A function to stop recording audio and automatically kick off transcription.
 * - isRecording: A boolean indicating if the user is recording audio.
 * - isTranscribing: A boolean indicating if the audio is being transcribed.
 * - transcript: The transcript of the recorded audio.
 * - transcriptionError: An error message if the transcription fails.
 * - mediaAccessError: An error message if microphone access fails.
 */
export function useTamboVoice() {
  const [transcript, setTranscript] = useState<string | null>(null);
  const client = useTamboClient();
  const {
    status,
    startRecording: startMediaRecording,
    stopRecording: stopMediaRecording,
    mediaBlobUrl,
    error: mediaAccessError,
  } = useReactMediaRecorder({
    audio: true,
    video: false,
    blobPropertyBag: { type: "audio/webm" },
  });

  const isRecording = status === "recording";

  const transcriptionMutation = useTamboMutation<
    string,
    Error,
    string // blobUrl parameter
  >({
    mutationFn: async (blobUrl: string) => {
      const response = await fetch(blobUrl);
      const audioBlob = await response.blob();
      const file = new File([audioBlob], "recording.webm", {
        type: "audio/webm",
      });

      return await client.beta.audio.transcribe({ file });
    },
    onSuccess: (transcription: string) => {
      setTranscript(transcription);
    },
  });

  // Trigger transcription when recording stops and we have a blob URL
  const shouldTranscribe =
    status === "stopped" &&
    mediaBlobUrl &&
    !transcriptionMutation.isPending &&
    !transcriptionMutation.isSuccess;

  useEffect(() => {
    if (shouldTranscribe) {
      transcriptionMutation.mutate(mediaBlobUrl);
    }
  }, [shouldTranscribe, mediaBlobUrl, transcriptionMutation]);

  const startRecording = useCallback(() => {
    if (isRecording) return;

    // Reset state when starting new recording
    setTranscript(null);
    transcriptionMutation.reset(); // Clear any previous mutation state
    startMediaRecording();
  }, [isRecording, startMediaRecording, transcriptionMutation]);

  const stopRecording = useCallback(() => {
    if (isRecording) {
      stopMediaRecording();
    }
  }, [isRecording, stopMediaRecording]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    mediaAccessError: mediaAccessError === "" ? null : mediaAccessError,
    isTranscribing: transcriptionMutation.isPending,
    transcript,
    transcriptionError: transcriptionMutation.error?.message ?? null,
  };
}
