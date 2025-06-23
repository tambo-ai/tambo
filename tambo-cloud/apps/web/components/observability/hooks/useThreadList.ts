import type { AlertState } from "@/components/dashboard-components/delete-confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SortField =
  | "date"
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
  contextKey: string;
  messages: number;
  tools: number;
  components: number;
  errors: number;
};

interface UseThreadListProps {
  threads: Thread[];
  projectId: string;
  onThreadsDeleted?: () => void;
  threadsPerPage?: number;
}

export interface UseThreadListReturn {
  // State
  sortField: SortField;
  sortDirection: SortDirection;
  searchQuery: string;
  selectedThreads: Set<string>;
  currentPage: number;
  alertState: AlertState;
  isDeletingThreads: boolean;
  deletingThreadIds: Set<string>;

  // Computed values
  filteredThreads: Thread[];
  currentThreads: Thread[];
  totalThreads: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;

  // Actions
  setSearchQuery: (query: string) => void;
  setAlertState: (state: AlertState) => void;
  handleSort: (field: SortField) => void;
  handleSelectAll: (checked: boolean) => void;
  handleSelectThread: (threadId: string, checked: boolean) => void;
  handlePageChange: (page: number) => void;
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
  threadsPerPage = 5,
}: UseThreadListProps): UseThreadListReturn {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(
    new Set(),
  );
  const [currentPage, setCurrentPage] = useState(1);
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

  // Optimize expensive computations with proper dependencies
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const query = searchQuery.toLowerCase().trim();
    return threads.filter(
      (thread) =>
        thread.id.toLowerCase().includes(query) ||
        thread.contextKey.toLowerCase().includes(query) ||
        (thread.name && thread.name.toLowerCase().includes(query)),
    );
  }, [threads, searchQuery]);

  // Memoize sort function to prevent recreation
  const sortFunction = useMemo(() => {
    return (a: Thread, b: Thread) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "date":
          return (
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()) *
            direction
          );
        case "threadId":
          return a.id.localeCompare(b.id) * direction;
        case "threadName":
          return (a.name || "").localeCompare(b.name || "") * direction;
        case "contextKey":
          return a.contextKey.localeCompare(b.contextKey) * direction;
        case "messages":
          return (a.messages - b.messages) * direction;
        case "errors":
          return (a.errors - b.errors) * direction;
        default:
          return 0;
      }
    };
  }, [sortField, sortDirection]);

  // Apply sort with memoized function
  const sortedThreads = useMemo(() => {
    return [...filteredThreads].sort(sortFunction);
  }, [filteredThreads, sortFunction]);

  // Pagination
  const totalThreads = filteredThreads.length;
  const validatedThreadsPerPage = Math.max(1, Math.min(100, threadsPerPage));
  const totalPages = Math.max(
    1,
    Math.ceil(totalThreads / validatedThreadsPerPage),
  );
  const validatedCurrentPage = Math.max(1, Math.min(totalPages, currentPage));
  const startIndex = (validatedCurrentPage - 1) * validatedThreadsPerPage;
  const endIndex = Math.min(startIndex + validatedThreadsPerPage, totalThreads);
  const currentThreads = sortedThreads.slice(startIndex, endIndex);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("desc");
      }
    },
    [sortField, sortDirection],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedThreads(new Set(filteredThreads.map((t) => t.id)));
      } else {
        setSelectedThreads(new Set());
      }
    },
    [filteredThreads],
  );

  // Optimize callbacks with stable references
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
    [], // No dependencies needed since we use functional updates
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(totalPages, page));
      if (validPage !== currentPage) {
        setCurrentPage(validPage);
      }
    },
    [totalPages, currentPage],
  );

  // Auto-adjust page when filters change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

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
      filteredThreads.length > 0 &&
      filteredThreads.every((t) => selectedThreads.has(t.id))
    );
  }, [filteredThreads, selectedThreads]);

  return {
    // State
    sortField,
    sortDirection,
    searchQuery,
    selectedThreads,
    currentPage,
    alertState,
    isDeletingThreads,
    deletingThreadIds,

    // Computed values
    filteredThreads,
    currentThreads,
    totalThreads,
    totalPages,
    startIndex,
    endIndex,

    // Actions
    setSearchQuery,
    setAlertState,
    handleSort,
    handleSelectAll,
    handleSelectThread,
    handlePageChange,
    handleDeleteClick,
    handleDeleteConfirm,
    areAllCurrentThreadsSelected,

    // Mutations
    deleteThreadMutation,
  };
}
