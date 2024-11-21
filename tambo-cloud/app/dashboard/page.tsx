"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { addProviderKey, createProject, getUserProjects } from "../services/hydra.service";
import { getSupabaseClient } from "../utils/supabase";
import { CreateProjectDialog } from "./dashboard-components/create-project-dialog";
import { ProjectCard } from "./dashboard-components/project-card";
import { ProjectResponseDto } from "./types/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session) {
        loadProjects();
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      setIsLoading(false)
    }
  };

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const projectsData = await getUserProjects();
      setProjects(projectsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (projectName: string, providerKey: string) => {
    try {
      const project = await createProject(projectName);
      await addProviderKey(project.id, "openai", providerKey);
      await loadProjects();
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
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

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Projects</h1>
        </div>
        <LoadingCards />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-md py-8">
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
      </div>
      {isLoading ? (
        <LoadingCards />
      ) : (
        <>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="mb-4">
            Create Project
          </Button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: ProjectResponseDto) => (
              <ProjectCard
                key={project.id}
                project={project}
                onProjectDeleted={loadProjects}
              />
            ))}
          </div>
          <CreateProjectDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSubmit={handleCreateProject} />
        </>
      )}
    </div>
  );
}
