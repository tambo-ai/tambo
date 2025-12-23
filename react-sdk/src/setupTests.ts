import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";
import { TransformStream, ReadableStream, WritableStream } from "stream/web";

// Mock Date.now() to return a fixed timestamp for consistent testing
const mockDate = new Date(2025, 0, 5, 12, 32, 58, 936);
global.Date.now = jest.fn(() => mockDate.getTime());

// Add TextEncoder/TextDecoder polyfills for Node.js test environment
Object.assign(global, { TextEncoder, TextDecoder });

// Add Web Streams API polyfills for jsdom environment (used by @modelcontextprotocol/sdk)
Object.assign(global, { TransformStream, ReadableStream, WritableStream });

// Mock react-media-recorder for tests (browser APIs not available in Node.js)
jest.mock("react-media-recorder", () => ({
  useReactMediaRecorder: () => ({
    status: "idle",
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    mediaBlobUrl: null,
    error: null,
  }),
}));
