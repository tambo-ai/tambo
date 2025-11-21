"use client";

import { KeyStep } from "@/components/cli-auth/key-step";
import { ProgressIndicator } from "@/components/cli-auth/progress-indicator";
import { ProjectStep } from "@/components/cli-auth/project-step";
import { CreateProjectDialog } from "@/components/dashboard-components/create-project-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";
import { api } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
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
  apiKey: string;
  countdown: number;
  isGenerating: boolean;
  onBack: () => void;
  onGenerate: () => Promise<void>;
  onProjectSelect: (projectId: string, projectName: string) => void;
  onNavigateToProject?: () => void;
  onCreateClick: () => void;
};

function Step({
  currentStep,
  selectedProjectId,
  selectedProjectName,
  apiKey,
  countdown,
  isGenerating,
  onBack,
  onGenerate,
  onProjectSelect,
  onNavigateToProject,
  onCreateClick,
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
            onCreateClick={onCreateClick}
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: session, status } = useSession();
  const isAuthLoading = status === "loading";
  const router = useRouter();
  const utils = api.useUtils();

  // Use our new countdown timer hook
  const { countdown, startTimer, stopTimer } = useCountdownTimer(60, () => {
    // Redirect to project page after showing 0
    setTimeout(() => {
      router.push(`/dashboard/${selectedProjectId}`);
    }, 500);
  });

  const createProjectMutation = api.project.createProject2.useMutation();
  const generateApiKeyMutation = api.project.generateApiKey.useMutation();

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
    async (projectId: string, projectName: string) => {
      setSelectedProjectId(projectId);
      setSelectedProjectName(projectName);
      setStep("key");
      // Generate API key immediately when switching to the key step
      await handleGenerate();
    },
    [handleGenerate],
  );

  const handleBack = useCallback(() => {
    // Stop the timer when going back to project selection
    stopTimer();
    setStep("select");
    setApiKey("");
  }, [stopTimer]);

  const handleCreateProject = useCallback(
    async (projectName: string) => {
      try {
        // Create the project
        const project = await createProjectMutation.mutateAsync({
          name: projectName,
        });

        // Invalidate project list query to refresh the data
        await utils.project.getUserProjects.invalidate();

        // Close dialog
        setIsCreateDialogOpen(false);

        // Select the new project and move to key step
        await handleProjectSelect(project.id, project.name);

        return { id: project.id };
      } catch (error) {
        console.error("Project creation failed:", error);
        throw error;
      }
    },
    [createProjectMutation, utils.project.getUserProjects, handleProjectSelect],
  );

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
                  apiKey={apiKey}
                  countdown={countdown}
                  isGenerating={isGenerating}
                  onBack={handleBack}
                  onGenerate={handleGenerate}
                  onProjectSelect={handleProjectSelect}
                  onNavigateToProject={navigateToProject}
                  onCreateClick={() => setIsCreateDialogOpen(true)}
                />
              )}
            </AnimatePresence>

            <CreateProjectDialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onSubmit={handleCreateProject}
              embedded={false}
              preventNavigation={true}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
