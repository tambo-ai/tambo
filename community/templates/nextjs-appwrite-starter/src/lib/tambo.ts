import { NoteCard } from "@/components/tambo/NoteCard";
import { databases } from "@/lib/appwrite";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { ID } from "appwrite";
import { z } from "zod";

// Appwrite Database configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!;

// Define the schema for NoteCard props
const noteCardSchema = z.object({
  title: z.string().describe("The title of the note"),
  content: z.string().describe("The content/body of the note"),
});

// Register components that Tambo can generate
export const components: TamboComponent[] = [
  {
    name: "NoteCard",
    description:
      "A card component that displays a note with a title and content. Use this when the user wants to create or display a note.",
    component: NoteCard,
    propsSchema: noteCardSchema,
  },
];

// Tool handler function
const createUserNote = async ({
  title,
  content,
}: {
  title: string;
  content: string;
}) => {
  try {
    // Only send title and content - Appwrite auto-tracks timestamps
    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      { title, content },
    );
    return {
      success: true,
      message: `Note "${title}" created successfully!`,
      documentId: document.$id,
    };
  } catch (error) {
    console.error("Failed to create note:", error);
    return {
      success: false,
      message: "Failed to create note. Please try again.",
      documentId: null,
    };
  }
};

// Register tools that Tambo can use
export const tools: TamboTool[] = [
  {
    name: "create_user_note",
    description:
      "Creates a new note in the Appwrite database for the current user",
    tool: createUserNote,
    inputSchema: z.object({
      title: z.string().describe("The title of the note"),
      content: z.string().describe("The content/body of the note"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      documentId: z.string().nullable(),
    }),
  },
];
