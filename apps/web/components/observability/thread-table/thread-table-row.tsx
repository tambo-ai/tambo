"use client";

import { CopyButton } from "@/components/copy-button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { memo, useCallback } from "react";
import { Thread } from "../hooks/useThreadList";
import { formatDateThreadTable } from "../utils";

interface ThreadRowProps {
  thread: Thread;
  isSelected: boolean;
  isDeleting: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onViewMessages: (id: string) => void;
  compact?: boolean;
}

export const ThreadRow = memo(
  ({
    thread,
    isSelected,
    isDeleting,
    onSelect,
    onViewMessages,
    compact = false,
  }: ThreadRowProps) => {
    const handleSelect = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onSelect(thread.id, e.target.checked);
      },
      [thread.id, onSelect],
    );

    const handleViewMessages = useCallback(() => {
      onViewMessages(thread.id);
    }, [thread.id, onViewMessages]);

    return (
      <TableRow
        className={cn(
          "hover:bg-accent/5",
          isDeleting && "opacity-50 pointer-events-none",
        )}
      >
        <TableCell className="py-2 text-sm w-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelect}
              disabled={isDeleting}
              className="rounded border-gray-300"
              aria-label={`Select thread ${thread.id.slice(0, 8)}`}
            />
            {isDeleting && (
              <div
                className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"
                aria-label="Deleting thread"
              />
            )}
          </div>
        </TableCell>

        <TableCell className="py-2 text-sm px-2 sm:px-4 text-primary">
          <div className="flex flex-col gap-1">
            <span className="text-xs sm:text-sm">
              {formatDateThreadTable(thread.createdAt).date}
            </span>
            <span className="text-xs text-foreground">
              {formatDateThreadTable(thread.createdAt).time}
            </span>
          </div>
        </TableCell>

        <TableCell
          className={`py-2 text-sm px-4 text-primary ${
            compact ? "hidden" : "hidden lg:table-cell"
          }`}
        >
          <div className="flex flex-col gap-1">
            <span>{formatDateThreadTable(thread.updatedAt).date}</span>
            <span className="text-xs text-foreground">
              {formatDateThreadTable(thread.updatedAt).time}
            </span>
          </div>
        </TableCell>

        <TableCell className="py-2 text-sm px-2 sm:px-4 hidden sm:table-cell">
          <div className="flex items-center gap-1">
            <code className="text-xs bg-info text-info px-1.5 py-0.5 rounded text-ellipsis overflow-hidden max-w-28 whitespace-nowrap">
              {thread.id || "N/A"}
            </code>
            <CopyButton clipboardValue={thread.id || ""} className="h-6 w-6" />
          </div>
        </TableCell>

        <TableCell
          className={`py-2 text-xs sm:text-sm px-2 sm:px-4 font-medium ${
            compact ? "hidden" : ""
          }`}
        >
          <span className="block truncate max-w-[120px] sm:max-w-none">
            {thread.name || (
              <span className="text-primary italic">No name</span>
            )}
          </span>
        </TableCell>

        <TableCell
          className={`py-2 text-sm px-4 font-medium ${
            compact ? "hidden" : "hidden md:table-cell"
          }`}
        >
          {thread.contextKey}
        </TableCell>

        <TableCell className="py-2 text-sm text-primary px-4 hidden md:table-cell">
          {thread.messages}
        </TableCell>

        <TableCell className="py-2 text-sm px-4 hidden md:table-cell">
          <span
            className={cn(
              "font-medium",
              thread.errors > 0 ? "text-red-600" : "text-primary",
            )}
          >
            {thread.errors}
          </span>
        </TableCell>

        <TableCell className="py-2 text-xs sm:text-sm px-1 sm:px-2">
          <button
            onClick={handleViewMessages}
            disabled={isDeleting}
            className="text-primary hover:bg-accent rounded-md p-1 disabled:opacity-50"
            aria-label={`View messages for thread ${thread.id.slice(0, 8)}`}
          >
            <span className="hidden sm:inline">View messages</span>
            <span className="sm:hidden">View</span>
          </button>
        </TableCell>
      </TableRow>
    );
  },
);

ThreadRow.displayName = "ThreadRow";
