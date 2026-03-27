"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { parseSkillContent } from "@/lib/parse-skill-frontmatter";
import { api } from "@/trpc/react";
import { AlertTriangle, FileText, Import, Plus } from "lucide-react";
import { useRef, useState } from "react";
import {
  DeleteConfirmationDialog,
  type AlertState,
} from "../delete-confirmation-dialog";
import { SkillCard } from "./skill-card";
import {
  type DragState,
  getDragState,
  readFileAsText,
  SkillSheet,
  type SkillSummary,
  validateSkillFile,
} from "./skill-sheet";

const SKILLS_SUPPORTED_PROVIDERS = new Set(["openai", "anthropic"]);

interface SkillsSectionProps {
  projectId: string;
  defaultLlmProviderName?: string;
}

function SkillsEmptyState({
  onCreateClick,
  onImportClick,
  disabled,
}: {
  onCreateClick: () => void;
  onImportClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <FileText
        className="h-12 w-12 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="text-center">
        <h3 className="text-lg font-heading font-semibold">No Skills Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Skills define how your agent behaves. Create your first skill or
          import a SKILL.md file to get started.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onImportClick} disabled={disabled}>
          <Import className="h-4 w-4" aria-hidden="true" />
          Import SKILL.md
        </Button>
        <Button onClick={onCreateClick} disabled={disabled}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Skill
        </Button>
      </div>
    </div>
  );
}

function SkillsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3 px-2">
          <div className="flex-1 space-y-1">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-6 w-11 bg-muted animate-pulse rounded-full" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SkillsSection({
  projectId,
  defaultLlmProviderName,
}: SkillsSectionProps) {
  const isProviderSupported =
    !defaultLlmProviderName ||
    SKILLS_SUPPORTED_PROVIDERS.has(defaultLlmProviderName);
  const { toast } = useToast();
  const utils = api.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: skills,
    isLoading,
    isError,
  } = api.skills.list.useQuery({ projectId });

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillSummary | null>(null);
  const [importedContent, setImportedContent] = useState<string | undefined>(
    undefined,
  );
  const [togglingSkillId, setTogglingSkillId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
  });
  const [cardDragState, setCardDragState] = useState<DragState>("none");

  // Overwrite confirmation state
  const [overwriteDialog, setOverwriteDialog] = useState<{
    isOpen: boolean;
    existingSkill: SkillSummary | null;
    fileContent: string;
  }>({ isOpen: false, existingSkill: null, fileContent: "" });

  const toggleMutation = api.skills.update.useMutation({
    onMutate: ({ skillId }) => {
      setTogglingSkillId(skillId);
    },
    onSuccess: () => {
      void utils.skills.list.invalidate();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update skill",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTogglingSkillId(null);
    },
  });

  const deleteMutation = api.skills.delete.useMutation({
    onSuccess: () => {
      setAlertState({ show: false, title: "", description: "" });
      setDeleteTargetId(null);
      toast({ title: "Skill deleted" });
      void utils.skills.list.invalidate();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete skill",
        variant: "destructive",
      });
    },
  });

  const openCreateSheet = () => {
    setEditingSkill(null);
    setImportedContent(undefined);
    setIsSheetOpen(true);
  };

  const openSheetWithContent = (
    content: string,
    skill: SkillSummary | null,
  ) => {
    setEditingSkill(skill);
    setImportedContent(content);
    setIsSheetOpen(true);
  };

  /**
   * Handle an imported file: parse its frontmatter, check for name conflicts,
   * and either open the create sheet or prompt to overwrite an existing skill.
   */
  const handleImportedFile = async (file: File) => {
    try {
      const content = await readFileAsText(file);
      const parsed = parseSkillContent(content);

      if (!parsed.success) {
        // File doesn't have valid frontmatter — still open create sheet with the content
        openSheetWithContent(content, null);
        return;
      }

      // Check for name conflict with existing skills
      const existingSkill = skills?.find((s) => s.name === parsed.name);
      if (existingSkill) {
        setOverwriteDialog({
          isOpen: true,
          existingSkill,
          fileContent: content,
        });
      } else {
        openSheetWithContent(content, null);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      });
    }
  };

  const handleOverwriteConfirm = () => {
    openSheetWithContent(
      overwriteDialog.fileContent,
      overwriteDialog.existingSkill,
    );
    setOverwriteDialog({ isOpen: false, existingSkill: null, fileContent: "" });
  };

  const handleOverwriteCancel = () => {
    setOverwriteDialog({ isOpen: false, existingSkill: null, fileContent: "" });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateSkillFile(file);
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
      } else {
        if (validation.warning) {
          toast({ title: "Note", description: validation.warning });
        }
        void handleImportedFile(file);
      }
    }
    // Reset so the same file can be re-imported
    e.target.value = "";
  };

  const handleCardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setCardDragState("none");
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

    void handleImportedFile(file);
  };

  const handleToggle = (skillId: string, enabled: boolean) => {
    toggleMutation.mutate({ projectId, skillId, enabled });
  };

  const handleEdit = (skillId: string) => {
    const skill = skills?.find((s) => s.id === skillId);
    if (skill) {
      setEditingSkill(skill);
      setImportedContent(undefined);
      setIsSheetOpen(true);
    }
  };

  const handleDelete = (skillId: string, name: string) => {
    setDeleteTargetId(skillId);
    setAlertState({
      show: true,
      title: `Delete "${name}"?`,
      description:
        "This skill will be permanently removed. This action cannot be undone.",
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      await deleteMutation.mutateAsync({
        projectId,
        skillId: deleteTargetId,
      });
    }
  };

  // Build a unique key for the sheet that changes when we want it to remount
  const sheetKey = isSheetOpen
    ? `${editingSkill?.id ?? "new"}-${importedContent ? "import" : "manual"}`
    : "closed";

  const isDragging = cardDragState !== "none";
  const isReady = !isDragging && !isLoading && !isError;
  const hasSkills = isReady && !!skills && skills.length > 0;
  const isEmpty = isReady && skills?.length === 0;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <Card
        className={`transition-colors ${cardDragState === "valid" ? "ring-2 ring-primary ring-offset-2" : ""} ${cardDragState === "invalid" ? "ring-2 ring-destructive ring-offset-2" : ""}`}
        onDragOver={
          isProviderSupported
            ? (e) => {
                e.preventDefault();
                setCardDragState(getDragState(e));
              }
            : undefined
        }
        onDragLeave={
          isProviderSupported
            ? (e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setCardDragState("none");
                }
              }
            : undefined
        }
        onDrop={isProviderSupported ? handleCardDrop : undefined}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading">Skills</CardTitle>
              <CardDescription>
                Define agent skills using SKILL.md files.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleImportClick}
                disabled={!isProviderSupported}
              >
                <Import className="h-4 w-4" aria-hidden="true" />
                Import
              </Button>
              <Button onClick={openCreateSheet} disabled={!isProviderSupported}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create Skill
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isProviderSupported ? (
            <Alert variant="warning" className="mb-4">
              <AlertTriangle />
              <AlertDescription>
                Skills are currently supported with OpenAI and Anthropic models.
                Your project uses {defaultLlmProviderName}. Switch to a
                supported model to enable skills.
              </AlertDescription>
            </Alert>
          ) : null}
          {cardDragState === "valid" ? (
            <div className="flex items-center justify-center py-8 border-2 border-dashed border-primary rounded-md bg-primary/5">
              <p className="text-sm font-medium text-primary">
                Drop SKILL.md file to import
              </p>
            </div>
          ) : null}
          {cardDragState === "invalid" ? (
            <div className="flex items-center justify-center py-8 border-2 border-dashed border-destructive rounded-md bg-destructive/5">
              <p className="text-sm font-medium text-destructive">
                Only markdown files (.md) can be imported
              </p>
            </div>
          ) : null}
          {!isDragging && isLoading ? <SkillsSkeleton /> : null}
          {!isDragging && isError ? (
            <p className="text-sm text-destructive py-4">
              Failed to load skills. Please try again.
            </p>
          ) : null}
          {isEmpty ? (
            <SkillsEmptyState
              onCreateClick={openCreateSheet}
              onImportClick={handleImportClick}
              disabled={!isProviderSupported}
            />
          ) : null}
          {hasSkills
            ? skills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skillId={skill.id}
                  name={skill.name}
                  description={skill.description}
                  enabled={skill.enabled}
                  isToggling={togglingSkillId === skill.id}
                  disabled={!isProviderSupported}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            : null}
        </CardContent>
      </Card>

      <SkillSheet
        key={sheetKey}
        projectId={projectId}
        skill={editingSkill}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        initialContent={importedContent}
      />

      <DeleteConfirmationDialog
        mode="single"
        alertState={alertState}
        setAlertState={setAlertState}
        onConfirm={handleDeleteConfirm}
      />

      <AlertDialog
        open={overwriteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) handleOverwriteCancel();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite existing skill?</AlertDialogTitle>
            <AlertDialogDescription>
              A skill named &ldquo;{overwriteDialog.existingSkill?.name}&rdquo;
              already exists. Do you want to replace its content with the
              imported file?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleOverwriteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleOverwriteConfirm}>
              Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
