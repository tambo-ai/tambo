import type TamboAI from "@tambo-ai/typescript-sdk";

/**
 * Converts tool call parameters from an array format to an object format.
 * Maps each parameter's name to its value for easier consumption.
 * @param parameters - Array of tool call parameters
 * @returns Object with parameter names as keys and values as values
 */
export function keyifyParameters(
  parameters: TamboAI.ToolCallParameter[] | undefined,
): Record<string, unknown> | undefined {
  if (!parameters) return;
  return Object.fromEntries(
    parameters.map((p) => [p.parameterName, p.parameterValue]),
  );
}
