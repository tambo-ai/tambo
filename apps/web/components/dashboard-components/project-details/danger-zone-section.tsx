"use client";

import { DestructiveActionButton } from "@/components/ui/destructive-action-button";
import { SettingsRow } from "@/components/ui/settings-row";

interface DangerZoneSectionProps {
  onRequestDelete: () => void;
  isDeleting: boolean;
}

export function DangerZoneSection({
  onRequestDelete,
  isDeleting,
}: DangerZoneSectionProps) {
  return (
    <SettingsRow
      label="Delete this project"
      description="Permanently delete this project and all of its data. This action cannot be undone."
    >
      <DestructiveActionButton
        onClick={onRequestDelete}
        isPending={isDeleting}
        aria-label="Delete this project"
        label="Delete this project"
      />
    </SettingsRow>
  );
}
