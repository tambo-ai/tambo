import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { JSONValue, LlmParameterUIType } from "@tambo-ai-cloud/core";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { FC } from "react";
import { ParameterRow } from "./parameter-row";
import { ParameterSuggestions } from "./parameter-suggestions";
import { PARAMETER_SUGGESTIONS, type ParameterEntry } from "./types";
import { formatValueForDisplay, shouldUseTextarea } from "./utils";

/**
 *
 * This file contains the components for the custom LLM parameters editor.
 * It includes the ViewMode and EditMode components, which are used to display
 * and edit the LLM parameters respectively.
 *
 */

/**
 * ViewModeContent Component
 *
 * Renders the content area of the view mode, handling loading states,
 * empty states, and parameter display.
 */
interface ViewModeContentProps {
  parameters: ParameterEntry[];
  isLoading?: boolean;
}

const ViewModeContent: FC<ViewModeContentProps> = ({
  parameters,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="h-4 bg-muted/50 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-muted/50 rounded w-1/2 animate-pulse" />
      </div>
    );
  }

  if (parameters.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No custom parameters configured.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {parameters.map((p, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium text-sm">{p.key}:</span>
            <span className="text-xs text-muted-foreground">({p.type})</span>
          </div>
          {shouldUseTextarea(p.type) ? (
            <pre className="text-xs bg-muted/50 p-2 rounded border font-mono whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
              {formatValueForDisplay(p.value, p.type)}
            </pre>
          ) : (
            <span className="text-sm text-muted-foreground font-mono">
              {formatValueForDisplay(p.value, p.type)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex items-start justify-between gap-4"
    >
      <div className="flex-1 flex flex-col gap-3">
        <CardDescription className="text-sm text-foreground">
          Custom parameters sent with each LLM request.
        </CardDescription>

        <ViewModeContent parameters={parameters} isLoading={isLoading} />
      </div>

      <Button variant="outline" size="sm" onClick={onEdit}>
        Edit
      </Button>
    </motion.div>
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
      className="flex flex-col"
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
          <Button
            variant="outline"
            onClick={onAddParameter}
            disabled={isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Parameter
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isPending || hasValidationErrors}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
