"use client";

import { CopyButton } from "@/components/copy-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { projectTableSchema } from "@/lib/schemas/project";
import { type RouterOutputs } from "@/trpc/react";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { z } from "zod/v3";

export const ProjectTableProps = z.object({
  compact: z
    .boolean()
    .optional()
    .describe("Whether to use compact mode. Always use compact mode."),
  projects: z
    .array(projectTableSchema)
    .optional()
    .describe("An array of project objects to display in the table."),
});

interface ProjectTableProps {
  projects?: RouterOutputs["project"]["getUserProjects"];
  compact?: boolean;
  selectedProjects: Set<string>;
  onSelectedProjectsChange: (selected: Set<string>) => void;
}

export function ProjectTable({
  projects,
  compact = false,
  selectedProjects,
  onSelectedProjectsChange,
}: ProjectTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const projectsPerPage = 4;

  const cellClass = compact ? "py-2 text-sm" : "py-4";
  const headerClass = compact ? "text-sm font-medium" : "";

  const isLoading = projects === undefined;
  const hasProjects = projects && projects.length > 0;

  // Pagination calculations
  const totalProjects = projects?.length || 0;
  const totalPages = Math.ceil(totalProjects / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;

  // Get current page projects
  const currentProjects = useMemo(() => {
    if (!projects) return [];
    return projects.slice(startIndex, endIndex);
  }, [projects, startIndex, endIndex]);

  const formatDate = (dateValue: Date | string, forceCompact = false) => {
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      // Use compact format on small screens or when explicitly set to compact
      const useCompact = forceCompact || compact;
      return date.toLocaleDateString(undefined, {
        month: useCompact ? "short" : "long",
        day: "numeric",
        year: useCompact ? "2-digit" : "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(
        currentProjects.map((p) => p.id).filter(Boolean),
      );
      onSelectedProjectsChange(newSelected);
    } else {
      onSelectedProjectsChange(new Set());
    }
  };

  const handleSelectProject = (projectId: string, checked: boolean) => {
    const newSelected = new Set(selectedProjects || new Set<string>());
    if (checked) {
      newSelected.add(projectId);
    } else {
      newSelected.delete(projectId);
    }
    onSelectedProjectsChange(newSelected);
  };

  return (
    <div className="rounded-md w-full overflow-hidden">
      {hasProjects && (
        <div className="flex items-center justify-end gap-2 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">
              {startIndex + 1}-{Math.min(endIndex, totalProjects)} of{" "}
              {totalProjects}
            </span>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 text-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 text-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* Checkbox column - hidden on small screens, visible on lg and up (unless compact is true) */}
              <TableHead
                className={`${headerClass} ${compact ? "hidden" : "hidden lg:table-cell"}`}
              >
                <input
                  type="checkbox"
                  checked={
                    currentProjects.length > 0 &&
                    currentProjects.every(
                      (p) => p.id && (selectedProjects?.has(p.id) ?? false),
                    )
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead className={`${headerClass} text-foreground`}>
                Project
              </TableHead>
              {/* ID column - hidden on xs, visible on sm and up */}
              <TableHead
                className={`${headerClass} px-4 hidden sm:table-cell text-foreground`}
              >
                ID
              </TableHead>
              {/* Created column - hidden on xs and sm, visible on md and up */}
              <TableHead
                className={`${headerClass} px-4 hidden md:table-cell text-foreground`}
              >
                Created
              </TableHead>
              {/* Last message column - hidden on xs and sm, visible on md and up */}
              <TableHead
                className={`${headerClass} px-4 hidden md:table-cell text-foreground`}
              >
                Last message
              </TableHead>
              {/* Messages column - visible in both compact and full modes */}
              <TableHead className={`${headerClass} text-foreground`}>
                Messages
              </TableHead>
              <TableHead
                className={`${headerClass} text-foreground ${compact ? "hidden" : "hidden lg:table-cell"}`}
              >
                Users
              </TableHead>
              {/* Actions column - only visible on lg and up (unless compact is true) */}
              <TableHead
                className={`${headerClass} text-foreground ${compact ? "hidden" : "hidden lg:table-cell"}`}
              >
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow key="loading">
                <TableCell colSpan={8} className={`text-center ${cellClass}`}>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-foreground">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : hasProjects ? (
              currentProjects.map((project, index) => {
                const projectId = project.id || "";
                const projectName = projectId ? (
                  <Link
                    href={`/dashboard/${projectId}`}
                    className="inline-flex items-center gap-1 transition-colors duration-100 group rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span className="group-hover:underline group-focus-visible:underline underline-offset-4">
                      {project.name}
                    </span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-100" />
                  </Link>
                ) : (
                  project.name
                );

                return (
                  <TableRow
                    key={projectId || `project-${index}`}
                    className="hover:bg-accent/5"
                  >
                    {/* Checkbox cell - hidden on small screens */}
                    <TableCell
                      className={`${cellClass} w-4 ${compact ? "hidden" : "hidden lg:table-cell"}`}
                    >
                      <input
                        type="checkbox"
                        checked={
                          projectId
                            ? (selectedProjects?.has(projectId) ?? false)
                            : false
                        }
                        onChange={(e) =>
                          projectId &&
                          handleSelectProject(projectId, e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className={`${cellClass} font-medium px-4`}>
                      {projectName}
                    </TableCell>
                    <TableCell
                      className={`${cellClass} px-4 hidden sm:table-cell`}
                    >
                      <div className="flex items-center gap-1">
                        <code className="text-xs lg:text-sm bg-info text-info px-1.5 py-0.5 rounded truncate max-w-[100px]">
                          {projectId || "N/A"}
                        </code>
                        {projectId && (
                          <CopyButton
                            clipboardValue={projectId}
                            className="h-3 w-3 lg:h-4 lg:w-4"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={`${cellClass} px-4 hidden md:table-cell text-sm`}
                    >
                      {/* Show compact date on small/medium screens */}
                      <span className="lg:hidden">
                        {formatDate(project.createdAt, true)}
                      </span>
                      {/* Show full date on large screens (unless compact is true) */}
                      <span className="hidden lg:inline">
                        {formatDate(project.createdAt)}
                      </span>
                    </TableCell>
                    {/* Last message column */}
                    <TableCell
                      className={`${cellClass} px-4 hidden md:table-cell text-sm`}
                    >
                      {project.lastMessageAt ? (
                        <>
                          {/* Compact date */}
                          <span className="lg:hidden">
                            {formatDate(project.lastMessageAt, true)}
                          </span>
                          {/* Full date */}
                          <span className="hidden lg:inline">
                            {formatDate(project.lastMessageAt)}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    {/* Messages & Users - only visible on large screens */}
                    <TableCell className={`${cellClass} text-sm`}>
                      {project.messages}
                    </TableCell>
                    <TableCell
                      className={`${cellClass} text-sm ${compact ? "hidden" : "hidden lg:table-cell"}`}
                    >
                      {project.users}
                    </TableCell>
                    {/* Actions - only visible on large screens */}
                    <TableCell
                      className={`${cellClass} ${compact ? "hidden" : "hidden lg:table-cell"}`}
                    >
                      <div className="flex items-center">
                        {projectId ? (
                          <Link
                            href={`/dashboard/${projectId}`}
                            className="hover:bg-accent rounded-md p-1"
                          >
                            View
                          </Link>
                        ) : (
                          <span className="text-sm">No ID</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow key="no-projects">
                <TableCell colSpan={8} className={`text-center ${cellClass}`}>
                  No projects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
