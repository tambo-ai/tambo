/**
 * Zod schemas for InstallationPlan validation
 *
 * These schemas define the structure of LLM-generated installation plans
 * and provide runtime validation with TypeScript type inference.
 */

import { z } from "zod";

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
    filePath: z.string().describe("Absolute path to layout file"),
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
    filePath: z.string().describe("Absolute path to component file"),
    reason: z.string().min(10).describe("Why register this component"),
    confidence: confidenceSchema,
    suggestedRegistration: z
      .string()
      .describe("Suggested registration code snippet"),
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
    filePath: z.string().describe("Absolute path to source function"),
    reason: z.string().min(10).describe("Why create this tool"),
    confidence: confidenceSchema,
    suggestedSchema: z.string().describe("Suggested Zod schema for tool input"),
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
    filePath: z.string().describe("Absolute path to component"),
    reason: z.string().min(10).describe("Why make this interactable"),
    confidence: confidenceSchema,
    integrationPattern: z.string().describe("How to integrate interactability"),
  })
  .strip();

/**
 * Chat widget placement recommendation schema
 *
 * Specifies where to add the chat interface.
 */
export const chatWidgetSetupSchema = z
  .object({
    filePath: z.string().describe("Where to add chat widget"),
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
