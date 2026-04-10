import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { SettingsRow } from "@/components/ui/settings-row";
import { JSONValue, LlmParameterUIType } from "@tambo-ai-cloud/core";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { ParameterRow } from "./parameter-row";
import { ParameterSuggestions } from "./parameter-suggestions";
import { PARAMETER_SUGGESTIONS, type ParameterEntry } from "./types";

/**
 *
 * This file contains the components for the custom LLM parameters editor.
 * It includes the ViewMode and EditMode components, which are used to display
 * and edit the LLM parameters respectively.
 *
 */

/**
 * ViewMode Component
 *
 * Read-only display mode for LLM parameters. Shows parameters in a clean,
 * formatted layout with loading states and empty state handling.
 */
interface ViewModeProps {
  parameters: ParameterEntry[];
  onEdit: () => void;
  isLoading?: boolean;
}

export function ViewMode({ parameters, onEdit, isLoading }: ViewModeProps) {
  const description =
    parameters.length > 0
      ? `${parameters.length} parameter${parameters.length === 1 ? "" : "s"} configured.`
      : "Custom parameters sent with each LLM request.";

  return (
    <SettingsRow label="Custom LLM parameters" description={description}>
      <Button variant="outline" size="sm" onClick={onEdit}>
        Edit
      </Button>
    </SettingsRow>
  );
}

/**
 * EditMode Component
 *
 * Interactive editing interface for managing LLM parameters. Provides full CRUD
 * operations with parameter suggestions, validation, and batch operations.
 */
interface EditModeProps {
  parameters: ParameterEntry[];
  providerName: string;
  suggestions: typeof PARAMETER_SUGGESTIONS;
  isPending: boolean;
  activeEditIndex: number | null;
  onParametersChange: (index: number, updatedParam: ParameterEntry) => void;
  onBeginEdit: (index: number) => void;
  onRemoveRow: (index: number) => void;
  onAddParameter: () => void;
  onApplySuggestion: (suggestion: {
    key: string;
    type: LlmParameterUIType;
    example?: JSONValue;
  }) => void;
  onSave: () => void;
  onCancel: () => void;
  allowCustomParameters?: boolean;
  hasValidationErrors?: boolean;
}

export function EditMode({
  parameters,
  providerName,
  suggestions,
  isPending,
  activeEditIndex,
  onParametersChange,
  onBeginEdit,
  onRemoveRow,
  onAddParameter,
  onApplySuggestion,
  onSave,
  onCancel,
  allowCustomParameters = true,
  hasValidationErrors,
}: EditModeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col px-4 py-3"
    >
      <CardDescription className="text-sm text-foreground mb-4">
        {allowCustomParameters
          ? "Add custom parameters to send with each LLM request."
          : "Add parameters from the suggestions below. Custom parameters are only available for OpenAI-compatible providers."}
      </CardDescription>

      <ParameterSuggestions
        providerName={providerName}
        suggestions={suggestions}
        onApply={onApplySuggestion}
      />

      <div className="flex flex-col">
        {parameters.length > 0 ? (
          <AnimatePresence>
            {parameters.map((param, idx) => (
              <ParameterRow
                key={param.id}
                index={idx}
                param={param}
                isEditing={activeEditIndex === idx}
                onBeginEdit={onBeginEdit}
                onRemoveRow={onRemoveRow}
                onParameterChange={onParametersChange}
                allowCustomParameters={allowCustomParameters}
              />
            ))}
          </AnimatePresence>
        ) : (
          <p className="text-sm text-muted-foreground">
            No custom parameters configured.
          </p>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-between gap-2 pt-2"
      >
        {allowCustomParameters && (
          <Button size="sm" onClick={onAddParameter} disabled={isPending}>
            <Plus className="h-4 w-4 mr-1" />
            Add Parameter
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={isPending || hasValidationErrors}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
