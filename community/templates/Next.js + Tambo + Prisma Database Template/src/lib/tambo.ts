import { z } from 'zod';
import { TamboTool } from '@tambo-ai/react';

export const createNote: TamboTool = {
  name: 'createNote',
  description: 'Create a new note with a title and content',
  inputSchema: z.object({
    note: z.string().describe('The title of the note'),
    content: z.string().describe('The content of the note')
  }),
  outputSchema: z.string().describe('Confirmation message about the created note'),
  tool: async ({ note, content }: { note: string; content: string }) => {
    try {
      const response = await fetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, content })
      });
      const data = await response.json();
      return data.message || data.error;
    } catch (error) {
      return `Error creating note: ${error}`;
    }
  }
};

export const listNotes: TamboTool = {
  name: 'listNotes',
  description: 'Get all notes from the database',
  inputSchema: z.object({}),
  outputSchema: z.string().describe('List of all notes with titles and dates'),
  tool: async () => {
    try {
      const response = await fetch('/api/notes/list');
      const data = await response.json();
      return data.message || data.error;
    } catch (error) {
      return `Error fetching notes: ${error}`;
    }
  }
};

export const tools: TamboTool[] = [createNote, listNotes];
