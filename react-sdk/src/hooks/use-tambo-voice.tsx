import { useCallback, useEffect, useRef, useState } from "react";
import { useTamboClient } from "../providers/tambo-client-provider";

/**
 * This hook is used to record audio and transcribe it using the Tambo API.
 * @returns An object with the following properties:
 * - startRecording: A function to start recording audio.
 * - stopRecording: A function to stop recording audio.
 * - isRecording: A boolean indicating if the user is recording audio.
 * - isRecordingComplete: A boolean indicating if the recording is complete.
 * - transcribeRecordedAudio: A function to transcribe the recorded audio.
 */
export function useTamboVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingComplete, setIsRecordingComplete] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const audioChunks = useRef<Blob[]>([]);
  const client = useTamboClient();

  // Register event handlers for the media recorder
  useEffect(() => {
    if (!mediaRecorder) return;

    const handleDataAvailable = (event: BlobEvent) => {
      if (event && event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    const handleStop = () => {
      setIsRecordingComplete(true);
      setMediaRecorder(null);
    };

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;

    return () => {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
    };
  }, [mediaRecorder]);

  const startRecording = useCallback(async () => {
    setIsRecording(true);
    setIsRecordingComplete(false);
    audioChunks.current = [];

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

    return await client.beta.audio.transcribe({ file });
  }, [audioChunks, client]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    isRecordingComplete,
    transcribeRecordedAudio,
  };
}
