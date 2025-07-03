import "@tambo-ai/typescript-sdk/shims/node";
import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

// Mock Date.now() to return a fixed timestamp for consistent testing
const mockDate = new Date(2025, 0, 5, 12, 32, 58, 936);
global.Date.now = jest.fn(() => mockDate.getTime());

// Add TextEncoder/TextDecoder polyfills for Node.js test environment
Object.assign(global, { TextEncoder, TextDecoder });
