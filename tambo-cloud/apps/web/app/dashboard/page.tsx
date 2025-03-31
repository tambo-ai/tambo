"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Header } from "@/components/sections/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { useEffect, useState } from "react";
import { CreateProjectDialog } from "../../components/dashboard-components/create-project-dialog";
import { ProjectCard } from "../../components/dashboard-components/project-card";
import { ProjectResponseDto } from "./types/types";

export default function DashboardPage() {
  //  const [projects, setProjects] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  const {
    data: projects,
    isLoading,
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

  const LoadingCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="h-48 bg-gray-100 animate-pulse" />
      ))}
    </div>
  );

  if (isAuthenticated == null) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Projects</h1>
        </div>
        <LoadingCards />
      </div>
    );
  }

  return (
    <div className="container">
      <Header showDashboardButton={false} showLogoutButton={true} />
      <div className="flex justify-between items-center my-8"></div>
      {!isAuthenticated ? (
        <div className="container max-w-md py-8">
          <AuthForm routeOnSuccess="/dashboard" />
        </div>
      ) : isLoading ? (
        <LoadingCards />
      ) : (
        <>
          <div className="flex justify-between items-center w-full mb-8 border-b p-4 pb-2 gap-4">
            <span className="text-sm text-muted-foreground">
              {projects?.length} project{projects?.length !== 1 ? "s" : ""}
            </span>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="text-xs px-3"
              variant="default"
            >
              + New
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects?.map((project: ProjectResponseDto) => (
              <ProjectCard
                key={project.id}
                project={project}
                onProjectDeleted={refetchProjects}
              />
            ))}
          </div>
          <CreateProjectDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSubmit={handleCreateProject}
          />
        </>
      )}
    </div>
  );
}
