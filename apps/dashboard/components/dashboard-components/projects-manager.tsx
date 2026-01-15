"use client";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { useToast } from "@/hooks/use-toast";
import { type RouterOutputs } from "@/trpc/react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { ProjectTable } from "./project-table";
import { Loader2 } from "lucide-react";

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

interface ProjectsManagerProps {
  projects: RouterOutputs["project"]["getUserProjects"] | undefined;
  onCreateProject: () => void;
  onRefetchProjects: () => void;
}

export function ProjectsManager({
  projects,
  onCreateProject,
  onRefetchProjects,
}: ProjectsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchTerm) return projects;

    const term = searchTerm.toLowerCase();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(term) ||
        project.id.toLowerCase().includes(term),
    );
  }, [projects, searchTerm]);

  // Get selected project details for the dialog
  const selectedProjectDetails = useMemo(() => {
    if (!projects) return { ids: [], names: [] };
    const selectedProjectsData = projects.filter(
      (p) => p.id && selectedProjects.has(p.id),
    );
    return {
      ids: selectedProjectsData.map((p) => p.id).filter(Boolean),
      names: selectedProjectsData.map((p) => p.name),
    };
  }, [projects, selectedProjects]);

  const allProjectIds = useMemo(() => {
    return new Set(projects?.map((p) => p.id) || []);
  }, [projects]);

  // Simple boolean calculation - no need for useMemo
  const allSelected = projects?.length === selectedProjects.size;

  // Handler for select/deselect all
  const handleToggleSelectAll = () => {
    setSelectedProjects(allSelected ? new Set() : allProjectIds);
  };

  const handleProjectsDeleted = () => {
    setSelectedProjects(new Set());
    onRefetchProjects();
    toast({
      title: "Success",
      description: "Projects deleted successfully",
    });
  };

  return (
    <>
      <motion.div
        className="flex items-center justify-between py-8"
        variants={itemVariants}
      >
        <h1 className="text-4xl font-bold">Projects</h1>
      </motion.div>
      <motion.div variants={itemVariants} className="mb-6">
        <div className="relative flex items-center justify-between gap-2">
          <SearchInput
            variant="rounded"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex items-center gap-2">
            {selectedProjects.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent border-none text-red-500 hover:text-red-500 hover:bg-transparent hover:border-none"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  `Delete (${selectedProjects.size})`
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent border-none hover:bg-transparent hover:border-none hover:text-muted-foreground"
              onClick={handleToggleSelectAll}
            >
              {allSelected ? "Deselect All" : "Select All"}
            </Button>
            <Button
              onClick={onCreateProject}
              className="text-sm px-4 gap-2 rounded-xl"
              variant="default"
            >
              Create Project
            </Button>
          </div>
        </div>
      </motion.div>
      <motion.div variants={itemVariants}>
        <ProjectTable
          projects={filteredProjects || []}
          selectedProjects={selectedProjects}
          onSelectedProjectsChange={setSelectedProjects}
        />
      </motion.div>
      <DeleteConfirmationDialog
        mode="multiple"
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selectedProjectIds={selectedProjectDetails.ids}
        selectedProjectNames={selectedProjectDetails.names}
        onProjectsDeleted={handleProjectsDeleted}
        onLoadingChange={setIsDeleting}
      />
    </>
  );
}
