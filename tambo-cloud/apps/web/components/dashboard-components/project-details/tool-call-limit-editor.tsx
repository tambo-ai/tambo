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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { useState } from "react";

interface ToolCallLimitEditorProps {
  project: {
    id: string;
    maxToolCallLimit: number;
  };
  onEdited?: () => void;
}

export function ToolCallLimitEditor({
  project,
  onEdited,
}: ToolCallLimitEditorProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [maxToolCallLimit, setMaxToolCallLimit] = useState(
    project.maxToolCallLimit.toString(),
  );

  const { mutateAsync: updateProject, isPending: isUpdating } =
    api.project.updateProject.useMutation();

  const handleSave = async () => {
    const limit = parseInt(maxToolCallLimit);

    if (isNaN(limit) || limit < 1) {
      toast({
        title: "Error",
        description: "Please enter a valid number greater than 0.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProject({
        projectId: project.id,
        maxToolCallLimit: limit,
      });

      toast({
        title: "Success",
        description: "Tool call limit updated successfully",
      });

      setIsEditing(false);
      onEdited?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tool call limit",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setMaxToolCallLimit(project.maxToolCallLimit.toString());
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Call Limit</CardTitle>
        <CardDescription>
          Set the maximum number of tool calls allowed per response. This helps
          prevent infinite loops and controls resource usage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxToolCallLimit">Maximum Tool Calls</Label>
              <Input
                id="maxToolCallLimit"
                type="number"
                min="1"
                value={maxToolCallLimit}
                onChange={(e) => setMaxToolCallLimit(e.target.value)}
                placeholder="Enter maximum tool calls"
                disabled={isUpdating}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Limit</p>
                <p className="text-2xl font-bold">{project.maxToolCallLimit}</p>
              </div>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              When the Tambo reaches this limit, it will finish the response
              with a message that it has reached the limit.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
