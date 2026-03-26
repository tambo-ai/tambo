"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import {
  DeleteConfirmationDialog,
  type AlertState,
} from "../delete-confirmation-dialog";
import { SkillCard } from "./skill-card";
import { SkillSheet, type SkillSummary } from "./skill-sheet";

interface SkillsSectionProps {
  projectId: string;
}

function SkillsEmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <FileText
        className="h-12 w-12 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="text-center">
        <h3 className="text-lg font-heading font-semibold">No Skills Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Skills define how your agent behaves. Create your first skill to get
          started.
        </p>
      </div>
      <Button onClick={onCreateClick}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Create Skill
      </Button>
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

export function SkillsSection({ projectId }: SkillsSectionProps) {
  const { toast } = useToast();
  const utils = api.useUtils();

  const {
    data: skills,
    isLoading,
    isError,
  } = api.skills.list.useQuery({ projectId });

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillSummary | null>(null);
  const [togglingSkillId, setTogglingSkillId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
  });

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
    setIsSheetOpen(true);
  };

  const handleToggle = (skillId: string, enabled: boolean) => {
    toggleMutation.mutate({ projectId, skillId, enabled });
  };

  const handleEdit = (skillId: string) => {
    const skill = skills?.find((s) => s.id === skillId);
    if (skill) {
      setEditingSkill(skill);
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading">Skills</CardTitle>
              <CardDescription>
                Define agent skills using SKILL.md files.
              </CardDescription>
            </div>
            <Button onClick={openCreateSheet}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Skill
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <SkillsSkeleton /> : null}
          {isError ? (
            <p className="text-sm text-destructive py-4">
              Failed to load skills. Please try again.
            </p>
          ) : null}
          {!isLoading && !isError && skills?.length === 0 ? (
            <SkillsEmptyState onCreateClick={openCreateSheet} />
          ) : null}
          {!isLoading && !isError && skills && skills.length > 0
            ? skills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skillId={skill.id}
                  name={skill.name}
                  description={skill.description}
                  enabled={skill.enabled}
                  isToggling={togglingSkillId === skill.id}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            : null}
        </CardContent>
      </Card>

      <SkillSheet
        key={isSheetOpen ? (editingSkill?.id ?? "new") : "closed"}
        projectId={projectId}
        skill={editingSkill}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />

      <DeleteConfirmationDialog
        mode="single"
        alertState={alertState}
        setAlertState={setAlertState}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
