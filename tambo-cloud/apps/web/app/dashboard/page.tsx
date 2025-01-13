"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Header } from "@/components/sections/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { CreateProjectDialog } from "../../components/dashboard-components/create-project-dialog";
import { ProjectCard } from "../../components/dashboard-components/project-card";
import {
  addProviderKey,
  createProject,
  getUserProjects,
} from "../services/hydra.service";
import { getSupabaseClient } from "../utils/supabase";
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
    console.log("Checking auth status");
    try {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session) {
        loadProjects();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
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

  const handleCreateProject = async (
    projectName: string,
    providerKey: string,
  ) => {
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
          <AuthForm isSignUpInitialValue={false} routeOnSuccess="/dashboard" />
        </div>
      ) : isLoading ? (
        <LoadingCards />
      ) : (
        <>
          <div className="flex justify-between items-center w-full mb-8 border-b p-4 pb-2 gap-4">
            <span className="text-sm text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
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
            onSubmit={handleCreateProject}
          />
        </>
      )}
    </div>
  );
}
