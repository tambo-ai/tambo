import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api, type RouterOutputs } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLinkIcon, InfoIcon, KeyRound, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ProviderKeySectionProps {
  project: RouterOutputs["project"]["getUserProjects"][number];
}

const sectionAnimationVariants = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: "easeInOut" },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

const shortTransition = { duration: 0.2 };

export const FREE_MESSAGE_LIMIT = 500;

export function ProviderKeySection({ project }: ProviderKeySectionProps) {
  const { toast } = useToast();

  // --- TRPC API Calls ---
  const { data: llmProviderConfigData, isLoading: isLoadingLlmProviderConfig } =
    api.llm.getLlmProviderConfig.useQuery(undefined, {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    });

  const {
    data: projectLlmSettings,
    isLoading: isLoadingProjectSettingsInitial,
    refetch: refetchProjectLlmSettings,
  } = api.project.getProjectLlmSettings.useQuery(
    { projectId: project.id },
    {
      enabled: !!project.id,
    },
  );

  const { data: messageUsage, isLoading: isLoadingMessageUsage } =
    api.project.getProjectMessageUsage.useQuery(
      { projectId: project.id },
      {
        enabled: !!project.id,
      },
    );

  const {
    data: storedApiKeys,
    isLoading: isLoadingStoredKeysInitial,
    refetch: refetchStoredApiKeys,
  } = api.project.getProviderKeys.useQuery(project.id, {
    enabled: !!project.id,
  });

  // --- UI State ---
  const [selectedProviderApiName, setSelectedProviderApiName] = useState<
    string | undefined
  >();
  const [selectedModelApiName, setSelectedModelApiName] = useState<
    string | undefined
  >();
  const [customModelName, setCustomModelName] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");

  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [isEditingApiKey, setIsEditingApiKey] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Effect for initializing state from fetched projectLlmSettings
  useEffect(() => {
    if (projectLlmSettings) {
      const data = projectLlmSettings;
      // If no provider is set, find and set OpenAI as default
      if (!data.defaultLlmProviderName && llmProviderConfigData) {
        const openaiProvider = Object.values(llmProviderConfigData).find(
          (provider) => provider.apiName === "openai",
        );
        if (openaiProvider) {
          setSelectedProviderApiName("openai");
          setSelectedModelApiName("gpt-4o-mini");
          return;
        }
      }

      setSelectedProviderApiName(data.defaultLlmProviderName ?? undefined);
      if (data.defaultLlmProviderName === "openai-compatible") {
        setCustomModelName(data.customLlmModelName ?? "");
        setSelectedModelApiName(undefined);
      } else {
        // If OpenAI is selected and no model is set, default to gpt-4o-mini
        if (
          data.defaultLlmProviderName === "openai" &&
          !data.defaultLlmModelName
        ) {
          setSelectedModelApiName("gpt-4o-mini");
        } else {
          setSelectedModelApiName(data.defaultLlmModelName ?? undefined);
        }
        setCustomModelName("");
      }
      setBaseUrl(data.customLlmBaseURL ?? "");
      setHasUnsavedChanges(false);
    }
  }, [projectLlmSettings, llmProviderConfigData]);

  // --- TRPC Mutations ---
  const { mutate: updateLlmSettings, isPending: isSavingDefaults } =
    api.project.updateProjectLlmSettings.useMutation({
      onSuccess: async () => {
        toast({
          title: "Success",
          description: "LLM configuration saved.",
        });
        setHasUnsavedChanges(false);
        await refetchProjectLlmSettings();
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
        await refetchStoredApiKeys();
        setIsEditingApiKey(false);
        setApiKeyInput("");
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to save API key: ${error.message}`,
          variant: "destructive",
        });
      },
    });

  // --- Derived State & Data (using TRPC data now) ---
  const llmProvidersArray = llmProviderConfigData
    ? Object.values(llmProviderConfigData)
    : [];

  const currentProviderConfig =
    selectedProviderApiName && llmProviderConfigData
      ? llmProviderConfigData[selectedProviderApiName]
      : undefined;

  const availableModelsArray =
    currentProviderConfig && !currentProviderConfig.isCustomProvider
      ? Object.values(currentProviderConfig.models ?? {})
      : [];
  const currentModelConfig =
    currentProviderConfig &&
    !currentProviderConfig.isCustomProvider &&
    selectedModelApiName &&
    currentProviderConfig.models
      ? currentProviderConfig.models[selectedModelApiName]
      : undefined;

  const currentApiKeyRecord = storedApiKeys?.find(
    (k) => k.providerName === selectedProviderApiName,
  );
  const maskedApiKeyDisplay = isLoadingStoredKeysInitial
    ? "Loading..."
    : currentApiKeyRecord
      ? currentApiKeyRecord.partiallyHiddenKey || "s•••••••••••••••••••••••key"
      : selectedProviderApiName === "openai" || !selectedProviderApiName
        ? messageUsage?.messageCount &&
          messageUsage.messageCount >= FREE_MESSAGE_LIMIT
          ? "free messages used, please add a key"
          : `using free messages (${messageUsage?.messageCount ?? 0}/${FREE_MESSAGE_LIMIT})`
        : "No API key set";

  // Effect to sync UI state when selectedProviderApiName changes
  useEffect(() => {
    if (selectedProviderApiName && projectLlmSettings) {
      const currentProviderFromSettings =
        projectLlmSettings.defaultLlmProviderName;
      if (selectedProviderApiName === currentProviderFromSettings) {
        if (selectedProviderApiName === "openai-compatible") {
          setCustomModelName(projectLlmSettings.customLlmModelName ?? "");
          setSelectedModelApiName(undefined);
          setBaseUrl(projectLlmSettings.customLlmBaseURL ?? "");
        } else {
          // If OpenAI is selected and no model is set, default to gpt-4o-mini
          if (
            selectedProviderApiName === "openai" &&
            !projectLlmSettings.defaultLlmModelName
          ) {
            setSelectedModelApiName("gpt-4o-mini");
          } else {
            setSelectedModelApiName(
              projectLlmSettings.defaultLlmModelName ?? undefined,
            );
          }
          setCustomModelName("");
          setBaseUrl("");
        }
      } else {
        // If switching to OpenAI and no model is selected, set gpt-4o-mini
        if (selectedProviderApiName === "openai") {
          setSelectedModelApiName("gpt-4o-mini");
        } else {
          setSelectedModelApiName(undefined);
        }
        setCustomModelName("");
        setBaseUrl("");
      }
    } else if (selectedProviderApiName) {
      if (selectedProviderApiName === "openai") {
        setSelectedModelApiName("gpt-4o-mini");
      } else if (selectedProviderApiName !== "openai-compatible") {
        setCustomModelName("");
        setBaseUrl("");
        setSelectedModelApiName(undefined);
      }
    }
  }, [selectedProviderApiName, projectLlmSettings]);

  // --- Event Handlers (basic implementation for UI interaction) ---
  const handleProviderSelect = useCallback((apiName: string) => {
    setSelectedProviderApiName(apiName);
    setSelectedModelApiName(undefined);
    setCustomModelName("");
    setBaseUrl("");
    setApiKeyInput("");
    setIsEditingApiKey(false);
    setHasUnsavedChanges(true);
  }, []);

  const handleModelSelect = useCallback((modelApiName: string) => {
    setSelectedModelApiName(modelApiName);
    setHasUnsavedChanges(true);
  }, []);

  const handleSaveDefaults = useCallback(() => {
    setShowValidationErrors(true);

    if (!selectedProviderApiName) {
      toast({
        title: "Error",
        description: "Please select a provider first.",
        variant: "destructive",
      });
      return;
    }

    // Check if API key is required and present
    if (
      selectedProviderApiName !== "openai" &&
      !currentApiKeyRecord?.partiallyHiddenKey
    ) {
      toast({
        title: "Error",
        description:
          "Please add an API key before saving settings for this provider.",
        variant: "destructive",
      });
      return;
    }

    let modelToSave: string | null = null;
    let customNameToSave: string | null = null;

    if (currentProviderConfig?.isCustomProvider) {
      if (!customModelName.trim()) {
        toast({
          title: "Error",
          description: "Model Name is required for this provider.",
          variant: "destructive",
        });
        return;
      }
      modelToSave = null;
      customNameToSave = customModelName.trim();
    } else {
      if (!selectedModelApiName) {
        toast({
          title: "Error",
          description: "Please select a model.",
          variant: "destructive",
        });
        return;
      }
      modelToSave = selectedModelApiName;
      customNameToSave = null;
    }

    let baseUrlToSave: string | null = null;
    if (currentProviderConfig?.apiName === "openai-compatible") {
      if (
        currentProviderConfig.requiresBaseUrl &&
        (!baseUrl || !baseUrl.trim())
      ) {
        toast({
          title: "Error",
          description:
            "Base URL is required for this OpenAI Compatible provider.",
          variant: "destructive",
        });
        return;
      }
      baseUrlToSave = baseUrl.trim() || null;
    }

    // If we made it here, clear validation errors and save
    setShowValidationErrors(false);
    updateLlmSettings({
      projectId: project.id,
      defaultLlmProviderName: selectedProviderApiName,
      defaultLlmModelName: modelToSave,
      customLlmModelName: customNameToSave,
      customLlmBaseURL: baseUrlToSave,
    });
  }, [
    selectedProviderApiName,
    currentProviderConfig,
    customModelName,
    selectedModelApiName,
    baseUrl,
    updateLlmSettings,
    project.id,
    toast,
    currentApiKeyRecord,
    setShowValidationErrors,
  ]);

  const handleSaveApiKey = useCallback(() => {
    if (!selectedProviderApiName) {
      toast({
        title: "Error",
        description: "Please select a provider first.",
        variant: "destructive",
      });
      return;
    }

    // Allow empty key for OpenAI to switch back to free messages
    if (
      currentProviderConfig?.apiName !== "openai" && // Changed from openai-compatible
      currentProviderConfig?.apiName !== "openai-compatible" &&
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
      provider: selectedProviderApiName,
      providerKey: apiKeyInput.trim() || undefined,
    });
  }, [
    selectedProviderApiName,
    apiKeyInput,
    addOrUpdateApiKey,
    project.id,
    toast,
    currentProviderConfig,
  ]);

  // --- UI Rendering ---
  const isLoadingInitialData =
    isLoadingLlmProviderConfig || isLoadingProjectSettingsInitial;

  if (isLoadingInitialData) {
    return (
      <Card className="overflow-hidden rounded-md border">
        <CardHeader>
          <CardTitle className="font-heading text-base font-semibold">
            LLM Configuration
          </CardTitle>
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

  return (
    <Card className="overflow-hidden rounded-md border">
      <CardHeader className="pb-0 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-base font-semibold">
            LLM Configuration
          </CardTitle>
          {hasUnsavedChanges && (
            <Button
              size="sm"
              onClick={handleSaveDefaults}
              disabled={isSavingDefaults}
            >
              {isSavingDefaults ? "Saving..." : "Save Settings"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="provider-select">Provider</Label>
          <Select
            value={selectedProviderApiName}
            onValueChange={handleProviderSelect}
            disabled={isLoadingLlmProviderConfig}
          >
            <SelectTrigger id="provider-select" className="w-full">
              <SelectValue
                placeholder={
                  isLoadingLlmProviderConfig
                    ? "Loading providers..."
                    : "Select a provider"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {llmProvidersArray.map((provider, index) => (
                <SelectItem
                  key={`${index}-${provider.apiName}`}
                  value={provider.apiName}
                >
                  {provider.displayName}
                  {provider.isDefaultProvider && " (default)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AnimatePresence mode="wait">
          {currentProviderConfig ? (
            <motion.div
              key={selectedProviderApiName || "provider_config"}
              variants={sectionAnimationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4 overflow-hidden rounded-md border bg-muted/10 p-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="mb-1 text-sm font-medium">
                  Configure {currentProviderConfig.displayName}
                </h4>
                {currentProviderConfig.docLinkRoot && (
                  <a
                    href={currentProviderConfig.docLinkRoot}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${currentProviderConfig.displayName} Documentation`}
                  >
                    <ExternalLinkIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </a>
                )}
              </div>

              {!currentProviderConfig.isCustomProvider ? (
                <div className="space-y-2">
                  <Label htmlFor="model-select">Model</Label>
                  <Select
                    value={selectedModelApiName}
                    onValueChange={handleModelSelect}
                    disabled={
                      isLoadingLlmProviderConfig ||
                      availableModelsArray.length === 0
                    }
                  >
                    <SelectTrigger id="model-select" className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingLlmProviderConfig
                            ? "Loading models..."
                            : availableModelsArray.length === 0
                              ? "No models configured for this provider"
                              : "Select a model"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModelsArray.map((model) => (
                        <SelectItem key={model.apiName} value={model.apiName}>
                          <div className="flex w-full items-center justify-between">
                            <span>
                              {model.displayName}
                              {model.isDefaultModel && " (default)"}
                            </span>
                            {model.status && (
                              <span
                                className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                                  model.status === "untested"
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {model.status.charAt(0).toUpperCase() +
                                  model.status.slice(1)}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValidationErrors && !selectedModelApiName && (
                    <p className="text-sm text-destructive mt-1">
                      Model selection is required
                    </p>
                  )}
                  {currentModelConfig && (
                    <div className="space-y-0.5 pt-1 text-xs text-muted-foreground">
                      {currentModelConfig.notes && (
                        <p className="mb-2 flex items-start">
                          <InfoIcon className="mr-1.5 mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                          {currentModelConfig.notes}
                        </p>
                      )}
                      {currentModelConfig.docLink && (
                        <a
                          href={currentModelConfig.docLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-link text-xs hover:underline"
                        >
                          <ExternalLinkIcon className="mr-1 h-3 w-3" />
                          Model Documentation
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-model-name-compatible">
                      Model Name
                    </Label>
                    <Input
                      id="custom-model-name-compatible"
                      type="text"
                      placeholder="e.g., llama3-8b-instruct, user/my-model-v1"
                      value={customModelName}
                      onChange={(e) => {
                        setCustomModelName(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                    />
                    {showValidationErrors && !customModelName.trim() && (
                      <p className="text-sm text-destructive mt-1">
                        Model name is required
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Enter the exact model name your OpenAI-compatible endpoint
                      expects.
                    </p>
                  </div>
                  {currentProviderConfig.requiresBaseUrl && (
                    <div className="space-y-2">
                      <Label htmlFor="base-url">Base URL</Label>
                      <Input
                        id="base-url"
                        type="url"
                        placeholder="e.g., https://example-provider.com/v1"
                        value={baseUrl}
                        onChange={(e) => {
                          setBaseUrl(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        The API endpoint URL for your compatible provider.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 border-t border-border/60 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    API Key
                    {currentProviderConfig.displayName !==
                      "OpenAI Compatible" &&
                      ` for ${currentProviderConfig.displayName}`}
                    {currentProviderConfig.displayName ===
                      "OpenAI Compatible" && " (Optional)"}
                  </Label>
                  {!isEditingApiKey && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-sans"
                      onClick={() => {
                        setIsEditingApiKey(true);
                        setApiKeyInput("");
                      }}
                      disabled={isLoadingStoredKeysInitial}
                    >
                      <KeyRound className="mr-1.5 h-3 w-3" />
                      {currentApiKeyRecord ? "Update Key" : "Add Key"}
                    </Button>
                  )}
                </div>

                {isEditingApiKey ? (
                  <motion.div
                    key="edit-api-key-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={shortTransition}
                    className="space-y-2 overflow-hidden"
                  >
                    <Input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={
                        currentProviderConfig?.apiName === "openai"
                          ? "Enter API Key or leave empty to use free messages"
                          : `Enter API Key${
                              currentProviderConfig?.displayName !==
                              "OpenAI Compatible"
                                ? ` for ${currentProviderConfig?.displayName}`
                                : ""
                            }`
                      }
                      autoFocus
                      className="w-full font-sans"
                    />
                    <div className="flex justify-end gap-2">
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
                      <Button
                        size="sm"
                        className="font-sans"
                        onClick={handleSaveApiKey}
                        disabled={
                          isUpdatingApiKey ||
                          (!apiKeyInput.trim() &&
                            currentProviderConfig?.apiName !== "openai" &&
                            currentProviderConfig?.apiName !==
                              "openai-compatible")
                        }
                      >
                        {isUpdatingApiKey ? (
                          "Saving..."
                        ) : (
                          <>
                            <Save className="mr-1.5 h-3 w-3" />
                            Save Key
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="display-api-key"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={shortTransition}
                  >
                    {isLoadingStoredKeysInitial ? (
                      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                    ) : (
                      <code className="block truncate rounded-md border bg-background px-2 py-1.5 font-mono text-sm">
                        {maskedApiKeyDisplay}
                      </code>
                    )}
                  </motion.div>
                )}
                {currentProviderConfig.apiKeyLink && (
                  <p className="pt-1 text-xs text-muted-foreground">
                    Need an API key?{" "}
                    <a
                      href={currentProviderConfig.apiKeyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-link hover:underline"
                    >
                      Get one from {currentProviderConfig.displayName}
                      <ExternalLinkIcon className="ml-1 h-3 w-3" />
                    </a>
                  </p>
                )}
              </div>
            </motion.div>
          ) : selectedProviderApiName && !isLoadingLlmProviderConfig ? (
            <motion.div
              key="provider_specific_skeleton"
              variants={sectionAnimationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="overflow-hidden"
            >
              <div className="mt-4 h-40 w-full animate-pulse space-y-4 rounded-md bg-muted p-4">
                <div className="h-10 rounded bg-muted-foreground/10" />
                <div className="h-16 rounded bg-muted-foreground/10" />
              </div>
            </motion.div>
          ) : !selectedProviderApiName && !isLoadingLlmProviderConfig ? (
            <motion.div
              key="select_provider_placeholder"
              variants={sectionAnimationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="overflow-hidden text-center"
            >
              <p className="py-6 text-sm text-muted-foreground">
                Select a provider to configure its models and API key.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
