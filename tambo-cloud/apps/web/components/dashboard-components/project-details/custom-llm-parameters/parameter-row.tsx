import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LlmParameterUIType } from "@tambo-ai-cloud/core";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PARAMETER_SUGGESTIONS, type ParameterEntry } from "./types";
import {
  getDefaultValueForType,
  shouldUseTextarea,
  validateValue,
} from "./utils";

/**
 * ParameterRow Component
 *
 * Represents a single editable parameter entry in the LLM parameters editor.
 * Provides inline editing capabilities with type-specific input controls and
 * validation. Handles both custom parameters and pre-defined suggestions.
 */
interface ParameterRowProps {
  index: number;
  param: ParameterEntry;
  isEditing: boolean;
  onBeginEdit: (rowIndex: number) => void;
  onRemoveRow: (rowIndex: number) => void;
  onParameterChange: (index: number, updatedParam: ParameterEntry) => void;
  allowCustomParameters?: boolean;
}

export function ParameterRow({
  index,
  param,
  isEditing,
  onBeginEdit,
  onRemoveRow,
  onParameterChange,
  allowCustomParameters = true,
}: ParameterRowProps) {
  const [local, setLocal] = useState<ParameterEntry>(param);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset local state when param changes from parent
  useEffect(() => {
    if (!isEditing) {
      setLocal(param);
      setValidationError(null);
    }
  }, [param, isEditing]);

  const handleKeyChange = (value: string) => {
    if (!isEditing) onBeginEdit(index);

    const updatedParam = { ...local, key: value };
    setLocal(updatedParam);
    onParameterChange(index, updatedParam);
  };

  const handleTypeChange = (value: LlmParameterUIType) => {
    if (!isEditing) onBeginEdit(index);

    // Clear validation error when type changes
    setValidationError(null);

    // Reset value to appropriate default when type changes
    let updatedParam = { ...local, type: value };
    if (value !== local.type) {
      const defaultValue = getDefaultValueForType(value);
      updatedParam = { ...updatedParam, value: defaultValue };
    }

    setLocal(updatedParam);
    onParameterChange(index, updatedParam);
  };

  const handleValueChange = (value: string) => {
    if (!isEditing) onBeginEdit(index);

    const updatedParam = { ...local, value };

    // Validate value changes
    const validation = validateValue(value, local.type);
    const error = validation.error;
    setValidationError(error);

    setLocal(updatedParam);

    // Always propagate changes to parent, even with validation errors
    // The parent can decide how to handle invalid parameters during save
    onParameterChange(index, updatedParam);
  };

  // Check if this parameter was added from suggestions (exists in PARAMETER_SUGGESTIONS)
  const isFromSuggestions = useMemo(() => {
    return PARAMETER_SUGGESTIONS.some((s) => s.key === param.key);
  }, [param.key]);

  // For parameters from suggestions: only allow value editing
  // For custom parameters: allow full editing only if allowCustomParameters is true
  const canEditKey = allowCustomParameters && !isFromSuggestions;
  const canEditType = allowCustomParameters && !isFromSuggestions;
  const canEditValue = true; // Values can always be edited

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{
        opacity: 0,
        height: 0,
        transition: { duration: 0.2 },
      }}
    >
      <div className="flex gap-2 items-start">
        {/* Key input */}
        <Input
          placeholder="Parameter name"
          value={local.key}
          onChange={(e) => handleKeyChange(e.target.value)}
          className="flex-1 focus:ring-inset"
          disabled={!canEditKey}
        />

        {/* Type selector */}
        <Select
          value={local.type}
          onValueChange={handleTypeChange}
          disabled={!canEditType}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="string">String</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
            <SelectItem value="array">Array</SelectItem>
            <SelectItem value="object">Object</SelectItem>
          </SelectContent>
        </Select>

        {/* Value input with type-specific handling */}
        {local.type === "boolean" ? (
          <Select
            value={local.value}
            onValueChange={handleValueChange}
            disabled={!canEditValue}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">true</SelectItem>
              <SelectItem value="false">false</SelectItem>
            </SelectContent>
          </Select>
        ) : shouldUseTextarea(local.type) ? (
          <Textarea
            placeholder={JSON.stringify(local.example)}
            value={local.value}
            onChange={(e) => handleValueChange(e.target.value)}
            className={`flex-1 resize-y min-h-[80px] font-mono text-sm ${
              validationError ? "border-red-500" : ""
            }`}
            disabled={!canEditValue}
          />
        ) : (
          <Input
            placeholder={JSON.stringify(local.example)}
            value={local.value}
            onChange={(e) => handleValueChange(e.target.value)}
            className={`flex-1 ${validationError ? "border-red-500" : ""}`}
            type={local.type === "number" ? "number" : "text"}
            step={local.type === "number" ? "0.01" : undefined}
            disabled={!canEditValue}
          />
        )}

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemoveRow(index)}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Validation error message */}
      <div className="h-6 mt-1">
        {validationError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-sm text-red-600 ml-2"
          >
            {validationError}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
