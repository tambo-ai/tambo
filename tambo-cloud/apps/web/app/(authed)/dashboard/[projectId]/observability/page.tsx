"use client";

import { ThreadMessagesModal } from "@/components/observability/messages/thread-messages-modal";
import { ThreadTable } from "@/components/observability/thread-table/thread-table";
import { calculateThreadStats } from "@/components/observability/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api, type RouterOutputs } from "@/trpc/react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { use, useEffect, useState } from "react";

type MessageType = ThreadType["messages"][0];
type ThreadType = RouterOutputs["thread"]["getThread"];

interface ProjectPageProps {
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

export default function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = use(params);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const utils = api.useUtils();

  // Fetch project details
  const { data: project, isLoading: isLoadingProject } =
    api.project.getUserProjects.useQuery(undefined, {
      select: (projects) => projects.find((p) => p.id === projectId),
    });

  // Fetch threads for the project
  const {
    data: threadData,
    isLoading: isLoadingThreads,
    error: threadsError,
    refetch: refetchThreads,
    isFetching: isFetchingThreads,
  } = api.thread.getThreads.useQuery({
    projectId,
    offset: 0,
    limit: 100,
  });

  // Extract threads and total count
  const threads = threadData?.threads || [];

  // Fetch selected thread details
  const { data: selectedThread, error: threadError } =
    api.thread.getThread.useQuery(
      {
        threadId: selectedThreadId!,
        projectId,
        includeInternal: true,
      },
      {
        enabled: !!selectedThreadId,
        placeholderData: (prev, prevQuery) => {
          if (!prevQuery) return undefined;
          const { input } = prevQuery.queryKey[1];
          if (
            input.threadId === selectedThreadId &&
            input.projectId === projectId
          ) {
            return prev;
          }
          return undefined;
        },
      },
    );

  useEffect(() => {
    if (threadsError) {
      toast({
        title: "Error",
        description: "Failed to load threads",
        variant: "destructive",
      });
    }
  }, [threadsError, toast]);

  useEffect(() => {
    if (threadError) {
      toast({
        title: "Error",
        description: "Failed to load thread details",
        variant: "destructive",
      });
    }
  }, [threadError, toast]);

  const handleViewMessages = (threadId: string) => {
    setSelectedThreadId(threadId);
    setIsMessagesModalOpen(true);
  };

  const handleThreadsDeleted = async () => {
    await utils.thread.getThreads.invalidate({ projectId });
  };

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

  const formattedThreads = threads.map((thread) => {
    const stats = calculateThreadStats(
      (thread.messages as MessageType[]) || [],
    );
    return {
      id: thread.id,
      name: thread.name || null,
      createdAt: thread.createdAt.toLocaleString(),
      contextKey: thread.contextKey || "user_context_key",
      messages: thread.messages?.length || 0,
      tools: stats.tools,
      components: stats.components,
      errors: stats.errors,
    };
  });

  if (isLoadingProject) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="h-32 animate-pulse" />
      </motion.div>
    );
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-semibold min-h-[3.5rem] flex items-center">
          Threads
        </h1>
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
        <ThreadTable
          threads={formattedThreads}
          onViewMessages={handleViewMessages}
          isLoading={isLoadingThreads}
          projectId={projectId}
          onThreadsDeleted={handleThreadsDeleted}
        />
      </div>

      {selectedThread && (
        <ThreadMessagesModal
          thread={selectedThread}
          isOpen={isMessagesModalOpen}
          onClose={() => setIsMessagesModalOpen(false)}
        />
      )}
    </motion.div>
  );
}
