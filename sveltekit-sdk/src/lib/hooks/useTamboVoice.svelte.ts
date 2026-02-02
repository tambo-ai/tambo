import { getContext, onDestroy } from "svelte";
import { TAMBO_CLIENT_KEY } from "../context.js";
import type TamboAI from "@tambo-ai/typescript-sdk";

/**
 * Voice recording state and controls
 */
export interface TamboVoiceResult {
  readonly isRecording: boolean;
  readonly isTranscribing: boolean;
  readonly transcript: string | null;
  readonly transcriptionError: string | null;
  readonly mediaAccessError: string | null;
  startRecording(): Promise<void>;
  stopRecording(): void;
}

/**
 * Create voice recording and transcription functionality.
 *
 * Provides controls for recording audio via the browser's MediaRecorder API
 * and transcribing it using the Tambo API.
 * @returns Voice recording state and controls
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createTamboVoice } from "@tambo-ai/svelte";
 *
 *   const voice = createTamboVoice();
 * </script>
 *
 * {#if voice.isRecording}
 *   <button onclick={voice.stopRecording}>Stop Recording</button>
 * {:else}
 *   <button onclick={voice.startRecording}>Start Recording</button>
 * {/if}
 *
 * {#if voice.isTranscribing}
 *   <p>Transcribing...</p>
 * {:else if voice.transcript}
 *   <p>Transcript: {voice.transcript}</p>
 * {/if}
 *
 * {#if voice.mediaAccessError}
 *   <p>Error: {voice.mediaAccessError}</p>
 * {/if}
 * ```
 */
export function createTamboVoice(): TamboVoiceResult {
  const client = getContext<TamboAI | undefined>(TAMBO_CLIENT_KEY);

  let isRecording = $state(false);
  let isTranscribing = $state(false);
  let transcript = $state<string | null>(null);
  let transcriptionError = $state<string | null>(null);
  let mediaAccessError = $state<string | null>(null);

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let stream: MediaStream | null = null;

  async function startRecording(): Promise<void> {
    if (isRecording) return;

    // Reset state
    transcript = null;
    transcriptionError = null;
    mediaAccessError = null;
    audioChunks = [];

    try {
      // Check if we're in a browser environment
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        mediaAccessError = "Media devices not available";
        return;
      }

      stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine best MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/ogg";

      mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        isRecording = false;

        // Stop all tracks
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          stream = null;
        }

        if (audioChunks.length === 0) {
          transcriptionError = "No audio recorded";
          return;
        }

        // Transcribe
        isTranscribing = true;

        try {
          if (!client) {
            throw new Error("Tambo client not available");
          }

          const blob = new Blob(audioChunks, {
            type: mediaRecorder?.mimeType ?? "audio/webm",
          });
          const file = new File([blob], "recording.webm", {
            type: mediaRecorder?.mimeType ?? "audio/webm",
          });

          const result = await client.beta.audio.transcribe({ file });
          transcript = result || null;
        } catch (err) {
          transcriptionError = err instanceof Error ? err.message : String(err);
        } finally {
          isTranscribing = false;
        }
      };

      mediaRecorder.onerror = () => {
        mediaAccessError = "Recording error occurred";
        isRecording = false;
      };

      mediaRecorder.start();
      isRecording = true;
    } catch (err) {
      mediaAccessError = err instanceof Error ? err.message : String(err);
      isRecording = false;
    }
  }

  function stopRecording(): void {
    if (!isRecording || !mediaRecorder) return;

    try {
      mediaRecorder.stop();
    } catch (err) {
      console.error("Error stopping recording:", err);
      isRecording = false;
    }
  }

  // Cleanup on destroy
  onDestroy(() => {
    if (mediaRecorder && isRecording) {
      try {
        mediaRecorder.stop();
      } catch {
        // Ignore errors during cleanup
      }
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  });

  return {
    get isRecording() {
      return isRecording;
    },
    get isTranscribing() {
      return isTranscribing;
    },
    get transcript() {
      return transcript;
    },
    get transcriptionError() {
      return transcriptionError;
    },
    get mediaAccessError() {
      return mediaAccessError;
    },
    startRecording,
    stopRecording,
  };
}
