import { useCallback, useEffect, useRef, useState } from "react";
import { useTamboClient } from "../providers/tambo-client-provider";

/**
 * This hook is used to record audio and transcribe it using the Tambo API.
 * @returns An object with the following properties:
 * - startRecording: A function to start recording audio.
 * - stopRecording: A function to stop recording audio.
 * - isRecording: A boolean indicating if the user is recording audio.
 * - isRecordingComplete: A boolean indicating if the recording is complete.
 * - isTranscribing: A boolean indicating if the audio is being transcribed.
 * - transcript: The transcript of the recorded audio.
 */
export function useTamboVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const audioChunks = useRef<Blob[]>([]);
  const client = useTamboClient();

  const startRecording = useCallback(async () => {
    setIsRecording(true);
    audioChunks.current = [];
    setTranscript(null);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });
    setMediaRecorder(recorder);
    recorder.start();
  }, []);

  // Stop recording audio and start transcription
  const stopRecording = useCallback(() => {
    if (mediaRecorder?.state === "recording") {
      mediaRecorder.requestData();
      mediaRecorder.stop();
    }
    setIsRecording(false);
  }, [mediaRecorder]);

  const transcribeRecordedAudio = useCallback(async () => {
    const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
    const file = new File([audioBlob], `recording.webm`, {
      type: "audio/webm",
    });

    setIsTranscribing(true);
    const result = await client.beta.audio.transcribe({ file });
    setIsTranscribing(false);
    setTranscript(result);
    return result;
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

  return {
    startRecording,
    stopRecording,
    isRecording,
    isTranscribing,
    transcript,
  };
}
