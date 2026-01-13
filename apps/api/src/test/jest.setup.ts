// Suppress console output during tests to keep test output clean.
// Tests can still verify console calls via jest.spyOn() assertions.
// To see console output in a specific test, use:
//   jest.spyOn(console, 'log').mockRestore();
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "debug").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Suppress NestJS Logger output during tests by disabling the default logger.
// This runs before each test file and suppresses [Nest] prefixed log messages.
// Individual tests can still create Logger instances and spy on them if needed.
import { Logger } from "@nestjs/common";
Logger.overrideLogger(false);

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
