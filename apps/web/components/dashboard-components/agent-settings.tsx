"use client";

import { InteractableAvailableMcpServers } from "@/components/dashboard-components/project-details/available-mcp-servers";
import { InteractableCustomInstructionsEditor } from "@/components/dashboard-components/project-details/custom-instructions-editor";
import { MemorySettings } from "@/components/dashboard-components/project-details/memory-settings";
import { InteractableProviderKeySection } from "@/components/dashboard-components/project-details/provider-key-section";
import { InteractableSkillsSection } from "@/components/dashboard-components/project-details/skills-section";
import { SystemPromptOverrideToggle } from "@/components/dashboard-components/project-details/system-prompt-override-toggle";
import { InteractableToolCallLimitEditor } from "@/components/dashboard-components/project-details/tool-call-limit-editor";
import { AgentPageSkeleton } from "@/components/skeletons/settings-skeletons";
import { Card } from "@/components/ui/card";
import { SettingsSection } from "@/components/ui/settings-section";
import { EditWithTamboButton } from "@/components/ui/tambo/edit-with-tambo-button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";

interface AgentSettingsProps {
  projectId: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

export function AgentSettings({ projectId }: AgentSettingsProps) {
  const {
    data: project,
    isLoading: isLoadingProject,
    refetch: handleRefreshProject,
  } = api.project.getUserProjects.useQuery(undefined, {
    select: (projects) => projects.find((p) => p.id === projectId),
  });

  if (isLoadingProject) {
    return <AgentPageSkeleton />;
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
          <SettingsSection
            title="Model"
            action={
              <EditWithTamboButton
                variant="button"
                description="Manage LLM providers for this project."
              />
            }
          >
            <InteractableProviderKeySection
              projectId={project.id}
              onEdited={handleRefreshProject}
            />
          </SettingsSection>

          <SettingsSection
            title="Instructions"
            description="Added to each conversation to guide how your agent responds."
            action={
              <EditWithTamboButton
                variant="button"
                description="Edit custom instructions for this project."
              />
            }
            bordered={false}
          >
            <InteractableCustomInstructionsEditor
              projectId={project.id}
              customInstructions={project.customInstructions}
              onEdited={handleRefreshProject}
            />
          </SettingsSection>

          <SettingsSection
            title="Behavior"
            action={
              <EditWithTamboButton
                variant="button"
                description="Manage tool call limits, memory, and prompt settings."
              />
            }
          >
            <SystemPromptOverrideToggle
              projectId={project.id}
              allowSystemPromptOverride={project.allowSystemPromptOverride}
              onEdited={handleRefreshProject}
            />
            <InteractableToolCallLimitEditor
              projectId={project.id}
              maxToolCallLimit={project.maxToolCallLimit}
              onEdited={handleRefreshProject}
            />
            <MemorySettings
              projectId={project.id}
              memoryEnabled={project.memoryEnabled}
              memoryToolsEnabled={project.memoryToolsEnabled}
              onEdited={handleRefreshProject}
            />
          </SettingsSection>

          <SettingsSection
            title="Skills"
            action={
              <EditWithTamboButton
                variant="button"
                description="Manage skills for this project."
              />
            }
            divided={false}
          >
            <InteractableSkillsSection
              projectId={project.id}
              defaultLlmProviderName={
                project.defaultLlmProviderName ?? undefined
              }
              defaultLlmModelName={project.defaultLlmModelName ?? undefined}
            />
          </SettingsSection>

          <SettingsSection
            title="Integrations"
            action={
              <EditWithTamboButton
                variant="button"
                description="Manage MCP servers for this project."
              />
            }
          >
            <InteractableAvailableMcpServers
              projectId={project.id}
              providerType={project.providerType}
              onEdited={handleRefreshProject}
            />
          </SettingsSection>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
