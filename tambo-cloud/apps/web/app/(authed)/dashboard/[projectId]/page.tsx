"use client";

import { APIKeyList } from "@/components/dashboard-components/project-details/api-key-list";
import { AvailableMcpServers } from "@/components/dashboard-components/project-details/available-mcp-servers";
import { AvailableTools } from "@/components/dashboard-components/project-details/available-tools";
import { DeleteAlertDialog } from "@/components/dashboard-components/project-details/delete-alert-dialog";
import { ProjectInfo } from "@/components/dashboard-components/project-details/project-info";
import { ProviderKeySection } from "@/components/dashboard-components/project-details/provider-key-section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2 } from "lucide-react";
import { use, useState } from "react";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

interface AlertState {
  show: boolean;
  title: string;
  description: string;
  data?: { id: string };
}

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

export default function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = use(params);
  const { toast } = useToast();
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
  });

  // Fetch project details
  const { data: project, isLoading: isLoadingProject } =
    api.project.getUserProjects.useQuery(undefined, {
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
      // Navigate to dashboard after deletion
      window.location.href = "/dashboard";
    } catch (_error) {
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
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="h-32 animate-pulse mt-6" />
      </motion.div>
    );
  }

  if (!project) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold">Project not found</h2>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Main Content Area */}
      <div className="space-y-6 mb-6">
        <motion.div variants={itemVariants}>
          <ProjectInfo
            project={project}
            createdAt={new Date().toLocaleDateString()}
          />
        </motion.div>

        {/* Flex container for side-by-side layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          <motion.div className="w-full lg:w-1/2" variants={itemVariants}>
            <ProviderKeySection project={project} />
          </motion.div>
          <motion.div className="w-full lg:w-1/2" variants={itemVariants}>
            <APIKeyList project={project} />
          </motion.div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <motion.div className="w-full lg:w-1/2" variants={itemVariants}>
            {project.mcpEnabled && <AvailableMcpServers project={project} />}
          </motion.div>
          <motion.div className="w-full lg:w-1/2" variants={itemVariants}>
            {project.composioEnabled && <AvailableTools project={project} />}
          </motion.div>
        </div>
        <motion.div className="pt-2" variants={itemVariants}>
          <Separator className="mb-4" />
          <div className="bg-destructive/5 p-4 rounded-md border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h4 className="text-sm font-heading font-semibold text-destructive">
                Danger Zone
              </h4>
            </div>
            <p className="text-xs font-sans text-muted-foreground mb-3">
              Deleting this project will permanently remove all associated data,
              API keys, and settings. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 font-sans"
              onClick={() =>
                setAlertState({
                  show: true,
                  title: "Delete Project",
                  description:
                    "Are you sure you want to delete this project? This action cannot be undone.",
                })
              }
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </div>
        </motion.div>
      </div>

      <DeleteAlertDialog
        alertState={alertState}
        setAlertState={setAlertState}
        onConfirm={handleDeleteProject}
      />
    </motion.div>
  );
}
