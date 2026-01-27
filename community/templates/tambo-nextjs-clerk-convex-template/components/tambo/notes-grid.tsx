"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NoteCard } from "./note-card";
import { EditNoteDialog } from "./edit-note-dialog";
import { z } from "zod";
import { FileText } from "lucide-react";
import { useState } from "react";

export const notesGridSchema = z.object({
  showArchived: z
    .boolean()
    .nullable()
    .optional()
    .default(false)
    .describe("Whether to show archived notes"),
  maxNotes: z
    .number()
    .nullable()
    .optional()
    .describe("Maximum number of notes to display"),
});

export type NotesGridProps = z.infer<typeof notesGridSchema>;

interface EditableNote {
  id: string;
  title: string;
  content: string;
  color?: string | null;
}

export function NotesGrid({ showArchived, maxNotes }: NotesGridProps) {
  const notes = useQuery(api.notes.getNotes, {
    includeArchived: showArchived ?? false,
  });
  const [editingNote, setEditingNote] = useState<EditableNote | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleNoteClick = (note: EditableNote) => {
    setEditingNote(note);
    setEditDialogOpen(true);
  };

  if (notes === undefined) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-muted/50 animate-pulse border border-border/30"
          />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted/50 p-4 mb-4 ring-1 ring-border/50">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No notes yet</h3>
        <p className="text-sm text-muted-foreground">
          Create a note using the + button or AI assistant!
        </p>
      </div>
    );
  }

  const displayNotes = maxNotes ? notes.slice(0, maxNotes) : notes;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {displayNotes.map((note) => (
          <NoteCard
            key={note._id}
            id={note._id}
            title={note.title}
            content={note.content}
            color={note.color}
            pinned={note.pinned}
            archived={note.archived}
            onEdit={() =>
              handleNoteClick({
                id: note._id,
                title: note.title,
                content: note.content,
                color: note.color,
              })
            }
          />
        ))}
      </div>

      <EditNoteDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        note={editingNote}
      />
    </>
  );
}
