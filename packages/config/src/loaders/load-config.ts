import { config as loadDotenv } from "dotenv";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import {
  findConfigFiles,
  type ConfigFileLocation,
} from "../paths/config-files";
import { ENV_VAR_MAPPING } from "./env-mapping";

export interface LoadConfigOptions<T extends z.ZodType> {
  /** Zod schema to validate config against */
  schema: T;
  /** Working directory for local config discovery */
  cwd?: string;
  /** Skip loading from files (env vars only) */
  envOnly?: boolean;
  /** Path to .env file (default: cwd/.env) */
  dotenvPath?: string;
  /** Additional env var mappings */
  extraEnvMapping?: Record<string, string>;
}

/**
 * Load configuration with precedence (right-most wins):
 *
 * defaults < user file < .env < local file < env vars
 *
 * 1. Schema defaults (lowest priority)
 * 2. User config file (~/.config/tambo/tambo.config.*)
 * 3. .env file in working directory
 * 4. Local config file (./tambo.config.*)
 * 5. Environment variables (highest priority)
 */
export async function loadConfig<T extends z.ZodType>(
  options: LoadConfigOptions<T>,
): Promise<z.infer<T>> {
  const {
    schema,
    cwd = process.cwd(),
    envOnly = false,
    dotenvPath,
    extraEnvMapping = {},
  } = options;

  const envMapping = { ...ENV_VAR_MAPPING, ...extraEnvMapping };

  // Start with empty config (schema defaults will be applied during parse)
  let config: Record<string, unknown> = {};

  if (!envOnly) {
    const configFiles = findConfigFiles(cwd);

    // 1. User config (lowest file priority)
    const userConfig = configFiles.find((f) => f.scope === "user");
    if (userConfig) {
      const userConfigData = await loadConfigFile(userConfig);
      config = deepMerge(config, userConfigData);
    }

    // 2. .env file (loaded into process.env, then applied)
    const envFile = dotenvPath ?? join(cwd, ".env");
    if (existsSync(envFile)) {
      loadDotenv({ path: envFile });
    }
    // Apply .env values to config (they're now in process.env)
    config = applyEnvVars(config, envMapping);

    // 3. Local config (higher priority than user config and .env)
    const localConfig = configFiles.find((f) => f.scope === "local");
    if (localConfig) {
      const localConfigData = await loadConfigFile(localConfig);
      config = deepMerge(config, localConfigData);
    }
  }

  // 4. Environment variables (highest priority - applied last)
  // Re-apply to ensure shell env vars override everything
  config = applyEnvVars(config, envMapping);

  return schema.parse(config);
}

/**
 * Synchronous config loading.
 * Note: Does not support TypeScript/JavaScript config files.
 */
export function loadConfigSync<T extends z.ZodType>(
  options: LoadConfigOptions<T>,
): z.infer<T> {
  const {
    schema,
    cwd = process.cwd(),
    envOnly = false,
    dotenvPath,
    extraEnvMapping = {},
  } = options;

  const envMapping = { ...ENV_VAR_MAPPING, ...extraEnvMapping };
  let config: Record<string, unknown> = {};

  if (!envOnly) {
    const configFiles = findConfigFiles(cwd);

    // 1. User config
    const userConfig = configFiles.find((f) => f.scope === "user");
    if (
      userConfig &&
      (userConfig.type === "yaml" || userConfig.type === "json")
    ) {
      config = deepMerge(config, loadConfigFileSync(userConfig));
    }

    // 2. .env file
    const envFile = dotenvPath ?? join(cwd, ".env");
    if (existsSync(envFile)) {
      loadDotenv({ path: envFile });
    }
    config = applyEnvVars(config, envMapping);

    // 3. Local config
    const localConfig = configFiles.find((f) => f.scope === "local");
    if (
      localConfig &&
      (localConfig.type === "yaml" || localConfig.type === "json")
    ) {
      config = deepMerge(config, loadConfigFileSync(localConfig));
    }
  }

  // 4. Environment variables
  config = applyEnvVars(config, envMapping);

  return schema.parse(config);
}

async function loadConfigFile(
  configFile: ConfigFileLocation,
): Promise<Record<string, unknown>> {
  const content = readFileSync(configFile.path, "utf-8");

  switch (configFile.type) {
    case "yaml":
      return parseYaml(content) ?? {};
    case "json":
      return JSON.parse(content);
    case "typescript":
    case "javascript": {
      const module = await import(configFile.path);
      const config = module.default ?? module;
      // Handle defineConfig wrapper
      return typeof config === "function" ? config() : config;
    }
  }
}

function loadConfigFileSync(
  configFile: ConfigFileLocation,
): Record<string, unknown> {
  const content = readFileSync(configFile.path, "utf-8");

  switch (configFile.type) {
    case "yaml":
      return parseYaml(content) ?? {};
    case "json":
      return JSON.parse(content);
    default:
      throw new Error(
        `Synchronous loading not supported for ${configFile.type} config files. Use loadConfig() instead.`,
      );
  }
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== null &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === "object" &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      );
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue;
    }
  }

  return result;
}

function applyEnvVars(
  config: Record<string, unknown>,
  mapping: Record<string, string>,
): Record<string, unknown> {
  const result = deepMerge({}, config);

  for (const [configPath, envVar] of Object.entries(mapping)) {
    const value = process.env[envVar];
    if (value !== undefined && value !== "") {
      setNestedValue(result, configPath, parseEnvValue(value));
    }
  }

  return result;
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (
      !(key in current) ||
      typeof current[key] !== "object" ||
      current[key] === null
    ) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Parse env var value to appropriate type.
 * Handles booleans, numbers, and arrays.
 */
function parseEnvValue(value: string): unknown {
  // Boolean
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;

  // Number
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== "") return num;

  // Comma-separated array
  if (value.includes(",")) {
    return value.split(",").map((s) => s.trim());
  }

  // String
  return value;
}
