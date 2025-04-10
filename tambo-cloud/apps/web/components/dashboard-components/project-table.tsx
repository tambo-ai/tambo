"use client";

import { ProjectResponseDto } from "@/app/dashboard/types/types";
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
import { MessageSquare, Settings } from "lucide-react";
import Link from "next/link";

interface ProjectTableProps {
  projects: ProjectResponseDto[];
  onShowDetails: (project: ProjectResponseDto) => void;
}

export function ProjectTable({ projects, onShowDetails }: ProjectTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Project ID</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
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
              <TableCell className="py-4">
                <div className="flex justify-end items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href={`/dashboard/${project.id}`}>
                      <MessageSquare className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onShowDetails(project)}
                  >
                    <Settings className="h-4 w-4" />
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
