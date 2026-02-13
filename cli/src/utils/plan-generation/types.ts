/**
 * Core types for installation plan generation
 *
 * Types are inferred from Zod schemas to ensure runtime validation
 * matches TypeScript type checking.
 */

import type { z } from "zod";
import type {
  providerSetupRecommendationSchema,
  componentRecommendationSchema,
  toolRecommendationSchema,
  interactableRecommendationSchema,
  chatWidgetSetupSchema,
  installationPlanSchema,
} from "./schemas.js";

/** Provider setup recommendation */
export type ProviderSetupRecommendation = z.infer<
  typeof providerSetupRecommendationSchema
>;

/** Component registration recommendation */
export type ComponentRecommendation = z.infer<
  typeof componentRecommendationSchema
>;

/** Tool creation recommendation */
export type ToolRecommendation = z.infer<typeof toolRecommendationSchema>;

/** Interactable integration recommendation */
export type InteractableRecommendation = z.infer<
  typeof interactableRecommendationSchema
>;

/** Chat widget placement recommendation */
export type ChatWidgetSetup = z.infer<typeof chatWidgetSetupSchema>;

/** Complete installation plan with all recommendation categories */
export type InstallationPlan = z.infer<typeof installationPlanSchema>;
