import { databases, DATABASE_ID, NOTES_COLLECTION_ID, Note } from '@/lib/appwrite';
import { ID } from 'appwrite';

export const createNote = {
  name: 'createNote',
  description: 'Create a new note with a title and content',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title of the note'
      },
      content: {
        type: 'string',
        description: 'The content of the note'
      }
    },
    required: ['title']
  },
  outputSchema: {
    type: 'string',
    description: 'Confirmation message about the created note'
  },
  tool: async ({ title, content = '' }: { title: string; content?: string }) => {
    try {
      const note = await databases.createDocument(
        DATABASE_ID,
        NOTES_COLLECTION_ID,
        ID.unique(),
        { title, content }
      );
      return `Created note: ${note.title}`;
    } catch (error) {
      return `Error creating note: ${error}`;
    }
  }
};

export const listNotes = {
  name: 'listNotes',
  description: 'Get all notes from the database',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  outputSchema: {
    type: 'string',
    description: 'List of all notes with titles and dates'
  },
  tool: async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        NOTES_COLLECTION_ID
      );
      const notes = response.documents as Note[];
      return notes.map(note => `${note.title} (${new Date(note.$createdAt).toLocaleDateString()})`).join('\n');
    } catch (error) {
      return `Error fetching notes: ${error}`;
    }
  }
};

export const tools = [createNote, listNotes];
