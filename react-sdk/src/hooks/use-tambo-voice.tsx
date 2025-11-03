import { useCallback, useEffect, useRef, useState } from "react";
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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null,
  );
  const [mediaAccessError, setMediaAccessError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const audioChunks = useRef<Blob[]>([]);
  const client = useTamboClient();

  // Get user permission and access the microphone
  const getMediaStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      setMediaAccessError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      return stream;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to access microphone. Please check permissions.";
      setMediaAccessError(errorMessage);
      console.error("Error getting media stream:", error);
      return null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    const stream = await getMediaStream();
    if (!stream) {
      return;
    }

    setIsRecording(true);
    audioChunks.current = [];
    setTranscript(null);
    setTranscriptionError(null);

    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });
    setMediaRecorder(recorder);
    recorder.start();
  }, [getMediaStream]);

  // Stop recording audio and start transcription
  const stopRecording = useCallback(() => {
    if (mediaRecorder?.state === "recording") {
      mediaRecorder.requestData();
      mediaRecorder.stop();
    }
    setIsRecording(false);
  }, [mediaRecorder]);

  const transcribeRecordedAudio = useCallback(async () => {
    if (!audioChunks.current.length) {
      setTranscriptionError("No audio captured. Please try again.");
      return;
    }
    const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
    const file = new File([audioBlob], `recording.webm`, {
      type: "audio/webm",
    });

    setIsTranscribing(true);
    try {
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
  }, [audioChunks, client]);

  // Register event handlers for the media recorder
  useEffect(() => {
    if (!mediaRecorder) return;

    const handleDataAvailable = (event: BlobEvent) => {
      if (event && event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    const handleStop = () => {
      // Stop all tracks to release the microphone and remove the recording indicator
      if (mediaRecorder?.stream) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }
      setMediaRecorder(null);
      transcribeRecordedAudio();
    };

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;

    return () => {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
    };
  }, [mediaRecorder, transcribeRecordedAudio]);

  // Cleanup effect to stop media stream when component unmounts
  useEffect(() => {
    return () => {
      if (mediaRecorder?.stream) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaRecorder]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    isTranscribing,
    transcript,
    transcriptionError,
    mediaAccessError,
  };
}
