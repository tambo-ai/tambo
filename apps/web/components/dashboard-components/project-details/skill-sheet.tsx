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

interface SkillSheetProps {
  projectId: string;
  skill: SkillSummary | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SkillSheet({
  projectId,
  skill,
  isOpen,
  onOpenChange,
}: SkillSheetProps) {
  const { toast } = useToast();
  const utils = api.useUtils();

  const [content, setContent] = useState(() =>
    skill
      ? reconstructSkillContent(
          skill.name,
          skill.description,
          skill.instructions,
        )
      : "",
  );

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

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>{skill ? "Edit Skill" : "Create Skill"}</SheetTitle>
          <SheetDescription>
            Paste a SKILL.md file below. The name and description are extracted
            from the YAML frontmatter.
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

          <div>
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
