"use client";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type RouterOutputs } from "@/trpc/react";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

export const ProjectTableSchema = z
  .object({
    id: z.string().describe("The unique identifier for the project."),
    name: z.string().describe("The human-readable name of the project."),
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
}

export function ProjectTable({ projects, compact = false }: ProjectTableProps) {
  const cellClass = compact ? "py-2 text-sm" : "py-4";
  const headerClass = compact ? "text-sm font-medium" : "";

  const isLoading = projects === undefined;
  const hasProjects = projects && projects.length > 0;

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

  return (
    <div className="rounded-md border w-full overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className={`${headerClass} ${compact ? "px-4 text-primary" : ""}`}
              >
                Name
              </TableHead>
              <TableHead
                className={`${headerClass} ${compact ? "px-4 hidden sm:table-cell text-primary" : ""}`}
              >
                Project ID
              </TableHead>
              <TableHead
                className={`${headerClass} ${compact ? "px-4 hidden md:table-cell text-primary" : ""}`}
              >
                Created
              </TableHead>
              {!compact && (
                <TableHead className={headerClass}>
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow key="loading">
                <TableCell
                  colSpan={compact ? 3 : 4}
                  className={`text-center ${cellClass}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : hasProjects ? (
              projects.map((project, index) => {
                const projectId = project.id || "";
                const displayId =
                  compact && projectId
                    ? projectId.slice(0, 8) + "..."
                    : projectId;

                return (
                  <TableRow
                    key={projectId || `project-${index}`}
                    className="hover:bg-accent/5"
                  >
                    <TableCell
                      className={`${cellClass} font-medium ${compact ? "px-4" : ""}`}
                    >
                      {compact && projectId ? (
                        <Link
                          href={`/dashboard/${projectId}`}
                          className="inline-flex items-center gap-1 text-foreground hover:text-primary transition-colors duration-100 group"
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
                      className={`${cellClass} ${compact ? "px-4 hidden sm:table-cell" : ""}`}
                    >
                      <div className="flex items-center gap-1">
                        <code
                          className={`${compact ? "text-xs" : "text-sm"} bg-muted px-1.5 py-0.5 rounded`}
                        >
                          {displayId || "N/A"}
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
                      className={`${cellClass} text-muted-foreground ${compact ? "px-4 hidden md:table-cell text-primary" : "text-sm"}`}
                    >
                      {formatDate(project.createdAt)}
                    </TableCell>
                    {!compact && !isLoading && (
                      <TableCell className={cellClass}>
                        <div className="flex justify-end items-center">
                          {projectId ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1"
                              asChild
                            >
                              <Link href={`/dashboard/${projectId}`}>
                                <span>Project Details</span>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No ID
                            </span>
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
                  colSpan={compact ? 3 : 4}
                  className={`text-center ${cellClass}`}
                >
                  No projects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!compact && !isLoading && (
        <div className="py-3 px-4 text-sm text-muted-foreground border-t">
          {projects ? projects.length : 0} project
          {projects && projects.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
