'use client';

import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, NOTES_COLLECTION_ID, Note } from '@/lib/appwrite';
import { useTamboThreadInput, useTamboThread, TamboProvider } from '@tambo-ai/react';
import { tools } from '@/components/tambo/tools';

function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { thread } = useTamboThread();

  const fetchNotes = async () => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, NOTES_COLLECTION_ID);
      setNotes(response.documents as Note[]);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    // Refresh notes when thread updates (after tool calls)
    fetchNotes();
  }, [thread?.messages?.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      submit({ tools });
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Next.js + Tambo + Appwrite Database Starter</h1>
        <p>AI-powered note management with Appwrite Database</p>
      </header>

      <main>
        <div className="chat-section">
          <div className="messages">
            {thread?.messages?.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">
                  {typeof message.content === 'string' 
                    ? message.content 
                    : Array.isArray(message.content) 
                      ? message.content.map((part: any, i: number) => (
                          <div key={i}>{part.text || JSON.stringify(part)}</div>
                        ))
                      : JSON.stringify(message.content)
                  }
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Try: 'Add a note called Ship Tambo template' or 'Show all notes'"
              disabled={isPending}
              className="message-input"
            />
            <button type="submit" disabled={isPending || !value.trim()}>
              {isPending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>

        <div className="notes-section">
          <h2>Notes ({notes.length})</h2>
          {notes.length === 0 ? (
            <p className="empty-state">No notes yet. Ask Tambo to create one!</p>
          ) : (
            <ul className="notes-list">
              {notes.map((note) => (
                <li key={note.$id} className="note-item">
                  <div className="note-content">
                    <span className="note-title">{note.title}</span>
                    {note.content && <p className="note-text">{note.content}</p>}
                  </div>
                  <span className="note-date">
                    {new Date(note.$createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        header {
          text-align: center;
          margin-bottom: 3rem;
        }

        h1 {
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1a1a1a;
        }

        header p {
          color: #666;
          font-size: 1rem;
        }

        main {
          display: grid;
          gap: 2rem;
        }

        .chat-section {
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 1.5rem;
          background: #fafafa;
        }

        .messages {
          min-height: 200px;
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 6px;
          border: 1px solid #e5e5e5;
        }

        .message {
          margin-bottom: 1rem;
          padding: 0.75rem;
          border-radius: 6px;
        }

        .message.user {
          background: #f0f9ff;
          margin-left: 2rem;
        }

        .message.assistant {
          background: #f9fafb;
          margin-right: 2rem;
        }

        .message-content {
          white-space: pre-wrap;
        }

        .input-form {
          display: flex;
          gap: 0.5rem;
        }

        .message-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        .message-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        button {
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
        }

        button:hover:not(:disabled) {
          background: #2563eb;
        }

        button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .notes-section {
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 1.5rem;
        }

        h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1a1a1a;
        }

        .empty-state {
          color: #666;
          font-style: italic;
          text-align: center;
          padding: 2rem;
        }

        .notes-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .note-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 0.75rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .note-item:last-child {
          border-bottom: none;
        }

        .note-content {
          flex: 1;
        }

        .note-title {
          font-weight: 500;
          color: #1a1a1a;
          display: block;
          margin-bottom: 0.25rem;
        }

        .note-text {
          color: #666;
          font-size: 0.875rem;
          margin: 0;
        }

        .note-date {
          color: #666;
          font-size: 0.875rem;
        }

        @media (max-width: 640px) {
          .container {
            padding: 1rem;
          }

          .note-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .message.user {
            margin-left: 1rem;
          }

          .message.assistant {
            margin-right: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <TamboProvider 
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      tools={tools}
    >
      <HomePage />
    </TamboProvider>
  );
}
