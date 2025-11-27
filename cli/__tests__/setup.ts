import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

// Add TextEncoder/TextDecoder polyfills for Node.js test environment
Object.assign(global, { TextEncoder, TextDecoder });
