// Jest manual mock for @tambo-ai/react/mcp used by registry component tests.
//
// Tests should cast the exported hooks to `jest.MockedFunction<typeof useTamboMcpPromptList>`
// (etc) when they need to override behavior for a specific scenario.

import { jest } from "@jest/globals";
import type { Mock } from "jest-mock";

export const useTamboMcpPromptList: Mock = jest.fn().mockReturnValue({
  data: [],
  isLoading: false,
  error: undefined,
});

export const useTamboMcpPrompt: Mock = jest.fn().mockReturnValue({
  data: undefined,
  error: undefined,
});

export const useTamboMcpResourceList: Mock = jest.fn().mockReturnValue({
  data: [],
  isLoading: false,
  error: undefined,
});

export const useTamboMcpResource: Mock = jest.fn().mockReturnValue({
  data: undefined,
  error: undefined,
});

export const useTamboMcpElicitation: Mock = jest.fn().mockReturnValue({
  elicitation: null,
  resolveElicitation: jest.fn(),
});

export const useTamboElicitationContext = useTamboMcpElicitation;

export const useTamboMcpServers: Mock = jest.fn().mockReturnValue([]);

export const isMcpResourceEntry: Mock = jest.fn().mockReturnValue(false);

export const TamboMcpProvider = jest.fn();
export const MCPTransport = jest.fn();
