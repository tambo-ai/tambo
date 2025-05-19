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
import { api } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLinkIcon, InfoIcon, KeyRound, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type RouterOutputs } from "@/trpc/react";

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

  // Effect for initializing state from fetched projectLlmSettings
  useEffect(() => {
    if (projectLlmSettings) {
      const data = projectLlmSettings;
      setSelectedProviderApiName(data.defaultLlmProviderName ?? undefined);
      if (data.defaultLlmProviderName === "openai-compatible") {
        setCustomModelName(data.customLlmModelName ?? "");
        setSelectedModelApiName(undefined);
      } else {
        setSelectedModelApiName(data.defaultLlmModelName ?? undefined);
        setCustomModelName("");
      }
      setBaseUrl(data.customLlmBaseURL ?? "");
    }
  }, [projectLlmSettings]);

  // --- TRPC Mutations ---
  const { mutate: updateLlmSettings, isPending: isSavingDefaults } =
    api.project.updateProjectLlmSettings.useMutation({
      onSuccess: async () => {
        toast({
          title: "Success",
          description: "LLM configuration saved.",
        });
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
      : "No API key set";

  // Effect to sync UI state when selectedProviderApiName changes,
  // especially after projectLlmSettings might have set it initially.
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
          setSelectedModelApiName(
            projectLlmSettings.defaultLlmModelName ?? undefined,
          );
          setCustomModelName("");
          setBaseUrl("");
        }
      } else {
        setSelectedModelApiName(undefined);
        setCustomModelName("");
        setBaseUrl("");
      }
    } else if (selectedProviderApiName) {
      if (selectedProviderApiName !== "openai-compatible") {
        setCustomModelName("");
        setBaseUrl("");
      }
      setSelectedModelApiName(undefined);
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
  }, []);

  const handleModelSelect = useCallback((modelApiName: string) => {
    setSelectedModelApiName(modelApiName);
  }, []);

  const handleSaveDefaults = useCallback(() => {
    if (!selectedProviderApiName) {
      toast({
        title: "Error",
        description: "Please select a provider first.",
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
    if (
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
      <Card className="border rounded-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-heading font-semibold">
            LLM Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60 w-full bg-muted animate-pulse rounded-md p-4 space-y-4">
            <div className="h-10 bg-muted-foreground/10 rounded"></div>
            <div className="h-24 bg-muted-foreground/10 rounded"></div>
            <div className="h-10 bg-muted-foreground/10 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader className="pt-4 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-heading font-semibold">
            LLM Configuration
          </CardTitle>
          <Button
            size="sm"
            onClick={handleSaveDefaults}
            disabled={
              isSavingDefaults ||
              !selectedProviderApiName ||
              isLoadingLlmProviderConfig ||
              isLoadingProjectSettingsInitial
            }
          >
            {isSavingDefaults ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
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
              className="border rounded-md p-4 bg-muted/10 space-y-4 overflow-hidden"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium mb-1">
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
                          <div className="flex items-center justify-between w-full">
                            <span>{model.displayName}</span>
                            {model.status && (
                              <span
                                className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
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
                  {currentModelConfig && (
                    <div className="text-xs text-muted-foreground pt-1 space-y-0.5">
                      {currentModelConfig.notes && (
                        <p className="flex items-start mb-2">
                          <InfoIcon className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0" />{" "}
                          {currentModelConfig.notes}
                        </p>
                      )}
                      {currentModelConfig.docLink && (
                        <a
                          href={currentModelConfig.docLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link text-xs hover:underline inline-flex items-center"
                        >
                          <ExternalLinkIcon className="h-3 w-3 mr-1" />
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
                      onChange={(e) => setCustomModelName(e.target.value)}
                    />
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
                        placeholder="e.g., http://localhost:11434/v1"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The API endpoint URL for your compatible provider.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex justify-between items-center">
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
                      <KeyRound className="h-3 w-3 mr-1.5" />
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
                      placeholder={`Enter API Key${currentProviderConfig.displayName !== "OpenAI Compatible" ? ` for ${currentProviderConfig.displayName}` : ""}`}
                      autoFocus
                      className="w-full font-sans"
                    />
                    <div className="flex gap-2 justify-end">
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
                            currentProviderConfig.apiName !==
                              "openai-compatible")
                        }
                      >
                        {isUpdatingApiKey ? (
                          "Saving..."
                        ) : (
                          <>
                            <Save className="h-3 w-3 mr-1.5" />
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
                      <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <code className="px-2 py-1.5 bg-background text-sm font-mono rounded-md border block truncate">
                        {maskedApiKeyDisplay}
                      </code>
                    )}
                  </motion.div>
                )}
                {currentProviderConfig.apiKeyLink && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Need an API key?{" "}
                    <a
                      href={currentProviderConfig.apiKeyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link hover:underline inline-flex items-center"
                    >
                      Get one from {currentProviderConfig.displayName}{" "}
                      <ExternalLinkIcon className="h-3 w-3 ml-1" />
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
              <div className="h-40 w-full bg-muted animate-pulse rounded-md p-4 space-y-4 mt-4">
                <div className="h-10 bg-muted-foreground/10 rounded"></div>
                <div className="h-16 bg-muted-foreground/10 rounded"></div>
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
              <p className="text-sm text-muted-foreground py-6">
                Select a provider to configure its models and API key.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
