import "@tambo-ai/typescript-sdk/shims/node";
import "@testing-library/jest-dom";

// Mock Date.now() to return a fixed timestamp for consistent testing
const mockDate = new Date(2025, 0, 5, 12, 32, 58, 936);
global.Date.now = jest.fn(() => mockDate.getTime());
