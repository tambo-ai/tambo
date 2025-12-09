"use client";

import { useToast } from "@/hooks/use-toast";
import { api, RouterOutputs } from "@/trpc/react";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod/v3";
import { ThreadMessagesModal } from "../messages/thread-messages-modal";
import { ThreadTable } from "./index";
import { THREADS_PER_PAGE } from "../utils";

/**
 * Self-contained wrapper for ThreadTable that handles TRPC data fetching and state management.
 *
 * Created to make ThreadTable compatible with Tambo's component system, which requires simple props.
 * The original ThreadTable needed complex props (threads, handlers, loading state) that come from
 * TRPC calls and local state, making it difficult for AI to use directly.
 *
 * This wrapper encapsulates all that complexity and only exposes `projectId` and `compact` props.
 */

type ThreadType = RouterOutputs["thread"]["getThread"];

interface ThreadTableContainerProps {
  projectId: string;
  compact?: boolean;
}

export const ThreadTableContainerSchema = z.object({
  projectId: z
    .string()
    .describe(
      "The ID of the project to fetch threads for. This must be a valid project ID (UUID format), NOT a project name.",
    ),
  compact: z
    .boolean()
    .optional()
    .describe(
      "Whether to show the table in compact mode. Always use compact=true. When true, hides Updated, Context Key, and Thread Name columns for a cleaner view. Defaults to false.",
    ),
});

export function ThreadTableContainer({
  projectId,
  compact = false,
}: ThreadTableContainerProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);

  // Server-side state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<
    | "created"
    | "updated"
    | "threadId"
    | "threadName"
    | "contextKey"
    | "messages"
    | "errors"
  >("created");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { toast } = useToast();
  const utils = api.useUtils();

  const threadsPerPage = THREADS_PER_PAGE;

  // Fetch threads with server-side pagination and search
  const {
    data: threadsData,
    isLoading: isLoadingThreads,
    error: threadsError,
  } = api.thread.getThreads.useQuery(
    {
      projectId,
      offset: (currentPage - 1) * threadsPerPage,
      limit: threadsPerPage,
      includeMessages: false,
      searchQuery: searchQuery.trim() || undefined,
      sortField,
      sortDirection,
    },
    {
      enabled: !!projectId,
      placeholderData: (previousData) => previousData,
    },
  );

  // Fetch selected thread details
  const {
    data: selectedThread,
    error: threadError,
    isLoading: isLoadingThread,
  } = api.thread.getThread.useQuery(
    {
      threadId: selectedThreadId!,
      projectId,
      includeInternal: true,
    },
    {
      enabled: !!selectedThreadId,
    },
  );

  // Handle errors
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

  const handleViewMessages = useCallback((threadId: string) => {
    setSelectedThreadId(threadId);
    setIsMessagesModalOpen(true);
  }, []);

  const handleThreadsDeleted = useCallback(async () => {
    await utils.thread.getThreads.invalidate({ projectId });
  }, [utils, projectId]);

  const handleSort = useCallback(
    (field: string) => {
      const typedField = field as typeof sortField;
      if (sortField === typedField) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(typedField);
        setSortDirection("desc");
      }
      setCurrentPage(1); // Reset to first page when sorting changes
    },
    [sortField, sortDirection],
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search changes
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const threads = threadsData?.threads || [];
  const totalCount = threadsData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / threadsPerPage);

  const formattedThreads = threads.map((thread) => ({
    id: thread.id,
    name: thread.name || null,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    contextKey: thread.contextKey || "user_context_key",
    messages: thread.messageCount || 0,
    errors: thread.errorCount || 0,
  }));

  return (
    <>
      <ThreadTable
        threads={formattedThreads}
        onViewMessages={handleViewMessages}
        isLoading={isLoadingThreads}
        projectId={projectId}
        onThreadsDeleted={handleThreadsDeleted}
        compact={compact}
        // Server-side pagination props
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        // Server-side search props
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        // Server-side sort props
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <ThreadMessagesModal
        thread={selectedThread || ({} as ThreadType)}
        isOpen={isMessagesModalOpen}
        onClose={() => setIsMessagesModalOpen(false)}
        isLoading={isLoadingThread && !selectedThread}
      />
    </>
  );
}
