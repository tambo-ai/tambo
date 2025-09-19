import { PARAMETER_METADATA } from "@tambo-ai-cloud/backend";

/**
 * Represents a single parameter entry in the UI.
 * All values are stored as strings for form inputs, then converted based on type.
 */
export interface ParameterEntry {
  id: string;
  key: string;
  value: string; // Always string for input fields
  type: ParameterType;
}

export type ParameterType = (typeof PARAMETER_SUGGESTIONS)[number]["type"];

export const PARAMETER_SUGGESTIONS = Object.entries(PARAMETER_METADATA).map(
  ([key, { description, uiType }]) => ({
    key,
    description,
    type: uiType,
  }),
);
