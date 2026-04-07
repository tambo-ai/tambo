"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_API_KEY_NAME, DEFAULT_PROJECT_NAME } from "@/lib/constants";
import { useClipboard } from "@/hooks/use-clipboard";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { Copy, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";

interface CopyCommandButtonProps {
  label: string;
  command: string;
}

function CopyCommandButton({ label, command }: CopyCommandButtonProps) {
  const [, copy] = useClipboard(command);
  const { toast } = useToast();

  const handleCopy = async () => {
    const success = await copy();
    if (success) {
      toast({
        title: "Copied",
        description: (
          <code className="font-mono text-xs bg-white/20 text-white rounded px-1.5 py-0.5">
            {command}
          </code>
        ),
      });
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
    >
      {label}
      <Copy className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}

export function GettingStartedGuide() {
  const [projectName, setProjectName] = useState(DEFAULT_PROJECT_NAME);
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [, copyKey] = useClipboard(createdApiKey ?? "");
  const { toast } = useToast();

  const { data: projects, isLoading: isLoadingProjects } =
    api.project.getUserProjects.useQuery();

  const createProjectMutation = api.project.createProject2.useMutation();
  const generateKeyMutation = api.project.generateApiKey.useMutation();
  const utils = api.useUtils();

  const handleCopyKey = async () => {
    const success = await copyKey();
    if (success) {
      toast({ title: "Copied", description: "API key" });
    }
  };

  const handleCreateProject = async () => {
    try {
      const project = await createProjectMutation.mutateAsync({
        name: projectName,
      });
      const keyResult = await generateKeyMutation.mutateAsync({
        projectId: project.id,
        name: DEFAULT_API_KEY_NAME,
      });
      setCreatedApiKey(keyResult.apiKey);
      await utils.project.getUserProjects.invalidate();
      toast({
        title: "Success",
        description: "Project and API key created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const handleCreateApiKey = async () => {
    if (!projects || projects.length === 0) return;

    try {
      const project = projects[0];
      const keyResult = await generateKeyMutation.mutateAsync({
        projectId: project.id,
        name: DEFAULT_API_KEY_NAME,
      });
      setCreatedApiKey(keyResult.apiKey);
      toast({
        title: "Success",
        description: "API key created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create API key",
        variant: "destructive",
      });
    }
  };

  // Hide guide if user has 2+ projects (they're past onboarding)
  if (projects && projects.length > 1) {
    return null;
  }

  // Show loading skeleton
  if (isLoadingProjects) {
    return (
      <div className="rounded-3xl border border-card-background bg-card-background p-4 mb-6">
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        <div className="mt-3 h-9 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const hasExistingProject = projects && projects.length === 1;
  const existingProject = hasExistingProject ? projects[0] : null;

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-card-background bg-card-background p-4 mb-6">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-card-foreground">
          {createdApiKey
            ? "Your API Key"
            : hasExistingProject
              ? existingProject?.name
              : "Get Started"}
        </h5>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {createdApiKey ? (
          <>
            <Input
              type="text"
              readOnly
              value={createdApiKey}
              className="flex-1 font-mono text-sm"
            />
            <button
              onClick={handleCopyKey}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              Copy
              <Copy className="h-3 w-3 text-muted-foreground" />
            </button>
          </>
        ) : hasExistingProject ? (
          <Button
            size="sm"
            variant="default"
            className="font-sans"
            disabled={generateKeyMutation.isPending}
            onClick={handleCreateApiKey}
          >
            {generateKeyMutation.isPending ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <KeyRound className="h-3 w-3" />
                Create API Key
              </span>
            )}
          </Button>
        ) : (
          <>
            <Input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="flex-1"
            />
            <Button
              size="sm"
              variant="default"
              className="font-sans"
              disabled={
                createProjectMutation.isPending ||
                generateKeyMutation.isPending ||
                !projectName.trim()
              }
              onClick={handleCreateProject}
            >
              {createProjectMutation.isPending ||
              generateKeyMutation.isPending ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <KeyRound className="h-3 w-3" />
                  Create Project
                </span>
              )}
            </Button>
          </>
        )}
        <div className="flex items-center gap-2">
          <CopyCommandButton
            label="Use Skill"
            command="npx skills add tambo-ai/tambo"
          />
          <CopyCommandButton
            label="Create App"
            command="npm create tambo-app@latest"
          />
        </div>
      </div>
    </div>
  );
}
