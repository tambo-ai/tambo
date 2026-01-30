import { type TamboComponent } from "@tambo-ai/react";
import { NoteCard, noteCardSchema } from "@/components/tambo/note-card";
import { NotesGrid, notesGridSchema } from "@/components/tambo/notes-grid";

/**
 * Tambo component registry for AI-driven generative UI
 * These components can be rendered by the AI based on user requests
 */
export const tamboComponents: TamboComponent[] = [
  {
    name: "NoteCard",
    description:
      "Displays a single note with title, content, and action buttons (pin, archive, delete). " +
      "ALWAYS render this component after creating a note with the createNote tool to show the user their new note. " +
      "Use the noteId returned from createNote as the 'id' prop, and include the title and content.",
    component: NoteCard,
    propsSchema: noteCardSchema,
  },
  {
    name: "NotesGrid",
    description:
      "Displays all user notes in a responsive grid layout with cards. " +
      "Use this when the user asks to see their notes, show all notes, list notes, or view their notes. " +
      "Each note card is interactive with pin, archive, and delete buttons.",
    component: NotesGrid,
    propsSchema: notesGridSchema,
  },
];
