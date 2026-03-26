"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";

interface SkillCardProps {
  skillId: string;
  name: string;
  description: string;
  enabled: boolean;
  isToggling?: boolean;
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
  onToggle,
  onEdit,
  onDelete,
}: SkillCardProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-2 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate hidden sm:block">
          {description}
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={(checked) => onToggle(skillId, checked)}
        disabled={isToggling}
        aria-label={`${enabled ? "Disable" : "Enable"} skill ${name}`}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(skillId)}
        aria-label={`Edit skill ${name}`}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(skillId, name)}
        aria-label={`Delete skill ${name}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
