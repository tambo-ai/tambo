// Jest manual mock for @tambo-ai/react used by registry component tests.
//
// Tests should cast the exported hooks to `jest.MockedFunction<typeof useTambo>`
// (etc) when they need to override behavior for a specific scenario.

import { jest } from "@jest/globals";
import type { Mock } from "jest-mock";

export enum GenerationStage {
  IDLE = "IDLE",
  CHOOSING_COMPONENT = "CHOOSING_COMPONENT",
  FETCHING_CONTEXT = "FETCHING_CONTEXT",
  HYDRATING_COMPONENT = "HYDRATING_COMPONENT",
  STREAMING_RESPONSE = "STREAMING_RESPONSE",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR",
  CANCELLED = "CANCELLED",
}

export const useTambo: Mock = jest.fn().mockReturnValue({
  thread: {
    messages: [],
    generationStage: GenerationStage.IDLE,
  },
});

export const useTamboThread: Mock = jest.fn().mockReturnValue({
  switchCurrentThread: jest.fn(),
  startNewThread: jest.fn(),
});

export const useTamboThreadList: Mock = jest.fn().mockReturnValue({
  data: { items: [] },
  isLoading: false,
  error: null,
  refetch: jest.fn(),
});

export const useTamboSuggestions: Mock = jest.fn().mockReturnValue({
  suggestions: [],
  isLoading: false,
  error: null,
  refetch: jest.fn(),
});
