"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsRow } from "@/components/ui/settings-row";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { useState } from "react";

interface ProjectNameSectionProps {
  projectId: string;
  projectName: string;
  onEdited: () => void;
}

export function ProjectNameSection({
  projectId,
  projectName,
  onEdited,
}: ProjectNameSectionProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");

  const { mutateAsync: updateProject, isPending } =
    api.project.updateProject.useMutation();

  const handleEdit = () => {
    setEditedName(projectName);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedName.trim()) return;

    try {
      await updateProject({
        projectId,
        name: editedName.trim(),
      });
      onEdited();
      toast({
        title: "Success",
        description: "Project name updated successfully",
      });
      setIsEditing(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to update project name",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName("");
  };

  return (
    <SettingsRow
      label="Project name"
      description="The display name for this project."
    >
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            placeholder="Project name"
            disabled={isPending}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                await handleSave();
              } else if (e.key === "Escape") {
                handleCancel();
              }
            }}
            autoFocus
            className="w-48"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending || !editedName.trim()}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm">{projectName}</span>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            Edit
          </Button>
        </div>
      )}
    </SettingsRow>
  );
}
