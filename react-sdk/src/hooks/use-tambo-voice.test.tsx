import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReactMediaRecorder } from "react-media-recorder";
import { useTamboVoice } from "./use-tambo-voice";
import { TamboClientContext } from "../providers/tambo-client-provider";
import TamboAI from "@tambo-ai/typescript-sdk";

// Override the global mock from setupTests.ts with a controllable version
jest.mock("react-media-recorder", () => ({
  useReactMediaRecorder: jest.fn(),
}));

// Mock the client provider
jest.mock("../providers/tambo-client-provider", () => ({
  ...jest.requireActual("../providers/tambo-client-provider"),
  useTamboClient: jest.fn(),
}));

import { useTamboClient } from "../providers/tambo-client-provider";

// Mock fetch globally
const mockFetch = jest.fn();

describe("useTamboVoice", () => {
  let previousFetch: typeof fetch;
  let mockStartRecording: jest.Mock;
  let mockStopRecording: jest.Mock;
  let mockTranscribe: jest.Mock;
  let queryClient: QueryClient;

  type MediaRecorderMockValue = Pick<
    ReturnType<typeof useReactMediaRecorder>,
    "status" | "startRecording" | "stopRecording" | "mediaBlobUrl" | "error"
  >;

  const createWrapper = () => {
    const mockClient = {
      beta: {
        audio: {
          transcribe: mockTranscribe,
        },
      },
    } as unknown as TamboAI;

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboClientContext.Provider
        value={{
          client: mockClient,
          queryClient,
          isUpdatingToken: false,
        }}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </TamboClientContext.Provider>
    );
    Wrapper.displayName = "TestWrapper";
    return Wrapper;
  };

  const setupMediaRecorderMock = (
    overrides: Partial<MediaRecorderMockValue> = {},
  ) => {
    const value: MediaRecorderMockValue = {
      status: "idle",
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      mediaBlobUrl: undefined,
      error: "",
      ...overrides,
    };
    jest
      .mocked(useReactMediaRecorder)
      .mockReturnValue(
        value as unknown as ReturnType<typeof useReactMediaRecorder>,
      );
    return value;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockFetch.mockReset();

    previousFetch = global.fetch;
    global.fetch = mockFetch as unknown as typeof fetch;

    mockStartRecording = jest.fn();
    mockStopRecording = jest.fn();
    mockTranscribe = jest.fn();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup default client mock
    const mockClient = {
      beta: {
        audio: {
          transcribe: mockTranscribe,
        },
      },
    };
    jest
      .mocked(useTamboClient)
      .mockReturnValue(mockClient as unknown as TamboAI);

    // Setup default media recorder mock
    setupMediaRecorderMock();

    // Setup default fetch mock
    mockFetch.mockResolvedValue({
      blob: async () =>
        await Promise.resolve(new Blob(["audio data"], { type: "audio/webm" })),
    });
  });

  afterEach(() => {
    global.fetch = previousFetch;
  });

  describe("Initial State", () => {
    it("should initialize with idle state and no transcript", () => {
      const { result } = renderHook(() => useTamboVoice(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isRecording).toBe(false);
      expect(result.current.isTranscribing).toBe(false);
      expect(result.current.transcript).toBeNull();
      expect(result.current.transcriptionError).toBeNull();
      expect(result.current.mediaAccessError).toBeNull();
    });
  });

  describe("Recording Flow", () => {
    it("should expose isRecording=true during active recording", () => {
      setupMediaRecorderMock({ status: "recording" });

      const { result } = renderHook(() => useTamboVoice(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isRecording).toBe(true);
    });

    it("should call startRecording on the media recorder", () => {
      const { result } = renderHook(() => useTamboVoice(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.startRecording();
      });

      expect(mockStartRecording).toHaveBeenCalled();
    });

    it("should call stopRecording on the media recorder when recording", () => {
      setupMediaRecorderMock({ status: "recording" });

      const { result } = renderHook(() => useTamboVoice(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.stopRecording();
      });

      expect(mockStopRecording).toHaveBeenCalled();
    });

    it("should reset transcript when starting a new recording", async () => {
      mockTranscribe.mockResolvedValue("first transcript");

      // Start with completed transcription
      setupMediaRecorderMock({
        status: "stopped",
        mediaBlobUrl: "blob:http://localhost/audio1",
      });

      const { result, rerender } = renderHook(() => useTamboVoice(), {
        wrapper: createWrapper(),
      });

      // Wait for transcription to complete
      await waitFor(() => {
        expect(result.current.transcript).toBe("first transcript");
      });

      // Now simulate starting a new recording
      setupMediaRecorderMock({ status: "idle" });
      rerender();

      act(() => {
        result.current.startRecording();
      });

      expect(result.current.transcript).toBeNull();
    });
  });

  describe("Transcription", () => {
    it("should trigger transcription after recording stops with blob URL", async () => {
      mockTranscribe.mockResolvedValue("Hello world");

      setupMediaRecorderMock({
        status: "stopped",
        mediaBlobUrl: "blob:http://localhost/audio",
      });

      const { result } = renderHook(() => useTamboVoice(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.transcript).toBe("Hello world");
      });

      expect(mockFetch).toHaveBeenCalledWith("blob:http://localhost/audio");
      expect(mockTranscribe).toHaveBeenCalled();
    });

    it("should expose isTranscribing=true during API call", async () => {
      let resolveTranscription: (value: string) => void;
      mockTranscribe.mockImplementation(
        async () =>
          await new Promise((resolve) => {
            resolveTranscription = resolve;
          }),
      );

      setupMediaRecorderMock({
        status: "stopped",
        mediaBlobUrl: "blob:http://localhost/audio",
      });

      const { result } = renderHook(() => useTamboVoice(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isTranscribing).toBe(true);
      });

      // Complete the transcription
      act(() => {
        resolveTranscription!("transcribed text");
      });

      await waitFor(() => {
        expect(result.current.isTranscribing).toBe(false);
      });
    });
  });

  describe("Error Handling", () => {
    it("should expose mediaAccessError when microphone access fails", () => {
      setupMediaRecorderMock({
        error: "Permission denied",
      });

      const { result } = renderHook(() => useTamboVoice(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mediaAccessError).toBe("Permission denied");
    });

    it("should expose transcriptionError when API call fails", async () => {
      mockTranscribe.mockRejectedValue(
        new Error("Transcription service unavailable"),
      );

      setupMediaRecorderMock({
        status: "stopped",
        mediaBlobUrl: "blob:http://localhost/audio",
      });

      const { result } = renderHook(() => useTamboVoice(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.transcriptionError).toBe(
          "Transcription service unavailable",
        );
      });

      expect(result.current.isTranscribing).toBe(false);
    });

    it("should handle blob fetch failure gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      setupMediaRecorderMock({
        status: "stopped",
        mediaBlobUrl: "blob:http://localhost/audio",
      });

      const { result } = renderHook(() => useTamboVoice(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.transcriptionError).toBe("Network error");
      });

      expect(result.current.isTranscribing).toBe(false);
      expect(result.current.transcript).toBeNull();
    });
  });
});
