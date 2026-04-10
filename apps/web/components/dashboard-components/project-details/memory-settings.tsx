"use client";

import { SettingsRow } from "@/components/ui/settings-row";
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
    <>
      <SettingsRow
        label="Enable memory"
        description="Automatically extract and remember facts about users across conversations. Memories are injected into the system prompt."
        htmlFor="memory-enabled"
      >
        <Switch
          id="memory-enabled"
          checked={memoryEnabled}
          onCheckedChange={handleMemoryEnabledChange}
          disabled={updateProject.isPending}
        />
      </SettingsRow>

      <SettingsRow
        label="Enable memory tools"
        description="Give the agent save_memory and delete_memory tools so it can explicitly save or forget information during conversations. Requires memory to be enabled."
        htmlFor="memory-tools-enabled"
      >
        <Switch
          id="memory-tools-enabled"
          checked={memoryToolsEnabled}
          onCheckedChange={handleMemoryToolsEnabledChange}
          disabled={!memoryEnabled || updateProject.isPending}
        />
      </SettingsRow>
    </>
  );
}
