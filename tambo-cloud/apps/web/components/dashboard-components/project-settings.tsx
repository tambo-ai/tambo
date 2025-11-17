"use client";

import {
  DeleteConfirmationDialog,
  type AlertState,
} from "@/components/dashboard-components/delete-confirmation-dialog";
import { InteractableAPIKeyList } from "@/components/dashboard-components/project-details/api-key-list";
import { InteractableAvailableMcpServers } from "@/components/dashboard-components/project-details/available-mcp-servers";
import { InteractableCustomInstructionsEditor } from "@/components/dashboard-components/project-details/custom-instructions-editor";
import { InteractableOAuthSettings } from "@/components/dashboard-components/project-details/oauth-settings";
import { InteractableProviderKeySection } from "@/components/dashboard-components/project-details/provider-key-section";
import { InteractableToolCallLimitEditor } from "@/components/dashboard-components/project-details/tool-call-limit-editor";
import { SettingsPageSkeleton } from "@/components/skeletons/settings-skeletons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
  const oauthSettingsRef = useRef<HTMLDivElement>(null);
  const mcpServersRef = useRef<HTMLDivElement>(null);
  const toolCallLimitRef = useRef<HTMLDivElement>(null);

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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleDeleteProject = async () => {
    try {
      await deleteProject(projectId);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      router.push("/dashboard");
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
      "oauth-settings": oauthSettingsRef,
      "mcp-servers": mcpServersRef,
      "tool-call-limit": toolCallLimitRef,
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
        className="flex flex-col px-2 sm:px-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <div className="bg-background w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 px-2 gap-4">
            {isEditingName ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-2xl sm:text-4xl font-semibold py-2 px-3 border-2 w-full sm:max-w-md placeholder:text-muted placeholder:font-normal min-h-[2.5rem] sm:min-h-[3.5rem]"
                placeholder="Project name"
                disabled={isUpdatingProject}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    await handleSaveName();
                  } else if (e.key === "Escape") {
                    handleCancelEdit();
                  }
                }}
                autoFocus
              />
            ) : (
              <h1 className="text-2xl sm:text-4xl font-semibold min-h-[2.5rem] sm:min-h-[3.5rem] flex items-center">
                {project.name}
              </h1>
            )}

            <div className="flex gap-2 sm:gap-3 self-end sm:self-auto">
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-sm sm:text-base"
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
                    className="text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveName}
                    disabled={isUpdatingProject || !editedName.trim()}
                    className="text-sm sm:text-base"
                  >
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleEditName}
                  className="text-sm sm:text-base"
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="sm:hidden py-4">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span>
              Navigate to:{" "}
              {activeSection.replace("-", " ").split(" ").join(" ")}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isMobileMenuOpen ? "rotate-180" : ""}`}
            />
          </Button>

          {isMobileMenuOpen && (
            <div className="mt-2 space-y-1">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 rounded-full ${
                  activeSection === "api-keys" ? "bg-accent" : "hover:bg-accent"
                }`}
                onClick={() => {
                  scrollToSection("api-keys");
                  setIsMobileMenuOpen(false);
                }}
              >
                API keys
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 rounded-full ${
                  activeSection === "llm-providers"
                    ? "bg-accent"
                    : "hover:bg-accent"
                }`}
                onClick={() => {
                  scrollToSection("llm-providers");
                  setIsMobileMenuOpen(false);
                }}
              >
                LLM providers
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 rounded-full ${
                  activeSection === "custom-instructions"
                    ? "bg-accent"
                    : "hover:bg-accent"
                }`}
                onClick={() => {
                  scrollToSection("custom-instructions");
                  setIsMobileMenuOpen(false);
                }}
              >
                Custom instructions
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 rounded-full ${
                  activeSection === "mcp-servers"
                    ? "bg-accent"
                    : "hover:bg-accent"
                }`}
                onClick={() => {
                  scrollToSection("mcp-servers");
                  setIsMobileMenuOpen(false);
                }}
              >
                MCP servers
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 rounded-full ${
                  activeSection === "tool-call-limit"
                    ? "bg-accent"
                    : "hover:bg-accent"
                }`}
                onClick={() => {
                  scrollToSection("tool-call-limit");
                  setIsMobileMenuOpen(false);
                }}
              >
                Tool Call Limit
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 rounded-full ${
                  activeSection === "oauth-settings"
                    ? "bg-accent"
                    : "hover:bg-accent"
                }`}
                onClick={() => {
                  scrollToSection("oauth-settings");
                  setIsMobileMenuOpen(false);
                }}
              >
                User Authentication
              </Button>
            </div>
          )}
        </div>

        {/* Main Layout */}
        <div className="flex gap-8 sm:gap-12 lg:gap-48 w-full">
          {/* Sidebar Navigation */}
          <div className="hidden sm:block py-6 w-48 lg:w-1/5 shrink-0">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                className={`justify-start gap-2 rounded-full text-sm ${
                  activeSection === "api-keys" ? "bg-accent" : "hover:bg-accent"
                }`}
                onClick={() => scrollToSection("api-keys")}
              >
                API keys
              </Button>
              <Button
                variant="ghost"
                className={`justify-start gap-2 rounded-full text-sm ${
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
                className={`justify-start gap-2 rounded-full text-sm ${
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
                className={`justify-start gap-2 rounded-full text-sm ${
                  activeSection === "mcp-servers"
                    ? "bg-accent"
                    : "hover:bg-accent"
                }`}
                onClick={() => scrollToSection("mcp-servers")}
              >
                MCP servers
              </Button>
              <Button
                variant="ghost"
                className={`justify-start gap-2 rounded-full text-sm ${
                  activeSection === "tool-call-limit"
                    ? "bg-accent"
                    : "hover:bg-accent"
                }`}
                onClick={() => scrollToSection("tool-call-limit")}
              >
                Tool Call Limit
              </Button>
              <Button
                variant="ghost"
                className={`justify-start gap-2 rounded-full text-sm ${
                  activeSection === "oauth-settings"
                    ? "bg-accent"
                    : "hover:bg-accent"
                }`}
                onClick={() => scrollToSection("oauth-settings")}
              >
                User Authentication
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div
            ref={scrollContainerRef}
            className="h-[calc(100vh-150px)] sm:h-[calc(100vh-200px)] w-full overflow-y-auto pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]"
          >
            <div className="space-y-4">
              <div ref={apiKeysRef} className="p-2">
                <InteractableAPIKeyList
                  projectId={project.id}
                  onEdited={handleRefreshProject}
                />
              </div>

              <div ref={llmProvidersRef} className="p-2">
                <InteractableProviderKeySection
                  projectId={project.id}
                  onEdited={handleRefreshProject}
                />
              </div>

              <div ref={customInstructionsRef} className="p-2">
                <InteractableCustomInstructionsEditor
                  projectId={project.id}
                  customInstructions={project.customInstructions}
                  allowSystemPromptOverride={project.allowSystemPromptOverride}
                  onEdited={handleRefreshProject}
                />
              </div>

              <div ref={mcpServersRef} className="p-2">
                <InteractableAvailableMcpServers
                  projectId={project.id}
                  providerType={project.providerType}
                  onEdited={handleRefreshProject}
                />
              </div>

              <div ref={toolCallLimitRef} className="p-2">
                <InteractableToolCallLimitEditor
                  projectId={project.id}
                  maxToolCallLimit={project.maxToolCallLimit}
                  onEdited={handleRefreshProject}
                />
              </div>

              <div ref={oauthSettingsRef} className="p-2">
                <InteractableOAuthSettings
                  projectId={project.id}
                  isTokenRequired={project.isTokenRequired ?? false}
                  onEdited={handleRefreshProject}
                />
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
    </TooltipProvider>
  );
}
