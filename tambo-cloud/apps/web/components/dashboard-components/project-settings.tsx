"use client";

import {
  DeleteConfirmationDialog,
  type AlertState,
} from "@/components/dashboard-components/delete-confirmation-dialog";
import { APIKeyList } from "@/components/dashboard-components/project-details/api-key-list";
import { AvailableMcpServers } from "@/components/dashboard-components/project-details/available-mcp-servers";
import { CustomInstructionsEditor } from "@/components/dashboard-components/project-details/custom-instructions-editor";
import { ProviderKeySection } from "@/components/dashboard-components/project-details/provider-key-section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

interface ProjectSettingsProps {
  projectId: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

export function ProjectSettings({ projectId }: ProjectSettingsProps) {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("api-keys");
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
  });

  // Edit mode state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  // Refs for each section
  const apiKeysRef = useRef<HTMLDivElement>(null);
  const llmProvidersRef = useRef<HTMLDivElement>(null);
  const customInstructionsRef = useRef<HTMLDivElement>(null);
  const mcpServersRef = useRef<HTMLDivElement>(null);

  // Add a ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch project details
  const {
    data: project,
    isLoading: isLoadingProject,
    refetch: handleRefreshProject,
  } = api.project.getUserProjects.useQuery(undefined, {
    select: (projects) => projects.find((p) => p.id === projectId),
  });

  const { mutateAsync: deleteProject, isPending: isDeleting } =
    api.project.removeProject.useMutation();

  // Update project mutation
  const { mutateAsync: updateProject, isPending: isUpdatingProject } =
    api.project.updateProject.useMutation();

  const handleDeleteProject = async () => {
    try {
      await deleteProject(projectId);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
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

  const handleEditName = () => {
    if (project) {
      setEditedName(project.name);
      setIsEditingName(true);
    }
  };

  const handleSaveName = async () => {
    if (!project || !editedName.trim()) {
      return;
    }

    try {
      await updateProject({
        projectId: project.id,
        name: editedName.trim(),
      });

      toast({
        title: "Success",
        description: "Project name updated successfully",
      });

      setIsEditingName(false);
      await handleRefreshProject();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to update project name",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    const refs = {
      "api-keys": apiKeysRef,
      "llm-providers": llmProvidersRef,
      "custom-instructions": customInstructionsRef,
      "mcp-servers": mcpServersRef,
    };

    // Get the target element and the scroll container
    const targetElement = refs[section as keyof typeof refs].current;
    const scrollContainer = scrollContainerRef.current;

    if (targetElement && scrollContainer) {
      // Calculate the scroll position relative to the container
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const relativeTop =
        targetRect.top - containerRect.top + scrollContainer.scrollTop;

      // Smooth scroll the container
      scrollContainer.scrollTo({
        top: relativeTop,
        behavior: "smooth",
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
          <h2 className="text-lg font-heading font-semibold">
            Project not found
          </h2>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col pl-4 pr-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="bg-background w-full">
        <div className="flex items-center justify-between py-2 px-2">
          {isEditingName ? (
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="text-4xl font-semibold py-2 px-3 border-2 max-w-md placeholder:text-muted placeholder:font-normal min-h-[3.5rem]"
              placeholder="Project name"
              disabled={isUpdatingProject}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveName();
                } else if (e.key === "Escape") {
                  handleCancelEdit();
                }
              }}
              autoFocus
            />
          ) : (
            <h1 className="text-4xl font-semibold min-h-[3.5rem] flex items-center">
              {project.name}
            </h1>
          )}

          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
              {isDeleting ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
            {isEditingName ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isUpdatingProject}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveName}
                  disabled={isUpdatingProject || !editedName.trim()}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleEditName}>
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex gap-48 w-full">
        {/* Sidebar Navigation */}
        <div className="py-6 w-1/5">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              className={`justify-start gap-2 rounded-full ${
                activeSection === "api-keys" ? "bg-accent" : "hover:bg-accent"
              }`}
              onClick={() => scrollToSection("api-keys")}
            >
              API keys
            </Button>
            <Button
              variant="ghost"
              className={`justify-start gap-2 rounded-full ${
                activeSection === "llm-providers"
                  ? "bg-accent"
                  : "hover:bg-accent"
              }`}
              onClick={() => scrollToSection("llm-providers")}
            >
              LLM providers
            </Button>
            <Button
              variant="ghost"
              className={`justify-start gap-2 rounded-full ${
                activeSection === "custom-instructions"
                  ? "bg-accent"
                  : "hover:bg-accent"
              }`}
              onClick={() => scrollToSection("custom-instructions")}
            >
              Custom instructions
            </Button>
            <Button
              variant="ghost"
              className={`justify-start gap-2 rounded-full ${
                activeSection === "mcp-servers"
                  ? "bg-accent"
                  : "hover:bg-accent"
              }`}
              onClick={() => scrollToSection("mcp-servers")}
            >
              MCP servers
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className="h-[calc(100vh-200px)] w-full overflow-y-auto pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]"
        >
          <div className="space-y-4">
            <div ref={apiKeysRef} className="p-2">
              <APIKeyList project={project} />
            </div>

            <div ref={llmProvidersRef} className="p-2">
              <ProviderKeySection project={project} />
            </div>

            <div ref={customInstructionsRef} className="p-2">
              <CustomInstructionsEditor
                project={project}
                onEdited={handleRefreshProject}
              />
            </div>

            <div ref={mcpServersRef} className="p-2">
              <AvailableMcpServers project={project} />
              <div className="h-[calc(100vh-600px)] min-h-[200px] max-h-[600px]" />
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        mode="single"
        alertState={alertState}
        setAlertState={setAlertState}
        onConfirm={handleDeleteProject}
      />
    </motion.div>
  );
}
