import { useCallback, useEffect, useRef, useState } from "react";

/**
 *
 */
export function useTamboVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const audioChunks = useRef<Blob[]>([]);

  // Register event handlers for the media recorder
  useEffect(() => {
    if (!mediaRecorder) return;

    const handleDataAvailable = (event: BlobEvent) => {
      if (event && event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    const handleStop = () => {
      const audioBlob = new Blob(audioChunks.current, {
        type: "audio/webm",
      });
      setAudioBlob(audioBlob);
      setMediaRecorder(null);
      audioChunks.current = [];
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
    setAudioBlob(null);
    audioChunks.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    recorder.start();
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    setIsRecording(false);
  }, [mediaRecorder]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    audioBlob,
  };
}
