"use client";

import { ThreadTableContainer } from "@/components/observability/thread-table/thread-table-container";
import { ObservabilityPageSkeleton } from "@/components/skeletons/observability-skeletons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { use } from "react";

interface ObservabilityPageProps {
  params: Promise<{
    projectId: string;
  }>;
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

export default function ObservabilityPage({ params }: ObservabilityPageProps) {
  const { projectId } = use(params);
  const { toast } = useToast();

  // Fetch project details
  const { data: project, isLoading: isLoadingProject } =
    api.project.getUserProjects.useQuery(undefined, {
      select: (projects) => projects.find((p) => p.id === projectId),
    });

  // For refresh functionality
  const { refetch: refetchThreads, isFetching: isFetchingThreads } =
    api.thread.getThreads.useQuery({
      projectId,
      offset: 0,
      limit: 100,
    });

  const handleRefresh = async () => {
    try {
      await refetchThreads();
      toast({
        title: "Refreshed",
        description: "Threads have been refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to refresh threads ${error}`,
        variant: "destructive",
      });
    }
  };

  if (isLoadingProject) {
    return <ObservabilityPageSkeleton />;
  }

  if (!project) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Project not found</h2>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col h-[calc(100vh-var(--header-height)-8rem)] overflow-hidden py-2 px-2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <h1 className="text-2xl sm:text-4xl font-semibold">Threads</h1>
        <Button
          onClick={handleRefresh}
          disabled={isFetchingThreads}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetchingThreads ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Thread Table Container - contains the thread table and the thread messages modal */}
        <ThreadTableContainer projectId={projectId} />
      </div>
    </motion.div>
  );
}
