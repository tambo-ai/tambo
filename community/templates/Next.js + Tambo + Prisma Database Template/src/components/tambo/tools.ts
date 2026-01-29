import { prisma } from '@/lib/prisma';

export const createNote = {
  name: 'createNote',
  description: 'Create a new note with a title and content',
  inputSchema: {
    type: 'object' as const,
    properties: {
      note: {
        type: 'string' as const,
        description: 'The title of the note'
      },
      content: {
        type: 'string' as const,
        description: 'The content of the note'
      }
    },
    required: ['note', 'content']
  },
  outputSchema: {
    type: 'string' as const,
    description: 'Confirmation message about the created note'
  },
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

export const updateNote = {
  name: 'updateNote',
  description: 'Update an existing note by finding it by title and changing its content',
  inputSchema: {
    type: 'object' as const,
    properties: {
      noteTitle: {
        type: 'string' as const,
        description: 'The current title of the note to update'
      },
      newContent: {
        type: 'string' as const,
        description: 'The new content for the note'
      }
    },
    required: ['noteTitle', 'newContent']
  },
  outputSchema: {
    type: 'string' as const,
    description: 'Confirmation message about the updated note'
  },
  tool: async ({ noteTitle, newContent }: { noteTitle: string; newContent: string }) => {
    try {
      // First find the note by title
      const notesResponse = await fetch('/api/notes');
      const notes = await notesResponse.json();
      const noteToUpdate = notes.find((n: any) => n.note.toLowerCase() === noteTitle.toLowerCase());
      
      if (!noteToUpdate) {
        return `Note with title "${noteTitle}" not found`;
      }
      
      // Update the note
      const response = await fetch('/api/notes/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: noteToUpdate.id, 
          note: noteToUpdate.note, 
          content: newContent 
        })
      });
      const data = await response.json();
      return data.message || data.error;
    } catch (error) {
      return `Error updating note: ${error}`;
    }
  }
};

export const listNotes = {
  name: 'listNotes',
  description: 'Get all notes from the database',
  inputSchema: {
    type: 'object' as const,
    properties: {}
  },
  outputSchema: {
    type: 'string' as const,
    description: 'List of all notes with titles and dates'
  },
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

export const tools = [createNote, updateNote, listNotes];
