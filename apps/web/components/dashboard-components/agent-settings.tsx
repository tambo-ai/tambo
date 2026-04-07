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

  const sections = [
    { id: "custom-instructions", label: "Custom Instructions" },
    { id: "skills", label: "Skills" },
    { id: "tool-call-limit", label: "Tool Call Limit" },
    { id: "mcp-servers", label: "MCP Servers" },
    { id: "llm-providers", label: "LLM Providers" },
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
            Configure the behavior of your Tambo agent.
          </p>
          <div className="space-y-6">
            <div
              id="custom-instructions"
              className="scroll-mt-[var(--sticky-offset)]"
            >
              <InteractableCustomInstructionsEditor
                projectId={project.id}
                customInstructions={project.customInstructions}
                allowSystemPromptOverride={project.allowSystemPromptOverride}
                onEdited={handleRefreshProject}
              />
            </div>

            <div id="skills" className="scroll-mt-[var(--sticky-offset)]">
              <InteractableSkillsSection
                projectId={project.id}
                defaultLlmProviderName={
                  project.defaultLlmProviderName ?? undefined
                }
                defaultLlmModelName={project.defaultLlmModelName ?? undefined}
              />
            </div>

            <div
              id="tool-call-limit"
              className="scroll-mt-[var(--sticky-offset)]"
            >
              <InteractableToolCallLimitEditor
                projectId={project.id}
                maxToolCallLimit={project.maxToolCallLimit}
                onEdited={handleRefreshProject}
              />
            </div>

            <div id="mcp-servers" className="scroll-mt-[var(--sticky-offset)]">
              <InteractableAvailableMcpServers
                projectId={project.id}
                providerType={project.providerType}
                onEdited={handleRefreshProject}
              />
            </div>

            <div
              id="llm-providers"
              className="scroll-mt-[var(--sticky-offset)]"
            >
              <InteractableProviderKeySection
                projectId={project.id}
                onEdited={handleRefreshProject}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
