import { homedir, platform, tmpdir } from "os";
import { join } from "path";
import { getTamboPaths, getPathsWithOverrides } from "./xdg";

describe("getTamboPaths", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
    // Clear all TAMBO and XDG vars
    delete process.env.TAMBO_CONFIG_DIR;
    delete process.env.TAMBO_DATA_DIR;
    delete process.env.TAMBO_CACHE_DIR;
    delete process.env.TAMBO_STATE_DIR;
    delete process.env.TAMBO_TEMP_DIR;
    delete process.env.XDG_CONFIG_HOME;
    delete process.env.XDG_DATA_HOME;
    delete process.env.XDG_CACHE_HOME;
    delete process.env.XDG_STATE_HOME;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns platform-appropriate defaults when no env vars set", () => {
    const paths = getTamboPaths();
    const home = homedir();
    const os = platform();

    if (os === "darwin") {
      expect(paths.config).toBe(join(home, "Library", "Preferences", "tambo"));
      expect(paths.data).toBe(
        join(home, "Library", "Application Support", "tambo"),
      );
      expect(paths.cache).toBe(join(home, "Library", "Caches", "tambo"));
    } else if (os === "linux") {
      expect(paths.config).toBe(join(home, ".config", "tambo"));
      expect(paths.data).toBe(join(home, ".local", "share", "tambo"));
      expect(paths.cache).toBe(join(home, ".cache", "tambo"));
    }
    // Windows paths would include AppData

    expect(paths.temp).toBe(join(tmpdir(), "tambo"));
  });

  it("respects XDG_CONFIG_HOME on all platforms", () => {
    process.env.XDG_CONFIG_HOME = "/custom/xdg/config";

    const paths = getTamboPaths();

    expect(paths.config).toBe("/custom/xdg/config/tambo");
  });

  it("respects XDG_DATA_HOME on all platforms", () => {
    process.env.XDG_DATA_HOME = "/custom/xdg/data";

    const paths = getTamboPaths();

    expect(paths.data).toBe("/custom/xdg/data/tambo");
  });

  it("respects XDG_CACHE_HOME on all platforms", () => {
    process.env.XDG_CACHE_HOME = "/custom/xdg/cache";

    const paths = getTamboPaths();

    expect(paths.cache).toBe("/custom/xdg/cache/tambo");
  });

  it("respects XDG_STATE_HOME on all platforms", () => {
    process.env.XDG_STATE_HOME = "/custom/xdg/state";

    const paths = getTamboPaths();

    expect(paths.state).toBe("/custom/xdg/state/tambo");
  });

  it("TAMBO_*_DIR overrides XDG_* vars", () => {
    process.env.XDG_CONFIG_HOME = "/xdg/config";
    process.env.TAMBO_CONFIG_DIR = "/tambo/explicit/config";

    const paths = getTamboPaths();

    expect(paths.config).toBe("/tambo/explicit/config");
  });

  it("TAMBO_TEMP_DIR overrides default temp", () => {
    process.env.TAMBO_TEMP_DIR = "/custom/temp";

    const paths = getTamboPaths();

    expect(paths.temp).toBe("/custom/temp");
  });
});

describe("getPathsWithOverrides", () => {
  it("returns base paths when no overrides provided", () => {
    const base = getTamboPaths();
    const result = getPathsWithOverrides();

    expect(result).toEqual(base);
  });

  it("applies partial overrides", () => {
    const base = getTamboPaths();
    const result = getPathsWithOverrides({
      config: "/override/config",
    });

    expect(result.config).toBe("/override/config");
    expect(result.data).toBe(base.data);
    expect(result.cache).toBe(base.cache);
  });

  it("applies all overrides", () => {
    const result = getPathsWithOverrides({
      config: "/a",
      data: "/b",
      cache: "/c",
      state: "/d",
      temp: "/e",
    });

    expect(result).toEqual({
      config: "/a",
      data: "/b",
      cache: "/c",
      state: "/d",
      temp: "/e",
    });
  });
});
