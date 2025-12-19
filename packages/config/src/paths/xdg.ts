import { homedir, tmpdir, platform } from "os";
import { join } from "path";

const APP_NAME = "tambo";

/**
 * XDG-compliant path resolution that:
 * 1. Respects XDG_* env vars on ALL platforms (including macOS)
 * 2. Falls back to platform-appropriate defaults when XDG not set
 * 3. Allows override via TAMBO_*_DIR env vars
 *
 * Reference: https://specifications.freedesktop.org/basedir/latest/
 */

interface PlatformDefaults {
  config: string;
  data: string;
  cache: string;
  state: string;
}

function getPlatformDefaults(): PlatformDefaults {
  const home = homedir();
  const os = platform();

  if (os === "win32") {
    // Windows: use AppData directories
    const appData = process.env.APPDATA ?? join(home, "AppData", "Roaming");
    const localAppData =
      process.env.LOCALAPPDATA ?? join(home, "AppData", "Local");
    return {
      config: join(appData, APP_NAME, "Config"),
      data: join(appData, APP_NAME, "Data"),
      cache: join(localAppData, APP_NAME, "Cache"),
      state: join(localAppData, APP_NAME, "State"),
    };
  }

  if (os === "darwin") {
    // macOS: use ~/Library paths as fallback (when XDG not set)
    return {
      config: join(home, "Library", "Preferences", APP_NAME),
      data: join(home, "Library", "Application Support", APP_NAME),
      cache: join(home, "Library", "Caches", APP_NAME),
      state: join(home, "Library", "Application Support", APP_NAME, "State"),
    };
  }

  // Linux/Unix: XDG defaults
  return {
    config: join(home, ".config", APP_NAME),
    data: join(home, ".local", "share", APP_NAME),
    cache: join(home, ".cache", APP_NAME),
    state: join(home, ".local", "state", APP_NAME),
  };
}

export interface TamboPaths {
  /** User-level config directory */
  config: string;
  /** User-level data directory (for generated files like auth state) */
  data: string;
  /** Cache directory */
  cache: string;
  /** State/log directory */
  state: string;
  /** Temp directory */
  temp: string;
}

/**
 * Resolve a single path with precedence:
 * 1. TAMBO_*_DIR env var (explicit override)
 * 2. XDG_*_HOME env var (user preference, respected on all platforms)
 * 3. Platform default
 */
function resolvePath(
  tamboEnvVar: string,
  xdgEnvVar: string,
  platformDefault: string,
): string {
  // 1. Explicit Tambo override
  const tamboOverride = process.env[tamboEnvVar];
  if (tamboOverride) {
    return tamboOverride;
  }

  // 2. XDG env var (respected on all platforms, including macOS)
  const xdgValue = process.env[xdgEnvVar];
  if (xdgValue) {
    return join(xdgValue, APP_NAME);
  }

  // 3. Platform default
  return platformDefault;
}

/**
 * Get platform-appropriate paths for Tambo files.
 *
 * Respects XDG_* environment variables on ALL platforms (including macOS).
 * Falls back to platform-appropriate defaults when not set.
 *
 * Can be overridden via:
 * - TAMBO_CONFIG_DIR, TAMBO_DATA_DIR, TAMBO_CACHE_DIR, TAMBO_STATE_DIR, TAMBO_TEMP_DIR
 * - Or via config file (see loadConfig with paths override)
 */
export function getTamboPaths(): TamboPaths {
  const defaults = getPlatformDefaults();

  return {
    config: resolvePath("TAMBO_CONFIG_DIR", "XDG_CONFIG_HOME", defaults.config),
    data: resolvePath("TAMBO_DATA_DIR", "XDG_DATA_HOME", defaults.data),
    cache: resolvePath("TAMBO_CACHE_DIR", "XDG_CACHE_HOME", defaults.cache),
    state: resolvePath("TAMBO_STATE_DIR", "XDG_STATE_HOME", defaults.state),
    temp: process.env.TAMBO_TEMP_DIR ?? join(tmpdir(), APP_NAME),
  };
}

/**
 * Get paths with config-based overrides applied.
 * This is called after config is loaded to apply any path overrides from config files.
 */
export function getPathsWithOverrides(
  overrides?: Partial<TamboPaths>,
): TamboPaths {
  const base = getTamboPaths();
  return {
    config: overrides?.config ?? base.config,
    data: overrides?.data ?? base.data,
    cache: overrides?.cache ?? base.cache,
    state: overrides?.state ?? base.state,
    temp: overrides?.temp ?? base.temp,
  };
}

/**
 * Get the path for a specific file in the config directory.
 */
export function getConfigFilePath(filename: string): string {
  return join(getTamboPaths().config, filename);
}

/**
 * Get the path for auth state storage.
 * Auth tokens go in data dir (not config) as they're generated, not user-configured.
 */
export function getAuthStatePath(): string {
  return join(getTamboPaths().data, "auth.json");
}

/**
 * Get the path for credentials (API keys, tokens).
 * Following clig.dev: secrets stored in files with secure permissions, not env vars.
 */
export function getCredentialsPath(): string {
  return join(getTamboPaths().data, "credentials.json");
}
