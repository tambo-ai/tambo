"use client";

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
  const createNote = useMutation(api.notes.createNote);
  const updateNote = useMutation(api.notes.updateNote);
  const deleteNote = useMutation(api.notes.deleteNote);

  // Create tools with Convex mutations
  const tools = useMemo(
    () =>
      createNotesTools(
        async (args) => {
          const result = await createNote({
            title: args.title,
            content: args.content,
            color: args.color as
              | "default"
              | "red"
              | "orange"
              | "yellow"
              | "green"
              | "blue"
              | "purple"
              | "pink"
              | undefined,
            pinned: args.pinned,
          });
          return { id: result.id, title: result.title };
        },
        async (args) => {
          return updateNote({
            id: args.id as Id<"notes">,
            title: args.title,
            content: args.content,
            color: args.color as
              | "default"
              | "red"
              | "orange"
              | "yellow"
              | "green"
              | "blue"
              | "purple"
              | "pink"
              | undefined,
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
      components={tamboComponents}
      tools={tools}
    >
      {children}
    </TamboProvider>
  );
}
