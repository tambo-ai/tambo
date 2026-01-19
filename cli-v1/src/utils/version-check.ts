import fs from "fs";
import path from "path";

import envPaths from "env-paths";
import semver from "semver";

import { out } from "./output.js";
import { isTTY } from "./tty.js";

interface VersionCache {
  checkedAt: string;
  latestVersion: string;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_FILE = "version-check.json";

function shouldNotify(): boolean {
  if (!isTTY()) {
    return false;
  }

  return !process.argv.includes("--json");
}

function getCachePath(): string {
  const paths = envPaths("tambov1");
  return path.join(paths.cache, CACHE_FILE);
}

function readCache(cachePath: string): VersionCache | null {
  if (!fs.existsSync(cachePath)) {
    return null;
  }

  try {
    const payload = JSON.parse(fs.readFileSync(cachePath, "utf-8")) as VersionCache;
    if (!payload.checkedAt || !payload.latestVersion) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function writeCache(cachePath: string, payload: VersionCache): void {
  const cacheDir = path.dirname(cachePath);
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2));
}

function warnIfOutdated(latestVersion: string): void {
  const currentVersion = getCurrentVersion();
  if (semver.gte(currentVersion, latestVersion)) {
    return;
  }

  out.warning(
    `A newer version of tambov1 is available (${latestVersion} > ${currentVersion}).`
  );
  out.info("To upgrade, run: npx tambov1@latest");
}

export async function checkLatestVersion(): Promise<void> {
  if (!shouldNotify()) {
    return;
  }

  const cachePath = getCachePath();
  const cached = readCache(cachePath);

  if (cached) {
    const ageMs = Date.now() - new Date(cached.checkedAt).getTime();
    if (ageMs < CACHE_TTL_MS) {
      warnIfOutdated(cached.latestVersion);
      return;
    }
  }

  try {
    const response = await fetch("https://registry.npmjs.org/tambov1/latest");
    const data = (await response.json()) as { version?: string };
    const latestVersion = data.version;

    if (!latestVersion) {
      return;
    }

    writeCache(cachePath, { checkedAt: new Date().toISOString(), latestVersion });
    warnIfOutdated(latestVersion);
  } catch {
    // Best-effort check; ignore network/cache failures.
  }
}

function getCurrentVersion(): string {
  const packageJsonPath = new URL("../../package.json", import.meta.url);
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as {
    version?: string;
  };
  if (!packageJson.version) {
    throw new Error("tambov1 package.json missing version");
  }
  return packageJson.version;
}
