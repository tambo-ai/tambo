import type { TamboElicitationRequest } from "@tambo-ai/react/mcp";
import * as React from "react";
import type { FieldSchema } from "./validation";

/**
 * Context value shared among ElicitationUI primitive sub-components.
 */
export interface ElicitationUIContextValue {
  /** The original elicitation request. */
  request: TamboElicitationRequest;
  /** Whether the form is in single-entry mode (auto-submits on selection). */
  isSingleEntry: boolean;
  /** The ordered field entries: [fieldName, fieldSchema]. */
  fields: [string, FieldSchema][];
  /** The required field names. */
  requiredFields: string[];
  /** Current form data keyed by field name. */
  formData: Record<string, unknown>;
  /** Set of field names the user has interacted with. */
  touchedFields: Set<string>;
  /** Whether the entire form passes validation. */
  isValid: boolean;
  /** Change handler for a field value. */
  handleFieldChange: (name: string, value: unknown) => void;
  /** Change handler for single-entry mode (submits immediately). */
  handleSingleEntryChange: (name: string, value: unknown) => void;
  /** Submit handler (accept with current form data). */
  handleAccept: () => void;
  /** Decline handler. */
  handleDecline: () => void;
  /** Cancel handler. */
  handleCancel: () => void;
}

const ElicitationUIContext =
  React.createContext<ElicitationUIContextValue | null>(null);

/**
 * Hook to access the elicitation UI context.
 * @internal This hook is for internal use by base components only.
 * @returns The elicitation UI context value
 * @throws Error if used outside of ElicitationUI.Root component
 */
function useElicitationUIContext(): ElicitationUIContextValue {
  const context = React.useContext(ElicitationUIContext);
  if (!context) {
    throw new Error(
      "React UI Base: ElicitationUIContext is missing. ElicitationUI parts must be used within <ElicitationUI.Root>",
    );
  }
  return context;
}

export { ElicitationUIContext, useElicitationUIContext };
