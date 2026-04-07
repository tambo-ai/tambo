"use client";

import {
  DeleteConfirmationDialog,
  type AlertState,
} from "@/components/dashboard-components/delete-confirmation-dialog";
import { InteractableAPIKeyList } from "@/components/dashboard-components/project-details/api-key-list";
import { DangerZoneSection } from "@/components/dashboard-components/project-details/danger-zone-section";
import { InteractableOAuthSettings } from "@/components/dashboard-components/project-details/oauth-settings";
import { ProjectNameSection } from "@/components/dashboard-components/project-details/project-name-section";
import { SettingsPageSkeleton } from "@/components/skeletons/settings-skeletons";
import { Card } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProjectSettingsProps {
  projectId: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

export function ProjectSettings({ projectId }: ProjectSettingsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
  });

  const {
    data: project,
    isLoading: isLoadingProject,
    refetch: handleRefreshProject,
  } = api.project.getUserProjects.useQuery(undefined, {
    select: (projects) => projects.find((p) => p.id === projectId),
  });

  const { mutateAsync: deleteProject, isPending: isDeleting } =
    api.project.removeProject.useMutation();

  const handleDeleteProject = async () => {
    try {
      await deleteProject(projectId);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      router.push("/");
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setAlertState({
        show: false,
        title: "",
        description: "",
        data: undefined,
      });
    }
  };

  if (isLoadingProject) {
    return <SettingsPageSkeleton />;
  }

  if (!project) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-heading font-semibold">
            Project not found
          </h2>
        </Card>
      </motion.div>
    );
  }

  const sections = [
    { id: "project-name", label: "Project Name" },
    { id: "api-keys", label: "API Keys" },
    { id: "authentication", label: "Authentication" },
    { id: "danger-zone", label: "Danger Zone" },
  ];

  return (
    <TooltipProvider>
      <motion.div
        className="flex gap-8 px-2 sm:px-4 max-w-6xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <nav className="hidden lg:block w-48 shrink-0 sticky top-[var(--sticky-offset)] pt-2 self-start bg-background">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            On this page
          </p>
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block text-sm text-muted-foreground py-1 hover:text-foreground transition-colors"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 min-w-0 max-w-4xl">
          <p className="text-muted-foreground mb-4 pt-2">
            Manage your project name, API keys, and webhooks.
          </p>
          <div className="space-y-6">
            <div id="project-name" className="scroll-mt-[var(--sticky-offset)]">
              <ProjectNameSection
                projectId={project.id}
                projectName={project.name}
                onEdited={handleRefreshProject}
              />
            </div>

            <div id="api-keys" className="scroll-mt-[var(--sticky-offset)]">
              <InteractableAPIKeyList
                projectId={project.id}
                onEdited={handleRefreshProject}
              />
            </div>

            <div
              id="authentication"
              className="scroll-mt-[var(--sticky-offset)]"
            >
              <InteractableOAuthSettings
                projectId={project.id}
                isTokenRequired={project.isTokenRequired ?? false}
                onEdited={handleRefreshProject}
              />
            </div>

            <div id="danger-zone" className="scroll-mt-[var(--sticky-offset)]">
              <DangerZoneSection
                onRequestDelete={() =>
                  setAlertState({
                    show: true,
                    title: "Delete Project",
                    description:
                      "Are you sure you want to delete this project? This action cannot be undone.",
                  })
                }
                isDeleting={isDeleting}
              />
            </div>
          </div>

          <DeleteConfirmationDialog
            mode="single"
            alertState={alertState}
            setAlertState={setAlertState}
            onConfirm={handleDeleteProject}
          />
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
