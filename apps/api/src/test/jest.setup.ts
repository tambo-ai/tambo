import { Logger } from "@nestjs/common";

// Suppress console output during tests to keep test output clean.
// Tests can still verify console calls via jest.spyOn() assertions.
//
// To see all console output during tests, set JEST_SHOW_LOGS=1:
//   JEST_SHOW_LOGS=1 npm test
//
// To restore output in a specific test:
//   jest.spyOn(console, 'log').mockRestore();

const shouldShowLogs = process.env.JEST_SHOW_LOGS === "1";

// Use beforeEach because jest.config.ts has resetMocks: true, which resets
// spies between tests. Using beforeAll would only suppress output for the
// first test in each file.
beforeEach(() => {
  if (!shouldShowLogs) {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    // Note: console.error is NOT suppressed by default so real errors
    // are visible. This prevents hiding problems that only log rather than throw.
    jest.spyOn(console, "debug").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Suppress NestJS Logger output during tests by disabling the default logger.
// This suppresses [Nest] prefixed log messages.
// Individual tests can still create Logger instances and spy on them if needed.
if (!shouldShowLogs) {
  Logger.overrideLogger(false);
}

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
