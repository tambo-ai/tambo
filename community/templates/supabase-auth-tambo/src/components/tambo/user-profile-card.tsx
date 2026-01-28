"use client";

import { ReactNode } from "react";

interface UserProfileCardProps {
  name: string;
  email: string;
  note?: string | null;
  lastUpdated?: string;
}

export function UserProfileCard({
  name,
  email,
  note,
  lastUpdated,
}: UserProfileCardProps): ReactNode {
  return (
    <div className="w-full max-w-full rounded-lg border bg-card p-4 space-y-3">
      <div className="min-w-0">
        <h3 className="font-semibold truncate">{name}</h3>
        <p className="text-sm text-muted-foreground truncate">{email}</p>
      </div>

      {note && (
        <div className="rounded-md bg-muted/50 p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Note
          </p>
          <p className="text-sm break-words">{note}</p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Updated {new Date(lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {!note && (
        <div className="text-sm text-muted-foreground italic">No note yet</div>
      )}
    </div>
  );
}
