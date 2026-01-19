import {
  describe,
  expect,
  it,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

const mockExistsSync = jest.fn<(p: unknown) => boolean>();
const mockMkdirSync = jest.fn();
const mockReadFileSync = jest.fn<(p: unknown, opts?: unknown) => string>();
const mockWriteFileSync = jest.fn();
const mockChmodSync = jest.fn();
const mockUnlinkSync = jest.fn();

const mockEnvPaths = jest.fn(() => ({
  data: "/mock/data/path",
  config: "/mock/config/path",
  cache: "/mock/cache/path",
}));

jest.unstable_mockModule("fs", () => ({
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  chmodSync: mockChmodSync,
  unlinkSync: mockUnlinkSync,
}));

jest.unstable_mockModule("env-paths", () => ({
  default: mockEnvPaths,
}));

// Suppress console output
const mockConsoleWarn = jest.fn();
const originalConsoleWarn = console.warn;

const {
  saveToken,
  loadToken,
  isTokenValid,
  getSessionToken,
  getCurrentUser,
  clearToken,
  hasStoredToken,
  getTokenStoragePath,
  setInMemoryToken,
  getEffectiveSessionToken,
} = await import("./token-storage.js");

describe("token-storage", () => {
  const validToken = {
    sessionToken: "test-token-123",
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    user: {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    },
    storedAt: new Date().toISOString(),
  };

  const expiredToken = {
    ...validToken,
    expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.warn = mockConsoleWarn;
    // Reset in-memory token
    setInMemoryToken(null);
    // Clear env var
    delete process.env.TAMBO_TOKEN;
    delete process.env.XDG_DATA_HOME;
    delete process.env.XDG_CONFIG_HOME;
    delete process.env.XDG_CACHE_HOME;
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
  });

  describe("saveToken", () => {
    it("creates data directory if it does not exist", async () => {
      mockExistsSync.mockReturnValue(false);

      await saveToken(validToken);

      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ recursive: true, mode: 0o700 }),
      );
    });

    it("writes token to file with correct permissions", async () => {
      mockExistsSync.mockReturnValue(true);

      await saveToken(validToken);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("auth.json"),
        expect.stringContaining(validToken.sessionToken),
        expect.objectContaining({ encoding: "utf-8", mode: 0o600 }),
      );
    });

    it("sets strict permissions on unix systems", async () => {
      mockExistsSync.mockReturnValue(true);
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", { value: "darwin" });

      await saveToken(validToken);

      expect(mockChmodSync).toHaveBeenCalledWith(
        expect.stringContaining("auth.json"),
        0o600,
      );

      Object.defineProperty(process, "platform", { value: originalPlatform });
    });

    it("skips chmod on Windows", async () => {
      mockExistsSync.mockReturnValue(true);
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", { value: "win32" });

      await saveToken(validToken);

      expect(mockChmodSync).not.toHaveBeenCalled();

      Object.defineProperty(process, "platform", { value: originalPlatform });
    });
  });

  describe("loadToken", () => {
    it("returns null when token file does not exist", () => {
      mockExistsSync.mockReturnValue(false);

      const result = loadToken();

      expect(result).toBeNull();
    });

    it("returns token when file exists and is valid", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(validToken));

      const result = loadToken();

      expect(result).toEqual(validToken);
    });

    it("returns null and warns for invalid JSON", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("invalid json {");

      const result = loadToken();

      expect(result).toBeNull();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("Could not read auth token file"),
      );
    });

    it("returns null and warns for missing sessionToken", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          expiresAt: validToken.expiresAt,
          user: validToken.user,
        }),
      );

      const result = loadToken();

      expect(result).toBeNull();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("invalid format"),
      );
    });

    it("returns null and warns for missing user", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          sessionToken: "token",
          expiresAt: validToken.expiresAt,
        }),
      );

      const result = loadToken();

      expect(result).toBeNull();
    });

    it("handles read errors gracefully", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new Error("Read error");
      });

      const result = loadToken();

      expect(result).toBeNull();
      expect(mockConsoleWarn).toHaveBeenCalled();
    });
  });

  describe("isTokenValid", () => {
    it("returns false when no token exists", () => {
      mockExistsSync.mockReturnValue(false);

      expect(isTokenValid()).toBe(false);
    });

    it("returns true for valid non-expired token", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(validToken));

      expect(isTokenValid()).toBe(true);
    });

    it("returns false for expired token", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(expiredToken));

      expect(isTokenValid()).toBe(false);
    });

    it("returns false for token without user id", () => {
      mockExistsSync.mockReturnValue(true);
      const tokenWithoutId = {
        ...validToken,
        user: { id: "", email: "test@example.com", name: "Test" },
      };
      mockReadFileSync.mockReturnValue(JSON.stringify(tokenWithoutId));

      expect(isTokenValid()).toBe(false);
    });
  });

  describe("getSessionToken", () => {
    it("returns null when no token exists", () => {
      mockExistsSync.mockReturnValue(false);

      expect(getSessionToken()).toBeNull();
    });

    it("returns token string for valid non-expired token", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(validToken));

      expect(getSessionToken()).toBe(validToken.sessionToken);
    });

    it("returns null for expired token", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(expiredToken));

      expect(getSessionToken()).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("returns null when no valid token", () => {
      mockExistsSync.mockReturnValue(false);

      expect(getCurrentUser()).toBeNull();
    });

    it("returns user info for valid token", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(validToken));

      const user = getCurrentUser();

      expect(user).toEqual(validToken.user);
    });

    it("returns null for expired token", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(expiredToken));

      expect(getCurrentUser()).toBeNull();
    });
  });

  describe("clearToken", () => {
    it("deletes token file when it exists", () => {
      mockExistsSync.mockReturnValue(true);

      clearToken();

      expect(mockUnlinkSync).toHaveBeenCalledWith(
        expect.stringContaining("auth.json"),
      );
    });

    it("does nothing when token file does not exist", () => {
      mockExistsSync.mockReturnValue(false);

      clearToken();

      expect(mockUnlinkSync).not.toHaveBeenCalled();
    });
  });

  describe("hasStoredToken", () => {
    it("returns true when token file exists", () => {
      mockExistsSync.mockReturnValue(true);

      expect(hasStoredToken()).toBe(true);
    });

    it("returns false when token file does not exist", () => {
      mockExistsSync.mockReturnValue(false);

      expect(hasStoredToken()).toBe(false);
    });
  });

  describe("getTokenStoragePath", () => {
    it("returns path to auth file", () => {
      const path = getTokenStoragePath();

      expect(path).toContain("auth.json");
    });
  });

  describe("in-memory token", () => {
    it("setInMemoryToken sets the in-memory token", () => {
      setInMemoryToken("memory-token");

      expect(getEffectiveSessionToken()).toBe("memory-token");
    });

    it("setInMemoryToken can clear the token", () => {
      setInMemoryToken("memory-token");
      setInMemoryToken(null);
      mockExistsSync.mockReturnValue(false);

      expect(getEffectiveSessionToken()).toBeNull();
    });
  });

  describe("getEffectiveSessionToken", () => {
    it("returns TAMBO_TOKEN env var when set", () => {
      process.env.TAMBO_TOKEN = "env-token";

      expect(getEffectiveSessionToken()).toBe("env-token");
    });

    it("returns in-memory token when set and no env var", () => {
      setInMemoryToken("memory-token");

      expect(getEffectiveSessionToken()).toBe("memory-token");
    });

    it("returns disk token when no env var or memory token", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(validToken));

      expect(getEffectiveSessionToken()).toBe(validToken.sessionToken);
    });

    it("prioritizes env var over memory token", () => {
      process.env.TAMBO_TOKEN = "env-token";
      setInMemoryToken("memory-token");

      expect(getEffectiveSessionToken()).toBe("env-token");
    });

    it("prioritizes memory token over disk token", () => {
      setInMemoryToken("memory-token");
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(validToken));

      expect(getEffectiveSessionToken()).toBe("memory-token");
    });
  });

  describe("XDG paths", () => {
    it("uses XDG_DATA_HOME when set", () => {
      process.env.XDG_DATA_HOME = "/custom/data";
      mockExistsSync.mockReturnValue(false);

      const path = getTokenStoragePath();

      expect(path).toContain("/custom/data");
    });
  });
});
