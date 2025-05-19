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
          {projects.map((project) => (
            <TableRow key={project.id} className="hover:bg-accent/5">
              <TableCell className="py-4 font-medium">{project.name}</TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-2">
                  <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                    {project.id}
                  </code>
                  <CopyButton clipboardValue={project.id} />
                </div>
              </TableCell>
              <TableCell className="py-4 text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
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
          ))}
        </TableBody>
      </Table>
      <div className="py-3 px-4 text-sm text-muted-foreground border-t">
        {projects.length} project{projects.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
