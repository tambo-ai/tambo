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
const mockReaddirSync = jest.fn<(path: string) => string[]>();
const mockStatSync = jest.fn();
const mockUnlinkSync = jest.fn();

jest.unstable_mockModule("node:fs", () => ({
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  readdirSync: mockReaddirSync,
  statSync: mockStatSync,
  unlinkSync: mockUnlinkSync,
}));

// Mock node:child_process
const mockSpawn = jest.fn();
jest.unstable_mockModule("node:child_process", () => ({
  spawn: mockSpawn,
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

// Mock token-storage (imported by telemetry for identity tracking)
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

let telemetry: {
  readonly EVENTS: Record<string, EventName>;
  readonly isTelemetryDisabled: () => boolean;
  readonly initTelemetry: (version: string) => void;
  readonly trackEvent: (
    event: EventName,
    properties?: Record<string, unknown>,
  ) => void;
  readonly flushDetached: () => void;
};

beforeAll(async () => {
  telemetry = await import("./telemetry.js");
});

/** Find the _events_ temp file written by flushDetached and parse its JSON. */
interface WrittenEventPayload {
  posthogHost: string;
  posthogApiKey: string;
  batch: {
    event: string;
    distinct_id: string;
    properties: Record<string, unknown>;
    timestamp: string;
  }[];
}

function getWrittenEventPayload(): WrittenEventPayload {
  const call = mockWriteFileSync.mock.calls.find(
    (c) => typeof c[0] === "string" && c[0].includes("_events_"),
  );
  if (!call) throw new Error("No _events_ file was written");
  return JSON.parse(call[1] as string) as WrittenEventPayload;
}

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
      mockReaddirSync.mockReturnValue([]);

      telemetry.initTelemetry("1.0.0");

      // Should write the state file with anonymousId
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
      mockReaddirSync.mockReturnValue([]);

      telemetry.initTelemetry("1.0.0");

      // Should read but not write since noticeShown is already true
      expect(mockReadFileSync).toHaveBeenCalledWith(
        "/mock/data/dir/telemetry.json",
        "utf-8",
      );
    });

    it("shows telemetry notice on first run", () => {
      const stderrSpy = jest
        .spyOn(process.stderr, "write")
        .mockReturnValue(true);

      mockExistsSync.mockImplementation((path: string) => {
        // State file doesn't exist, data dir does for cleanup
        if (path === "/mock/data/dir/telemetry.json") return false;
        return path === "/mock/data/dir";
      });
      mockReaddirSync.mockReturnValue([]);

      telemetry.initTelemetry("1.0.0");

      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining("Tambo collects anonymous CLI usage data"),
      );

      stderrSpy.mockRestore();
    });
  });

  // Tests below rely on module-level state set by initTelemetry above.
  // Jest runs tests sequentially within a file, so initTelemetry has
  // already enabled tracking with a known anonymousId.

  describe("trackEvent + flushDetached lifecycle", () => {
    it("queues an event via trackEvent", () => {
      // After initTelemetry ran above, tracking is enabled
      mockExistsSync.mockReturnValue(true);
      mockLoadToken.mockReturnValue(null);
      mockSpawn.mockReturnValue({ unref: jest.fn() });

      telemetry.trackEvent(telemetry.EVENTS.COMMAND_COMPLETED, {
        command: "test",
        duration_ms: 42,
      });

      // Flush to verify the event was queued
      telemetry.flushDetached();

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("_events_"),
        expect.stringContaining("cli.command.completed"),
        expect.objectContaining({ mode: 0o600 }),
      );
    });

    it("spawns a detached child process on flush", () => {
      mockExistsSync.mockReturnValue(true);
      mockLoadToken.mockReturnValue(null);
      const mockUnref = jest.fn();
      mockSpawn.mockReturnValue({ unref: mockUnref });

      telemetry.trackEvent(telemetry.EVENTS.AUTH_LOGIN);
      telemetry.flushDetached();

      expect(mockSpawn).toHaveBeenCalledWith(
        process.execPath,
        expect.arrayContaining([expect.stringContaining("telemetry-flush.js")]),
        expect.objectContaining({ detached: true, stdio: "ignore" }),
      );
      expect(mockUnref).toHaveBeenCalled();
    });

    it("uses userId as distinct_id when auth token is available", () => {
      mockExistsSync.mockReturnValue(true);
      mockLoadToken.mockReturnValue({
        sessionToken: "test",
        expiresAt: "2099-01-01T00:00:00Z",
        storedAt: new Date().toISOString(),
        user: { id: "user_123", email: "test@example.com", name: "Test" },
      });
      mockSpawn.mockReturnValue({ unref: jest.fn() });

      telemetry.trackEvent(telemetry.EVENTS.COMPONENT_ADDED, {
        component_name: "chat",
      });
      telemetry.flushDetached();

      const parsed = getWrittenEventPayload();
      expect(parsed.batch[0].distinct_id).toBe("user_123");
      expect(parsed.batch[0].properties.$anon_distinct_id).toBeDefined();
    });

    it("uses anonymousId as distinct_id when no auth token", () => {
      mockExistsSync.mockReturnValue(true);
      mockLoadToken.mockReturnValue(null);
      mockSpawn.mockReturnValue({ unref: jest.fn() });

      telemetry.trackEvent(telemetry.EVENTS.AUTH_LOGOUT);
      telemetry.flushDetached();

      const parsed = getWrittenEventPayload();
      expect(parsed.batch[0].distinct_id).toBeDefined();
      expect(parsed.batch[0].properties.$anon_distinct_id).toBeUndefined();
    });

    it("uses custom telemetry host from env when set", () => {
      process.env.TAMBO_TELEMETRY_HOST = "https://custom-host.example.com";
      mockExistsSync.mockReturnValue(true);
      mockLoadToken.mockReturnValue(null);
      mockSpawn.mockReturnValue({ unref: jest.fn() });

      telemetry.trackEvent(telemetry.EVENTS.COMMAND_COMPLETED, {
        command: "list",
      });
      telemetry.flushDetached();

      const parsed = getWrittenEventPayload();
      expect(parsed.posthogHost).toBe("https://custom-host.example.com");
    });
  });
});
