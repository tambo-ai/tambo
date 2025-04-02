"use client";

import { getSupabaseClient } from "@/app/utils/supabase";
import { Header } from "@/components/sections/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthStep } from "./components/AuthStep";
import { CreateProjectDialog } from "./components/CreateProjectDialog";
import { DeleteKeyDialog } from "./components/DeleteKeyDialog";
import { KeyStep } from "./components/KeyStep";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { ProjectStep } from "./components/ProjectStep";

// Types
type AuthProvider = "github" | "google";

type Step = "auth" | "project" | "key";

type CreateProjectDialogState = Readonly<{
  isOpen: boolean;
  name: string;
  providerKey: string;
}>;

type DeleteDialogState = Readonly<{
  isOpen: boolean;
  keyId: string;
  keyName: string;
}>;

/**
 * CLI Authentication Page Component
 *
 * Handles the complete flow for CLI authentication:
 * 1. User authentication (GitHub/Google)
 * 2. Project selection or creation
 * 3. API key generation and management
 */
export default function CLIAuthPage() {
  // State management with strict typing
  const [step, setStep] = useState<Step>("auth");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(30);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    keyId: "",
    keyName: "",
  });
  const [createDialog, setCreateDialog] = useState<CreateProjectDialogState>({
    isOpen: false,
    name: "",
    providerKey: "",
  });

  const { data: session } = useSession();
  const isAuthenticated = !!session;

  const { toast } = useToast();
  const supabase = useMemo(() => getSupabaseClient(), []);

  // Queries with configuration
  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = api.project.getUserProjects.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const {
    data: existingApiKeys,
    isLoading: apiKeysLoading,
    error: apiKeysError,
    refetch: refetchApiKeys,
  } = api.project.getApiKeys.useQuery(selectedProject, {
    enabled: step === "key" && !!selectedProject,
  });

  const { mutateAsync: deleteApiKey, isPending: isDeletingKey } =
    api.project.removeApiKey.useMutation({
      onSuccess: () => {
        refetchApiKeys();
        toast({
          title: "Success",
          description: "API key deleted successfully",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete API key. Please try again.",
          variant: "destructive",
        });
      },
    });

  const { mutateAsync: generateApiKey, isPending: isGeneratingKey } =
    api.project.generateApiKey.useMutation({
      onSuccess: () => {
        refetchApiKeys();
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to generate API key. Please try again.",
          variant: "destructive",
        });
      },
    });

  const { mutateAsync: createProject, isPending: isCreatingProject } =
    api.project.createProject.useMutation({
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create project. Please try again.",
          variant: "destructive",
        });
      },
    });

  const { mutateAsync: addProviderKey } =
    api.project.addProviderKey.useMutation({
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to add provider key. Please try again.",
          variant: "destructive",
        });
      },
    });

  const { mutateAsync: updateProviderKey } =
    api.project.addProviderKey.useMutation();
  const { data: providerKeys, refetch: refetchProviderKeys } =
    api.project.getProviderKeys.useQuery(selectedProject, {
      enabled: step === "key" && !!selectedProject,
    });

  // Calculate key name directly
  const cliKeyCount =
    existingApiKeys?.filter((key) => key.name.startsWith("CLI Key")).length ??
    0;
  const nextKeyName =
    cliKeyCount === 0 ? "CLI Key" : `CLI Key ${cliKeyCount + 1}`;

  const closeWindow = useCallback(() => {
    try {
      window.close();
    } catch (error) {
      console.error("Failed to close window:", error);
      toast({
        title: "Warning",
        description:
          "Unable to close window automatically. Please close it manually.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (isAuthenticated) {
      setStep("project");
    }
  }, [isAuthenticated, setStep]);

  useEffect(() => {
    if (!apiKey) return;

    toast({
      title: "API Key Generated",
      description: `This window will close automatically in 30 seconds.`,
    });

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          closeWindow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [apiKey, toast, closeWindow]);

  useEffect(() => {
    if (step === "project") {
      refetchProjects();
    } else if (step === "key" && selectedProject) {
      refetchApiKeys();
      refetchProviderKeys();
    }
  }, [
    step,
    selectedProject,
    refetchProjects,
    refetchApiKeys,
    refetchProviderKeys,
  ]);

  // Event handlers
  const handleAuth = useCallback(
    async (provider: AuthProvider) => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/cli-auth`,
          },
        });
        if (error) throw error;
      } catch (error) {
        console.error("Auth failed:", error);
        toast({
          title: "Error",
          description: "Failed to authenticate. Please try again.",
          variant: "destructive",
        });
      }
    },
    [supabase.auth, toast],
  );

  const handleCreateProject = useCallback(async () => {
    if (!createDialog.name.trim() || !createDialog.providerKey.trim()) return;

    try {
      const project = await createProject(createDialog.name);
      await addProviderKey({
        projectId: project.id,
        provider: "openai",
        providerKey: createDialog.providerKey,
      });

      // Refetch projects and wait for it to complete
      await refetchProjects();

      // set the project id
      setSelectedProject(project.id);

      // Auto-generate the first API key
      const result = await generateApiKey({
        projectId: project.id,
        name: "CLI Key",
      });

      setApiKey(result.apiKey);
      setStep("key");
      setCreateDialog({ isOpen: false, name: "", providerKey: "" });
    } catch (error) {
      console.error("Project creation failed:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  }, [
    createProject,
    addProviderKey,
    generateApiKey,
    refetchProjects,
    createDialog.name,
    createDialog.providerKey,
    toast,
  ]);

  const handleGenerateApiKey = useCallback(async () => {
    try {
      const result = await generateApiKey({
        projectId: selectedProject,
        name: nextKeyName,
      });
      setApiKey(result.apiKey);
      setCountdown(30);
    } catch (error) {
      console.error("API key generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate API key. Please try again.",
        variant: "destructive",
      });
    }
  }, [generateApiKey, selectedProject, nextKeyName, toast]);

  const handleDeleteApiKey = useCallback(
    async (keyId: string) => {
      try {
        await deleteApiKey({
          projectId: selectedProject,
          apiKeyId: keyId,
        });
        setDeleteDialog({ isOpen: false, keyId: "", keyName: "" });
      } catch (error) {
        console.error("API key deletion failed:", error);
        toast({
          title: "Error",
          description: "Failed to delete API key. Please try again.",
          variant: "destructive",
        });
      }
    },
    [deleteApiKey, selectedProject, toast],
  );

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setStep("auth");
      setSelectedProject("");
      setApiKey("");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  }, [supabase.auth, toast]);

  const handleProviderKeyChange = async (key: string) => {
    try {
      await updateProviderKey({
        projectId: selectedProject,
        provider: "openai",
        providerKey: key,
      });
      await refetchProviderKeys();
      toast({
        title: "Success",
        description: "OpenAI API key updated successfully",
      });
    } catch (error) {
      console.error("Failed to update provider key:", error);
      toast({
        title: "Error",
        description: "Failed to update OpenAI API key",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Header showDashboardButton={false} />
      <CreateProjectDialog
        state={createDialog}
        isCreating={isCreatingProject}
        onStateChange={setCreateDialog}
        onConfirm={handleCreateProject}
      />

      <DeleteKeyDialog
        state={deleteDialog}
        isDeleting={isDeletingKey}
        onStateChange={setDeleteDialog}
        onConfirm={handleDeleteApiKey}
      />

      <div className="flex flex-col items-center justify-center min-h-[calc(70vh-var(--header-height))] w-full px-4">
        <Card className="w-full max-w-lg mx-auto shadow-lg border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-bold tracking-tight">
                tambo CLI Setup
              </CardTitle>
              <CardDescription className="text-base">
                {step === "auth" && "Sign in to get started with tambo"}
                {step === "project" &&
                  "Choose a project to generate your API key"}
                {step === "key" && "Almost done! Generate your API key"}
              </CardDescription>
            </div>
            {step !== "auth" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <ProgressIndicator
              steps={["auth", "project", "key"]}
              currentStep={step}
            />

            {step === "auth" && <AuthStep onAuth={handleAuth} />}

            {step === "project" && (
              <ProjectStep
                projects={projects}
                isLoading={projectsLoading}
                error={projectsError}
                onProjectSelect={(id) => {
                  setSelectedProject(id);
                  setStep("key");
                }}
                onCreateClick={() =>
                  setCreateDialog((prev) => ({ ...prev, isOpen: true }))
                }
              />
            )}

            {step === "key" && (
              <KeyStep
                apiKey={apiKey}
                countdown={countdown}
                existingKeys={existingApiKeys}
                isLoading={apiKeysLoading}
                error={apiKeysError}
                isGenerating={isGeneratingKey}
                onBack={() => {
                  setApiKey("");
                  setStep("project");
                }}
                onGenerate={handleGenerateApiKey}
                onDeleteClick={(keyId, keyName) =>
                  setDeleteDialog({ isOpen: true, keyId, keyName })
                }
                providerKey={
                  providerKeys?.[providerKeys.length - 1]?.partiallyHiddenKey ??
                  null
                }
                onProviderKeyChange={handleProviderKeyChange}
                projectName={
                  projects?.find((p) => p.id === selectedProject)?.name ?? ""
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
