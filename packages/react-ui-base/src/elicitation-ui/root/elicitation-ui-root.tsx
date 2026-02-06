import { Slot } from "@radix-ui/react-slot";
import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { ElicitationUIContext } from "./elicitation-ui-context";
import { isSingleEntryMode, validateField } from "./validation";

export type ElicitationUIRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** The active elicitation request from the MCP server. */
    request: TamboElicitationRequest;
    /** Callback fired when the user accepts, declines, or cancels. */
    onResponse: (response: TamboElicitationResponse) => void;
  }
>;

/**
 * Root primitive for the elicitation UI component.
 * Provides context with form state, validation, and handlers for child components.
 * @returns A context-providing wrapper element for elicitation sub-components
 */
export const ElicitationUIRoot = React.forwardRef<
  HTMLDivElement,
  ElicitationUIRootProps
>(function ElicitationUIRoot(
  { children, request, onResponse, asChild, ...props },
  ref,
) {
  const singleEntry = isSingleEntryMode(request);

  const fields = React.useMemo(
    () => Object.entries(request.requestedSchema.properties),
    [request.requestedSchema.properties],
  );

  const requiredFields = React.useMemo(
    () => request.requestedSchema.required ?? [],
    [request.requestedSchema.required],
  );

  const [formData, setFormData] = React.useState<Record<string, unknown>>(
    () => {
      const initial: Record<string, unknown> = {};
      fields.forEach(([name, schema]) => {
        if (schema.default !== undefined) {
          initial[name] = schema.default;
        }
      });
      return initial;
    },
  );

  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(
    new Set(),
  );

  const isValid = fields.every(([fieldName, fieldSchema]) => {
    const value = formData[fieldName];
    const isRequired = requiredFields.includes(fieldName);
    return validateField(value, fieldSchema, isRequired).valid;
  });

  const handleFieldChange = React.useCallback(
    (name: string, value: unknown) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setTouchedFields((prev) => new Set(prev).add(name));
    },
    [],
  );

  const handleSingleEntryChange = React.useCallback(
    (name: string, value: unknown) => {
      const updatedData = { ...formData, [name]: value };
      setFormData(updatedData);
      setTouchedFields((prev) => new Set(prev).add(name));
      onResponse({ action: "accept", content: updatedData });
    },
    [formData, onResponse],
  );

  const handleAccept = React.useCallback(() => {
    if (!isValid) {
      setTouchedFields(new Set(fields.map(([name]) => name)));
      return;
    }
    onResponse({ action: "accept", content: formData });
  }, [isValid, fields, formData, onResponse]);

  const handleDecline = React.useCallback(() => {
    onResponse({ action: "decline" });
  }, [onResponse]);

  const handleCancel = React.useCallback(() => {
    onResponse({ action: "cancel" });
  }, [onResponse]);

  const contextValue = React.useMemo(
    () => ({
      request,
      isSingleEntry: singleEntry,
      fields,
      requiredFields,
      formData,
      touchedFields,
      isValid,
      handleFieldChange,
      handleSingleEntryChange,
      handleAccept,
      handleDecline,
      handleCancel,
    }),
    [
      request,
      singleEntry,
      fields,
      requiredFields,
      formData,
      touchedFields,
      isValid,
      handleFieldChange,
      handleSingleEntryChange,
      handleAccept,
      handleDecline,
      handleCancel,
    ],
  );

  const Comp = asChild ? Slot : "div";

  return (
    <ElicitationUIContext.Provider value={contextValue}>
      <Comp
        ref={ref}
        data-slot="elicitation-ui-root"
        data-single-entry={singleEntry || undefined}
        {...props}
      >
        {children}
      </Comp>
    </ElicitationUIContext.Provider>
  );
});
ElicitationUIRoot.displayName = "ElicitationUI.Root";
