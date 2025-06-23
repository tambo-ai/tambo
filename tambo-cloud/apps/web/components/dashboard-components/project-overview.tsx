"use client";

import { ProjectInfo } from "@/components/dashboard-components/project-details/project-info";
import { Card } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";

interface ProjectOverviewProps {
  projectId: string;
}

export function ProjectOverview({ projectId }: ProjectOverviewProps) {
  // Fetch project details
  const { data: project, isLoading: isLoadingProject } =
    api.project.getUserProjects.useQuery(undefined, {
      select: (projects) => projects.find((p) => p.id === projectId),
    });

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ProjectInfo
        project={project}
        createdAt={new Date(project.createdAt).toLocaleDateString()}
      />
    </motion.div>
  );
}
