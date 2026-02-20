// Jest manual mock for @tambo-ai/react used by registry component tests.
//
// Tests should cast the exported hooks to `jest.MockedFunction<typeof useTambo>`
// (etc) when they need to override behavior for a specific scenario.

import { jest } from "@jest/globals";
import type { Mock } from "jest-mock";

export const useTambo: Mock = jest.fn().mockReturnValue({
  messages: [],
  isStreaming: false,
  isWaiting: false,
  isIdle: true,
  currentThreadId: "mock-thread-id",
  switchThread: jest.fn(),
  startNewThread: jest.fn().mockReturnValue("new-thread-id"),
  cancelRun: jest.fn(),
});

export const useTamboThreadList: Mock = jest.fn().mockReturnValue({
  data: { threads: [] },
  isLoading: false,
  error: null,
  refetch: jest.fn(),
});

export const useTamboSuggestions: Mock = jest.fn().mockReturnValue({
  suggestions: [],
  isGenerating: false,
  error: null,
  refetch: jest.fn(),
});

export const useTamboThreadInput: Mock = jest.fn().mockReturnValue({
  value: "",
  setValue: jest.fn(),
  submit: jest.fn(),
  error: null,
  images: [],
  addImages: jest.fn(async () => undefined),
  addImage: jest.fn(async () => undefined),
  removeImage: jest.fn(),
});

export const useTamboInteractable: Mock = jest.fn().mockReturnValue({
  setInteractableSelected: jest.fn(),
});

export const useIsTamboTokenUpdating: Mock = jest.fn().mockReturnValue(false);

export const MCPTransport = {
  HTTP: "http",
  SSE: "sse",
} as const;
