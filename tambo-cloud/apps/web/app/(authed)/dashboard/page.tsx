"use client";

import { CreateProjectDialog } from "@/components/dashboard-components/create-project-dialog";
import { DashboardCard } from "@/components/dashboard-components/dashboard-card";
import { OnboardingWizard } from "@/components/dashboard-components/onboarding-wizard";
import { ProjectsManager } from "@/components/dashboard-components/projects-manager";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

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

export default function DashboardPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [messagesPeriod, setMessagesPeriod] = useState("all time");
  const [usersPeriod, setUsersPeriod] = useState("all time");
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const isAuthLoading = status === "loading";

  const {
    data: projects,
    isLoading: isProjectsLoading,
    error: projectLoadingError,
    refetch: refetchProjects,
  } = api.project.getUserProjects.useQuery(undefined, {
    enabled: !!session,
  });

  const { data: totalUsage, isLoading: isLoadingMessageUsage } =
    api.project.getTotalMessageUsage.useQuery(
      { period: messagesPeriod },
      { enabled: !!session },
    );

  const { data: totalUsers, isLoading: isLoadingUserCount } =
    api.project.getTotalUsers.useQuery(
      { period: usersPeriod },
      { enabled: !!session },
    );

  useEffect(() => {
    if (projectLoadingError) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    }
  }, [projectLoadingError, toast]);

  // Open onboarding wizard for new users (no projects), otherwise use regular create dialog
  useEffect(() => {
    if (!isProjectsLoading && projects && projects.length === 0) {
      setIsOnboardingOpen(true);
    }
  }, [isProjectsLoading, projects]);

  const { mutateAsync: createProject } =
    api.project.createProject2.useMutation();
  const { mutateAsync: addProviderKey } =
    api.project.addProviderKey.useMutation();

  const handleCreateProject = async (
    projectName: string,
    providerKey?: string,
  ) => {
    try {
      const project = await createProject({ name: projectName });
      await addProviderKey({
        projectId: project.id,
        provider: "openai",
        providerKey: providerKey ?? "",
      });
      await refetchProjects();
      setIsCreateDialogOpen(false);
      setIsOnboardingOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      return project;
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create project: ${error}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const periodOptions = [
    { value: "all time", label: "all time" },
    { value: "per month", label: "last 30 days" },
    { value: "per week", label: "last 7 days" },
  ];

  const LoadingSpinner = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh]"
    >
      <Icons.spinner className="h-8 w-8 animate-spin text-foreground" />
      <p className="mt-4 text-sm text-foreground">Loading...</p>
    </motion.div>
  );

  // Show loading spinner while checking auth or loading projects
  if (isAuthLoading || isProjectsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 md:py-14">
          <DashboardCard
            title="Number of Projects"
            value={projects?.length || 0}
          />
          <DashboardCard
            title="Messages"
            value={totalUsage?.totalMessages || 0}
            defaultPeriod="all time"
            periodOptions={periodOptions}
            onPeriodChange={setMessagesPeriod}
            isLoading={isLoadingMessageUsage}
          />
          <DashboardCard
            title="Users"
            value={totalUsers?.totalUsers || 0}
            defaultPeriod="all time"
            periodOptions={periodOptions}
            onPeriodChange={setUsersPeriod}
            isLoading={isLoadingUserCount}
          />
        </div>

        <ProjectsManager
          projects={projects}
          onCreateProject={() => setIsCreateDialogOpen(true)}
          onRefetchProjects={async () => {
            await refetchProjects();
          }}
        />

        {/* Onboarding wizard for new users (no projects) */}
        <OnboardingWizard
          open={isOnboardingOpen}
          onOpenChange={setIsOnboardingOpen}
          onSubmit={handleCreateProject}
        />

        {/* Regular create project dialog for existing users */}
        <CreateProjectDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateProject}
        />
      </>
    </motion.div>
  );
}
