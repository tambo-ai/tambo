"use client";

import { CreateProjectDialog } from "@/components/cli-auth/create-project-dialog";
import { KeyStep } from "@/components/cli-auth/key-step";
import { ProgressIndicator } from "@/components/cli-auth/progress-indicator";
import { ProjectStep } from "@/components/cli-auth/project-step";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/auth";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";
import { api } from "@/trpc/react";
import { MCPTransport } from "@tambo-ai-cloud/core";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.3,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delay: 0.2, duration: 0.4 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Loading component
function Loading() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center py-8"
    >
      <div className="animate-pulse h-8 w-8 rounded-full bg-muted" />
    </motion.div>
  );
}

// Step component
type StepProps = {
  currentStep: "select" | "key";
  selectedProjectId: string | null;
  selectedProjectName: string;
  createDialogState: {
    isOpen: boolean;
    name: string;
    providerKey: string;
    mcpServer?: {
      url: string;
      customHeaders: Record<string, string>;
      mcpTransport: MCPTransport;
    };
  };
  setCreateDialogState: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      name: string;
      providerKey: string;
      mcpServer?: {
        url: string;
        customHeaders: Record<string, string>;
        mcpTransport: MCPTransport;
      };
    }>
  >;
  apiKey: string;
  countdown: number;
  isGenerating: boolean;
  onBack: () => void;
  onGenerate: () => Promise<void>;
  onProjectSelect: (projectId: string, projectName: string) => void;
  onNavigateToProject?: () => void;
};

function Step({
  currentStep,
  selectedProjectId,
  selectedProjectName,
  createDialogState,
  setCreateDialogState,
  apiKey,
  countdown,
  isGenerating,
  onBack,
  onGenerate,
  onProjectSelect,
  onNavigateToProject,
}: StepProps) {
  switch (currentStep) {
    case "select":
      return (
        <motion.div
          key="project-step"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <ProjectStep
            onProjectSelect={onProjectSelect}
            onCreateClick={() =>
              setCreateDialogState({
                ...createDialogState,
                isOpen: true,
              })
            }
          />
        </motion.div>
      );
    case "key":
      return (
        <motion.div
          key="key-step"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <KeyStep
            apiKey={apiKey}
            countdown={countdown}
            isGenerating={isGenerating}
            onBack={onBack}
            onGenerate={onGenerate}
            projectName={selectedProjectName}
            projectId={selectedProjectId ?? ""}
            onNavigateToProject={onNavigateToProject}
          />
        </motion.div>
      );
    default:
      return null;
  }
}

export function CLIAuthPage() {
  const [step, setStep] = useState<"select" | "key">("select");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [createDialogState, setCreateDialogState] = useState<{
    isOpen: boolean;
    name: string;
    providerKey: string;
    mcpServer?: {
      url: string;
      customHeaders: Record<string, string>;
      mcpTransport: MCPTransport;
    };
  }>({
    isOpen: false,
    name: "",
    providerKey: "",
    mcpServer: undefined,
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const { data: session, isLoading: isAuthLoading } = useSession();
  const router = useRouter();

  // Use our new countdown timer hook
  const { countdown, startTimer, stopTimer } = useCountdownTimer(60, () => {
    // Redirect to project page after showing 0
    setTimeout(() => {
      router.push(`/dashboard/${selectedProjectId}`);
    }, 500);
  });

  const createProjectMutation = api.project.createProject2.useMutation();
  const addProviderKeyMutation = api.project.addProviderKey.useMutation();
  const generateApiKeyMutation = api.project.generateApiKey.useMutation();

  // Get the queryClient for invalidating queries
  const utils = api.useUtils();

  const steps = ["select a project", "generate key"];

  const handleGenerate = useCallback(async () => {
    if (!selectedProjectId || isGenerating) return;

    try {
      setIsGenerating(true);
      const timestamp = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const result = await generateApiKeyMutation.mutateAsync({
        projectId: selectedProjectId,
        name: `CLI Key (${timestamp})`,
      });

      setApiKey(result.apiKey);

      // Start the countdown timer
      startTimer();
    } catch (error) {
      console.error("Key generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProjectId, generateApiKeyMutation, isGenerating, startTimer]);

  const handleProjectSelect = useCallback(
    (projectId: string, projectName: string) => {
      setSelectedProjectId(projectId);
      setSelectedProjectName(projectName);
      setStep("key");
      // Generate API key immediately when switching to the key step
      handleGenerate();
    },
    [handleGenerate],
  );

  const handleBack = useCallback(() => {
    // Stop the timer when going back to project selection
    stopTimer();
    setStep("select");
    setApiKey("");
  }, [stopTimer]);

  const handleCreateProject = useCallback(async () => {
    try {
      setIsCreatingProject(true);

      // Prepare project creation input
      const createProjectInput = {
        name: createDialogState.name,
        mcpServers: createDialogState.mcpServer
          ? [createDialogState.mcpServer]
          : undefined,
      };

      const newProject =
        await createProjectMutation.mutateAsync(createProjectInput);

      // Add OpenAI provider key
      if (createDialogState.providerKey) {
        await addProviderKeyMutation.mutateAsync({
          projectId: newProject.id,
          provider: "openai",
          providerKey: createDialogState.providerKey,
        });
      }

      // Invalidate project list query to refresh the data
      await utils.project.getUserProjects.invalidate();

      // Close dialog and reset state
      setCreateDialogState({
        isOpen: false,
        name: "",
        providerKey: "",
        mcpServer: undefined,
      });

      // Select the new project
      handleProjectSelect(newProject.id, newProject.name);
    } catch (error) {
      console.error("Project creation failed:", error);
    } finally {
      setIsCreatingProject(false);
    }
  }, [
    createDialogState,
    createProjectMutation,
    addProviderKeyMutation,
    handleProjectSelect,
    utils.project.getUserProjects,
  ]);

  const navigateToProject = useCallback(() => {
    if (selectedProjectId) {
      router.push(`/dashboard/${selectedProjectId}`);
    }
  }, [router, selectedProjectId]);

  if (isAuthLoading) {
    return <div className="hidden"></div>;
  }

  // If no session after loading, don't render the UI
  if (!session) {
    return <div className="hidden"></div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-[70vh] flex items-center justify-center"
    >
      <motion.div variants={cardVariants}>
        <Card className="container max-w-lg text-center shadow-md">
          <CardHeader>
            <CardTitle>Setup tambo ai</CardTitle>
            <ProgressIndicator
              steps={steps}
              currentStep={
                step === "select" ? "select a project" : "generate key"
              }
              onStepClick={
                step === "key"
                  ? (clickedStep) =>
                      clickedStep === "select a project" && handleBack()
                  : undefined
              }
            />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4"></div>
            <AnimatePresence mode="wait">
              {isAuthLoading ? (
                <Loading />
              ) : (
                <Step
                  currentStep={step}
                  selectedProjectId={selectedProjectId}
                  selectedProjectName={selectedProjectName}
                  createDialogState={createDialogState}
                  setCreateDialogState={setCreateDialogState}
                  apiKey={apiKey}
                  countdown={countdown}
                  isGenerating={isGenerating}
                  onBack={handleBack}
                  onGenerate={handleGenerate}
                  onProjectSelect={handleProjectSelect}
                  onNavigateToProject={navigateToProject}
                />
              )}
            </AnimatePresence>

            <CreateProjectDialog
              state={createDialogState}
              isCreating={isCreatingProject}
              onStateChange={setCreateDialogState}
              onConfirm={handleCreateProject}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
