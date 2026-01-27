"use client";

import { ReactNode } from "react";

interface UserProfileCardProps {
  name: string;
  email: string;
  note?: string;
  lastUpdated?: string;
}

export function UserProfileCard({
  name,
  email,
  note,
  lastUpdated,
}: UserProfileCardProps): ReactNode {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm overflow-hidden w-full max-w-full">
      <div className="space-y-4 w-full">
        <div className="min-w-0 w-full">
          <h2 className="text-lg font-semibold text-card-foreground break-words">
            {name}
          </h2>
          <p className="text-sm text-muted-foreground break-words">{email}</p>
        </div>

        {note && (
          <div className="mt-4 rounded-md bg-primary/5 p-4 min-w-0 w-full overflow-hidden">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Your Note
            </p>
            <p className="mt-2 text-sm text-foreground break-words w-full">
              {note}
            </p>
            {lastUpdated && (
              <p className="mt-2 text-xs text-muted-foreground">
                Updated {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
