import "@testing-library/jest-dom";
import { expect } from "@jest/globals";
import { TextDecoder, TextEncoder } from "util";
import { TransformStream, ReadableStream, WritableStream } from "stream/web";
import { htmlSnapshotSerializer } from "./html-snapshot-serializer";

// Add TextEncoder/TextDecoder polyfills for Node.js test environment
Object.assign(global, { TextEncoder, TextDecoder });

// Add Web Streams API polyfills for jsdom environment (used by @modelcontextprotocol/sdk)
Object.assign(global, { TransformStream, ReadableStream, WritableStream });

// Add custom snapshot serializer for HTML strings
expect.addSnapshotSerializer(htmlSnapshotSerializer);
