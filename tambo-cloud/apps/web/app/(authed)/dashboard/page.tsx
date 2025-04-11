"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { CreateProjectDialog } from "../../../components/dashboard-components/create-project-dialog";
import { ProjectTable } from "../../../components/dashboard-components/project-table";

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

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

export default function DashboardPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { data: session, isLoading: isAuthLoading } = useSession();

  const {
    data: projects,
    isLoading: isProjectsLoading,
    error: projectLoadingError,
    refetch: refetchProjects,
  } = api.project.getUserProjects.useQuery(undefined, {
    enabled: !!session,
  });

  useEffect(() => {
    if (projectLoadingError) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    }
  }, [projectLoadingError, toast]);

  const { mutateAsync: createProject } =
    api.project.createProject.useMutation();
  const { mutateAsync: addProviderKey } =
    api.project.addProviderKey.useMutation();

  const handleCreateProject = async (
    projectName: string,
    providerKey: string,
  ) => {
    try {
      const project = await createProject(projectName);
      await addProviderKey({
        projectId: project.id,
        provider: "openai",
        providerKey: providerKey,
      });
      await refetchProjects();
      setIsCreateDialogOpen(false);
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

  const LoadingSpinner = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh]"
    >
      <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
    </motion.div>
  );

  // Show loading spinner while checking auth or loading projects
  if (isAuthLoading || isProjectsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <>
        <motion.div
          className="flex items-center justify-between pb-4"
          variants={itemVariants}
        >
          <h1 className="text-2xl font-heading font-bold">Projects</h1>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="text-sm px-4 gap-2"
            variant="default"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </motion.div>
        <motion.div variants={itemVariants}>
          <ProjectTable projects={projects || []} />
        </motion.div>
        <CreateProjectDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateProject}
        />
      </>
    </motion.div>
  );
}
