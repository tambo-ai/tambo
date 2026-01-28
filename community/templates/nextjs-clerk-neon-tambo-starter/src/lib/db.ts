import { neon } from "@neondatabase/serverless";

export interface Note {
  id: number;
  user_id: string;
  content: string;
  created_at: Date;
}

function getDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(process.env.DATABASE_URL);
}

export async function initDatabase(): Promise<void> {
  const sql = getDatabase();

  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)
  `;
}

export async function saveNote(
  userId: string,
  content: string,
): Promise<Note> {
  const sql = getDatabase();

  const result = await sql`
    INSERT INTO notes (user_id, content)
    VALUES (${userId}, ${content})
    RETURNING *
  `;

  const note = result[0] as Note;

  if (!note) {
    throw new Error("Failed to save note");
  }

  return note;
}

export async function getUserNotes(userId: string): Promise<Note[]> {
  const sql = getDatabase();

  const notes = await sql`
    SELECT * FROM notes
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return notes as Note[];
}

export async function deleteNote(noteId: number, userId: string): Promise<void> {
  const sql = getDatabase();

  await sql`
    DELETE FROM notes
    WHERE id = ${noteId} AND user_id = ${userId}
  `;
}
