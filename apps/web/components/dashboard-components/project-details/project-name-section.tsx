"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Project Name</CardTitle>
        <CardDescription className="text-sm font-sans text-foreground">
          The display name for this project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="flex flex-col gap-3">
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
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isPending || !editedName.trim()}
              >
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm">{projectName}</span>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
