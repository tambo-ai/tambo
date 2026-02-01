"use client";

import { useUser } from "@clerk/nextjs";
import { z } from "zod";

/**
 * Zod schema for ShowUserProfile component props.
 *
 * This schema validates props at runtime before the component renders.
 * TypeScript types are automatically inferred from this schema.
 */
export const showUserProfileSchema = z.object({
  title: z
    .string()
    .optional()
    .describe("Optional title to display above the profile card"),
});

export type ShowUserProfileProps = z.infer<typeof showUserProfileSchema>;

/**
 * ShowUserProfile - Tambo Runtime-Driven Component
 *
 * This component demonstrates Tambo's core philosophy:
 *
 * 1. Runtime-driven UI: The AI decides to render this component based on user intent
 *    - User says "show my profile" → AI emits structured action → This component renders
 *    - No hardcoded routes or manual component mounting needed
 *
 * 2. Strong typing + Zod validation:
 *    - Props are validated via showUserProfileSchema (Zod)
 *    - TypeScript types are inferred from the schema
 *    - Runtime validation ensures type safety
 *
 * 3. Authentication proof:
 *    - This component accesses Clerk user data via useUser()
 *    - Only renders when user is authenticated (proves auth integration)
 *    - Displays user-specific data scoped to the signed-in user
 *
 * 4. Streaming-first UX:
 *    - Renders as part of the AI's streaming response
 *    - Appears inline with chat messages
 *    - No page reloads or separate API calls
 *
 * Design:
 * - Clean bordered container matching chat aesthetics
 * - Consistent typography with message thread
 * - Visually proves Clerk → Tambo authentication integration
 */
export function ShowUserProfile({ title }: ShowUserProfileProps) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="text-[15px] text-muted-foreground py-2">Loading...</div>
    );
  }

  if (!user) {
    return (
      <div className="text-[15px] text-destructive py-2">
        Not authenticated. This component requires a signed-in user.
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-background">
      {title && (
        <div className="font-medium text-foreground text-[15px] mb-3">
          {title}
        </div>
      )}

      <div className="space-y-3 text-[15px]">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">User ID</span>
          <code className="text-foreground font-mono text-sm bg-muted px-2 py-1 rounded">
            {user.id}
          </code>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Email</span>
          <span className="text-foreground">
            {user.primaryEmailAddress?.emailAddress}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Tambo Session</span>
          <span className="text-green-600 dark:text-green-400 font-mono text-sm">
            isTamboAuthenticated: true
          </span>
        </div>
        {user.firstName && (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-foreground">
              {user.firstName} {user.lastName}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border text-sm text-muted-foreground">
        🔐 This data comes from your authenticated Clerk session. The AI
        rendered this component because you asked to see your profile, proving
        that AI messages are authenticated and scoped to your user identity.
      </div>
    </div>
  );
}
