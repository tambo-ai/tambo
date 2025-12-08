export const useReactMediaRecorder = () => ({
  status: "idle" as const,
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  mediaBlobUrl: null,
  error: null,
});
