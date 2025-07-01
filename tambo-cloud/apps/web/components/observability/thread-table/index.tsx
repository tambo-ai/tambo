"use client";

import { DeleteConfirmationDialog } from "@/components/dashboard-components/delete-confirmation-dialog";
import { ThreadTableSkeleton } from "@/components/skeletons/observability-skeletons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { memo, useCallback } from "react";
import { Thread, useThreadList } from "../hooks/useThreadList";
import { SORT_FIELDS, getSortDirectionLabel, getSortLabel } from "../utils";
import { ThreadTableHeader } from "./thread-table-header";
import { ThreadRow } from "./thread-table-row";

export interface ThreadTableProps {
  threads: Thread[];
  onViewMessages: (threadId: string) => void;
  onThreadsDeleted?: () => void;
  projectId: string;
  isLoading: boolean;
  compact?: boolean;
}

export const ThreadTable = memo(
  ({
    threads,
    onViewMessages,
    onThreadsDeleted,
    projectId,
    isLoading,
    compact = false,
  }: ThreadTableProps) => {
    const {
      // State
      sortField,
      sortDirection,
      searchQuery,
      selectedThreads,
      alertState,

      // Computed values
      currentThreads,
      totalThreads,
      totalPages,
      startIndex,
      endIndex,
      currentPage,

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

      // Loading states
      isDeletingThreads,
      deletingThreadIds,
    } = useThreadList({ threads, projectId, onThreadsDeleted });

    const handleViewMessages = useCallback(
      (threadId: string) => {
        onViewMessages(threadId);
      },
      [onViewMessages],
    );

    const handleThreadSelect = useCallback(
      (threadId: string, checked: boolean) => {
        handleSelectThread(threadId, checked);
      },
      [handleSelectThread],
    );

    if (isLoading || projectId === undefined) {
      return <ThreadTableSkeleton />;
    }

    const hasThreads = threads && threads.length > 0;

    // Filter sort fields based on compact mode
    const availableSortFields = compact
      ? SORT_FIELDS.filter(
          (field) => !["updated", "threadName", "contextKey"].includes(field),
        )
      : SORT_FIELDS;

    return (
      <div className="space-y-4">
        {/* Search, Filters, and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2 p-2">
          <div className="w-full sm:w-auto order-2 sm:order-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {availableSortFields.map((field) => (
                  <DropdownMenuItem
                    key={field}
                    onClick={() => handleSort(field)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span>{getSortLabel(field)}</span>
                    {sortField === field && (
                      <span className="text-xs text-muted-foreground">
                        {getSortDirectionLabel(field, sortDirection)}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="relative w-full sm:w-1/2 order-1 sm:order-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-full border w-full"
              aria-label="Search threads by ID, name, or context key"
              role="searchbox"
            />
          </div>
          <div className="w-full sm:w-auto flex justify-end order-3">
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {selectedThreads.size > 0 && (
                <Button
                  variant="ghost"
                  onClick={handleDeleteClick}
                  disabled={isDeletingThreads || deleteThreadMutation.isPending}
                  className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-transparent text-sm"
                >
                  {isDeletingThreads ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span className="hidden sm:inline">Deleting...</span>
                    </>
                  ) : (
                    <>
                      <span className="sm:hidden">
                        Delete ({selectedThreads.size})
                      </span>
                      <span className="hidden sm:inline">
                        Delete ({selectedThreads.size})
                      </span>
                    </>
                  )}
                </Button>
              )}
              {!areAllCurrentThreadsSelected() ? (
                <Button
                  variant="ghost"
                  className="bg-transparent hover:bg-transparent text-sm"
                  onClick={() => handleSelectAll(true)}
                >
                  <span className="sm:hidden">Select all</span>
                  <span className="hidden sm:inline">Select all</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="bg-transparent hover:bg-transparent text-sm"
                  onClick={() => handleSelectAll(false)}
                >
                  <span className="sm:hidden">Deselect</span>
                  <span className="hidden sm:inline">Deselect all</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-md w-full overflow-hidden">
          {/* Pagination Header */}
          {hasThreads && (
            <div className="flex items-center justify-end gap-2 px-2 sm:px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-foreground">
                  {startIndex + 1}-{Math.min(endIndex, totalThreads)} of{" "}
                  {totalThreads}
                  {threads.length >= 10 && (
                    <span className="text-xs ml-1 hidden sm:inline">
                      (showing recent)
                    </span>
                  )}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <Table className="w-full min-w-[400px]">
              <ThreadTableHeader
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                allSelected={
                  currentThreads.length > 0 &&
                  currentThreads.every((t) => selectedThreads.has(t.id))
                }
                onSelectAll={handleSelectAll}
                hasCurrentThreads={currentThreads.length > 0}
                compact={compact}
              />
              <TableBody>
                {currentThreads.length > 0 ? (
                  currentThreads.map((thread) => (
                    <ThreadRow
                      key={thread.id}
                      thread={thread}
                      isSelected={selectedThreads.has(thread.id)}
                      isDeleting={deletingThreadIds.has(thread.id)}
                      onSelect={handleThreadSelect}
                      onViewMessages={handleViewMessages}
                      compact={compact}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={compact ? 6 : 9}
                      className="text-center py-2 text-sm text-muted-foreground"
                    >
                      {searchQuery
                        ? "No threads found matching your search."
                        : "No threads found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          mode="single"
          alertState={alertState}
          setAlertState={setAlertState}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    );
  },
);

ThreadTable.displayName = "ThreadTable";
