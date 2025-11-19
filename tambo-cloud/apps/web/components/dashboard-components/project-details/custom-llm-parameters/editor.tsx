"use client";

import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import {
  JSONValue,
  LlmParameterUIType,
  llmProviderConfig,
} from "@tambo-ai-cloud/core";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EditMode, ViewMode } from "./editor-modes";
import { PARAMETER_SUGGESTIONS, type ParameterEntry } from "./types";
import {
  convertValue,
  extractParameters,
  generateParameterId,
  getDefaultValueForType,
  validateValue,
} from "./utils";

interface CustomLlmParametersEditorProps {
  projectId: string;
  selectedProvider?: string | null;
  selectedModel?: string | null;
  onEdited?: () => void;
}

/**
 * CustomLlmParametersEditor Component
 *
 * Manages custom LLM parameters with a nested storage structure:
 * provider -> model -> parameters
 *
 * Architecture Decision:
 * We store parameters per model rather than per provider because:
 * - Different models may need different optimizations
 * - Users can switch between models without losing settings
 * - Allows fine-tuning for specific use cases per model
 *
 * The trade-off is added complexity in this component and ai-sdk-client.ts,
 * but it provides better UX for power users who need model-specific configs.
 */
export function CustomLlmParametersEditor({
  projectId,
  selectedProvider,
  selectedModel,
  onEdited,
}: CustomLlmParametersEditorProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [parameters, setParameters] = useState<ParameterEntry[]>([]);
  const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null);

  // Fetch project data to get LLM settings and custom parameters
  const { data: projectData, isLoading: isProjectLoading } =
    api.project.getProjectById.useQuery(projectId, {
      enabled: !!projectId,
    });

  const providerName =
    selectedProvider || projectData?.defaultLlmProviderName || "openai";

  const currentProvider =
    selectedProvider || projectData?.defaultLlmProviderName;

  const currentModel = useMemo(() => {
    if (selectedModel) return selectedModel;

    // For OpenAI-compatible providers, use customLlmModelName
    if (providerName === "openai-compatible") {
      return projectData?.customLlmModelName;
    }

    // For other providers, use defaultLlmModelName
    return projectData?.defaultLlmModelName;
  }, [
    selectedModel,
    projectData?.defaultLlmModelName,
    projectData?.customLlmModelName,
    providerName,
  ]);

  // Determine if custom parameters are allowed for this provider
  // Only OpenAI-compatible providers can add custom parameters
  const allowCustomParameters = providerName === "openai-compatible";

  // Initialize parameters from project data
  useEffect(() => {
    const params = extractParameters(
      projectData?.customLlmParameters,
      currentProvider,
      currentModel,
    );
    setParameters(params);
    setActiveEditIndex(null);
  }, [projectData?.customLlmParameters, currentProvider, currentModel]);

  const updateProject = api.project.updateProject.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      setActiveEditIndex(null);
      toast({
        variant: "success",
        title: "Success",
        description: "Custom parameters saved successfully",
      });
      if (onEdited) {
        onEdited();
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error saving parameters",
        description: error.message,
      });
    },
  });

  const hasValidationErrors = useMemo(() => {
    return parameters.some((p) => {
      // Check if key is empty
      if (!p.key.trim()) {
        return true;
      }
      // Check if value is invalid
      const validation = validateValue(p.value, p.type);
      return !validation.isValid;
    });
  }, [parameters]);

  const handleSave = useCallback(() => {
    if (!projectId || !currentProvider || !currentModel) return;

    // Convert UI parameters back to their proper types
    const parametersObject = Object.fromEntries(
      parameters
        .filter((p) => p.key)
        .map((p) => [p.key, convertValue(p.value, p.type)])
        .filter(([_, v]) => v !== undefined),
    );

    const existingParams = projectData?.customLlmParameters ?? {};

    const updatedCustomLlmParameters = {
      ...existingParams,
      [currentProvider]: {
        ...existingParams[currentProvider],
        [currentModel]: parametersObject,
      },
    };

    updateProject.mutate({
      projectId,
      customLlmParameters: updatedCustomLlmParameters,
    });
  }, [
    projectId,
    projectData?.customLlmParameters,
    currentProvider,
    currentModel,
    parameters,
    updateProject,
  ]);

  const handleCancel = useCallback(() => {
    const params = extractParameters(
      projectData?.customLlmParameters,
      currentProvider,
      currentModel,
    );
    setParameters(params);
    setIsEditing(false);
    setActiveEditIndex(null);
  }, [projectData?.customLlmParameters, currentProvider, currentModel]);

  const handleBeginEdit = useCallback((rowIndex: number) => {
    setActiveEditIndex(rowIndex);
  }, []);

  const handleRemoveRow = useCallback((rowIndex: number) => {
    setParameters((prev) => prev.filter((_, i) => i !== rowIndex));
    setActiveEditIndex(null);
  }, []);

  const handleAddParameter = useCallback(() => {
    // Only allow adding parameters for OpenAI-compatible providers
    if (!allowCustomParameters) {
      toast({
        variant: "destructive",
        title: "Custom parameters not allowed",
        description:
          "Custom parameters are only available for OpenAI-compatible providers. Please use the suggested parameters instead.",
      });
      return;
    }

    const newParams = [
      ...parameters,
      {
        id: generateParameterId("new"),
        key: "",
        value: getDefaultValueForType("string"),
        type: "string" as const,
      },
    ];
    setParameters(newParams);
    setActiveEditIndex(newParams.length - 1);
  }, [parameters, allowCustomParameters, toast]);

  const handleApplySuggestion = useCallback(
    (suggestion: {
      key: string;
      type: LlmParameterUIType;
      example?: JSONValue;
    }) => {
      if (parameters.some((p) => p.key === suggestion.key)) {
        toast({
          variant: "default",
          title: "Info",
          description: `Parameter "${suggestion.key}" already exists`,
        });
        return;
      }

      const newParams = [
        ...parameters,
        {
          id: generateParameterId(suggestion.key),
          key: suggestion.key,
          value: getDefaultValueForType(suggestion.type, suggestion.example),
          type: suggestion.type,
          example: suggestion.example,
        },
      ];
      setParameters(newParams);
      setActiveEditIndex(newParams.length - 1);
    },
    [parameters, toast],
  );

  const handleParameterChange = useCallback(
    (index: number, updatedParam: ParameterEntry) => {
      setParameters((prev) =>
        prev.map((p, i) => (i === index ? updatedParam : p)),
      );
    },
    [],
  );
  const suggestions = useMemo(() => {
    const base = PARAMETER_SUGGESTIONS;
    if (!currentModel) return base;
    const providerInfo = llmProviderConfig[providerName];
    const modelInfo = providerInfo?.models?.[currentModel];
    const providerParams = modelInfo?.modelSpecificParams ?? {};
    const providerSuggestions = Object.entries(providerParams).map(
      ([key, value]) => ({
        key,
        description: value.description,
        type: value.uiType,
        example: value.example,
      }),
    );
    const seen = new Set<string>();
    const merged = [...base, ...providerSuggestions].filter((s) => {
      if (seen.has(s.key)) return false;
      seen.add(s.key);
      return true;
    });
    return merged;
  }, [providerName, currentModel]);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isEditing ? (
          <EditMode
            key="edit-mode"
            parameters={parameters}
            providerName={providerName}
            suggestions={suggestions}
            isPending={updateProject.isPending}
            activeEditIndex={activeEditIndex}
            onParametersChange={handleParameterChange}
            onBeginEdit={handleBeginEdit}
            onRemoveRow={handleRemoveRow}
            onAddParameter={handleAddParameter}
            onApplySuggestion={handleApplySuggestion}
            onSave={handleSave}
            onCancel={handleCancel}
            allowCustomParameters={allowCustomParameters}
            hasValidationErrors={hasValidationErrors}
          />
        ) : (
          <ViewMode
            key="view-mode"
            parameters={parameters}
            onEdit={() => projectId && setIsEditing(true)}
            isLoading={isProjectLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
