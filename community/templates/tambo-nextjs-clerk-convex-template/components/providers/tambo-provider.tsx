"use client";

import { useUser } from "@clerk/clerk-react";
import { TamboProvider } from "@tambo-ai/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { tamboComponents } from "@/lib/tambo";
import { createNotesTools } from "@/lib/tambo/tools";
import { ReactNode, useMemo } from "react";

interface TamboClientProviderProps {
  children: ReactNode;
}

/**
 * Tambo provider that integrates with Convex for notes management.
 * Provides AI-driven components and tools for the notes app.
 */
export function TamboClientProvider({ children }: TamboClientProviderProps) {
  const { user } = useUser();
  const createNote = useMutation(api.notes.createNote);
  const updateNote = useMutation(api.notes.updateNote);
  const deleteNote = useMutation(api.notes.deleteNote);

  // Same API URL as dashboard so thread/stream hits the same project (required for streaming all messages).
  const tamboUrl = process.env.NEXT_PUBLIC_TAMBO_API_URL;
  // Tie thread to user so dashboard and app show the same conversation.
  const contextKey = user?.id ? `user:${user.id}` : undefined;

  // Create tools with Convex mutations
  const tools = useMemo(
    () =>
      createNotesTools(
        async (args) => {
          const result = await createNote({
            title: args.title,
            content: args.content,
            pinned: args.pinned,
          });
          return { id: result.id, title: result.title };
        },
        async (args) => {
          return updateNote({
            id: args.id as Id<"notes">,
            title: args.title,
            content: args.content,
            pinned: args.pinned,
            archived: args.archived,
          });
        },
        async (args) => {
          return deleteNote({ id: args.id as Id<"notes"> });
        },
      ),
    [createNote, updateNote, deleteNote],
  );

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      tamboUrl={tamboUrl}
      contextKey={contextKey}
      components={tamboComponents}
      tools={tools}
    >
      {children}
    </TamboProvider>
  );
}
