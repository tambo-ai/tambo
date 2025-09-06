"use client";

import { TamboProvider } from "@tambo-ai/react";
import {
  MessageInput,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
} from "../../components/ui/message-input";
import {
  VoiceInputProvider,
  useVoiceInput,
  useVoiceInputContext,
} from "../../components/ui/use-voice-input-local";
import { Mic, Square } from "lucide-react";
import React from "react";

// Custom Voice Button component for testing
const TestVoiceButton = () => {
  const { isEnabled } = useVoiceInputContext();
  const {
    startRecording,
    stopRecording,
    isRecording,
    isTranscribing,
    error,
    isSupported,
  } = useVoiceInput();

  // Don't render if voice input is disabled or not supported
  if (!isEnabled || !isSupported) {
    return (
      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
        <Mic className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  const handleClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const buttonClasses = `w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
    isRecording
      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
  } ${isTranscribing ? "opacity-50 cursor-wait" : ""}`;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isTranscribing}
        className={buttonClasses}
        title={
          isTranscribing
            ? "Transcribing..."
            : isRecording
              ? "Stop recording"
              : error
                ? "Voice input error"
                : "Start voice input"
        }
      >
        {isRecording ? (
          <Square className="w-4 h-4" fill="currentColor" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>
      {error && (
        <div className="mt-2 text-sm text-red-600">Error: {error.message}</div>
      )}
    </div>
  );
};

export default function TestVoicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Voice Input Test</h1>
        <div className="max-w-2xl">
          <TamboProvider apiKey="test-key">
            <VoiceInputProvider enabled={true}>
              <MessageInput>
                <MessageInputTextarea placeholder="Type or use voice input..." />
                <MessageInputToolbar>
                  <TestVoiceButton />
                  <MessageInputSubmitButton />
                </MessageInputToolbar>
              </MessageInput>
            </VoiceInputProvider>
          </TamboProvider>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h2 className="font-semibold mb-2">Testing Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Look for the microphone button in the message input above</li>
            <li>Click it to start recording (should turn red and pulse)</li>
            <li>Grant microphone permission if prompted</li>
            <li>Speak clearly into your microphone</li>
            <li>Click the square button to stop recording</li>
            <li>Watch for transcribed text to appear in the input field</li>
          </ol>

          <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-400">
            <p className="text-sm text-green-800">
              <strong>Backend Ready:</strong> The transcription endpoint is now
              implemented! Make sure you have your <code>OPENAI_API_KEY</code>{" "}
              set in <code>.env.local</code>
            </p>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400">
            <p className="text-sm text-blue-800">
              <strong>Requirements:</strong> Voice input requires HTTPS (or
              localhost), microphone permissions, and OpenAI API key.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
