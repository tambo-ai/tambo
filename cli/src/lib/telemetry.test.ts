import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { EventName } from "./telemetry.js";

// Mock node:fs
const mockExistsSync = jest.fn<(path: string) => boolean>();
const mockMkdirSync = jest.fn();
const mockReadFileSync = jest.fn<(path: string, encoding: string) => string>();
const mockWriteFileSync = jest.fn();

jest.unstable_mockModule("node:fs", () => ({
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
}));

// Mock node:crypto
const MOCK_UUID = "550e8400-e29b-41d4-a716-446655440000";
jest.unstable_mockModule("node:crypto", () => ({
  randomUUID: () => MOCK_UUID,
}));

// Mock paths
jest.unstable_mockModule("./paths.js", () => ({
  getDir: () => "/mock/data/dir",
}));

// Mock token-storage
const mockLoadToken = jest.fn<
  () => {
    sessionToken: string;
    expiresAt: string;
    storedAt: string;
    user: { id: string; email: string | null; name: string | null };
  } | null
>();
jest.unstable_mockModule("./token-storage.js", () => ({
  loadToken: mockLoadToken,
}));

// Mock posthog-node — use a class so `new PostHog(...)` works correctly
const mockCapture = jest.fn();
const mockShutdown = jest
  .fn<() => Promise<void>>()
  .mockResolvedValue(undefined);
const mockPostHogConstructor = jest.fn();

jest.unstable_mockModule("posthog-node", () => ({
  PostHog: class MockPostHog {
    capture = mockCapture;
    shutdown = mockShutdown;
    constructor(...args: unknown[]) {
      mockPostHogConstructor(...args);
    }
  },
}));

let telemetry: {
  readonly EVENTS: Record<string, EventName>;
  readonly isTelemetryDisabled: () => boolean;
  readonly initTelemetry: (version: string) => void;
  readonly trackEvent: (
    event: EventName,
    properties?: Record<string, unknown>,
  ) => void;
  readonly shutdownTelemetry: () => Promise<void>;
};

beforeAll(async () => {
  telemetry = await import("./telemetry.js");
});

describe("telemetry", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    delete process.env.TAMBO_TELEMETRY_DISABLED;
    delete process.env.DO_NOT_TRACK;
    delete process.env.CI;
    delete process.env.TAMBO_TELEMETRY_HOST;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isTelemetryDisabled", () => {
    it("returns false when no env vars are set", () => {
      expect(telemetry.isTelemetryDisabled()).toBe(false);
    });

    it("returns true when TAMBO_TELEMETRY_DISABLED is set", () => {
      process.env.TAMBO_TELEMETRY_DISABLED = "1";
      expect(telemetry.isTelemetryDisabled()).toBe(true);
    });

    it("returns true when DO_NOT_TRACK is set", () => {
      process.env.DO_NOT_TRACK = "1";
      expect(telemetry.isTelemetryDisabled()).toBe(true);
    });

    it("returns false when TAMBO_TELEMETRY_DISABLED is '0'", () => {
      process.env.TAMBO_TELEMETRY_DISABLED = "0";
      expect(telemetry.isTelemetryDisabled()).toBe(false);
    });

    it("returns false when DO_NOT_TRACK is '0'", () => {
      process.env.DO_NOT_TRACK = "0";
      expect(telemetry.isTelemetryDisabled()).toBe(false);
    });
  });

  describe("initTelemetry", () => {
    it("skips init when telemetry is disabled", () => {
      process.env.TAMBO_TELEMETRY_DISABLED = "1";
      telemetry.initTelemetry("1.0.0");
      expect(mockExistsSync).not.toHaveBeenCalled();
    });

    it("creates a new state file on first run", () => {
      mockExistsSync.mockReturnValue(false);

      telemetry.initTelemetry("1.0.0");

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/mock/data/dir/telemetry.json",
        expect.stringContaining(MOCK_UUID),
        expect.objectContaining({ encoding: "utf-8" }),
      );
    });

    it("loads existing state without rewriting", () => {
      const existingState = JSON.stringify({
        anonymousId: "existing-uuid-1234",
        noticeShown: true,
      });

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(existingState);

      telemetry.initTelemetry("1.0.0");

      expect(mockReadFileSync).toHaveBeenCalledWith(
        "/mock/data/dir/telemetry.json",
        "utf-8",
      );
    });

    it("shows telemetry notice on first run", () => {
      const stderrSpy = jest
        .spyOn(process.stderr, "write")
        .mockReturnValue(true);

      mockExistsSync.mockReturnValue(false);

      telemetry.initTelemetry("1.0.0");

      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining("Tambo collects anonymous CLI usage data"),
      );

      stderrSpy.mockRestore();
    });

    it("creates PostHog client with correct config", () => {
      mockExistsSync.mockReturnValue(false);
      mockPostHogConstructor.mockClear();

      telemetry.initTelemetry("1.0.0");

      expect(mockPostHogConstructor).toHaveBeenCalledWith(
        "phc_MxSdt6nYWc9GZulDDw1LNTfvIIjGLbN3XW0vsBcvGgY",
        expect.objectContaining({
          host: "https://us.i.posthog.com",
          flushAt: 1,
          flushInterval: 0,
        }),
      );
    });

    it("uses custom telemetry host from env", () => {
      process.env.TAMBO_TELEMETRY_HOST = "https://custom-host.example.com";
      mockExistsSync.mockReturnValue(false);
      mockPostHogConstructor.mockClear();

      telemetry.initTelemetry("1.0.0");

      expect(mockPostHogConstructor).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          host: "https://custom-host.example.com",
        }),
      );
    });
  });

  describe("trackEvent", () => {
    beforeEach(() => {
      // Ensure telemetry is initialized before each trackEvent test
      const existingState = JSON.stringify({
        anonymousId: MOCK_UUID,
        noticeShown: true,
      });
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(existingState);
      telemetry.initTelemetry("1.0.0");
      mockCapture.mockClear();
    });

    it("calls capture with correct event and properties", () => {
      mockLoadToken.mockReturnValue(null);

      telemetry.trackEvent(telemetry.EVENTS.COMMAND_COMPLETED, {
        command: "test",
        duration_ms: 42,
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "cli.command.completed",
          properties: expect.objectContaining({
            command: "test",
            duration_ms: 42,
            source: "cli",
          }),
        }),
      );
    });

    it("uses userId as distinctId when auth token is available", () => {
      mockLoadToken.mockReturnValue({
        sessionToken: "test",
        expiresAt: "2099-01-01T00:00:00Z",
        storedAt: new Date().toISOString(),
        user: { id: "user_123", email: "test@example.com", name: "Test" },
      });

      telemetry.trackEvent(telemetry.EVENTS.COMPONENT_ADDED, {
        component_name: "chat",
      });

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          distinctId: "user_123",
          properties: expect.objectContaining({
            $anon_distinct_id: MOCK_UUID,
          }),
        }),
      );
    });

    it("uses anonymousId as distinctId when no auth token", () => {
      mockLoadToken.mockReturnValue(null);

      telemetry.trackEvent(telemetry.EVENTS.AUTH_LOGOUT);

      expect(mockCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          distinctId: MOCK_UUID,
        }),
      );

      const captureArg = mockCapture.mock.calls[0]?.[0] as
        | Record<string, unknown>
        | undefined;
      const properties = captureArg?.properties as
        | Record<string, unknown>
        | undefined;
      expect(properties?.$anon_distinct_id).toBeUndefined();
    });
  });

  describe("shutdownTelemetry", () => {
    it("calls shutdown on the PostHog client", async () => {
      // Ensure client is initialized
      const existingState = JSON.stringify({
        anonymousId: MOCK_UUID,
        noticeShown: true,
      });
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(existingState);
      telemetry.initTelemetry("1.0.0");
      mockShutdown.mockClear();

      await telemetry.shutdownTelemetry();

      expect(mockShutdown).toHaveBeenCalled();
    });

    it("resets module state so trackEvent is a no-op after shutdown", async () => {
      const existingState = JSON.stringify({
        anonymousId: MOCK_UUID,
        noticeShown: true,
      });
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(existingState);
      telemetry.initTelemetry("1.0.0");

      await telemetry.shutdownTelemetry();
      mockCapture.mockClear();

      telemetry.trackEvent(telemetry.EVENTS.COMMAND_COMPLETED, {
        command: "test",
      });

      expect(mockCapture).not.toHaveBeenCalled();
    });
  });
});
