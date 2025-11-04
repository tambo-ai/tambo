import { useCallback, useEffect, useState } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { useTamboClient } from "../providers/tambo-client-provider";

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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null,
  );
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

  const transcribeRecordedAudio = useCallback(
    async (blobUrl: string) => {
      setIsTranscribing(true);
      setTranscriptionError(null);

      try {
        // Fetch the blob from the URL
        const response = await fetch(blobUrl);
        const audioBlob = await response.blob();
        const file = new File([audioBlob], "recording.webm", {
          type: "audio/webm",
        });

        const transcription = await client.beta.audio.transcribe({ file });
        setTranscript(transcription);
      } catch (error) {
        setTranscriptionError(
          error instanceof Error
            ? error.message
            : "Something went wrong during transcription.",
        );
      } finally {
        setIsTranscribing(false);
      }
    },
    [client],
  );

  // Trigger transcription when recording stops and we have a blob URL
  useEffect(() => {
    if (status === "stopped" && mediaBlobUrl) {
      transcribeRecordedAudio(mediaBlobUrl);
    }
  }, [status, mediaBlobUrl, transcribeRecordedAudio]);

  const startRecording = useCallback(() => {
    if (isRecording) return;

    // Reset state when starting new recording
    setTranscript(null);
    setTranscriptionError(null);
    startMediaRecording();
  }, [isRecording, startMediaRecording]);

  const stopRecording = useCallback(() => {
    if (isRecording) {
      stopMediaRecording();
    }
  }, [isRecording, stopMediaRecording]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    isTranscribing,
    transcript,
    transcriptionError,
    mediaAccessError: mediaAccessError || null,
  };
}
