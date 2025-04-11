"use client";

import { ThreadList } from "@/components/thread/thread-list";
import { ThreadMessages } from "@/components/thread/thread-messages";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { use, useEffect, useId, useState } from "react";

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
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const { toast } = useToast();
  const [showInternalMessages, setShowInternalMessages] = useState(false);
  const checkboxId = useId();
  // Fetch project details
  const { data: project, isLoading: isLoadingProject } =
    api.project.getUserProjects.useQuery(undefined, {
      select: (projects) => projects.find((p) => p.id === projectId),
    });

  // Fetch threads for the project
  const {
    data: threads,
    isLoading: isLoadingThreads,
    error: threadsError,
    refetch: refetchThreads,
  } = api.thread.getThreads.useQuery({ projectId });

  const simpleThreads = threads?.map((thread) => ({
    id: thread.id,
    projectId,
    createdAt: thread.createdAt.toLocaleString(),
    updatedAt: thread.updatedAt.toLocaleString(),
  }));

  // Fetch selected thread details
  const { data: selectedThread, error: threadError } =
    api.thread.getThread.useQuery(
      {
        threadId: selectedThreadId!,
        projectId,
        includeInternal: showInternalMessages,
      },
      {
        enabled: !!selectedThreadId,
      },
    );

  // Handle errors with useEffect
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
      className="flex flex-col"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thread List */}
        <motion.div className="border rounded-lg p-4" variants={itemVariants}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Threads</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => await refetchThreads()}
              disabled={isLoadingThreads}
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoadingThreads && "animate-spin")}
              />
            </Button>
          </div>
          {isLoadingThreads ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-16 animate-pulse" />
              ))}
            </div>
          ) : (
            <ThreadList
              threads={simpleThreads || []}
              selectedThreadId={selectedThreadId}
              onThreadSelect={setSelectedThreadId}
              isLoading={isLoadingThreads}
            />
          )}
        </motion.div>

        {/* Thread Messages */}
        <motion.div className="border rounded-lg p-4" variants={itemVariants}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold mb-4">Messages</h2>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={showInternalMessages}
                onCheckedChange={(checked) =>
                  setShowInternalMessages(!!checked)
                }
                id={checkboxId}
              />
              <Label htmlFor={checkboxId}>Show internal messages</Label>
            </div>
          </div>
          {selectedThread ? (
            <ThreadMessages thread={selectedThread} />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Select a thread to view messages
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
