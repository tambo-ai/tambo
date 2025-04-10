"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Icons } from "@/components/icons";
import { Header } from "@/components/sections/header";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { CreateProjectDialog } from "../../components/dashboard-components/create-project-dialog";
import { ProjectDetailsDialog } from "../../components/dashboard-components/project-details/project-details-dialog";
import { ProjectTable } from "../../components/dashboard-components/project-table";
import { ProjectResponseDto } from "./types/types";

export default function DashboardPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<ProjectResponseDto | null>(null);
  const { toast } = useToast();
  const { data: session, isLoading: isAuthLoading } = useSession();
  const isAuthenticated = !!session;

  const {
    data: projects,
    isLoading: isProjectsLoading,
    error: projectLoadingError,
    refetch: refetchProjects,
  } = api.project.getUserProjects.useQuery(undefined, {
    enabled: !!isAuthenticated,
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
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create project: ${error}`,
        variant: "destructive",
      });
    }
  };

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
    </div>
  );

  // Show loading spinner while checking auth
  if (isAuthLoading) {
    return (
      <div className="container">
        <Header showDashboardButton={false} showLogoutButton={false} />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container">
      <Header showDashboardButton={false} showLogoutButton={true} />
      {!isAuthenticated ? (
        <div className="container max-w-md py-8">
          <AuthForm routeOnSuccess="/dashboard" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-heading font-bold">Projects</h1>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="text-sm px-4 gap-2"
              variant="default"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>
          <ProjectTable
            projects={projects || []}
            onShowDetails={(project) => setSelectedProject(project)}
          />
          <CreateProjectDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSubmit={handleCreateProject}
          />
          {selectedProject && (
            <ProjectDetailsDialog
              project={selectedProject}
              open={!!selectedProject}
              onOpenChange={(open) => !open && setSelectedProject(null)}
              onProjectDeleted={refetchProjects}
            />
          )}
        </>
      )}
    </div>
  );
}
