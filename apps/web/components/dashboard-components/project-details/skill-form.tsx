"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";
import { parseSkillContent, toSkillSlug } from "@tambo-ai-cloud/core";
import { Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

/**
 * Extract a human-readable message from a tRPC/zod error.
 * tRPC wraps zod validation errors as a JSON-stringified array of issues;
 * this parses the first message out. Falls back to the raw string if
 * parsing fails.
 * @returns A single error message string.
 */
export function extractErrorMessage(error: { message: string }): string {
  try {
    const parsed: unknown = JSON.parse(error.message);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const first = parsed[0] as { message?: string };
      if (typeof first.message === "string") {
        return first.message;
      }
    }
  } catch {
    // Not JSON -- use as-is
  }
  return error.message;
}

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

/** MIME types that are clearly not markdown -- detected during drag via dataTransfer.items. */
const BLOCKED_MIME_PREFIXES = ["image/", "audio/", "video/", "application/pdf"];

/**
 * Check drag event MIME type to detect clearly non-markdown files.
 * Browsers only expose MIME type during drag, not the filename -- so this
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

interface SkillFormProps {
  projectId: string;
  skill: SkillSummary | null;
  onClose: () => void;
  /** Pre-parsed fields from an imported file. */
  initialFields?: { name: string; description: string; instructions: string };
}

export function SkillForm({
  projectId,
  skill,
  onClose,
  initialFields,
}: SkillFormProps) {
  const { toast } = useToast();
  const utils = api.useUtils();

  const [name, setName] = useState(initialFields?.name ?? skill?.name ?? "");
  const [description, setDescription] = useState(
    initialFields?.description ?? skill?.description ?? "",
  );
  const [instructions, setInstructions] = useState(
    initialFields?.instructions ?? skill?.instructions ?? "",
  );

  const handlePasteWithFrontmatter = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    const result = parseSkillContent(text);
    if (!result.success) return;

    e.preventDefault();
    setName(result.name);
    setDescription(result.description);
    setInstructions(result.instructions);
  }, []);

  const slugifiedName = useMemo(() => toSkillSlug(name), [name]);
  const showSlugPreview = name.trim().length > 0 && slugifiedName !== name;

  const isValid = slugifiedName.length > 0 && description.trim().length > 0;
  const saveButtonLabel = skill ? "Save changes" : "Create skill";

  const mutationOptions = {
    onSuccess: () => {
      onClose();
      toast({ title: skill ? "Skill updated" : "Skill created" });
      void utils.skills.list.invalidate();
    },
    onError: (error: { message: string }) => {
      toast({
        title: "Error",
        description: extractErrorMessage(error),
        variant: "destructive" as const,
      });
    },
  };

  const createMutation = api.skills.create.useMutation(mutationOptions);
  const updateMutation = api.skills.update.useMutation(mutationOptions);
  const saveMutation = skill ? updateMutation : createMutation;

  const handleSave = () => {
    if (!isValid) return;

    const payload = {
      projectId,
      name: slugifiedName,
      description: description.trim(),
      instructions: instructions.trim(),
    };

    if (skill) {
      updateMutation.mutate({ ...payload, skillId: skill.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="rounded-md border p-4 space-y-4">
      <h3 className="text-sm font-semibold">
        {skill ? "Edit Skill" : "Create Skill"}
      </h3>

      <div className="space-y-1">
        <Label htmlFor="skill-name">Name</Label>
        <Input
          id="skill-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPaste={handlePasteWithFrontmatter}
          placeholder="e.g. code-review-assistant"
          maxLength={200}
        />
        {showSlugPreview && (
          <p className="mt-4 text-xs text-muted-foreground">
            Will be saved as: <span className="font-mono">{slugifiedName}</span>
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="skill-description">Description</Label>
        <Input
          id="skill-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onPaste={handlePasteWithFrontmatter}
          placeholder="What this skill does, in one sentence"
          maxLength={2000}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="skill-instructions">Instructions</Label>
        <Textarea
          id="skill-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          onPaste={handlePasteWithFrontmatter}
          placeholder="Detailed instructions for the agent..."
          className="min-h-[200px] font-mono text-sm"
          spellCheck={false}
          maxLength={100_000}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isValid || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            saveButtonLabel
          )}
        </Button>
      </div>
    </div>
  );
}
