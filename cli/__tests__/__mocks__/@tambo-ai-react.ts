// Jest manual mock for @tambo-ai/react used by registry component tests.
//
// Tests should call `jest.mock("@tambo-ai/react")` and then cast the
// exported hooks to `jest.MockedFunction<typeof useTambo>` (etc) when they
// need to override behavior for a specific scenario.

export const useTambo = jest.fn().mockReturnValue({
  thread: {
    messages: [],
    generationStage: "IDLE",
  },
});

export const useTamboThread = jest.fn().mockReturnValue({
  switchCurrentThread: jest.fn(),
  startNewThread: jest.fn(),
});

export const useTamboThreadList = jest.fn().mockReturnValue({
  data: { items: [] },
  isLoading: false,
  error: null,
  refetch: jest.fn(),
});
