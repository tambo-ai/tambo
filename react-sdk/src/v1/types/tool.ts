/**
 * Tool Types for v1 API
 *
 * Defines how client-side tools are registered and executed.
 *
 * TODO: Once @tambo-ai/typescript-sdk/v1 is released, import Tool
 * from the SDK package.
 */

import type { Content } from "./message";

/**
 * Tool registration metadata for the API
 * This is what gets sent to the API in the `available_tools` field
 */
export interface Tool {
  /** Tool name (must be unique) */
  name: string;

  /** Human-readable description for the AI */
  description: string;

  /** JSON Schema describing tool input parameters */
  inputSchema: Record<string, unknown>;
}

/**
 * Tool implementation function
 */
export type ToolFunction<
  TInput extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
> = (input: TInput) => Promise<TOutput> | TOutput;

/**
 * Optional function to transform tool output into content blocks
 * Useful for tools that return rich media (images, audio, etc.)
 */
export type TransformToContent<TOutput = unknown> = (
  result: TOutput,
) => Content[];

/**
 * Tool registration for React SDK
 * Extends Tool with the actual implementation
 */
export interface TamboV1Tool<
  TInput extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
> extends Tool {
  /** The tool implementation */
  tool: ToolFunction<TInput, TOutput>;

  /** Optional: Transform result to content blocks (default: stringifies to text) */
  transformToContent?: TransformToContent<TOutput>;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  /** Tool call ID */
  toolCallId: string;

  /** Tool result content blocks */
  content: Content[];

  /** Whether execution resulted in error */
  isError: boolean;
}
