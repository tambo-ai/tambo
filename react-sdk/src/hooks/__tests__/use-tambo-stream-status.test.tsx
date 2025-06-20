import { renderHook } from "@testing-library/react";
import { GenerationStage, TamboThreadMessage } from "../../model/generate-component-response";
import { useTamboThread } from "../../providers/tambo-thread-provider";
import { useTamboCurrentMessage } from "../use-current-message";
import { useTamboStreamStatus, StreamStatus, PropStatus } from "../use-tambo-stream-status";

// Mock the required providers and hooks
jest.mock("../../providers/tambo-thread-provider", () => ({
  useTamboThread: jest.fn(),
}));

jest.mock("../use-current-message", () => ({
  useTamboCurrentMessage: jest.fn(),
}));

interface TestProps {
  title: string;
  description: string;
  count: number;
}

describe("useTamboStreamStatus", () => {
  beforeEach(() => {
    // Setup default mocks
    jest.mocked(useTamboThread).mockReturnValue({
      streaming: false,
      generationStage: GenerationStage.IDLE,
    } as any);
    
    jest.mocked(useTamboCurrentMessage).mockReturnValue(undefined);
  });

  describe("SSR Guard", () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it("should throw error during SSR", () => {
      // Simulate SSR environment
      delete (global as any).window;

      expect(() => {
        renderHook(() => useTamboStreamStatus());
      }).toThrow("useTamboStreamStatus cannot be used during SSR/SSG. Use only in browser contexts or wrap in useEffect/dynamic import.");
    });
  });

  describe("Initialization", () => {
    it("should initialize with pending state when no props", () => {
      const { result } = renderHook(() => useTamboStreamStatus<TestProps>());

      expect(result.current.streamStatus).toEqual({
        isPending: true,
        isStreaming: false,
        isSuccess: false,
        isError: false,
        streamError: undefined,
      });
      expect(result.current.propStatus).toEqual({});
    });
  });

  describe("Boolean Lifecycle", () => {
    it("should show isPending when no tokens received yet", () => {
      const mockMessage: Partial<TamboThreadMessage> = {
        componentProps: {
          title: "",
          description: "",
          count: 0,
        },
      };

      jest.mocked(useTamboCurrentMessage).mockReturnValue(mockMessage as TamboThreadMessage);
      jest.mocked(useTamboThread).mockReturnValue({
        streaming: false,
        generationStage: GenerationStage.IDLE,
      } as any);

      const { result } = renderHook(() => useTamboStreamStatus<TestProps>());

      expect(result.current.streamStatus.isPending).toBe(true);
      expect(result.current.streamStatus.isStreaming).toBe(false);
      expect(result.current.streamStatus.isSuccess).toBe(false);
      expect(result.current.streamStatus.isError).toBe(false);

      expect(result.current.propStatus.title.isPending).toBe(true);
      expect(result.current.propStatus.title.isStreaming).toBe(false);
    });

    it("should show isStreaming when receiving tokens", () => {
      const mockMessage: Partial<TamboThreadMessage> = {
        componentProps: {
          title: "Partial title",
          description: "",
          count: 0,
        },
      };

      jest.mocked(useTamboCurrentMessage).mockReturnValue(mockMessage as TamboThreadMessage);
      jest.mocked(useTamboThread).mockReturnValue({
        streaming: true,
        generationStage: GenerationStage.STREAMING_RESPONSE,
      } as any);

      const { result } = renderHook(() => useTamboStreamStatus<TestProps>());

      expect(result.current.streamStatus.isPending).toBe(false);
      expect(result.current.streamStatus.isStreaming).toBe(true);
      expect(result.current.streamStatus.isSuccess).toBe(false);
      expect(result.current.streamStatus.isError).toBe(false);

      expect(result.current.propStatus.title.isPending).toBe(false);
      expect(result.current.propStatus.title.isStreaming).toBe(true);
      expect(result.current.propStatus.description.isPending).toBe(true);
    });

    it("should show isSuccess when all props are complete", () => {
      const mockMessage: Partial<TamboThreadMessage> = {
        componentProps: {
          title: "Complete title",
          description: "Complete description",
          count: 42,
        },
      };

      jest.mocked(useTamboCurrentMessage).mockReturnValue(mockMessage as TamboThreadMessage);
      jest.mocked(useTamboThread).mockReturnValue({
        streaming: false,
        generationStage: GenerationStage.COMPLETE,
      } as any);

      const { result } = renderHook(() => useTamboStreamStatus<TestProps>());

      expect(result.current.streamStatus.isPending).toBe(false);
      expect(result.current.streamStatus.isStreaming).toBe(false);
      expect(result.current.streamStatus.isSuccess).toBe(true);
      expect(result.current.streamStatus.isError).toBe(false);

      expect(result.current.propStatus.title.isSuccess).toBe(true);
      expect(result.current.propStatus.description.isSuccess).toBe(true);
      expect(result.current.propStatus.count.isSuccess).toBe(true);
    });

    it("should show isError when fatal error occurs", () => {
      const mockMessage: Partial<TamboThreadMessage> = {
        componentProps: {
          title: "Partial title",
          description: "",
          count: 0,
        },
      };

      jest.mocked(useTamboCurrentMessage).mockReturnValue(mockMessage as TamboThreadMessage);
      jest.mocked(useTamboThread).mockReturnValue({
        streaming: false,
        generationStage: GenerationStage.ERROR,
      } as any);

      const { result } = renderHook(() => useTamboStreamStatus<TestProps>());

      expect(result.current.streamStatus.isPending).toBe(false);
      expect(result.current.streamStatus.isStreaming).toBe(false);
      expect(result.current.streamStatus.isSuccess).toBe(false);
      expect(result.current.streamStatus.isError).toBe(true);
      expect(result.current.streamStatus.streamError).toBeInstanceOf(Error);

      expect(result.current.propStatus.title.isError).toBe(true);
      expect(result.current.propStatus.description.isError).toBe(true);
      expect(result.current.propStatus.count.isError).toBe(true);
    });
  });

  describe("Derivation Rules", () => {
    it("should derive isPending when all props are pending", () => {
      const mockMessage: Partial<TamboThreadMessage> = {
        componentProps: {
          title: "",
          description: "",
          count: 0,
        },
      };

      jest.mocked(useTamboCurrentMessage).mockReturnValue(mockMessage as TamboThreadMessage);
      jest.mocked(useTamboThread).mockReturnValue({
        streaming: false,
        generationStage: GenerationStage.IDLE,
      } as any);

      const { result } = renderHook(() => useTamboStreamStatus<TestProps>());

      expect(result.current.streamStatus.isPending).toBe(true);
    });

    it("should derive isStreaming when any prop is streaming", () => {
      const mockMessage: Partial<TamboThreadMessage> = {
        componentProps: {
          title: "Complete title",
          description: "Partial desc",
          count: 0,
        },
      };

      jest.mocked(useTamboCurrentMessage).mockReturnValue(mockMessage as TamboThreadMessage);
      jest.mocked(useTamboThread).mockReturnValue({
        streaming: true,
        generationStage: GenerationStage.STREAMING_RESPONSE,
      } as any);

      const { result } = renderHook(() => useTamboStreamStatus<TestProps>());

      expect(result.current.streamStatus.isStreaming).toBe(true);
    });

    it("should derive isSuccess when all props are successful", () => {
      const mockMessage: Partial<TamboThreadMessage> = {
        componentProps: {
          title: "Complete title",
          description: "Complete description",
          count: 42,
        },
      };

      jest.mocked(useTamboCurrentMessage).mockReturnValue(mockMessage as TamboThreadMessage);
      jest.mocked(useTamboThread).mockReturnValue({
        streaming: false,
        generationStage: GenerationStage.COMPLETE,
      } as any);

      const { result } = renderHook(() => useTamboStreamStatus<TestProps>());

      expect(result.current.streamStatus.isSuccess).toBe(true);
    });

    it("should derive isError when any prop has error", () => {
      const mockMessage: Partial<TamboThreadMessage> = {
        componentProps: {
          title: "Complete title",
          description: "Complete description",
          count: 42,
        },
      };

      jest.mocked(useTamboCurrentMessage).mockReturnValue(mockMessage as TamboThreadMessage);
      jest.mocked(useTamboThread).mockReturnValue({
        streaming: false,
        generationStage: GenerationStage.ERROR,
      } as any);

      const { result } = renderHook(() => useTamboStreamStatus<TestProps>());

      expect(result.current.streamStatus.isError).toBe(true);
      expect(result.current.streamStatus.streamError).toBeInstanceOf(Error);
    });
  });

  describe("Error Handling", () => {
    it("should propagate first fatal error to streamError", () => {
      jest.mocked(useTamboCurrentMessage).mockReturnValue({
        componentProps: { title: "test" },
      } as TamboThreadMessage);
      jest.mocked(useTamboThread).mockReturnValue({
        streaming: false,
        generationStage: GenerationStage.ERROR,
      } as any);

      const { result } = renderHook(() => useTamboStreamStatus<{ title: string }>());

      expect(result.current.streamStatus.streamError).toBeInstanceOf(Error);
      expect(result.current.streamStatus.streamError?.message).toBe("Stream generation failed");
    });

    it("should set per-prop errors when stream fails", () => {
      jest.mocked(useTamboCurrentMessage).mockReturnValue({
        componentProps: { title: "test" },
      } as TamboThreadMessage);
      jest.mocked(useTamboThread).mockReturnValue({
        streaming: false,
        generationStage: GenerationStage.ERROR,
      } as any);

      const { result } = renderHook(() => useTamboStreamStatus<{ title: string }>());

      expect(result.current.propStatus.title.isError).toBe(true);
      expect(result.current.propStatus.title.error).toBeInstanceOf(Error);
    });
  });

  describe("Type Safety", () => {
    it("should preserve generic type for prop status", () => {
      const mockMessage: Partial<TamboThreadMessage> = {
        componentProps: {
          title: "Test title",
          count: 42,
        },
      };

      jest.mocked(useTamboCurrentMessage).mockReturnValue(mockMessage as TamboThreadMessage);
      jest.mocked(useTamboThread).mockReturnValue({
        streaming: false,
        generationStage: GenerationStage.COMPLETE,
      } as any);

      const { result } = renderHook(() => useTamboStreamStatus<{ title: string; count: number }>());

      // Type checking - these should not cause TypeScript errors
      const titleStatus: PropStatus = result.current.propStatus.title;
      const countStatus: PropStatus = result.current.propStatus.count;
      const streamStatus: StreamStatus = result.current.streamStatus;

      expect(titleStatus).toBeDefined();
      expect(countStatus).toBeDefined();
      expect(streamStatus).toBeDefined();
    });
  });
});