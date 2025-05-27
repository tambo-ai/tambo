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
import { ArrowRight } from "lucide-react";
import { type RouterOutputs } from "@/trpc/react";
import Link from "next/link";
import { z } from "zod";

export const ProjectTableSchema = z
  .object({
    id: z.string().describe("The unique identifier for the project."),
    name: z.string().describe("The human-readable name of the project."),
  })
  .describe(
    "Defines the structure of a project object, including its ID, name, and creation date.",
  );

export const ProjectTableProps = z.object({
  projects: z
    .array(ProjectTableSchema)
    .describe("An array of project objects to display in the table."),
});

interface ProjectTableProps {
  projects: RouterOutputs["project"]["getUserProjects"];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead className="w-[100px]">Project ID</TableHead>
            <TableHead className="w-[100px]">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects && projects.length > 0 ? (
            projects.map((project, index) => (
              <TableRow
                key={project.id ? project.id : `project-${index}`}
                className="hover:bg-accent/5"
              >
                <TableCell className="py-4 font-medium">
                  {project.name}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                      {project.id}
                    </code>
                    <CopyButton clipboardValue={project.id} />
                  </div>
                </TableCell>
                <TableCell className="py-4 text-sm text-muted-foreground">
                  {new Date(project.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex justify-end items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1"
                      asChild
                    >
                      <Link href={`/dashboard/${project.id}`}>
                        <span>Project Details</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow key="no-projects">
              <TableCell colSpan={4} className="text-center py-4">
                No projects found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="py-3 px-4 text-sm text-muted-foreground border-t">
        {projects ? projects.length : 0} project
        {projects && projects.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
