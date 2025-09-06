import { act, renderHook, waitFor } from "@testing-library/react";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { useTamboThreadInput } from "../../providers/tambo-thread-input-provider";
import { useTamboVoiceInput } from "../../providers/tambo-voice-input-provider";
import { useVoiceInput } from "../use-voice-input";

// Mock the required providers
jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
}));

jest.mock("../../providers/tambo-thread-input-provider", () => ({
  useTamboThreadInput: jest.fn(),
}));

jest.mock("../../providers/tambo-voice-input-provider", () => ({
  useTamboVoiceInput: jest.fn(),
}));

// Mock MediaRecorder
class MockMediaRecorder {
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  stream: MediaStream;

  constructor(stream: MediaStream, _options?: any) {
    this.stream = stream;
  }

  start() {
    this.state = "recording";
    // Simulate data available immediately
    if (this.ondataavailable) {
      this.ondataavailable({
        data: new Blob(["test"], { type: "audio/webm" }),
      });
    }
  }

  stop() {
    this.state = "inactive";
    // Simulate onstop being called asynchronously
    setTimeout(() => {
      if (this.onstop) {
        this.onstop();
      }
    }, 10);
  }

  static isTypeSupported(mimeType: string) {
    return mimeType.includes("webm");
  }
}

// Mock MediaStream and MediaStreamTrack
class MockMediaStreamTrack {
  stop = jest.fn();
}

class MockMediaStream {
  private tracks: MockMediaStreamTrack[];

  constructor() {
    this.tracks = [new MockMediaStreamTrack()];
  }

  getTracks() {
    return this.tracks;
  }
}

describe("useVoiceInput", () => {
  const mockSetValue = jest.fn();
  const mockClient = {
    baseURL: "https://api.tambo.ai",
    apiKey: "test-api-key",
  };

  // Store original objects
  const originalMediaRecorder = global.MediaRecorder;
  const originalNavigator = global.navigator;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup MediaRecorder mock
    (global as any).MediaRecorder = MockMediaRecorder;
    (global as any).MediaStream = MockMediaStream;

    // Setup navigator.mediaDevices mock
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: jest.fn().mockResolvedValue(new MockMediaStream()),
      },
      writable: true,
    });

    // Setup fetch mock for transcription
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ text: "transcribed text" }),
    });

    // Setup default mocks
    jest.mocked(useTamboClient).mockReturnValue({
      client: mockClient as any,
    } as any);

    jest.mocked(useTamboThreadInput).mockReturnValue({
      value: "",
      setValue: mockSetValue,
    } as any);

    jest.mocked(useTamboVoiceInput).mockReturnValue({
      isEnabled: true,
    });
  });

  afterEach(() => {
    // Restore original objects
    global.MediaRecorder = originalMediaRecorder;
    global.navigator = originalNavigator;
    global.fetch = originalFetch;
  });

  describe("Initial State", () => {
    it("should initialize with idle state", () => {
      const { result } = renderHook(() => useVoiceInput());

      expect(result.current.state).toBe("idle");
      expect(result.current.isRecording).toBe(false);
      expect(result.current.isTranscribing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isSupported).toBe(true);
    });

    it("should detect when voice input is not supported", () => {
      // Remove MediaRecorder to simulate unsupported browser
      delete (global as any).MediaRecorder;

      const { result } = renderHook(() => useVoiceInput());

      expect(result.current.isSupported).toBe(false);
    });
  });

  describe("Recording Flow", () => {
    it("should start recording when startRecording is called", async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startRecording();
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      expect(result.current.state).toBe("recording");
      expect(result.current.isRecording).toBe(true);
    });

    it("should stop recording when stopRecording is called", async () => {
      const { result } = renderHook(() => useVoiceInput());

      // Start recording first
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.isRecording).toBe(true);

      // Stop recording
      act(() => {
        result.current.stopRecording();
      });

      // Wait for state updates
      await waitFor(() => {
        expect(result.current.isRecording).toBe(false);
      });
    });

    it("should handle permission denied error", async () => {
      const permissionError = new Error("Permission denied");
      permissionError.name = "NotAllowedError";

      jest
        .mocked(navigator.mediaDevices.getUserMedia)
        .mockRejectedValueOnce(permissionError);

      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.state).toBe("error");
      expect(result.current.error?.message).toBe(
        "Microphone permission denied",
      );
    });

    it("should handle no microphone found error", async () => {
      const notFoundError = new Error("No device found");
      notFoundError.name = "NotFoundError";

      jest
        .mocked(navigator.mediaDevices.getUserMedia)
        .mockRejectedValueOnce(notFoundError);

      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.state).toBe("error");
      expect(result.current.error?.message).toBe("No microphone found");
    });
  });

  describe("Transcription", () => {
    it("should transcribe audio and append to existing text", async () => {
      jest.mocked(useTamboThreadInput).mockReturnValue({
        value: "existing text",
        setValue: mockSetValue,
      } as any);

      const { result } = renderHook(() => useVoiceInput());

      // Start recording
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.isRecording).toBe(true);

      // Stop recording and wait for transcription
      await act(async () => {
        result.current.stopRecording();
        // Wait for the MediaRecorder.stop() to trigger onstop callback
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Wait for transcription to complete
      await waitFor(
        () => {
          expect(mockSetValue).toHaveBeenCalledWith(
            "existing text transcribed text",
          );
        },
        { timeout: 2000 },
      );

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.tambo.ai/api/v1/audio/transcriptions",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        }),
      );
    });

    it("should handle transcription errors", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startRecording();
      });

      await act(async () => {
        result.current.stopRecording();
        // Wait for the MediaRecorder.stop() to trigger onstop callback
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      await waitFor(
        () => {
          expect(result.current.state).toBe("error");
          expect(result.current.error?.message).toBe("Network error");
        },
        { timeout: 2000 },
      );
    });

    it("should handle empty transcription response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ text: "" }),
      });

      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startRecording();
      });

      await act(async () => {
        result.current.stopRecording();
        // Wait for the MediaRecorder.stop() to trigger onstop callback
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      await waitFor(
        () => {
          expect(result.current.state).toBe("idle");
        },
        { timeout: 2000 },
      );

      // Should not call setValue if transcription is empty
      expect(mockSetValue).not.toHaveBeenCalled();
    });
  });

  describe("Voice Input Disabled", () => {
    it("should return error when voice input is disabled", async () => {
      jest.mocked(useTamboVoiceInput).mockReturnValue({
        isEnabled: false,
      });

      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.state).toBe("error");
      expect(result.current.error?.message).toBe("Voice input is disabled");
      expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    });
  });

  describe("Cleanup", () => {
    it("should clean up media stream on stop", async () => {
      const { result } = renderHook(() => useVoiceInput());

      await act(async () => {
        await result.current.startRecording();
      });

      const mockTrack = new MockMediaStreamTrack();
      const mockStream = new MockMediaStream();
      jest.spyOn(mockStream, "getTracks").mockReturnValue([mockTrack]);
      jest
        .mocked(navigator.mediaDevices.getUserMedia)
        .mockResolvedValueOnce(mockStream as any);

      act(() => {
        result.current.stopRecording();
      });

      await waitFor(() => {
        expect(result.current.isRecording).toBe(false);
      });
    });
  });
});
