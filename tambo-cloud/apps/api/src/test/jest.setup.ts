// Global mock for superjson (ESM module)
jest.mock("superjson", () => ({
  default: {
    parse: jest.fn((str) => {
      return JSON.parse(str);
    }),
    stringify: jest.fn((obj) => JSON.stringify(obj)),
    serialize: jest.fn((obj) => ({ json: JSON.stringify(obj) })),
    deserialize: jest.fn(({ json }) => {
      try {
        return JSON.parse(json);
      } catch (_e) {
        return json;
      }
    }),
  },
}));

// Global no-op mock for Sentry NestJS SDK
jest.mock("@sentry/nestjs", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setTag: jest.fn(),
  setUser: jest.fn(),
  withScope: (callback: any) =>
    callback({
      setTag: jest.fn(),
      setUser: jest.fn(),
      setContext: jest.fn(),
      setFingerprint: jest.fn(),
    }),
  startSpan: (_cfg: any, fn: any) =>
    typeof fn === "function" ? fn() : undefined,
  startInactiveSpan: (_cfg: any) => ({ end: jest.fn() }),
  httpIntegration: jest.fn(() => ({})),
  flush: jest.fn(async () => undefined),
  addBreadcrumb: jest.fn(),
  setContext: jest.fn(),
}));
