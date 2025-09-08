import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";
import {
  AGENT_PROVIDER_REGISTRY,
  AgentProviderType,
  AiProviderType,
  DEFAULT_OPENAI_MODEL,
} from "@tambo-ai-cloud/core";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronsUpDown,
  ExternalLinkIcon,
  InfoIcon,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { z } from "zod";

function getAgentProviderLabel(type: AgentProviderType): string {
  const info = AGENT_PROVIDER_REGISTRY.find((p) => p.type === type);
  if (!info) return String(type);
  return info.isSupported ? info.name : `${info.name} (coming soon)`;
}

export const ProviderKeySectionSchema = z
  .object({
    id: z.string().describe("The unique identifier for the project."),
    name: z.string().describe("The name of the project."),
  })
  .describe("Project data from the router output.");

export const ProviderKeySectionProps = z.object({
  project: z
    .lazy(() =>
      ProviderKeySectionSchema.describe(
        "The project to configure LLM providers for.",
      ),
    )
    .optional()
    .describe("Props for the ProviderKeySection component."),
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe(
      "Optional callback function triggered when settings are successfully updated.",
    ),
});

interface ProviderKeySectionProps {
  project?: RouterOutputs["project"]["getUserProjects"][number];
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
    properties?: {
      inputTokenLimit?: number;
    };
  };
}

export const FREE_MESSAGE_LIMIT = 500;

export function ProviderKeySection({
  project,
  onEdited,
}: ProviderKeySectionProps) {
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
    { projectId: project?.id ?? "" },
    { enabled: !!project?.id },
  );

  const { data: messageUsage } = api.project.getProjectMessageUsage.useQuery(
    { projectId: project?.id ?? "" },
    { enabled: !!project?.id },
  );

  const {
    data: storedApiKeys,
    isLoading: isLoadingKeys,
    refetch: refetchKeys,
  } = api.project.getProviderKeys.useQuery(project?.id ?? "", {
    enabled: !!project?.id,
  });

  const { data: projectMessageUsage } =
    api.project.getProjectMessageUsage.useQuery(
      { projectId: project?.id ?? "" },
      {
        enabled: !!project?.id,
      },
    );

  // --- State Management ---
  const [mode, setMode] = useState<AiProviderType>(AiProviderType.LLM);
  const [combinedSelectValue, setCombinedSelectValue] = useState<string>("");
  const [combinedSelectOpen, setCombinedSelectOpen] = useState(false);
  const [customModelName, setCustomModelName] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [maxInputTokens, setMaxInputTokens] = useState<string>("");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [isEditingApiKey, setIsEditingApiKey] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Agent settings state
  const [agentProvider, setAgentProvider] = useState<AgentProviderType>(
    AgentProviderType.CREWAI,
  );
  const [agentUrl, setAgentUrl] = useState<string>("");
  const [agentName, setAgentName] = useState<string>("");

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
              properties: model.properties,
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
    if (hydratedRef !== project?.id) {
      if (projectLlmSettings.agentProviderType) {
        setAgentProvider(projectLlmSettings.agentProviderType);
      }
      setAgentUrl(projectLlmSettings.agentUrl ?? "");
      setAgentName(projectLlmSettings.agentName ?? "");
      agentHydratedRef.current = project?.id ?? null;
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
        if (modelConfig?.properties?.inputTokenLimit) {
          setMaxInputTokens(modelConfig.properties.inputTokenLimit.toString());
        }
      }
    }

    setHasUnsavedChanges(false);
  }, [project?.id, projectLlmSettings, llmProviderConfigData]);

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
        setHasUnsavedChanges(false);
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
        setHasUnsavedChanges(false);
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

  const maskedApiKeyDisplay = isLoadingKeys
    ? "Loading..."
    : currentApiKeyRecord
      ? currentApiKeyRecord.partiallyHiddenKey || "sk•••••••••••••••••••••••••"
      : canUseFreeMessages
        ? messageUsage?.messageCount &&
          messageUsage.messageCount >= FREE_MESSAGE_LIMIT
          ? "free messages used, please add a key"
          : `using free messages (${messageUsage?.messageCount ?? 0}/${FREE_MESSAGE_LIMIT})`
        : "API key required";

  // --- Event Handlers ---
  const handleCombinedSelectChange = useCallback(
    (value: string) => {
      setCombinedSelectValue(value);
      setCombinedSelectOpen(false);

      // Reset fields when changing selection
      const [provider, model] = value.split("|", 2);
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
          setMaxInputTokens(projectLlmSettings.maxInputTokens.toString());
        } else {
          // Set default token limit for new model
          const option = providerModelOptions.find(
            (opt) => opt.value === value,
          );
          if (option?.model?.properties?.inputTokenLimit) {
            setMaxInputTokens(
              option.model.properties.inputTokenLimit.toString(),
            );
          } else {
            setMaxInputTokens("");
          }
        }
      }

      setApiKeyInput("");
      setIsEditingApiKey(false);
      setHasUnsavedChanges(true);
    },
    [
      providerModelOptions,
      customModelName,
      baseUrl,
      maxInputTokens,
      projectLlmSettings,
    ],
  );

  const handleSaveDefaults = useCallback(async () => {
    if (!project?.id) {
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
      if (!localAgentUrl || !localAgentName) {
        toast({
          title: "Error",
          description: "Agent URL and Agent Name are required.",
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
        projectId: project.id,
        providerType: AiProviderType.AGENT,
        agentProviderType: agentProvider,
        agentUrl: localAgentUrl,
        agentName: localAgentName,
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
        currentSelectedOption?.model?.properties?.inputTokenLimit &&
        tokens > currentSelectedOption.model.properties.inputTokenLimit
      ) {
        toast({
          title: "Error",
          description: `Input token limit cannot exceed model maximum (${currentSelectedOption.model.properties.inputTokenLimit.toLocaleString()}).`,
          variant: "destructive",
        });
        return;
      }

      maxTokensToSave = tokens;
    }

    setShowValidationErrors(false);
    // Ensure providerType is set back to LLM when saving in LLM mode.
    // Do not clear any agent fields—preserve previously saved values.
    if (project.providerType !== AiProviderType.LLM) {
      await updateAgentSettingsAsync({
        projectId: project.id,
        providerType: AiProviderType.LLM,
      });
    }

    updateLlmSettings({
      projectId: project.id,
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
    project?.id,
    project?.providerType,
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
    toast,
  ]);

  const handleSaveApiKey = useCallback(async () => {
    if (!project?.id || !parsedSelection.provider) {
      toast({
        title: "Error",
        description: "No project or provider selected.",
        variant: "destructive",
      });
      return;
    }

    if (apiKeyInput.trim() && apiKeyValidation && !apiKeyValidation.isValid) {
      toast({
        title: "Invalid API Key",
        description: apiKeyValidation.error || "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    if (
      !["openai", "openai-compatible"].includes(parsedSelection.provider) &&
      !apiKeyInput.trim()
    ) {
      toast({
        title: "Error",
        description: "API key cannot be empty for this provider.",
        variant: "destructive",
      });
      return;
    }

    addOrUpdateApiKey({
      projectId: project.id,
      provider: parsedSelection.provider,
      providerKey: apiKeyInput.trim() || undefined,
    });
  }, [
    parsedSelection.provider,
    apiKeyInput,
    apiKeyValidation,
    addOrUpdateApiKey,
    project?.id,
    toast,
  ]);

  // --- Loading State ---
  if (isLoadingConfig || isLoadingSettings) {
    return (
      <Card className="overflow-hidden rounded-md border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">LLM Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60 w-full animate-pulse space-y-4 rounded-md bg-muted p-4">
            <div className="h-10 rounded bg-muted-foreground/10" />
            <div className="h-24 rounded bg-muted-foreground/10" />
            <div className="h-10 rounded bg-muted-foreground/10" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card className="border rounded-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">LLM Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">No project selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-md border">
      <CardHeader className="pb-0 pt-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">LLM Providers</CardTitle>
          {hasUnsavedChanges && (
            <Button
              size="sm"
              className="font-sans bg-transparent border hover:bg-accent"
              onClick={handleSaveDefaults}
              disabled={isSavingDefaults}
            >
              {isSavingDefaults || isSavingAgent ? (
                <span className="text-primary">Saving...</span>
              ) : (
                <span className="text-primary">Save Settings</span>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      {/* usage chip moved below mode toggle */}
      <CardContent className="space-y-4 p-6">
        {/* Mode Toggle */}
        <div className="max-w-xl">
          <Label className="mb-2 block">AI Mode</Label>
          <RadioGroup
            value={mode}
            onValueChange={(v) => {
              setMode(v as AiProviderType);
              setHasUnsavedChanges(true);
            }}
            className="grid grid-cols-2 gap-3"
          >
            <label
              className={cn(
                "flex items-center gap-2 rounded-md border p-3",
                mode === AiProviderType.LLM && "border-primary",
              )}
            >
              <RadioGroupItem value={AiProviderType.LLM} id="mode-llm" />
              <span className="text-sm">LLM</span>
            </label>
            <label
              className={cn(
                "flex items-center gap-2 rounded-md border p-3",
                mode === AiProviderType.AGENT && "border-primary",
              )}
            >
              <RadioGroupItem value={AiProviderType.AGENT} id="mode-agent" />
              <span className="text-sm">Agent</span>
              <span className="ml-2 text-[10px] uppercase tracking-wide rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-800">
                beta
              </span>
            </label>
          </RadioGroup>
        </div>

        {mode === AiProviderType.LLM && (
          <div className="max-w-xl">
            <p className="text-sm font-sans text-foreground max-w-sm">
              Tambo offers 500 free messages. Once the limit is reached,
              you&apos;ll have to add your API key to your project.
            </p>
            <div className="flex items-center gap-2 mt-2 mb-2">
              <p className="text-xs font-sans text-success max-w-xs bg-success-background rounded-full p-2">
                {projectMessageUsage?.messageCount} out of 500 messages used
              </p>
            </div>
          </div>
        )}

        {/* Provider • Model Select (LLM Mode) */}
        <div className="space-y-2 max-w-xl">
          <AnimatePresence initial={false} mode="wait">
            {mode === AiProviderType.LLM && (
              <motion.div
                key="llm-settings"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Label htmlFor="provider-model-select">Provider • Model</Label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {mode === AiProviderType.LLM && (
          <>
            <Popover
              open={combinedSelectOpen}
              onOpenChange={setCombinedSelectOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={combinedSelectOpen}
                  className="w-full justify-between h-10 font-normal"
                >
                  {currentSelectedOption ? (
                    <span className="truncate">
                      {currentSelectedOption.label}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Select provider and model
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Search providers and models..." />
                  <CommandList>
                    <CommandEmpty>No provider or model found.</CommandEmpty>
                    <CommandGroup>
                      {providerModelOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={handleCombinedSelectChange}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                combinedSelectValue === option.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span className="truncate">{option.label}</span>
                          </div>
                          {option.model?.status && (
                            <span
                              className={cn(
                                "ml-2 rounded-full px-1.5 py-0.5 text-xs",
                                option.model.status === "untested"
                                  ? "bg-gray-200 text-gray-700"
                                  : option.model.status === "known-issues"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700",
                              )}
                            >
                              {option.model.status}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <div className="border-t p-2 flex items-center justify-between text-xs">
                      <a
                        href="https://github.com/tambo-ai/tambo-cloud/issues/new?template=feature_request.md&title=Add%20support%20for%20[Model%20Name]"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-foreground hover:text-primary transition-colors"
                      >
                        Request support for another model
                        <ExternalLinkIcon className="ml-1 h-3 w-3" />
                      </a>
                      <a
                        href="https://docs.tambo.co/models/labels"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-foreground hover:text-primary transition-colors"
                      >
                        What do these labels mean?
                        <ExternalLinkIcon className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {showValidationErrors && !combinedSelectValue && (
              <p className="text-sm text-destructive mt-1">
                Please select a provider and model
              </p>
            )}

            <AnimatePresence mode="wait">
              {mode === AiProviderType.LLM && currentSelectedOption && (
                <motion.div
                  key={combinedSelectValue + "-llm"}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-4 rounded-md max-w-xl"
                >
                  {/* Model Information */}
                  {currentSelectedOption.model?.notes && (
                    <div className="space-y-2 text-xs text-foreground">
                      <p className="flex items-start">
                        <InfoIcon className="mr-1.5 mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        {currentSelectedOption.model.notes}
                      </p>
                      <div className="flex items-start space-x-2">
                        {currentSelectedOption.model.docLink && (
                          <a
                            href={currentSelectedOption.model.docLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-link text-xs hover:underline"
                          >
                            Learn more
                            <ExternalLinkIcon className="ml-1 h-3 w-3" />
                          </a>
                        )}
                        <a
                          href="https://github.com/tambo-ai/tambo/issues/new?template=feature_request.md&title=Add%20support%20for%20[Model%20Name]"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-link text-xs hover:underline"
                        >
                          Request support for another model
                          <ExternalLinkIcon className="ml-1 h-3 w-3" />
                        </a>
                        <a
                          href="https://docs.tambo.co/models/labels"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-link text-xs hover:underline"
                        >
                          Docs
                          <ExternalLinkIcon className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Custom Provider Fields */}
                  {currentSelectedOption.provider.isCustomProvider && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="custom-model-name">Model Name</Label>
                        <Input
                          id="custom-model-name"
                          type="text"
                          placeholder="e.g., llama3-8b-instruct"
                          value={customModelName}
                          onChange={(e) => {
                            setCustomModelName(e.target.value);
                            setHasUnsavedChanges(true);
                          }}
                        />
                        {showValidationErrors && !customModelName.trim() && (
                          <p className="text-sm text-destructive">
                            Model name is required
                          </p>
                        )}
                      </div>

                      {currentSelectedOption.provider.requiresBaseUrl && (
                        <div className="space-y-2">
                          <Label htmlFor="base-url">Base URL</Label>
                          <Input
                            id="base-url"
                            type="url"
                            placeholder="e.g., https://api.example.com/v1"
                            value={baseUrl}
                            onChange={(e) => {
                              setBaseUrl(e.target.value);
                              setHasUnsavedChanges(true);
                            }}
                          />
                          {showValidationErrors && !baseUrl.trim() && (
                            <p className="text-sm text-destructive">
                              Base URL is required
                            </p>
                          )}
                          <p className="text-xs text-foreground">
                            Requests will be sent to{" "}
                            <span className="inline-flex rounded-md bg-muted px-2 py-0.5 font-mono">
                              {baseUrl.trim()
                                ? baseUrl.trim().replace(/\/$/, "")
                                : "<baseurl>"}
                              /chat/completions
                            </span>
                          </p>
                        </div>
                      )}

                      {currentSelectedOption.provider.apiName ===
                        "openai-compatible" && (
                        <div className="space-y-2">
                          <Label htmlFor="max-input-tokens">
                            Maximum Input Tokens
                          </Label>
                          <Input
                            id="max-input-tokens"
                            type="number"
                            min="1"
                            placeholder="e.g., 4096"
                            value={maxInputTokens}
                            onChange={(e) => {
                              setMaxInputTokens(e.target.value);
                              setHasUnsavedChanges(true);
                            }}
                          />
                          {showValidationErrors &&
                            (!maxInputTokens ||
                              Number(maxInputTokens) <= 0) && (
                              <p className="text-sm text-destructive">
                                Please enter a valid token limit
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input Token Limit for Regular Models */}
                  {!currentSelectedOption.provider.isCustomProvider && (
                    <div className="space-y-2">
                      <Label htmlFor="max-input-tokens">
                        Input Token Limit
                      </Label>
                      <Input
                        id="max-input-tokens"
                        type="number"
                        min="1"
                        max={
                          currentSelectedOption.model?.properties
                            ?.inputTokenLimit
                        }
                        placeholder={`${currentSelectedOption.model?.properties?.inputTokenLimit ?? 4096}`}
                        value={maxInputTokens}
                        onChange={(e) => {
                          setMaxInputTokens(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                      />
                      <p className="text-xs text-foreground">
                        Tambo will limit the number of tokens sent to the model
                        to this value.
                        {currentSelectedOption.model?.properties
                          ?.inputTokenLimit && (
                          <span>
                            {" "}
                            Maximum:{" "}
                            {currentSelectedOption.model.properties.inputTokenLimit.toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* API Key Section */}
                  <div className="space-y-2">
                    <Label>
                      API Key for {currentSelectedOption.provider.displayName}
                    </Label>
                    {isEditingApiKey ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-2"
                      >
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              type="password"
                              value={apiKeyInput}
                              onChange={(e) => setApiKeyInput(e.target.value)}
                              placeholder={
                                parsedSelection.provider === "openai"
                                  ? "Enter API Key or leave empty for free messages"
                                  : "Enter API Key"
                              }
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
                            onClick={handleSaveApiKey}
                            disabled={
                              isUpdatingApiKey ||
                              isValidatingApiKey ||
                              (!apiKeyInput.trim() &&
                                !["openai", "openai-compatible"].includes(
                                  parsedSelection.provider || "",
                                )) ||
                              (!apiKeyValidation?.isValid &&
                                !!apiKeyInput.trim())
                            }
                          >
                            {isUpdatingApiKey ? "Saving..." : "Save Key"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsEditingApiKey(false);
                              setApiKeyInput("");
                            }}
                            disabled={isUpdatingApiKey}
                          >
                            Cancel
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
                          <p className="text-sm text-green-600">
                            ✓ API key is valid
                          </p>
                        )}
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="block truncate rounded-md border bg-background px-2 py-1.5 font-mono text-sm flex-1">
                          {maskedApiKeyDisplay}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditingApiKey(true);
                            setApiKeyInput("");
                          }}
                        >
                          {currentApiKeyRecord ? "Update Key" : "Add Key"}
                        </Button>
                      </div>
                    )}

                    {currentSelectedOption.provider.apiKeyLink && (
                      <p className="text-xs text-foreground">
                        Need an API key?{" "}
                        <a
                          href={currentSelectedOption.provider.apiKeyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-link hover:underline"
                        >
                          Get one from{" "}
                          {currentSelectedOption.provider.displayName}
                          <ExternalLinkIcon className="ml-1 h-3 w-3" />
                        </a>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Agent Settings */}
        <AnimatePresence mode="wait">
          {mode === AiProviderType.AGENT && (
            <motion.div
              key="agent-settings"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-4 rounded-md max-w-xl"
            >
              <div className="space-y-2">
                <Label htmlFor="agent-provider">Agent Provider</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-10 font-normal"
                    >
                      <span className="truncate">
                        {getAgentProviderLabel(agentProvider)}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Search agent providers..." />
                      <CommandList>
                        <CommandEmpty>No provider found.</CommandEmpty>
                        <CommandGroup>
                          {AGENT_PROVIDER_REGISTRY.map((provider) => (
                            <CommandItem
                              key={provider.type}
                              value={provider.type}
                              disabled={!provider.isSupported}
                              onSelect={() => {
                                if (!provider.isSupported) return;
                                setAgentProvider(provider.type);
                                setHasUnsavedChanges(true);
                              }}
                            >
                              {getAgentProviderLabel(provider.type)}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-url">Agent URL</Label>
                <Input
                  id="agent-url"
                  type="url"
                  placeholder="e.g., https://my-agent.example.com"
                  value={agentUrl}
                  onChange={(e) => {
                    setAgentUrl(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                />
                {showValidationErrors && !agentUrl.trim() && (
                  <p className="text-sm text-destructive">
                    Agent URL is required
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input
                  id="agent-name"
                  type="text"
                  placeholder="e.g., tambo-agent"
                  value={agentName}
                  onChange={(e) => {
                    setAgentName(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                />
                <p className="text-xs text-foreground">
                  Optional. Some agent providers require an agent name to route
                  requests correctly.
                </p>
                {showValidationErrors && !agentName.trim() && (
                  <p className="text-sm text-destructive">
                    Agent name is required
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
