import type { AlertState } from "@/components/dashboard-components/delete-confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { useCallback, useEffect, useRef, useState } from "react";

export type SortField =
  | "created"
  | "updated"
  | "threadId"
  | "threadName"
  | "contextKey"
  | "messages"
  | "errors";

export type SortDirection = "asc" | "desc";

export type Thread = {
  id: string;
  name?: string | null;
  createdAt: string;
  updatedAt: string;
  contextKey: string;
  messages: number;
  errors: number;
};

interface UseThreadListProps {
  threads: Thread[];
  projectId: string;
  onThreadsDeleted?: () => void;
}

export interface UseThreadListReturn {
  // State
  selectedThreads: Set<string>;
  alertState: AlertState;
  isDeletingThreads: boolean;
  deletingThreadIds: Set<string>;

  // Actions
  setAlertState: (state: AlertState) => void;
  handleSelectAll: (checked: boolean) => void;
  handleSelectThread: (threadId: string, checked: boolean) => void;
  handleDeleteClick: () => void;
  handleDeleteConfirm: () => Promise<void>;
  areAllCurrentThreadsSelected: () => boolean;

  // Mutations
  deleteThreadMutation: ReturnType<typeof api.thread.deleteThread.useMutation>;
}

export function useThreadList({
  threads,
  projectId,
  onThreadsDeleted,
}: UseThreadListProps): UseThreadListReturn {
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(
    new Set(),
  );
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
  });
  const [isDeletingThreads, setIsDeletingThreads] = useState(false);
  const [deletingThreadIds, setDeletingThreadIds] = useState<Set<string>>(
    new Set(),
  );

  const { toast } = useToast();
  const utils = api.useUtils();

  const deleteThreadMutation = api.thread.deleteThread.useMutation({
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add cleanup ref to track mounted state
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedThreads(new Set(threads.map((t) => t.id)));
      } else {
        setSelectedThreads(new Set());
      }
    },
    [threads],
  );

  const handleSelectThread = useCallback(
    (threadId: string, checked: boolean) => {
      setSelectedThreads((prev) => {
        const newSelected = new Set(prev);
        if (checked) {
          newSelected.add(threadId);
        } else {
          newSelected.delete(threadId);
        }
        return newSelected;
      });
    },
    [],
  );

  const handleDeleteClick = useCallback(() => {
    const selectedCount = selectedThreads.size;

    if (selectedCount === 0) {
      toast({
        title: "No threads selected",
        description: "Please select threads to delete",
        variant: "destructive",
      });
      return;
    }

    const selectedThreadInfo = Array.from(selectedThreads)
      .map((id) => threads.find((t) => t.id === id))
      .filter((thread): thread is Thread => thread !== undefined);

    if (selectedThreadInfo.length === 0) {
      toast({
        title: "Invalid selection",
        description: "Selected threads could not be found",
        variant: "destructive",
      });
      return;
    }

    const threadNames = selectedThreadInfo
      .slice(0, 3)
      .map(
        (thread) =>
          `${thread.contextKey || "Unknown"} (${thread.id?.slice(0, 8) || "N/A"}...)`,
      )
      .join(", ");

    const hasMoreThreads = selectedThreadInfo.length > 3;

    let description = `Are you sure you want to delete ${selectedCount} thread${selectedCount > 1 ? "s" : ""}?\n\n`;

    if (selectedCount <= 3) {
      description += threadNames;
    } else {
      description += threadNames;
      if (hasMoreThreads) {
        description += ` and ${selectedCount - 3} more`;
      }
    }

    description +=
      "\n\nThis action cannot be undone. All messages in these threads will be permanently deleted.";

    setAlertState({
      show: true,
      title: "Delete Threads",
      description: description,
    });
  }, [selectedThreads, threads, toast]);

  const handleDeleteConfirm = useCallback(async () => {
    const threadIds = Array.from(selectedThreads);
    setIsDeletingThreads(true);

    try {
      let deletedCount = 0;
      let failedCount = 0;

      for (const threadId of threadIds) {
        try {
          await deleteThreadMutation.mutateAsync({
            projectId,
            threadId,
          });
          deletedCount++;

          // Remove from deleting set as we progress
          setDeletingThreadIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(threadId);
            return newSet;
          });
        } catch (error) {
          console.error(`Failed to delete thread ${threadId}:`, error);
          failedCount++;

          toast({
            title: "Thread deletion failed",
            description: `Failed to delete thread ${threadId.slice(0, 8)}...`,
            variant: "destructive",
          });
        }
      }

      // Reset loading states
      setSelectedThreads(new Set());
      await utils.thread.getThreads.invalidate({ projectId });
      onThreadsDeleted?.();

      // Show results...
      if (deletedCount > 0 && failedCount === 0) {
        toast({
          title: "Success",
          description: `${deletedCount} thread${deletedCount > 1 ? "s" : ""} deleted successfully`,
        });
      } else if (deletedCount > 0 && failedCount > 0) {
        toast({
          title: "Partial success",
          description: `${deletedCount} deleted, ${failedCount} failed`,
          variant: "destructive",
        });
      } else if (failedCount > 0) {
        toast({
          title: "All deletions failed",
          description: `Failed to delete ${failedCount} thread${failedCount > 1 ? "s" : ""}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete threads:", error);

      if (isMountedRef.current) {
        toast({
          title: "Unexpected error",
          description:
            "An unexpected error occurred while deleting threads. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsDeletingThreads(false);
        setDeletingThreadIds(new Set());
      }
    }
  }, [
    selectedThreads,
    deleteThreadMutation,
    projectId,
    utils,
    onThreadsDeleted,
    toast,
  ]);

  const areAllCurrentThreadsSelected = useCallback(() => {
    return (
      threads.length > 0 && threads.every((t) => selectedThreads.has(t.id))
    );
  }, [threads, selectedThreads]);

  return {
    // State
    selectedThreads,
    alertState,
    isDeletingThreads,
    deletingThreadIds,

    // Actions
    setAlertState,
    handleSelectAll,
    handleSelectThread,
    handleDeleteClick,
    handleDeleteConfirm,
    areAllCurrentThreadsSelected,

    // Mutations
    deleteThreadMutation,
  };
}
