/**
 * Zod schemas for InstallationPlan validation
 *
 * These schemas define the structure of LLM-generated installation plans
 * and provide runtime validation with TypeScript type inference.
 */

import { z } from "zod";

/**
 * File path validation — rejects natural language descriptions masquerading as paths
 */
const filePathSchema = z
  .string()
  .min(1)
  .refine((val) => !val.includes("(") && !val.includes(")"), {
    message: "filePath must be a real filesystem path, not a description",
  })
  .describe("Relative filesystem path (e.g. app/layout.tsx)");

/**
 * Confidence score validation (0.0 to 1.0)
 */
const confidenceSchema = z
  .number()
  .min(0)
  .max(1)
  .describe("Confidence score between 0.0 and 1.0");

/**
 * Provider setup recommendation schema
 *
 * Specifies where and how to add TamboProvider to the project.
 */
export const providerSetupRecommendationSchema = z
  .object({
    filePath: filePathSchema,
    nestingLevel: z
      .number()
      .int()
      .min(0)
      .describe("How deeply to nest (0=outermost)"),
    rationale: z.string().min(10).describe("Why this location is recommended"),
    confidence: confidenceSchema,
  })
  .strip();

/**
 * Component registration recommendation schema
 *
 * Identifies components that should be registered as AI-controllable.
 */
export const componentRecommendationSchema = z
  .object({
    name: z.string().describe("Component name"),
    filePath: filePathSchema,
    reason: z.string().min(10).describe("Why register this component"),
    confidence: confidenceSchema,
  })
  .strip();

/**
 * Tool creation recommendation schema
 *
 * Identifies functions or API calls that should become Tambo tools.
 */
export const toolRecommendationSchema = z
  .object({
    name: z.string().describe("Tool name"),
    type: z
      .enum(["server-action", "fetch", "axios", "exported-function"])
      .describe("Tool candidate type"),
    filePath: filePathSchema,
    reason: z.string().min(10).describe("Why create this tool"),
    confidence: confidenceSchema,
  })
  .strip();

/**
 * Interactable integration recommendation schema
 *
 * Identifies components that should be enhanced with Tambo interactability.
 */
export const interactableRecommendationSchema = z
  .object({
    componentName: z.string().describe("Target component name"),
    filePath: filePathSchema,
    reason: z.string().min(10).describe("Why make this interactable"),
    confidence: confidenceSchema,
  })
  .strip();

/**
 * Chat widget placement recommendation schema
 *
 * Specifies where to add the chat interface.
 */
export const chatWidgetSetupSchema = z
  .object({
    filePath: filePathSchema,
    position: z
      .enum(["bottom-right", "bottom-left", "top-right", "sidebar"])
      .describe("Widget position"),
    rationale: z.string().min(10).describe("Why this position"),
    confidence: confidenceSchema,
  })
  .strip();

/**
 * Complete installation plan schema
 *
 * Validates the full plan structure with all recommendation categories.
 */
export const installationPlanSchema = z
  .object({
    providerSetup: providerSetupRecommendationSchema,
    componentRecommendations: z.array(componentRecommendationSchema),
    toolRecommendations: z.array(toolRecommendationSchema),
    interactableRecommendations: z.array(interactableRecommendationSchema),
    chatWidgetSetup: chatWidgetSetupSchema,
  })
  .strip();
