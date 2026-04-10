"use client";

import { SettingsRow } from "@/components/ui/settings-row";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { useState } from "react";

interface SystemPromptOverrideToggleProps {
  projectId: string;
  allowSystemPromptOverride?: boolean | null;
  onEdited: () => void;
}

export function SystemPromptOverrideToggle({
  projectId,
  allowSystemPromptOverride: initialValue,
  onEdited,
}: SystemPromptOverrideToggleProps) {
  const { toast } = useToast();
  const [checked, setChecked] = useState(Boolean(initialValue));

  const updateProject = api.project.updateProject.useMutation({
    onSuccess: () => {
      onEdited();
    },
    onError: () => {
      setChecked(Boolean(initialValue));
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  const handleChange = (val: boolean) => {
    setChecked(val);
    updateProject.mutate({
      projectId,
      allowSystemPromptOverride: val,
    });
  };

  return (
    <SettingsRow
      label="Allow system prompt override"
      description="When enabled, a system message passed from client-side initialMessages will override custom instructions."
    >
      <Switch
        checked={checked}
        onCheckedChange={handleChange}
        disabled={updateProject.isPending}
        aria-label="Allow system prompt override"
      />
    </SettingsRow>
  );
}
