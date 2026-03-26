"use client";

import {
  parseSkillContent,
  reconstructSkillContent,
} from "@/lib/parse-skill-frontmatter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

export type SkillSummary = RouterOutputs["skills"]["list"][number];

/**
 * Read the text content of a dropped or selected File.
 * @returns The file content as a string.
 */
export async function readFileAsText(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

interface SkillSheetProps {
  projectId: string;
  skill: SkillSummary | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, overrides the default content (used for file import). */
  initialContent?: string;
}

export function SkillSheet({
  projectId,
  skill,
  isOpen,
  onOpenChange,
  initialContent,
}: SkillSheetProps) {
  const { toast } = useToast();
  const utils = api.useUtils();

  const [content, setContent] = useState(() => {
    if (initialContent !== undefined) return initialContent;
    if (skill) {
      return reconstructSkillContent(
        skill.name,
        skill.description,
        skill.instructions,
      );
    }
    return "";
  });

  const [isDragOver, setIsDragOver] = useState(false);

  const parseResult = useMemo(() => {
    if (!content.trim()) return null;
    return parseSkillContent(content);
  }, [content]);

  const mutationOptions = {
    onSuccess: () => {
      onOpenChange(false);
      toast({ title: skill ? "Skill updated" : "Skill created" });
      void utils.skills.list.invalidate();
    },
    onError: (error: { message: string }) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive" as const,
      });
    },
  };

  const createMutation = api.skills.create.useMutation(mutationOptions);
  const updateMutation = api.skills.update.useMutation(mutationOptions);
  const saveMutation = skill ? updateMutation : createMutation;

  const handleSave = () => {
    if (!parseResult?.success) return;

    if (skill) {
      updateMutation.mutate({
        projectId,
        skillId: skill.id,
        name: parseResult.name,
        description: parseResult.description,
        instructions: parseResult.body,
      });
    } else {
      createMutation.mutate({
        projectId,
        name: parseResult.name,
        description: parseResult.description,
        instructions: parseResult.body,
      });
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      setContent(text);
    } catch {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>{skill ? "Edit Skill" : "Create Skill"}</SheetTitle>
          <SheetDescription>
            Paste or drag a SKILL.md file below. The name and description are
            extracted from the YAML frontmatter.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div
            className="space-y-2 rounded-md border p-3 bg-muted/50"
            aria-live="polite"
          >
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="font-medium truncate">
                {parseResult?.success ? parseResult.name : "\u2014"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Description
              </Label>
              <p className="text-sm text-muted-foreground truncate">
                {parseResult?.success ? parseResult.description : "\u2014"}
              </p>
            </div>
            {parseResult && !parseResult.success ? (
              <p className="text-xs text-destructive">{parseResult.error}</p>
            ) : null}
          </div>

          <div
            className={`relative rounded-md transition-colors ${isDragOver ? "ring-2 ring-primary ring-offset-2" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            {isDragOver ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-primary/5 border-2 border-dashed border-primary">
                <p className="text-sm font-medium text-primary">
                  Drop SKILL.md file here
                </p>
              </div>
            ) : null}
            <Label htmlFor="skill-content" className="sr-only">
              Skill content
            </Label>
            <Textarea
              id="skill-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                "---\nname: My Skill\ndescription: A brief description\n---\n\nSkill instructions here..."
              }
              className="min-h-[400px] font-mono text-sm"
              spellCheck={false}
              maxLength={100_000}
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!parseResult?.success || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
