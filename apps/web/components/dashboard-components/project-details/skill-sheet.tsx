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

interface FileValidationResult {
  /** Whether the file should be accepted at all. */
  isValid: boolean;
  /** A non-blocking warning to show (e.g. unexpected filename). */
  warning?: string;
  /** A blocking error message (file rejected). */
  error?: string;
}

const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);

/**
 * Validate a file for skill import. Blocks non-markdown files, warns if
 * the filename is not SKILL.md.
 * @returns Validation result with optional warning or error.
 */
export function validateSkillFile(file: File): FileValidationResult {
  const name = file.name.toLowerCase();
  const ext = name.slice(name.lastIndexOf("."));

  if (!MARKDOWN_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      error: `Only markdown files (.md) can be imported. "${file.name}" is not a markdown file.`,
    };
  }

  if (name !== "skill.md") {
    return {
      isValid: true,
      warning: `"${file.name}" is not named SKILL.md. It will still be imported, but the expected filename is SKILL.md.`,
    };
  }

  return { isValid: true };
}

export type DragState = "none" | "valid" | "invalid";

/** MIME types that are clearly not markdown — detected during drag via dataTransfer.items. */
const BLOCKED_MIME_PREFIXES = ["image/", "audio/", "video/", "application/pdf"];

/**
 * Check drag event MIME type to detect clearly non-markdown files.
 * Browsers only expose MIME type during drag, not the filename — so this
 * catches obvious cases (images, PDFs) but can't distinguish .ts from .md.
 * Full filename validation happens on drop via validateSkillFile().
 * @returns "valid" if it could be markdown, "invalid" if clearly not.
 */
export function getDragState(e: React.DragEvent): DragState {
  const item = e.dataTransfer.items[0];
  if (!item || item.kind !== "file") return "invalid";

  const type = item.type.toLowerCase();
  if (BLOCKED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix))) {
    return "invalid";
  }

  return "valid";
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

  const [dragState, setDragState] = useState<DragState>("none");

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
        instructions: parseResult.instructions,
      });
    } else {
      createMutation.mutate({
        projectId,
        name: parseResult.name,
        description: parseResult.description,
        instructions: parseResult.instructions,
      });
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragState("none");
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const validation = validateSkillFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }
    if (validation.warning) {
      toast({ title: "Note", description: validation.warning });
    }

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
          <SheetTitle className="text-card-foreground">
            {skill ? "Edit Skill" : "Create Skill"}
          </SheetTitle>
          <SheetDescription>
            Paste or drag a SKILL.md file below. The name and description are
            extracted from the YAML frontmatter.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1 -mx-1 space-y-4">
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
            className={`relative rounded-md transition-colors ${dragState === "valid" ? "ring-2 ring-primary ring-offset-2" : ""} ${dragState === "invalid" ? "ring-2 ring-destructive ring-offset-2" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragState(getDragState(e));
            }}
            onDragLeave={() => setDragState("none")}
            onDrop={handleDrop}
          >
            {dragState === "valid" ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-primary/5 border-2 border-dashed border-primary">
                <p className="text-sm font-medium text-primary">
                  Drop SKILL.md file here
                </p>
              </div>
            ) : null}
            {dragState === "invalid" ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-destructive/5 border-2 border-dashed border-destructive">
                <p className="text-sm font-medium text-destructive">
                  Only markdown files (.md) are supported
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
            className="gap-2"
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
