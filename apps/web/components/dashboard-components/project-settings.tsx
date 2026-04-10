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
import { SettingsSection } from "@/components/ui/settings-section";
import { EditWithTamboButton } from "@/components/ui/tambo/edit-with-tambo-button";
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

  return (
    <TooltipProvider>
      <motion.div
        className="px-2 sm:px-4 max-w-4xl mx-auto rounded-lg p-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="space-y-8">
          <SettingsSection title="General">
            <ProjectNameSection
              projectId={project.id}
              projectName={project.name}
              onEdited={handleRefreshProject}
            />
          </SettingsSection>

          <SettingsSection
            title="API Keys"
            action={
              <EditWithTamboButton
                variant="button"
                description="Manage API keys for this project."
              />
            }
          >
            <InteractableAPIKeyList
              projectId={project.id}
              onEdited={handleRefreshProject}
            />
          </SettingsSection>

          <SettingsSection
            title="Authentication"
            action={
              <EditWithTamboButton
                variant="button"
                description="Manage OAuth token validation settings."
              />
            }
          >
            <InteractableOAuthSettings
              projectId={project.id}
              isTokenRequired={project.isTokenRequired ?? false}
              onEdited={handleRefreshProject}
            />
          </SettingsSection>

          <SettingsSection
            title="Danger Zone"
            cardClassName="border-destructive/50"
          >
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
          </SettingsSection>
        </div>

        <DeleteConfirmationDialog
          mode="single"
          alertState={alertState}
          setAlertState={setAlertState}
          onConfirm={handleDeleteProject}
        />
      </motion.div>
    </TooltipProvider>
  );
}
