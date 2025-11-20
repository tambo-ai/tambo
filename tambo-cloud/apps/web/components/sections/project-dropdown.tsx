"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { Check, ChevronDown, ChevronUp, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateProjectDialog } from "../dashboard-components/create-project-dialog";
import { SearchInput } from "../ui/search-input";

interface Project {
  id: string;
  name: string;
  messages: number;
  users: number;
}

interface ProjectDropdownProps {
  projectId: string | null;
  projects: Project[] | undefined;
  currentProject: Project | undefined;
  refetchProjects: () => void;
}

export function ProjectDropdown({
  projectId,
  projects,
  currentProject,
  refetchProjects,
}: ProjectDropdownProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Filter projects based on search query
  const filteredProjects =
    projects?.filter((project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  // Create project mutations
  const { mutateAsync: createProject } =
    api.project.createProject2.useMutation();
  const { mutateAsync: addProviderKey } =
    api.project.addProviderKey.useMutation();

  const handleProjectChange = (selectedProjectId: string) => {
    if (selectedProjectId !== projectId) {
      router.push(`/dashboard/${selectedProjectId}`);
      setIsOpen(false);
    }
  };

  const handleCreateProject = async (
    projectName: string,
    providerKey?: string,
  ) => {
    try {
      const project = await createProject({ name: projectName });
      await addProviderKey({
        projectId: project.id,
        provider: "openai",
        providerKey: providerKey ?? "",
      });

      await refetchProjects();

      setIsCreateDialogOpen(false);
      setIsOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      return project;
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create project: ${error}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  if (!projectId || !projects || projects.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-2 py-1 h-auto"
          >
            <div className="flex items-center gap-2">
              <Image
                src="/logo/icon/Octo-Icon.svg"
                width={24}
                height={24}
                alt="Octo Icon"
                className="h-6 w-6"
              />
              <span className="hidden md:inline-block font-medium">
                {currentProject?.name || "Select project"}
              </span>
            </div>
            <div className="flex flex-col -space-y-2">
              <ChevronUp className="h-4 w-4" />
              <ChevronDown className="h-4 w-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <div className="p-2">
            <SearchInput
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenuSeparator />

          {/* Projects list with scrolling */}
          <ScrollArea className="h-[200px]">
            <div className="p-1">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    className="cursor-pointer hover:bg-theme-accent focus:bg-theme-accent"
                    onClick={() => handleProjectChange(project.id)}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-xs text-foreground">
                          {project.messages} messages • {project.users} users
                        </span>
                      </div>
                      {project.id === projectId && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-sm text-foreground">
                  No projects found
                </div>
              )}
            </div>
          </ScrollArea>

          <DropdownMenuSeparator />

          {/* Create new project button */}
          <Button
            variant="outline"
            className="w-full justify-start border-none hover:bg-theme-accent"
            onClick={() => {
              setIsOpen(false);
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4 border border-gray-300 rounded-full" />
            Create New Project
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateProject}
      />
    </>
  );
}
