// Main exports
export { loadConfig, loadConfigSync, defineConfig } from "./loaders";
export type { LoadConfigOptions } from "./loaders";

// Schema exports
export {
  fullConfigSchema,
  dbConfigSchema,
  cliConfigSchema,
  type FullConfig,
  type DbConfig,
  type CliOnlyConfig,
} from "./schemas";

// Path exports
export { getTamboPaths, getPathsWithOverrides } from "./paths";
export type { TamboPaths } from "./paths";

// State exports
export { isAuthenticated, getCurrentUser, getAccessToken } from "./state";

// Re-export submodules for direct imports
export * from "./schemas";
export * from "./paths";
export * from "./state";
export * from "./loaders";
