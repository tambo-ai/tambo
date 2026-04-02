"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { useState } from "react";

interface MemorySettingsProps {
  projectId: string;
  memoryEnabled: boolean;
  memoryToolsEnabled: boolean;
  onEdited: () => void;
}

export function MemorySettings({
  projectId,
  memoryEnabled: memoryEnabledProp,
  memoryToolsEnabled: memoryToolsEnabledProp,
  onEdited,
}: MemorySettingsProps) {
  const { toast } = useToast();
  const [memoryEnabled, setMemoryEnabled] = useState(memoryEnabledProp);
  const [memoryToolsEnabled, setMemoryToolsEnabled] = useState(
    memoryToolsEnabledProp,
  );

  const updateProject = api.project.updateProject.useMutation({
    onSuccess: () => {
      onEdited();
    },
    onError: (error) => {
      toast({
        title: "Failed to update memory settings",
        description: error.message,
        variant: "destructive",
      });
      // Revert optimistic state
      setMemoryEnabled(memoryEnabledProp);
      setMemoryToolsEnabled(memoryToolsEnabledProp);
    },
  });

  const handleMemoryEnabledChange = (checked: boolean) => {
    setMemoryEnabled(checked);
    // If disabling memory, also disable tools
    if (!checked && memoryToolsEnabled) {
      setMemoryToolsEnabled(false);
      updateProject.mutate({
        projectId,
        memoryEnabled: checked,
        memoryToolsEnabled: false,
      });
    } else {
      updateProject.mutate({ projectId, memoryEnabled: checked });
    }
  };

  const handleMemoryToolsEnabledChange = (checked: boolean) => {
    setMemoryToolsEnabled(checked);
    updateProject.mutate({ projectId, memoryToolsEnabled: checked });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memory</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="memory-enabled">Enable memory</Label>
            <p className="text-sm text-muted-foreground">
              Automatically extract and remember facts about users across
              conversations. Memories are injected into the system prompt.
            </p>
          </div>
          <Switch
            id="memory-enabled"
            checked={memoryEnabled}
            onCheckedChange={handleMemoryEnabledChange}
            disabled={updateProject.isPending}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="memory-tools-enabled">Enable memory tools</Label>
            <p className="text-sm text-muted-foreground">
              Give the agent save_memory and delete_memory tools so it can
              explicitly save or forget information during conversations.
              Requires memory to be enabled.
            </p>
          </div>
          <Switch
            id="memory-tools-enabled"
            checked={memoryToolsEnabled}
            onCheckedChange={handleMemoryToolsEnabledChange}
            disabled={!memoryEnabled || updateProject.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
