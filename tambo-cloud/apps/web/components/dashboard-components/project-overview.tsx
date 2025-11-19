"use client";

import { DailyMessagesChart } from "@/components/dashboard-components/project-details/daily-messages-chart";
// import { DailyThreadErrorsChart } from "@/components/dashboard-components/project-details/daily-thread-errors-chart";
import { ProjectInfo } from "@/components/dashboard-components/project-details/project-info";
import { ProjectOverviewSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { Card } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";

interface ProjectOverviewProps {
  projectId: string;
}

export function ProjectOverview({ projectId }: ProjectOverviewProps) {
  const { data: project, isLoading: isLoadingProject } =
    api.project.getUserProjects.useQuery(undefined, {
      select: (projects) => projects.find((p) => p.id === projectId),
    });

  if (isLoadingProject) {
    return <ProjectOverviewSkeleton />;
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
      className="space-y-6"
    >
      <ProjectInfo
        project={project}
        createdAt={new Date(project.createdAt).toLocaleDateString()}
      />
      <div>
        <DailyMessagesChart projectIds={[projectId]} days={30} />

        {/* TODO: Add back in when we have error tracking */}
        {/* <DailyThreadErrorsChart projectId={projectId} /> */}
      </div>
    </motion.div>
  );
}
