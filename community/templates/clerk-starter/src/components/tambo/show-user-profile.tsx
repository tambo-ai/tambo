"use client";

import { useUser } from "@clerk/nextjs";
import { z } from "zod";

export const showUserProfileSchema = z.object({
  title: z.string().optional().describe("Optional title to display above the profile card"),
});

export type ShowUserProfileProps = z.infer<typeof showUserProfileSchema>;

export function ShowUserProfile({ title }: ShowUserProfileProps) {
  const { user, isLoaded } = useUser();


  if (!isLoaded) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="animate-pulse">Loading user profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700">
        Not signed in
      </div>
    );
  }

  return (
    <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)] shadow-none">
      {title && <h3 className="text-lg font-semibold mb-3 text-[var(--card-foreground)]">{title}</h3>}
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <span className="text-[var(--muted-foreground)] text-xs font-medium uppercase tracking-wider">User ID</span>
          <code className="text-sm bg-[var(--muted)] px-2 py-1.5 rounded text-[var(--foreground)] font-mono border border-[var(--border)]">{user.id}</code>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[var(--muted-foreground)] text-xs font-medium uppercase tracking-wider">Email</span>
          <span className="text-sm text-[var(--card-foreground)] font-medium">{user.primaryEmailAddress?.emailAddress ?? "No email"}</span>
        </div>
      </div>
    </div>
  );
}
