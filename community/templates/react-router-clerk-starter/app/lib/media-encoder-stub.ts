/**
 * Stub module for media-encoder-host packages and related dependencies
 * This prevents SSR errors when these browser-only packages are imported
 */

// Stub for media-encoder-host
export const load = () => {};

// Stub for react-media-recorder
export const useReactMediaRecorder = () => ({
  status: "idle",
  startRecording: () => {},
  stopRecording: () => {},
  mediaBlobUrl: undefined,
  clearBlobUrl: () => {},
});

// Stub for ReactMediaRecorder component
export const ReactMediaRecorder = () => null;

// Default export
export default {};
