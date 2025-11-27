// Mock implementation of @tambo-ai/react for testing registry components
const mockFn = () => {
  const fn = (...args: unknown[]) => {
    fn.mock.calls.push(args);
    return fn.mockReturnValue || fn.defaultReturn;
  };
  fn.mock = { calls: [] as unknown[][] };
  fn.mockReturnValue = undefined;
  fn.defaultReturn = undefined;
  return fn;
};

const createMockHook = (defaultReturn: unknown) => {
  const fn = mockFn();
  fn.defaultReturn = defaultReturn;
  fn.mockReturnValue = defaultReturn;
  return fn;
};

export const useTambo = createMockHook({
  thread: {
    messages: [],
    generationStage: "IDLE",
  },
});

export const useTamboThread = createMockHook({
  switchCurrentThread: mockFn(),
  startNewThread: mockFn(),
});

export const useTamboThreadList = createMockHook({
  data: { items: [] },
  isLoading: false,
  error: null,
  refetch: mockFn(),
});
