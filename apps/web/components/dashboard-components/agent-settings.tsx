"use client";

import { InteractableAvailableMcpServers } from "@/components/dashboard-components/project-details/available-mcp-servers";
import { InteractableCustomInstructionsEditor } from "@/components/dashboard-components/project-details/custom-instructions-editor";
import { InteractableProviderKeySection } from "@/components/dashboard-components/project-details/provider-key-section";
import { InteractableSkillsSection } from "@/components/dashboard-components/project-details/skills-section";
import { InteractableToolCallLimitEditor } from "@/components/dashboard-components/project-details/tool-call-limit-editor";
import { AgentPageSkeleton } from "@/components/skeletons/settings-skeletons";
import { Card } from "@/components/ui/card";
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
        className="flex flex-col px-2 sm:px-4 max-w-4xl"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="space-y-6 py-4">
          {/* Model */}
          <InteractableProviderKeySection
            projectId={project.id}
            onEdited={handleRefreshProject}
          />

          {/* Behavior: Instructions */}
          <InteractableCustomInstructionsEditor
            projectId={project.id}
            customInstructions={project.customInstructions}
            allowSystemPromptOverride={project.allowSystemPromptOverride}
            onEdited={handleRefreshProject}
          />

          {/* Behavior: Skills */}
          <InteractableSkillsSection
            projectId={project.id}
            defaultLlmProviderName={project.defaultLlmProviderName ?? undefined}
            defaultLlmModelName={project.defaultLlmModelName ?? undefined}
          />

          {/* Behavior: Tool Call Limit */}
          <InteractableToolCallLimitEditor
            projectId={project.id}
            maxToolCallLimit={project.maxToolCallLimit}
            onEdited={handleRefreshProject}
          />

          {/* MCP */}
          <InteractableAvailableMcpServers
            projectId={project.id}
            providerType={project.providerType}
            onEdited={handleRefreshProject}
          />
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
