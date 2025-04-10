"use client";

import { Header } from "@/components/sections/header";
import { ThreadList } from "@/components/thread/thread-list";
import { ThreadMessages } from "@/components/thread/thread-messages";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { RefreshCw } from "lucide-react";
import { use, useEffect, useId, useState } from "react";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

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
      <div className="container">
        <Card className="h-32 animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Project not found</h2>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex flex-col min-h-screen">
      <Header showDashboardButton showLogoutButton />

      {/* Project Metadata */}
      <div className="my-6 p-6 border rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">ID: {project.id}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thread List */}
        <div className="border rounded-lg p-4">
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
        </div>

        {/* Thread Messages */}
        <div className="border rounded-lg p-4">
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
        </div>
      </div>
    </div>
  );
}
