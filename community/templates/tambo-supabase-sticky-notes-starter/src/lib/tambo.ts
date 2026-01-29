/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { CreateNote, createNoteSchema } from "@/components/ui/create-note";
import { UpdateNote, updateNoteSchema } from "@/components/ui/update-note";
import { DeleteNote, deleteNoteSchema } from "@/components/ui/delete-note";
import type { TamboComponent } from "@tambo-ai/react";

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 */

export const components: TamboComponent[] = [
  {
    name: "create_note",
    description:
      "Creates a sticky note card that saves to the database and appears on the canvas. " +
      "Color meanings: yellow=general notes, red=urgent/important tasks, green=ideas/brainstorming, " +
      "blue=todos/action items, purple=creative/design work, pink=personal reminders. " +
      "ALWAYS use this component when user mentions: note, sticky, reminder, task, todo, idea, or similar.",
    component: CreateNote,
    propsSchema: createNoteSchema,
  },
  {
    name: "update_note",
    description:
      "Updates an existing note's content or color. " +
      "Use when user wants to edit, update, change, or modify a note. " +
      "User must specify the note ID (number visible on each note). " +
      "Can update content, color, or both.",
    component: UpdateNote,
    propsSchema: updateNoteSchema,
  },
  {
    name: "delete_note",
    description:
      "Deletes a note from the database and removes it from the canvas. " +
      "Use when user wants to delete, remove, or trash a note. " +
      "User must specify the note ID (number visible on each note).",
    component: DeleteNote,
    propsSchema: deleteNoteSchema,
  },
];
