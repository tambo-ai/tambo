"use client";

import { Button } from "@/components/ui/button";
import { DestructiveActionButton } from "@/components/ui/destructive-action-button";
import { Switch } from "@/components/ui/switch";

interface SkillCardProps {
  skillId: string;
  name: string;
  description: string;
  enabled: boolean;
  isToggling?: boolean;
  isDeleting?: boolean;
  disabled?: boolean;
  onToggle: (skillId: string, enabled: boolean) => void;
  onEdit: (skillId: string) => void;
  onDelete: (skillId: string, name: string) => void;
}

export function SkillCard({
  skillId,
  name,
  description,
  enabled,
  isToggling,
  isDeleting,
  disabled,
  onToggle,
  onEdit,
  onDelete,
}: SkillCardProps) {
  return (
    <div
      className={`flex items-center gap-3 py-3 border-b last:border-b-0 transition-opacity ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate hidden sm:block">
          {description}
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={(checked) => onToggle(skillId, checked)}
        disabled={disabled || isToggling}
        aria-label={`${enabled ? "Disable" : "Enable"} skill ${name}`}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(skillId)}
        disabled={disabled}
        aria-label={`Edit skill ${name}`}
      >
        Edit
      </Button>
      <DestructiveActionButton
        onClick={() => onDelete(skillId, name)}
        disabled={disabled}
        isPending={isDeleting}
        aria-label={`Delete skill ${name}`}
      />
    </div>
  );
}
