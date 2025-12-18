import { jest } from "@jest/globals";

type UseReactMediaRecorderResult = {
  status: "idle";
  startRecording: jest.Mock;
  stopRecording: jest.Mock;
  clearBlobUrl: jest.Mock;
  mediaBlobUrl: string | null;
  error: unknown | null;
};

export const useReactMediaRecorder = (): UseReactMediaRecorderResult => ({
  status: "idle",
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  clearBlobUrl: jest.fn(),
  mediaBlobUrl: null,
  error: null,
});

export const ReactMediaRecorder = () => null;
