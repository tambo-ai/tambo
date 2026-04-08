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
import { EditWithTamboButton } from "@/components/ui/tambo/edit-with-tambo-button";
import { useToast } from "@/hooks/use-toast";
import {
  parseSkillContent,
  SKILLS_SUPPORTED_PROVIDERS,
  modelSupportsSkills,
  llmProviderConfig,
} from "@tambo-ai-cloud/core";
import { api } from "@/trpc/react";
import { withTamboInteractable } from "@tambo-ai/react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, FileText, Import, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod/v3";
import {
  type AlertState,
  DeleteConfirmationDialog,
} from "../delete-confirmation-dialog";
import { SkillCard } from "./skill-card";
import {
  type DragState,
  getDragState,
  readFileAsText,
  SkillForm,
  type SkillSummary,
  validateSkillFile,
} from "./skill-form";

interface SkillsSectionProps {
  projectId: string;
  defaultLlmProviderName?: string;
  defaultLlmModelName?: string;
  defaultNewSkill?: {
    name: string;
    description: string;
    instructions: string;
  };
  defaultEditSkill?: {
    skillId: string;
    name?: string;
    description?: string;
    instructions?: string;
  };
}

function SkillsEmptyState({ dragState }: { dragState: DragState }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4 border-2 border-dashed rounded-md">
      <FileText
        className={`h-12 w-12 transition-colors ${dragState === "valid" ? "text-primary" : "text-muted-foreground"}`}
        aria-hidden="true"
      />
      <div className="text-center">
        <h3 className="text-lg font-semibold">No Skills Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Skills define how your agent behaves. Create your first skill or
          import a SKILL.md file to get started.
        </p>
      </div>
      <p
        className={`text-xs transition-colors ${dragState === "valid" ? "text-primary font-medium" : dragState === "invalid" ? "text-destructive font-medium" : "text-muted-foreground"}`}
      >
        {dragState === "invalid"
          ? "Only markdown files (.md) can be imported"
          : "Drop SKILL.md file to import"}
      </p>
    </div>
  );
}

function SkillsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <div className="flex-1 space-y-1">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-9 bg-muted animate-pulse rounded-full" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkillsSection({
  projectId,
  defaultLlmProviderName,
  defaultLlmModelName,
  defaultNewSkill,
  defaultEditSkill,
}: SkillsSectionProps) {
  const isProviderSupported =
    !defaultLlmProviderName ||
    SKILLS_SUPPORTED_PROVIDERS.has(defaultLlmProviderName);
  const isSkillsSupported =
    isProviderSupported &&
    (!defaultLlmProviderName ||
      !defaultLlmModelName ||
      modelSupportsSkills(defaultLlmProviderName, defaultLlmModelName));

  function getModelDisplayName(): string {
    if (!defaultLlmProviderName || !defaultLlmModelName) {
      return defaultLlmModelName ?? "";
    }
    const modelCfg =
      llmProviderConfig[defaultLlmProviderName]?.models?.[defaultLlmModelName];
    return modelCfg?.displayName ?? defaultLlmModelName;
  }
  const { toast } = useToast();
  const utils = api.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: skills,
    isLoading,
    isError,
  } = api.skills.list.useQuery({ projectId });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillSummary | null>(null);
  const [importedFields, setImportedFields] = useState<
    { name: string; description: string; instructions: string } | undefined
  >(undefined);

  // Track dismissed Tambo-driven forms by stable string IDs so cache
  // invalidations (which produce new array refs) don't reopen the form
  const dismissedNewSkillNameRef = useRef<string | null>(null);
  const dismissedEditSkillIdRef = useRef<string | null>(null);

  // When Tambo streams in a new defaultNewSkill, open the create form automatically
  useEffect(() => {
    if (!defaultNewSkill) return;
    if (dismissedNewSkillNameRef.current === defaultNewSkill.name) return;
    setEditingSkill(null);
    setImportedFields(defaultNewSkill);
    setIsFormOpen(true);
  }, [defaultNewSkill]);

  // When Tambo streams in a defaultEditSkill, find the existing skill and open the edit form
  useEffect(() => {
    if (!defaultEditSkill || !skills || isFormOpen) return;
    if (dismissedEditSkillIdRef.current === defaultEditSkill.skillId) return;
    const existing = skills.find((s) => s.id === defaultEditSkill.skillId);
    if (!existing) return;
    setEditingSkill(existing);
    setImportedFields({
      name: defaultEditSkill.name ?? existing.name,
      description: defaultEditSkill.description ?? existing.description,
      instructions: defaultEditSkill.instructions ?? existing.instructions,
    });
    setIsFormOpen(true);
  }, [defaultEditSkill, skills, isFormOpen]);

  const [togglingSkillId, setTogglingSkillId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
  });
  const [cardDragState, setCardDragState] = useState<DragState>("none");

  // Overwrite confirmation state
  const overwriteDialogClosed = {
    isOpen: false as const,
    existingSkill: null,
    fields: { name: "", description: "", instructions: "" },
  };
  const [overwriteDialog, setOverwriteDialog] = useState<{
    isOpen: boolean;
    existingSkill: SkillSummary | null;
    fields: { name: string; description: string; instructions: string };
  }>(overwriteDialogClosed);

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

  const openCreateForm = () => {
    setEditingSkill(null);
    setImportedFields(defaultNewSkill);
    setIsFormOpen(true);
  };

  const openFormWithFields = (
    fields: { name: string; description: string; instructions: string },
    skill: SkillSummary | null,
  ) => {
    setEditingSkill(skill);
    setImportedFields(fields);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    // Mark Tambo-driven forms as dismissed by stable string IDs so
    // cache invalidations don't reopen the form
    if (defaultNewSkill) {
      dismissedNewSkillNameRef.current = defaultNewSkill.name;
    }
    if (defaultEditSkill) {
      dismissedEditSkillIdRef.current = defaultEditSkill.skillId;
    }
    setIsFormOpen(false);
    setEditingSkill(null);
    setImportedFields(undefined);
  };

  /**
   * Parse file content into fields and check for name conflicts.
   */
  const parseAndCheckConflict = (content: string) => {
    const parsed = parseSkillContent(content);

    if (!parsed.success) {
      // File doesn't have valid frontmatter -- put everything in instructions
      openFormWithFields(
        { name: "", description: "", instructions: content },
        null,
      );
      return;
    }

    const fields = {
      name: parsed.name,
      description: parsed.description,
      instructions: parsed.instructions,
    };

    // Check for name conflict with existing skills
    const existingSkill = skills?.find((s) => s.name === parsed.name);
    if (existingSkill) {
      setOverwriteDialog({ isOpen: true, existingSkill, fields });
    } else {
      openFormWithFields(fields, null);
    }
  };

  /**
   * Handle an imported file: validate, read, parse, and check for conflicts.
   */
  const handleImportedFile = async (file: File) => {
    try {
      const content = await readFileAsText(file);
      parseAndCheckConflict(content);
    } catch {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      });
    }
  };

  const handleOverwriteConfirm = () => {
    openFormWithFields(overwriteDialog.fields, overwriteDialog.existingSkill);
    setOverwriteDialog(overwriteDialogClosed);
  };

  const handleOverwriteCancel = () => {
    setOverwriteDialog(overwriteDialogClosed);
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
      setImportedFields(undefined);
      setIsFormOpen(true);
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

  // Build a unique key for the form that changes when we want it to remount
  const formKey = isFormOpen
    ? `${editingSkill?.id ?? "new"}-${importedFields ? "import" : "manual"}`
    : "closed";

  const isDragging = cardDragState !== "none";
  const isReady = !isLoading && !isError;
  const hasSkills = isReady && !!skills && skills.length > 0;
  const isEmpty = isReady && skills?.length === 0;
  const enableCardDrop = isSkillsSupported;

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
          enableCardDrop
            ? (e) => {
                e.preventDefault();
                setCardDragState(getDragState(e));
              }
            : undefined
        }
        onDragLeave={
          enableCardDrop
            ? (e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setCardDragState("none");
                }
              }
            : undefined
        }
        onDrop={enableCardDrop ? handleCardDrop : undefined}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Skills
                <EditWithTamboButton description="Manage skills for this project." />
              </CardTitle>
              <CardDescription>
                Define agent skills using SKILL.md files.
              </CardDescription>
            </div>
            <AnimatePresence mode="wait">
              {!isFormOpen && (
                <motion.div
                  className="flex gap-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="outline"
                    onClick={handleImportClick}
                    disabled={!isSkillsSupported}
                  >
                    <Import className="h-4 w-4 mr-1" aria-hidden="true" />
                    Import
                  </Button>
                  <Button
                    onClick={openCreateForm}
                    disabled={!isSkillsSupported}
                  >
                    <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                    Create Skill
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {isDragging ? (
              <div
                className={`absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed bg-background/80 backdrop-blur-sm ${
                  cardDragState === "valid"
                    ? "border-primary"
                    : "border-destructive"
                }`}
              >
                <p
                  className={`text-sm font-medium ${cardDragState === "valid" ? "text-primary" : "text-destructive"}`}
                >
                  {cardDragState === "valid"
                    ? "Drop SKILL.md file to import"
                    : "Only markdown files (.md) can be imported"}
                </p>
              </div>
            ) : null}
            {!isSkillsSupported ? (
              <Alert variant="warning" className="mb-4">
                <AlertTriangle />
                <AlertDescription>
                  {!isProviderSupported
                    ? `Skills are currently supported with OpenAI and Anthropic models. Your project uses ${defaultLlmProviderName}. Switch to a supported provider to enable skills.`
                    : `Skills are not supported by ${getModelDisplayName()}. Switch to a supported model to enable skills.`}
                </AlertDescription>
              </Alert>
            ) : null}
            {isLoading ? <SkillsSkeleton /> : null}
            {isError ? (
              <p className="text-sm text-destructive py-4">
                Failed to load skills. Please try again.
              </p>
            ) : null}

            <AnimatePresence mode="wait">
              {isFormOpen && (
                <motion.div
                  key={formKey}
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SkillForm
                    projectId={projectId}
                    skill={editingSkill}
                    onClose={closeForm}
                    initialFields={importedFields}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {!isFormOpen && isEmpty ? (
              <SkillsEmptyState dragState={cardDragState} />
            ) : null}
            {!isFormOpen && hasSkills
              ? skills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skillId={skill.id}
                    name={skill.name}
                    description={skill.description}
                    enabled={skill.enabled}
                    isToggling={togglingSkillId === skill.id}
                    isDeleting={
                      deleteMutation.isPending && deleteTargetId === skill.id
                    }
                    disabled={!isSkillsSupported}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              : null}
          </div>
        </CardContent>
      </Card>

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

export const InteractableSkillsSectionProps = z.object({
  projectId: z.string().describe("The unique identifier for the project."),
  defaultLlmProviderName: z
    .string()
    .optional()
    .describe("The default LLM provider name for the project."),
  defaultLlmModelName: z
    .string()
    .optional()
    .describe("The default LLM model name for the project."),
  defaultNewSkill: z
    .object({
      name: z.string().describe("The default name for a new skill."),
      description: z
        .string()
        .describe("The default description for a new skill."),
      instructions: z
        .string()
        .describe("The default instructions for a new skill."),
    })
    .optional()
    .describe(
      "Optional default fields for a new skill, used when creating a skill via Tambo.",
    ),
  defaultEditSkill: z
    .object({
      skillId: z.string().describe("The ID of the existing skill to edit."),
      name: z.string().optional().describe("The updated name for the skill."),
      description: z
        .string()
        .optional()
        .describe("The updated description for the skill."),
      instructions: z
        .string()
        .optional()
        .describe("The updated instructions for the skill."),
    })
    .optional()
    .describe(
      "Optional fields to edit an existing skill. When set, the edit form opens pre-filled with the updated values. Use fetchProjectSkills first to get the skill ID.",
    ),
});

export const InteractableSkillsSection = withTamboInteractable(SkillsSection, {
  componentName: "Skills",
  description:
    "A component that allows users to manage agent skills for their project. Users can create, edit, delete, toggle, and import skills from SKILL.md files.",
  propsSchema: InteractableSkillsSectionProps,
});
