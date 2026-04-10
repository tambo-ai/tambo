import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsRow } from "@/components/ui/settings-row";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
  AgentProviderType,
  AiProviderType,
  DEFAULT_OPENAI_MODEL,
} from "@tambo-ai-cloud/core";
import type { Suggestion } from "@tambo-ai/react";
import { withTamboInteractable } from "@tambo-ai/react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDebounce } from "use-debounce";
import { z } from "zod/v3";
import { AgentSettings } from "./agent-settings";
import { CustomLlmParametersEditor } from "./custom-llm-parameters/editor";

const COMPONENT_NAME = "LLMProviders";

const _providerKeySectionSuggestions: Suggestion[] = [
  {
    id: "change-model",
    title: "Change Model",
    description: "Change Model",
    detailedSuggestion: "Change the model used for this project to gpt-4o",
    messageId: "change-model",
  },
  {
    id: "turn-on-thinking",
    title: "Turn on Thinking",
    description: "Turn on Thinking",
    detailedSuggestion: "Turn on thinking for the model used for this project",
    messageId: "turn-on-thinking",
  },
  {
    id: "change-input-token-limit",
    title: "Change Input Token Limit",
    description: "Change Input Token Limit",
    detailedSuggestion:
      "Change the input token limit for the model used for this project",
    messageId: "change-input-token-limit",
  },
];

export const InteractableProviderKeySectionProps = z.object({
  projectId: z.string().describe("The unique identifier for the project."),
  changeMode: z
    .enum(["llm", "agent"])
    .optional()
    .describe(
      "When set, switches the component to the specified AI mode. Use 'llm' for traditional LLM configuration or 'agent' for agent-based configuration. This will trigger the mode toggle and mark settings as changed.",
    ),
  changeProviderAndModel: z
    .object({
      provider: z
        .string()
        .describe(
          "The provider API name (e.g., 'openai', 'anthropic', 'openai-compatible')",
        ),
      model: z
        .string()
        .optional()
        .describe(
          "The model API name (e.g., 'gpt-5.2', 'claude-sonnet-4-5-20250929'). Use 'custom' or omit for custom providers.",
        ),
    })
    .optional()
    .describe(
      "When set, changes the selected provider and model combination. The component will update the dropdown selection and reset related fields. This triggers the combined provider/model selector.",
    ),
  updateApiKey: z
    .string()
    .optional()
    .describe(
      "When set, enters edit mode for the API key field with this value pre-filled. Set to empty string to clear the key (for OpenAI/OpenAI-compatible only). After setting this value, the component will be in API key edit mode ready to save.",
    ),
  enterApiKeyEditMode: z
    .boolean()
    .optional()
    .describe(
      "When true, opens the API key editing interface, allowing the user to manually enter a new API key for the currently selected provider.",
    ),
  updateCustomModelName: z
    .string()
    .optional()
    .describe(
      "When set, updates the custom model name field for custom providers (like OpenAI-compatible). This is required when using custom providers.",
    ),
  updateBaseUrl: z
    .string()
    .optional()
    .describe(
      "When set, updates the base URL field for providers that require it (like OpenAI-compatible). Requests will be sent to <baseUrl>/chat/completions.",
    ),
  updateMaxInputTokens: z
    .number()
    .optional()
    .describe(
      "When set, updates the maximum input tokens limit. Tambo will limit the number of tokens sent to the model to this value. Must be positive and within the model's maximum limit.",
    ),
  saveSettings: z
    .boolean()
    .optional()
    .describe(
      "When true, triggers the save action for all current settings. This will validate all fields and save the LLM or Agent configuration based on the current mode.",
    ),
  updateAgentUrl: z
    .string()
    .optional()
    .describe(
      "When set, updates the agent URL field in agent mode. This is the endpoint URL where the agent is hosted. Required for agent mode.",
    ),
  updateAgentName: z
    .string()
    .optional()
    .describe(
      "When set, updates the agent name field in agent mode. This is an optional identifier for the agent configuration.",
    ),
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe(
      "Optional callback function triggered when settings are successfully updated or API keys are saved.",
    ),
});

interface ProviderKeySectionProps {
  projectId: string;
  // Interactable control props
  changeMode?: "llm" | "agent";
  changeProviderAndModel?: { provider: string; model?: string };
  updateApiKey?: string;
  enterApiKeyEditMode?: boolean;
  updateCustomModelName?: string;
  updateBaseUrl?: string;
  updateMaxInputTokens?: number;
  saveSettings?: boolean;
  updateAgentUrl?: string;
  updateAgentName?: string;
  onEdited?: () => void;
}

interface ProviderModelOption {
  value: string;
  label: string;
  provider: {
    apiName: string;
    displayName: string;
    isCustomProvider: boolean;
    requiresBaseUrl?: boolean;
    apiKeyLink?: string;
  };
  model?: {
    apiName: string;
    displayName: string;
    status?: string;
    notes?: string;
    docLink?: string;
    inputTokenLimit?: number;
  };
}

export const FREE_MESSAGE_LIMIT = 500;

// --- Header conversion helpers (module-level) ---
function agentHeadersArrayToRecord(
  items: { header: string; value: string }[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const kv of items) {
    // Normalize header names to a consistent case to avoid duplicate
    // case-variants (HTTP header names are case-insensitive).
    const key = kv.header.trim().toLowerCase();
    const val = kv.value.trim();
    if (!key || !val) continue;
    // Keep last-write-wins behavior on duplicate keys.
    result[key] = val;
  }
  return result;
}

function agentHeadersRecordToArray(
  record: Record<string, string> | null | undefined,
): { header: string; value: string }[] {
  if (!record) return [];
  return Object.entries(record).map(([header, value]) => ({ header, value }));
}

export function ProviderKeySectionBase({
  projectId,
  changeMode,
  changeProviderAndModel,
  updateApiKey,
  enterApiKeyEditMode,
  updateCustomModelName: externalCustomModelName,
  updateBaseUrl: externalBaseUrl,
  updateMaxInputTokens: externalMaxInputTokens,
  saveSettings: triggerSaveSettings,
  updateAgentUrl: externalAgentUrl,
  updateAgentName: externalAgentName,
  onEdited,
}: ProviderKeySectionProps) {
  const modeSelectId = useId();
  const customModelNameId = useId();
  const baseUrlId = useId();
  const maxInputTokensId = useId();
  const { toast } = useToast();

  // --- TRPC Queries ---
  const { data: llmProviderConfigData, isLoading: isLoadingConfig } =
    api.llm.getLlmProviderConfig.useQuery(undefined, {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    });

  const {
    data: projectLlmSettings,
    isLoading: isLoadingSettings,
    refetch: refetchSettings,
  } = api.project.getProjectLlmSettings.useQuery(
    { projectId: projectId ?? "" },
    { enabled: !!projectId },
  );

  const { data: messageUsage } = api.project.getProjectMessageUsage.useQuery(
    { projectId: projectId ?? "" },
    { enabled: !!projectId },
  );

  const {
    data: storedApiKeys,
    isLoading: isLoadingKeys,
    refetch: refetchKeys,
  } = api.project.getProviderKeys.useQuery(projectId ?? "", {
    enabled: !!projectId,
  });

  const { data: projectMessageUsage } =
    api.project.getProjectMessageUsage.useQuery(
      { projectId: projectId ?? "" },
      {
        enabled: !!projectId,
      },
    );

  // --- State Management ---
  const [mode, setMode] = useState(AiProviderType.LLM);
  const [combinedSelectValue, setCombinedSelectValue] = useState("");
  const [customModelName, setCustomModelName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [maxInputTokens, setMaxInputTokens] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Agent settings state
  const [agentProvider, setAgentProvider] = useState(AgentProviderType.CREWAI);
  const [agentUrl, setAgentUrl] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentHeaders, setAgentHeaders] = useState<
    { header: string; value: string }[]
  >([]);

  // Parse provider and model from combined value
  const parsedSelection = useMemo(() => {
    if (!combinedSelectValue) return { provider: undefined, model: undefined };
    const [provider, model] = combinedSelectValue.split("|", 2);
    return {
      provider: provider || undefined,
      model: model === "custom" ? undefined : model,
    };
  }, [combinedSelectValue]);

  // Generate provider-model options
  const providerModelOptions: ProviderModelOption[] = useMemo(() => {
    if (!llmProviderConfigData) return [];

    const options: ProviderModelOption[] = [];

    Object.values(llmProviderConfigData).forEach((provider) => {
      if (provider.isCustomProvider) {
        options.push({
          value: `${provider.apiName}|custom`,
          label: `${provider.displayName} • Custom Model`,
          provider: {
            apiName: provider.apiName,
            displayName: provider.displayName,
            isCustomProvider: true,
            requiresBaseUrl: provider.requiresBaseUrl,
            apiKeyLink: provider.apiKeyLink,
          },
        });
      } else {
        const models = provider.models || {};
        Object.values(models).forEach((model) => {
          options.push({
            value: `${provider.apiName}|${model.apiName}`,
            label: `${provider.displayName} • ${model.displayName}${
              model.apiName === DEFAULT_OPENAI_MODEL ? " (default)" : ""
            }`,
            provider: {
              apiName: provider.apiName,
              displayName: provider.displayName,
              isCustomProvider: false,
              apiKeyLink: provider.apiKeyLink,
            },
            model: {
              apiName: model.apiName,
              displayName: model.displayName,
              status: model.status,
              notes: model.notes,
              docLink: model.docLink,
              inputTokenLimit: model.inputTokenLimit,
            },
          });
        });
      }
    });

    return options.sort((a, b) => {
      const aIsTested = a.model?.status === "tested";
      const bIsTested = b.model?.status === "tested";
      if (aIsTested && !bIsTested) return -1;
      if (!aIsTested && bIsTested) return 1;
      return 0;
    });
  }, [llmProviderConfigData]);

  // Fast lookup for options by value to avoid repeated linear searches in renderers
  const providerModelOptionMap = useMemo(
    () => new Map(providerModelOptions.map((o) => [o.value, o])),
    [providerModelOptions],
  );

  const currentSelectedOption = providerModelOptions.find(
    (option) => option.value === combinedSelectValue,
  );

  const currentProviderConfig =
    parsedSelection.provider && llmProviderConfigData
      ? llmProviderConfigData[parsedSelection.provider]
      : undefined;

  // Track whether we've hydrated agent fields for this project to prevent
  // overwriting in-progress edits when data is refetched.
  const agentHydratedRef = useRef<string | null>(null);

  // Initialize state from saved settings
  useEffect(() => {
    if (!projectLlmSettings || !llmProviderConfigData) return;

    // Provider mode
    setMode(projectLlmSettings.providerType ?? AiProviderType.LLM);

    // Agent settings: hydrate from stored values once per project so a user can
    // switch between modes without losing previously entered settings, and avoid
    // clobbering in‑progress edits on refetch.
    const hydratedRef = agentHydratedRef.current;
    if (hydratedRef !== projectId) {
      if (projectLlmSettings.agentProviderType) {
        setAgentProvider(projectLlmSettings.agentProviderType);
      }
      setAgentUrl(projectLlmSettings.agentUrl ?? "");
      setAgentName(projectLlmSettings.agentName ?? "");
      setAgentHeaders(
        agentHeadersRecordToArray(projectLlmSettings.agentHeaders),
      );
      agentHydratedRef.current = projectId ?? null;
    }

    // LLM settings
    const provider = projectLlmSettings.defaultLlmProviderName || "openai";
    const model =
      projectLlmSettings.defaultLlmModelName || DEFAULT_OPENAI_MODEL;

    if (provider === "openai-compatible") {
      setCombinedSelectValue(`${provider}|custom`);
      setCustomModelName(projectLlmSettings.customLlmModelName || "");
      setBaseUrl(projectLlmSettings.customLlmBaseURL || "");
      setMaxInputTokens(projectLlmSettings.maxInputTokens?.toString() || "");
    } else {
      const actualModel =
        provider === "openai" && !projectLlmSettings.defaultLlmModelName
          ? DEFAULT_OPENAI_MODEL
          : model;
      setCombinedSelectValue(`${provider}|${actualModel}`);

      // Set maxInputTokens from saved settings or model default
      if (projectLlmSettings.maxInputTokens) {
        setMaxInputTokens(projectLlmSettings.maxInputTokens.toString());
      } else {
        const providerConfig = llmProviderConfigData[provider];
        const modelConfig = providerConfig?.models?.[actualModel];
        if (modelConfig?.inputTokenLimit) {
          setMaxInputTokens(modelConfig.inputTokenLimit.toString());
        }
      }
    }
  }, [projectId, projectLlmSettings, llmProviderConfigData]);

  // --- Interactable Control Props Watchers ---

  // Watch changeMode to switch between LLM and Agent modes
  useEffect(() => {
    if (changeMode !== undefined) {
      const newMode =
        changeMode === "llm" ? AiProviderType.LLM : AiProviderType.AGENT;
      setMode(newMode);
    }
  }, [changeMode]);

  // Watch changeProviderAndModel to update provider/model selection
  useEffect(() => {
    if (changeProviderAndModel != null) {
      const { provider, model } = changeProviderAndModel;
      const combinedValue = model
        ? `${provider}|${model}`
        : `${provider}|custom`;
      handleCombinedSelectChange(combinedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeProviderAndModel]);

  // Watch updateApiKey to enter edit mode with pre-filled value
  useEffect(() => {
    if (updateApiKey) {
      setApiKeyInput(updateApiKey);
      setIsEditingApiKey(true);
    }
  }, [updateApiKey]);

  // Watch enterApiKeyEditMode to open API key editing interface
  useEffect(() => {
    if (enterApiKeyEditMode === true) {
      setApiKeyInput("");
      setIsEditingApiKey(true);
    }
  }, [enterApiKeyEditMode]);

  // Watch updateCustomModelName to update custom model name field
  useEffect(() => {
    if (externalCustomModelName) {
      setCustomModelName(externalCustomModelName);
    }
  }, [externalCustomModelName]);

  // Watch updateBaseUrl to update base URL field
  useEffect(() => {
    if (externalBaseUrl) {
      setBaseUrl(externalBaseUrl);
    }
  }, [externalBaseUrl]);

  // Watch updateMaxInputTokens to update token limit
  useEffect(() => {
    if (externalMaxInputTokens) {
      setMaxInputTokens(externalMaxInputTokens.toString());
    }
  }, [externalMaxInputTokens]);

  // Watch saveSettings to trigger save action
  useEffect(() => {
    if (triggerSaveSettings === true) {
      handleSaveDefaults().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSaveSettings]);

  // Watch updateAgentUrl to update agent URL field
  useEffect(() => {
    if (externalAgentUrl) {
      setAgentUrl(externalAgentUrl);
    }
  }, [externalAgentUrl]);

  // Watch updateAgentName to update agent name field
  useEffect(() => {
    if (externalAgentName) {
      setAgentName(externalAgentName);
    }
  }, [externalAgentName]);

  // API key validation
  const [debouncedApiKey] = useDebounce(apiKeyInput, 500);
  const { data: apiKeyValidation, isFetching: isValidatingApiKey } =
    api.validate.validateApiKey.useQuery(
      {
        apiKey: debouncedApiKey,
        provider: parsedSelection.provider || "",
        options: {
          allowEmpty: ["openai", "openai-compatible"].includes(
            parsedSelection.provider || "",
          ),
          timeout: 5000,
        },
      },
      {
        enabled: !!parsedSelection.provider && !!debouncedApiKey,
        staleTime: 30000,
        retry: false,
      },
    );

  // --- Mutations ---
  const { mutateAsync: updateAgentSettingsAsync, isPending: isSavingAgent } =
    api.project.updateProjectAgentSettings.useMutation({
      onSuccess: async () => {
        toast({ title: "Success", description: "Agent configuration saved." });
        await refetchSettings();
        onEdited?.();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to save agent configuration: ${error.message}`,
          variant: "destructive",
        });
      },
    });
  const { mutate: updateLlmSettings, isPending: isSavingDefaults } =
    api.project.updateProjectLlmSettings.useMutation({
      onSuccess: async () => {
        toast({
          title: "Success",
          description: "LLM configuration saved.",
        });
        await refetchSettings();
        onEdited?.();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to save configuration: ${error.message}`,
          variant: "destructive",
        });
      },
    });

  const { mutate: addOrUpdateApiKey, isPending: isUpdatingApiKey } =
    api.project.addProviderKey.useMutation({
      onSuccess: async () => {
        toast({ title: "Success", description: "API key saved successfully." });
        await refetchKeys();
        setIsEditingApiKey(false);
        setApiKeyInput("");
        onEdited?.();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to save API key: ${error.message}`,
          variant: "destructive",
        });
      },
    });

  // --- Derived State ---
  const currentApiKeyRecord = storedApiKeys?.find(
    (k) => k.providerName === parsedSelection.provider,
  );

  const isUsingDefaultModel = parsedSelection.model === DEFAULT_OPENAI_MODEL;
  const canUseFreeMessages =
    parsedSelection.provider === "openai" && isUsingDefaultModel;

  // Check if current state differs from saved state
  const hasActualChanges = useMemo(() => {
    if (!projectLlmSettings) return false;

    // Check mode change
    if (mode !== (projectLlmSettings.providerType ?? AiProviderType.LLM)) {
      return true;
    }

    // Check LLM settings changes
    if (mode === AiProviderType.LLM) {
      const savedProvider =
        projectLlmSettings.defaultLlmProviderName || "openai";
      const savedModel =
        projectLlmSettings.defaultLlmModelName || DEFAULT_OPENAI_MODEL;

      // Build saved combined value
      const savedCombinedValue =
        savedProvider === "openai-compatible"
          ? `${savedProvider}|custom`
          : `${savedProvider}|${savedModel}`;

      if (combinedSelectValue !== savedCombinedValue) return true;

      // Check custom provider fields
      if (parsedSelection.provider === "openai-compatible") {
        if (customModelName !== (projectLlmSettings.customLlmModelName || ""))
          return true;
        if (baseUrl !== (projectLlmSettings.customLlmBaseURL || ""))
          return true;
      }

      // Check max input tokens
      const currentTokens = maxInputTokens.trim();
      const savedTokens = projectLlmSettings.maxInputTokens?.toString() || "";
      if (currentTokens !== savedTokens) return true;
    }

    // Check Agent settings changes
    if (mode === AiProviderType.AGENT) {
      if (
        agentProvider !==
        (projectLlmSettings.agentProviderType ?? AgentProviderType.CREWAI)
      )
        return true;
      if (agentUrl !== (projectLlmSettings.agentUrl ?? "")) return true;
      if (agentName !== (projectLlmSettings.agentName ?? "")) return true;

      // Check agent headers - normalize by sorting to avoid order sensitivity
      const normalizeHeaders = (arr: { header: string; value: string }[]) =>
        [...arr].sort((a, b) => a.header.localeCompare(b.header));

      const savedHeaders = agentHeadersRecordToArray(
        projectLlmSettings.agentHeaders,
      );
      if (
        JSON.stringify(normalizeHeaders(agentHeaders)) !==
        JSON.stringify(normalizeHeaders(savedHeaders))
      )
        return true;
    }

    return false;
  }, [
    projectLlmSettings,
    mode,
    combinedSelectValue,
    parsedSelection.provider,
    customModelName,
    baseUrl,
    maxInputTokens,
    agentProvider,
    agentUrl,
    agentName,
    agentHeaders,
  ]);

  const maskedApiKeyDisplay = isLoadingKeys
    ? "Loading..."
    : currentApiKeyRecord
      ? currentApiKeyRecord.partiallyHiddenKey || "sk•••••••••••••••••••••••••"
      : canUseFreeMessages
        ? messageUsage?.messageCount &&
          messageUsage.messageCount >= FREE_MESSAGE_LIMIT
          ? "starter LLM calls used — connect your provider key to continue"
          : `using starter LLM calls (${messageUsage?.messageCount ?? 0}/${FREE_MESSAGE_LIMIT})`
        : "API key required";

  // --- Event Handlers ---
  const handleCombinedSelectChange = useCallback(
    (value: string) => {
      setCombinedSelectValue(value);

      // Reset fields when changing selection
      const [provider, model] = value.split("|", 2);
      let tokenLimit: string = "";

      if (provider === "openai-compatible") {
        // Keep existing values if switching within custom providers
        if (!customModelName) setCustomModelName("");
        if (!baseUrl) setBaseUrl("");
        if (!maxInputTokens) setMaxInputTokens("");
      } else {
        setCustomModelName("");
        setBaseUrl("");

        // Check if we're switching back to the saved model
        const isSavedModel =
          projectLlmSettings?.defaultLlmProviderName === provider &&
          projectLlmSettings?.defaultLlmModelName === model;

        if (isSavedModel && projectLlmSettings?.maxInputTokens) {
          // Restore the saved token limit for this model
          tokenLimit = projectLlmSettings.maxInputTokens.toString();
        } else {
          // Set default token limit for new model
          const option = providerModelOptions.find(
            (opt) => opt.value === value,
          );
          if (option?.model?.inputTokenLimit) {
            tokenLimit = option.model.inputTokenLimit.toString();
          }
        }
        setMaxInputTokens(tokenLimit);

        // Auto-save for standard providers (custom providers need additional fields first)
        if (projectId && model && model !== "custom") {
          updateLlmSettings({
            projectId,
            defaultLlmProviderName: provider,
            defaultLlmModelName: model,
            customLlmModelName: null,
            customLlmBaseURL: null,
            maxInputTokens: tokenLimit ? parseInt(tokenLimit) : null,
          });
        }
      }

      setApiKeyInput("");
      setIsEditingApiKey(false);
    },
    [
      providerModelOptions,
      customModelName,
      baseUrl,
      maxInputTokens,
      projectLlmSettings,
      projectId,
      updateLlmSettings,
    ],
  );

  const handleSaveDefaults = useCallback(async () => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "No project selected.",
        variant: "destructive",
      });
      return;
    }
    setShowValidationErrors(true);

    if (mode === AiProviderType.AGENT) {
      const localAgentUrl = agentUrl.trim();
      const localAgentName = agentName.trim();
      if (!localAgentUrl) {
        toast({
          title: "Error",
          description: "Agent URL is required.",
          variant: "destructive",
        });
        return;
      }

      // Basic client URL check to help user quickly
      try {
        const _ = new URL(localAgentUrl);
      } catch {
        toast({
          title: "Error",
          description: "Invalid agent URL.",
          variant: "destructive",
        });
        return;
      }

      setShowValidationErrors(false);
      await updateAgentSettingsAsync({
        projectId,
        providerType: AiProviderType.AGENT,
        agentProviderType: agentProvider,
        agentUrl: localAgentUrl,
        agentName: localAgentName || null,
        agentHeaders: agentHeadersArrayToRecord(agentHeaders),
      });
      return;
    }

    // LLM mode save flow
    if (!combinedSelectValue) {
      toast({
        title: "Error",
        description: "Please select a provider and model.",
        variant: "destructive",
      });
      return;
    }

    const { provider, model } = parsedSelection;

    if (!provider) {
      toast({
        title: "Error",
        description: "Please select a provider.",
        variant: "destructive",
      });
      return;
    }

    // Check API key requirement
    const requiresApiKey = !canUseFreeMessages;
    if (requiresApiKey && !currentApiKeyRecord?.partiallyHiddenKey) {
      const errorMessage =
        provider === "openai" && !isUsingDefaultModel
          ? `Free messages are only available for the default model (${DEFAULT_OPENAI_MODEL}). Please add your OpenAI API key to use other models.`
          : "Please add an API key before saving settings for this provider.";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // Validate custom provider fields
    if (currentProviderConfig?.isCustomProvider) {
      if (!customModelName.trim()) {
        toast({
          title: "Error",
          description: "Model Name is required for custom providers.",
          variant: "destructive",
        });
        return;
      }

      if (currentProviderConfig.requiresBaseUrl && !baseUrl.trim()) {
        toast({
          title: "Error",
          description: "Base URL is required for this provider.",
          variant: "destructive",
        });
        return;
      }

      if (provider === "openai-compatible") {
        const tokens = parseInt(maxInputTokens);
        if (isNaN(tokens) || tokens <= 0) {
          toast({
            title: "Error",
            description: "Please enter a valid maximum input tokens value.",
            variant: "destructive",
          });
          return;
        }
      }
    } else {
      if (!model) {
        toast({
          title: "Error",
          description: "Please select a model.",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate token limit
    let maxTokensToSave: number | null = null;
    if (maxInputTokens.trim()) {
      const tokens = parseInt(maxInputTokens);
      if (isNaN(tokens) || tokens <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid maximum input tokens value.",
          variant: "destructive",
        });
        return;
      }

      // Check against model limit if applicable
      if (
        currentSelectedOption?.model?.inputTokenLimit &&
        tokens > currentSelectedOption.model.inputTokenLimit
      ) {
        toast({
          title: "Error",
          description: `Input token limit cannot exceed model maximum (${currentSelectedOption.model.inputTokenLimit.toLocaleString()}).`,
          variant: "destructive",
        });
        return;
      }

      maxTokensToSave = tokens;
    }

    setShowValidationErrors(false);
    // Ensure providerType is set back to LLM when saving in LLM mode.
    // Do not clear any agent fields—preserve previously saved values.
    if (projectLlmSettings?.providerType !== AiProviderType.LLM) {
      await updateAgentSettingsAsync({
        projectId,
        providerType: AiProviderType.LLM,
      });
    }

    updateLlmSettings({
      projectId,
      defaultLlmProviderName: provider,
      defaultLlmModelName: currentProviderConfig?.isCustomProvider
        ? null
        : model || null,
      customLlmModelName: currentProviderConfig?.isCustomProvider
        ? customModelName.trim()
        : null,
      customLlmBaseURL:
        currentProviderConfig?.apiName === "openai-compatible"
          ? baseUrl.trim() || null
          : null,
      maxInputTokens: maxTokensToSave,
    });
  }, [
    projectId,
    projectLlmSettings,
    combinedSelectValue,
    parsedSelection,
    customModelName,
    baseUrl,
    maxInputTokens,
    currentProviderConfig,
    currentSelectedOption,
    currentApiKeyRecord,
    canUseFreeMessages,
    isUsingDefaultModel,
    updateLlmSettings,
    updateAgentSettingsAsync,
    mode,
    agentProvider,
    agentUrl,
    agentName,
    agentHeaders,
    toast,
  ]);

  const handleSaveApiKey = useCallback(async () => {
    if (!projectId || !parsedSelection.provider) {
      toast({
        title: "Error",
        description: "No project or provider selected.",
        variant: "destructive",
      });
      return;
    }

    if (
      (apiKeyInput || "").trim() &&
      apiKeyValidation &&
      !apiKeyValidation.isValid
    ) {
      toast({
        title: "Invalid API Key",
        description: apiKeyValidation.error || "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    if (
      !["openai", "openai-compatible"].includes(parsedSelection.provider) &&
      !(apiKeyInput || "").trim()
    ) {
      toast({
        title: "Error",
        description: "API key cannot be empty for this provider.",
        variant: "destructive",
      });
      return;
    }

    addOrUpdateApiKey({
      projectId,
      provider: parsedSelection.provider,
      providerKey: (apiKeyInput || "").trim() || undefined,
    });
  }, [
    parsedSelection.provider,
    apiKeyInput,
    apiKeyValidation,
    addOrUpdateApiKey,
    projectId,
    toast,
  ]);

  // --- Loading State ---
  if (isLoadingConfig || isLoadingSettings) {
    return (
      <div className="px-4 py-3">
        <div className="h-60 w-full animate-pulse space-y-4 rounded-md bg-muted p-4">
          <div className="h-10 rounded bg-muted-foreground/10" />
          <div className="h-24 rounded bg-muted-foreground/10" />
          <div className="h-10 rounded bg-muted-foreground/10" />
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="px-4 py-3">
        <p className="text-sm text-foreground">No project selected</p>
      </div>
    );
  }

  return (
    <>
      {/* Mode Select */}
      <SettingsRow
        label="AI Mode"
        description="Choose between LLM or Agent mode"
        htmlFor={modeSelectId}
      >
        <Select
          value={mode}
          onValueChange={(v) => {
            const newMode = v as AiProviderType;
            setMode(newMode);
            // Only auto-save when switching to LLM; Agent mode requires
            // the user to fill in provider + URL before saving.
            if (newMode === AiProviderType.LLM) {
              updateAgentSettingsAsync({
                projectId,
                providerType: newMode,
              }).catch(() => {
                setMode(mode);
              });
            }
          }}
        >
          <SelectTrigger id={modeSelectId} className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AiProviderType.LLM}>LLM</SelectItem>
            <SelectItem value={AiProviderType.AGENT}>
              Agent
              <span className="ml-2 text-[10px] uppercase tracking-wide rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-800">
                beta
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      {mode === AiProviderType.LLM && (
        <>
          <SettingsRow
            label="Provider and Model"
            description={`${projectMessageUsage?.messageCount} of 500 starter LLM calls used`}
          >
            <Combobox
              items={providerModelOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={combinedSelectValue}
              onChange={handleCombinedSelectChange}
              placeholder="Select provider and model"
              searchPlaceholder="Search providers and models..."
              emptyText="No provider or model found."
              renderRight={(option) => {
                const opt = providerModelOptionMap.get(option.value);
                if (!opt?.model?.status) return null;
                return (
                  <span
                    className={cn(
                      "ml-2 rounded-full px-1.5 py-0.5 text-xs",
                      opt.model.status === "untested"
                        ? "bg-gray-200 text-gray-700"
                        : opt.model.status === "known-issues"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700",
                    )}
                  >
                    {opt.model.status}
                  </span>
                );
              }}
            />
          </SettingsRow>

          {/* Custom Provider Fields */}
          {currentSelectedOption?.provider.isCustomProvider && (
            <>
              <SettingsRow
                label="Model name"
                description="The model identifier for your custom provider."
                htmlFor={customModelNameId}
              >
                <Input
                  id={customModelNameId}
                  type="text"
                  placeholder="e.g., llama3-8b-instruct"
                  value={customModelName}
                  onChange={(e) => {
                    setCustomModelName(e.target.value);
                  }}
                  className="w-48"
                />
              </SettingsRow>

              {currentSelectedOption.provider.requiresBaseUrl && (
                <SettingsRow
                  label="Base URL"
                  description="We append /chat/completions to this URL when making requests."
                  htmlFor={baseUrlId}
                >
                  <Input
                    id={baseUrlId}
                    type="url"
                    placeholder="e.g., https://api.example.com/v1"
                    value={baseUrl}
                    onChange={(e) => {
                      setBaseUrl(e.target.value);
                    }}
                    className="w-64"
                  />
                </SettingsRow>
              )}

              {currentSelectedOption.provider.apiName ===
                "openai-compatible" && (
                <SettingsRow
                  label="Maximum input tokens"
                  description="The maximum number of tokens to send to the model."
                  htmlFor={maxInputTokensId}
                >
                  <Input
                    id={maxInputTokensId}
                    type="number"
                    min="1"
                    placeholder="e.g., 4096"
                    value={maxInputTokens}
                    onChange={(e) => {
                      setMaxInputTokens(e.target.value);
                    }}
                    className="w-24 text-right tabular-nums"
                  />
                </SettingsRow>
              )}
            </>
          )}

          {/* Input Token Limit for Regular Models */}
          {currentSelectedOption &&
            !currentSelectedOption.provider.isCustomProvider && (
              <SettingsRow
                label="Input token limit"
                description={
                  currentSelectedOption.model?.inputTokenLimit
                    ? `Maximum: ${currentSelectedOption.model.inputTokenLimit.toLocaleString()}`
                    : "Limits the number of tokens sent to the model."
                }
                htmlFor={maxInputTokensId}
              >
                <Input
                  id={maxInputTokensId}
                  type="number"
                  min="1"
                  max={currentSelectedOption.model?.inputTokenLimit}
                  placeholder={`${currentSelectedOption.model?.inputTokenLimit ?? 4096}`}
                  value={maxInputTokens}
                  onChange={(e) => {
                    setMaxInputTokens(e.target.value);
                  }}
                  onBlur={() => {
                    if (hasActualChanges) {
                      handleSaveDefaults().catch(console.error);
                    }
                  }}
                  className="w-24 text-right tabular-nums"
                />
              </SettingsRow>
            )}

          {/* API Key Section */}
          {currentSelectedOption && (
            <div className="py-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    API key for {currentSelectedOption.provider.displayName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your provider API key for authenticating LLM requests.
                  </p>
                </div>
                {!isEditingApiKey && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      setIsEditingApiKey(true);
                      setApiKeyInput("");
                    }}
                  >
                    {currentApiKeyRecord ? "Edit" : "Add"}
                  </Button>
                )}
              </div>
              {isEditingApiKey ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setIsEditingApiKey(false);
                            setApiKeyInput("");
                          }
                        }}
                        placeholder="Enter your LLM provider key"
                        autoFocus
                        className={cn(
                          "pr-8",
                          !apiKeyValidation?.isValid &&
                            apiKeyInput &&
                            "border-destructive",
                        )}
                      />
                      {isValidatingApiKey && (
                        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingApiKey(false);
                        setApiKeyInput("");
                      }}
                      disabled={isUpdatingApiKey}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveApiKey}
                      disabled={
                        isUpdatingApiKey ||
                        isValidatingApiKey ||
                        (!(apiKeyInput || "").trim() &&
                          !["openai", "openai-compatible"].includes(
                            parsedSelection.provider || "",
                          )) ||
                        (!apiKeyValidation?.isValid &&
                          !!(apiKeyInput || "").trim())
                      }
                    >
                      {isUpdatingApiKey ? "Saving..." : "Save"}
                    </Button>
                  </div>

                  {apiKeyInput &&
                    apiKeyValidation &&
                    !apiKeyValidation.isValid && (
                      <p className="text-sm text-destructive">
                        {apiKeyValidation.error}
                      </p>
                    )}
                  {apiKeyInput && apiKeyValidation?.isValid && (
                    <p className="text-sm text-green-600">✓ API key is valid</p>
                  )}
                </div>
              ) : (
                <code className="block truncate rounded-md border bg-background px-2 py-1.5 font-mono text-sm">
                  {maskedApiKeyDisplay}
                </code>
              )}
            </div>
          )}

          {/* Custom LLM Parameters Section */}
          {currentSelectedOption && (
            <CustomLlmParametersEditor
              projectId={projectId}
              selectedProvider={parsedSelection.provider}
              selectedModel={parsedSelection.model}
              onEdited={onEdited}
            />
          )}
          {showValidationErrors && !combinedSelectValue && (
            <p className="text-sm text-destructive mt-1 px-4">
              Please select a provider and model
            </p>
          )}
        </>
      )}

      {/* Agent Settings */}
      <AnimatePresence mode="wait">
        {mode === AiProviderType.AGENT && (
          <div>
            <AgentSettings
              agentProvider={agentProvider}
              setAgentProvider={setAgentProvider}
              agentUrl={agentUrl}
              setAgentUrl={setAgentUrl}
              showValidationErrors={showValidationErrors}
              agentName={agentName}
              setAgentName={setAgentName}
              agentHeaders={agentHeaders}
              setAgentHeaders={setAgentHeaders}
            />
            <div className="flex items-center justify-end gap-3 border-t border-border py-4">
              {!agentUrl.trim() && (
                <p className="text-sm text-muted-foreground">
                  Agent provider and URL are required to save.
                </p>
              )}
              <Button
                size="sm"
                onClick={handleSaveDefaults}
                disabled={isSavingAgent || !agentUrl.trim()}
              >
                {isSavingAgent ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// Export the interactable version
export const InteractableProviderKeySection = withTamboInteractable(
  ProviderKeySectionBase,
  {
    componentName: COMPONENT_NAME,
    description:
      "Manages LLM and Agent provider configuration for a project. Allows switching between LLM mode (traditional language models) and Agent mode (custom agent endpoints). In LLM mode, users can select providers (OpenAI, Anthropic, OpenAI-compatible, etc.), choose models, configure API keys, set custom model names and base URLs for compatible providers, and adjust input token limits. In Agent mode, users can configure custom agent URLs and metadata. This component validates API keys, handles free message limits for OpenAI's default model, and saves all configuration changes to the project.",
    propsSchema: InteractableProviderKeySectionProps,
  },
);
