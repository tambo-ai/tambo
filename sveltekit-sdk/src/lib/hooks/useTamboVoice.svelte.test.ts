/**
 * Tests for useTamboVoice hook.
 *
 * Note: Testing voice recording requires mocking browser APIs.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tick } from "svelte";

// Mock svelte
vi.mock("svelte", async () => {
  const actual = await vi.importActual("svelte");
  return {
    ...actual,
    getContext: vi.fn(),
    onDestroy: vi.fn((callback) => {
      // Store callback for testing cleanup
      (
        global as unknown as { onDestroyCallback?: () => void }
      ).onDestroyCallback = callback;
    }),
  };
});

describe("createTamboVoice", () => {
  let mockClient: {
    beta: { audio: { transcribe: ReturnType<typeof vi.fn> } };
  };
  let mockMediaRecorder: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    ondataavailable: ((event: { data: Blob }) => void) | null;
    onstop: (() => Promise<void>) | null;
    onerror: (() => void) | null;
    mimeType: string;
    state: string;
  };
  let mockStream: {
    getTracks: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.resetModules();

    // Mock client
    mockClient = {
      beta: {
        audio: {
          transcribe: vi.fn().mockResolvedValue("Test transcription"),
        },
      },
    };

    // Mock MediaRecorder
    mockMediaRecorder = {
      start: vi.fn(),
      stop: vi.fn(),
      ondataavailable: null,
      onstop: null,
      onerror: null,
      mimeType: "audio/webm",
      state: "inactive",
    };

    // Mock stream
    mockStream = {
      getTracks: vi.fn(() => [{ stop: vi.fn() }]),
    };

    // Mock globals
    global.MediaRecorder = vi.fn(
      () => mockMediaRecorder,
    ) as unknown as typeof MediaRecorder;
    (
      global.MediaRecorder as unknown as {
        isTypeSupported: ReturnType<typeof vi.fn>;
      }
    ).isTypeSupported = vi.fn(() => true);

    global.navigator = {
      mediaDevices: {
        getUserMedia: vi.fn(() => Promise.resolve(mockStream)),
      },
    } as unknown as Navigator;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial values", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      expect(voice.isRecording).toBe(false);
      expect(voice.isTranscribing).toBe(false);
      expect(voice.transcript).toBeNull();
      expect(voice.transcriptionError).toBeNull();
      expect(voice.mediaAccessError).toBeNull();
    });
  });

  describe("startRecording", () => {
    it("should request microphone access", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      await voice.startRecording();

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: true,
      });
    });

    it("should set isRecording to true", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      await voice.startRecording();
      await tick();

      expect(voice.isRecording).toBe(true);
    });

    it("should start the MediaRecorder", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      await voice.startRecording();

      expect(mockMediaRecorder.start).toHaveBeenCalled();
    });

    it("should set mediaAccessError when navigator is undefined", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      // Remove navigator
      const originalNavigator = global.navigator;
      (global as unknown as { navigator: undefined }).navigator = undefined;

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      await voice.startRecording();
      await tick();

      expect(voice.mediaAccessError).toBe("Media devices not available");
      expect(voice.isRecording).toBe(false);

      // Restore
      global.navigator = originalNavigator;
    });

    it("should set mediaAccessError when getUserMedia fails", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      // Mock getUserMedia to reject
      (
        navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error("Permission denied"));

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      await voice.startRecording();
      await tick();

      expect(voice.mediaAccessError).toBe("Permission denied");
      expect(voice.isRecording).toBe(false);
    });

    it("should not start if already recording", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      await voice.startRecording();
      await voice.startRecording(); // Second call

      // getUserMedia should only be called once
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    });
  });

  describe("stopRecording", () => {
    it("should stop the MediaRecorder", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      await voice.startRecording();
      voice.stopRecording();

      expect(mockMediaRecorder.stop).toHaveBeenCalled();
    });

    it("should do nothing if not recording", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      voice.stopRecording();

      expect(mockMediaRecorder.stop).not.toHaveBeenCalled();
    });
  });

  describe("transcription", () => {
    it("should transcribe audio after recording stops", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      await voice.startRecording();

      // Simulate data available
      mockMediaRecorder.ondataavailable?.({
        data: new Blob(["audio data"], { type: "audio/webm" }),
      });

      // Simulate stop
      if (mockMediaRecorder.onstop) {
        await mockMediaRecorder.onstop();
      }
      await tick();

      expect(mockClient.beta.audio.transcribe).toHaveBeenCalled();
    });

    it("should set transcript on success", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      await voice.startRecording();

      // Simulate data
      mockMediaRecorder.ondataavailable?.({
        data: new Blob(["audio"], { type: "audio/webm" }),
      });

      // Simulate stop
      if (mockMediaRecorder.onstop) {
        await mockMediaRecorder.onstop();
      }
      await tick();

      expect(voice.transcript).toBe("Test transcription");
    });

    it("should set transcriptionError on failure", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      mockClient.beta.audio.transcribe.mockRejectedValue(
        new Error("Transcription failed"),
      );

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      await voice.startRecording();

      mockMediaRecorder.ondataavailable?.({
        data: new Blob(["audio"], { type: "audio/webm" }),
      });

      if (mockMediaRecorder.onstop) {
        await mockMediaRecorder.onstop();
      }
      await tick();

      expect(voice.transcriptionError).toBe("Transcription failed");
    });

    it("should set transcriptionError when no audio recorded", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      await voice.startRecording();

      // Don't add any audio data, directly stop
      if (mockMediaRecorder.onstop) {
        await mockMediaRecorder.onstop();
      }
      await tick();

      expect(voice.transcriptionError).toBe("No audio recorded");
    });

    it("should set transcriptionError when client is not available", async () => {
      const { getContext } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(undefined); // No client

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      const voice = createTamboVoice();

      await voice.startRecording();

      mockMediaRecorder.ondataavailable?.({
        data: new Blob(["audio"], { type: "audio/webm" }),
      });

      if (mockMediaRecorder.onstop) {
        await mockMediaRecorder.onstop();
      }
      await tick();

      expect(voice.transcriptionError).toBe("Tambo client not available");
    });
  });

  describe("cleanup", () => {
    it("should stop recording on destroy", async () => {
      const { getContext, onDestroy } = await import("svelte");
      vi.mocked(getContext).mockReturnValue(mockClient);

      const { createTamboVoice } = await import("./useTamboVoice.svelte.js");
      createTamboVoice();

      // Verify onDestroy was called
      expect(onDestroy).toHaveBeenCalled();
    });
  });
});
