"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DangerZoneSectionProps {
  onRequestDelete: () => void;
  isDeleting: boolean;
}

export function DangerZoneSection({
  onRequestDelete,
  isDeleting,
}: DangerZoneSectionProps) {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Danger Zone</CardTitle>
        <CardDescription className="text-sm font-sans text-foreground">
          Permanently delete this project and all of its data. This action
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onRequestDelete}
          disabled={isDeleting}
          aria-label="Delete this project"
        >
          {isDeleting ? "Deleting..." : "Delete this project"}
        </Button>
      </CardContent>
    </Card>
  );
}
