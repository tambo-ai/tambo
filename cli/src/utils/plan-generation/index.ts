/**
 * Plan generation orchestrator
 *
 * Sends ProjectAnalysis to Tambo API via client-core, extracts JSON from model response,
 * validates against Zod schema, and returns typed InstallationPlan.
 */

import { createTamboClient, executeRun } from "@tambo-ai/client-core";
import { ZodError } from "zod";
import type { ProjectAnalysis } from "../project-analysis/types.js";
import { extractJsonFromResponse } from "./json-extraction.js";
import { buildPlanPrompt } from "./prompt-builder.js";
import { installationPlanSchema } from "./schemas.js";
import type { InstallationPlan } from "./types.js";

export interface GeneratePlanOptions {
  /** Project analysis output from Phase 2 */
  projectAnalysis: ProjectAnalysis;
  /** Tambo API key */
  apiKey: string;
  /** User key for V1 API authentication */
  userKey?: string;
  /** Optional base URL for API (defaults to production) */
  baseUrl?: string;
  /** Optional progress callback for streaming text deltas */
  onProgress?: (chunk: string) => void;
}

/**
 * Generate an installation plan from project analysis.
 *
 * Orchestrates the full flow:
 * 1. Create Tambo client
 * 2. Create thread for plan generation
 * 3. Build prompt from project analysis
 * 4. Execute run with streaming
 * 5. Extract JSON from response
 * 6. Validate against schema
 * 7. Return typed plan
 *
 * @param options - Plan generation options
 * @returns Promise resolving to validated InstallationPlan
 * @throws Error if JSON extraction fails
 * @throws Error if Zod validation fails
 */
export async function generatePlan(
  options: GeneratePlanOptions,
): Promise<InstallationPlan> {
  // 1. Create Tambo client
  const client = createTamboClient({
    apiKey: options.apiKey,
    userKey: options.userKey ?? "cli",
    ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
  });

  // 2. Create thread for plan generation
  const thread = await client.threads.create({
    metadata: { purpose: "plan-generation" },
  });

  // 3. Build prompt from project analysis
  const prompt = buildPlanPrompt(options.projectAnalysis);

  // 4. Execute run with streaming
  const responseText = await executeRun(client, thread.id, prompt, {
    onEvent: (event: unknown) => {
      // Forward text deltas to onProgress callback
      const data = event as {
        type: string;
        delta?: string;
      };
      if (data.type === "TEXT_MESSAGE_CONTENT" && data.delta) {
        options.onProgress?.(data.delta);
      }
    },
  });

  // 5. Extract JSON from response
  const json = extractJsonFromResponse(responseText);

  // 6. Validate against schema
  try {
    const validatedPlan = installationPlanSchema.parse(json);
    return validatedPlan;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Model returned invalid plan: ${error.message}`);
    }
    throw error;
  }
}

// Re-export types and utilities for consumer convenience
export { buildPlanPrompt, TAMBO_SDK_REFERENCE } from "./prompt-builder.js";
export { installationPlanSchema } from "./schemas.js";
export type {
  ChatWidgetSetup,
  ComponentRecommendation,
  InstallationPlan,
  InteractableRecommendation,
  ProviderSetupRecommendation,
  ToolRecommendation,
} from "./types.js";
