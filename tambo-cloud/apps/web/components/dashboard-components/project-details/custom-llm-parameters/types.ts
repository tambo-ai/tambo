import {
  JSONValue,
  LlmParameterUIType,
  PARAMETER_METADATA,
} from "@tambo-ai-cloud/core";
/**
 * Represents a single parameter entry in the UI.
 * All values are stored as strings for form inputs, then converted based on type.
 */
export interface ParameterEntry {
  id: string;
  key: string;
  value: string; // Always string for input fields
  type: LlmParameterUIType;
  example?: JSONValue;
}

export const PARAMETER_SUGGESTIONS = Object.entries(PARAMETER_METADATA).map(
  ([key, { description, uiType, example }]) => ({
    key,
    description,
    type: uiType,
    example,
  }),
);
