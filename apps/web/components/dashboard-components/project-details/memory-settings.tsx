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
  onEdited: () => void;
}

export function MemorySettings({
  projectId,
  memoryEnabled: memoryEnabledProp,
  onEdited,
}: MemorySettingsProps) {
  const { toast } = useToast();
  const [memoryEnabled, setMemoryEnabled] = useState(memoryEnabledProp);

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
      setMemoryEnabled(memoryEnabledProp);
    },
  });

  const handleMemoryEnabledChange = (checked: boolean) => {
    setMemoryEnabled(checked);
    updateProject.mutate({ projectId, memoryEnabled: checked });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Memory</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
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
      </CardContent>
    </Card>
  );
}
