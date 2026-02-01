'use client';

import { useState, useEffect } from 'react';

interface Note {
  id: string;
  note: string;
  content: string;
  createdAt: Date;
}

export function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notes');
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Expose refresh function for parent components
  useEffect(() => {
    const windowWithRefresh = window as { refreshNotes?: () => void };
    windowWithRefresh.refreshNotes = fetchNotes;
    return () => {
      delete windowWithRefresh.refreshNotes;
    };
  }, []);

  if (loading) {
    return (
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Notes ({notes.length})</h2>
      </div>
      
      <div className="p-4">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No notes yet. Ask Tambo to create one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{note.note}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-4">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
