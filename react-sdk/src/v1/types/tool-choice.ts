/**
 * Tool choice type matching the V1 API format.
 * Controls how the model selects tools during generation.
 */
export type ToolChoice =
  | "auto" // Model decides (default)
  | "required" // Must use at least one tool
  | "none" // Cannot use tools
  | { name: string }; // Must use specific tool
