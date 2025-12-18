// Mock for react-media-recorder - not needed for message content tests
export const useReactMediaRecorder = () => ({
  status: "idle",
  startRecording: () => {},
  stopRecording: () => {},
  mediaBlobUrl: null,
  clearBlobUrl: () => {},
});

export const ReactMediaRecorder = () => null;
