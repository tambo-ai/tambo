"use client";

import { CreateProjectDialog } from "@/components/cli-auth/CreateProjectDialog";
import { KeyStep } from "@/components/cli-auth/KeyStep";
import { ProgressIndicator } from "@/components/cli-auth/ProgressIndicator";
import { ProjectStep } from "@/components/cli-auth/ProjectStep";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/auth";
import { api } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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

export default function CLIAuthPage() {
  const [step, setStep] = useState<"select" | "key">("select");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createDialogState, setCreateDialogState] = useState({
    isOpen: false,
    name: "",
    providerKey: "",
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const { data: session, isLoading: isAuthLoading } = useSession();
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // tRPC queries and mutations
  const projectsQuery = api.project.getUserProjects.useQuery(undefined, {
    enabled: !!session,
  });
  const createProjectMutation = api.project.createProject.useMutation();
  const addProviderKeyMutation = api.project.addProviderKey.useMutation();
  const generateApiKeyMutation = api.project.generateApiKey.useMutation();
  const providerKeysQuery = api.project.getProviderKeys.useQuery(
    selectedProjectId ?? "",
    {
      enabled: !!selectedProjectId && !!session,
      staleTime: 30000,
    },
  );

  const steps = ["select a project", "generate key"];

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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

      // Clear existing timer if any
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Start countdown
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }

            // Set countdown to 0 to show it before redirect
            setTimeout(() => {
              // Redirect to project page after showing 0
              router.push(`/dashboard/${selectedProjectId}`);
            }, 500);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Key generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProjectId, generateApiKeyMutation, isGenerating, router]);

  const handleProjectSelect = useCallback(
    (projectId: string) => {
      const selectedProject = projectsQuery.data?.find(
        (project) => project.id === projectId,
      );

      if (selectedProject) {
        setSelectedProjectId(projectId);
        setSelectedProjectName(selectedProject.name);
        setStep("key");
        // Generate API key immediately when switching to the key step
        handleGenerate();
      }
    },
    [projectsQuery.data, handleGenerate],
  );

  const handleBack = useCallback(() => {
    // Clear the timer when going back to project selection
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStep("select");
    setApiKey("");
    setCountdown(60);
  }, []);

  const handleCreateProject = useCallback(async () => {
    try {
      setIsCreatingProject(true);
      const newProject = await createProjectMutation.mutateAsync(
        createDialogState.name,
      );

      // Add OpenAI provider key
      if (createDialogState.providerKey) {
        await addProviderKeyMutation.mutateAsync({
          projectId: newProject.id,
          provider: "openai",
          providerKey: createDialogState.providerKey,
        });
      }

      // Refetch projects
      await projectsQuery.refetch();

      // Close dialog and reset state
      setCreateDialogState({
        isOpen: false,
        name: "",
        providerKey: "",
      });

      // Select the new project
      setSelectedProjectId(newProject.id);
      setSelectedProjectName(newProject.name);
      setStep("key");
      handleGenerate();
    } catch (error) {
      console.error("Project creation failed:", error);
    } finally {
      setIsCreatingProject(false);
    }
  }, [
    createDialogState,
    createProjectMutation,
    addProviderKeyMutation,
    projectsQuery,
    handleGenerate,
  ]);

  if (isAuthLoading) {
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
              {isAuthLoading ||
              (step === "select" && projectsQuery.isLoading) ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-8"
                >
                  <div className="animate-pulse h-8 w-8 rounded-full bg-muted" />
                </motion.div>
              ) : step === "select" ? (
                <motion.div
                  key="project-step"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <ProjectStep
                    projects={projectsQuery.data}
                    isLoading={false}
                    error={projectsQuery.error}
                    onProjectSelect={handleProjectSelect}
                    onCreateClick={() =>
                      setCreateDialogState({
                        ...createDialogState,
                        isOpen: true,
                      })
                    }
                  />
                </motion.div>
              ) : (
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
                    error={providerKeysQuery.error}
                    isGenerating={isGenerating}
                    onBack={handleBack}
                    onGenerate={handleGenerate}
                    projectName={selectedProjectName}
                  />
                </motion.div>
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
