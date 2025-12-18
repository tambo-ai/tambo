import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";
import { TransformStream, ReadableStream, WritableStream } from "stream/web";

// Add TextEncoder/TextDecoder polyfills for Node.js test environment
Object.assign(global, { TextEncoder, TextDecoder });

// Add Web Streams API polyfills for jsdom environment (used by @modelcontextprotocol/sdk)
Object.assign(global, { TransformStream, ReadableStream, WritableStream });
