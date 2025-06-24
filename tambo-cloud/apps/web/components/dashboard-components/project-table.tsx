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
import { type RouterOutputs } from "@/trpc/react";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { z } from "zod";

export const ProjectTableSchema = z
  .object({
    id: z.string().describe("The unique identifier for the project."),
    name: z.string().describe("The human-readable name of the project."),
    messages: z.number().describe("The number of messages in the project."),
    users: z.number().describe("The number of users in the project."),
    createdAt: z
      .string()
      .datetime()
      .describe("The date and time the project was created."),
  })
  .describe(
    "Defines the structure of a project object, including its ID, name, and creation date.",
  );

export const ProjectTableProps = z.object({
  compact: z
    .boolean()
    .optional()
    .describe("Whether to use compact mode. Always use compact mode."),
  projects: z
    .array(ProjectTableSchema)
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

  const formatDate = (dateValue: Date | string) => {
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return date.toLocaleDateString(undefined, {
        month: compact ? "short" : "long",
        day: "numeric",
        year: compact ? "2-digit" : "numeric",
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
    const newSelected = new Set(selectedProjects);
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
              <TableHead className={headerClass}>
                <input
                  type="checkbox"
                  checked={
                    currentProjects.length > 0 &&
                    currentProjects.every(
                      (p) => p.id && selectedProjects.has(p.id),
                    )
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead className={`${headerClass} text-foreground`}>
                Project
              </TableHead>
              <TableHead
                className={`${headerClass} ${
                  compact ? "px-4 hidden sm:table-cell" : ""
                } text-foreground`}
              >
                ID
              </TableHead>
              <TableHead
                className={`${headerClass} ${
                  compact ? "px-4 hidden md:table-cell" : ""
                } text-foreground`}
              >
                Created
              </TableHead>
              {!compact && (
                <>
                  <TableHead className={`${headerClass} text-foreground`}>
                    Messages
                  </TableHead>
                  <TableHead className={`${headerClass} text-foreground`}>
                    Users
                  </TableHead>
                </>
              )}
              {!compact && (
                <TableHead className={`${headerClass} text-foreground`}>
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow key="loading">
                <TableCell
                  colSpan={compact ? 4 : 7}
                  className={`text-center ${cellClass}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-foreground">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : hasProjects ? (
              currentProjects.map((project, index) => {
                const projectId = project.id || "";

                return (
                  <TableRow
                    key={projectId || `project-${index}`}
                    className="hover:bg-accent/5"
                  >
                    <TableCell className={`${cellClass} w-4`}>
                      <input
                        type="checkbox"
                        checked={
                          projectId ? selectedProjects.has(projectId) : false
                        }
                        onChange={(e) =>
                          projectId &&
                          handleSelectProject(projectId, e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell
                      className={`${cellClass} font-medium ${
                        compact ? "px-4" : ""
                      }`}
                    >
                      {compact && projectId ? (
                        <Link
                          href={`/dashboard/${projectId}`}
                          className="inline-flex items-center gap-1 transition-colors duration-100 group"
                        >
                          <span className="group-hover:underline underline-offset-4">
                            {project.name}
                          </span>
                          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-100" />
                        </Link>
                      ) : (
                        project.name
                      )}
                    </TableCell>
                    <TableCell
                      className={`${cellClass} ${
                        compact ? "px-4 hidden sm:table-cell" : ""
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <code
                          className={`${
                            compact ? "text-xs" : "text-sm"
                          } bg-info text-info px-1.5 py-0.5 rounded text-ellipsis overflow-hidden whitespace-nowrap max-w-28`}
                        >
                          {projectId || "N/A"}
                        </code>
                        {projectId && (
                          <CopyButton
                            clipboardValue={projectId}
                            className={compact ? "h-3 w-3" : ""}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={`${cellClass} ${
                        compact ? "px-4 hidden md:table-cell" : "text-sm"
                      }`}
                    >
                      {formatDate(project.createdAt)}
                    </TableCell>
                    {!compact && (
                      <>
                        <TableCell className={`${cellClass} text-sm`}>
                          {project.messages}
                        </TableCell>
                        <TableCell className={`${cellClass} text-sm`}>
                          {project.users}
                        </TableCell>
                      </>
                    )}
                    {!compact && !isLoading && (
                      <TableCell className={cellClass}>
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
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow key="no-projects">
                <TableCell
                  colSpan={compact ? 4 : 7}
                  className={`text-center ${cellClass}`}
                >
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
