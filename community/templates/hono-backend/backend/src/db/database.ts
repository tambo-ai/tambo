import Database from "better-sqlite3";
// import { join } from "node:path";

/**
 * Database setup using better-sqlite3
 * Creates an in-memory database for this demo
 * For production, use a file-based database by passing a file path
 */

// Use in-memory database for demo - change to a file path for persistence
// For production with persistence, uncomment the line below and the join import:
// const db = new Database(join(process.cwd(), 'data', 'database.sqlite'));
const db = new Database(":memory:");

// Enable foreign keys
db.pragma("foreign_keys = ON");

/**
 * Initialize database schema
 */
export function initDatabase() {
  // Create bookmarks table
  const createBookmarksTable = db.prepare(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      created_at TEXT NOT NULL
    )
  `);

  createBookmarksTable.run();

  console.log("✓ Database initialized");
}

/**
 * Prepared statements for bookmarks
 * These are created lazily to ensure the table exists first
 */
function createQueries() {
  return {
    getAll: db.prepare("SELECT * FROM bookmarks ORDER BY created_at DESC"),
    getById: db.prepare("SELECT * FROM bookmarks WHERE id = ?"),
    create: db.prepare(`
      INSERT INTO bookmarks (id, title, url, description, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `),
    update: db.prepare(`
      UPDATE bookmarks
      SET title = ?, url = ?, description = ?, tags = ?
      WHERE id = ?
    `),
    delete: db.prepare("DELETE FROM bookmarks WHERE id = ?"),
  };
}

// Export queries lazily
let _queries: ReturnType<typeof createQueries> | null = null;
export const bookmarkQueries = new Proxy(
  {} as ReturnType<typeof createQueries>,
  {
    get(target, prop) {
      if (!_queries) {
        _queries = createQueries();
      }
      return _queries[prop as keyof typeof _queries];
    },
  },
);

/**
 * Helper to serialize tags to JSON string
 */
export function serializeTags(tags?: string[]): string | null {
  return tags && tags.length > 0 ? JSON.stringify(tags) : null;
}

/**
 * Helper to deserialize tags from JSON string
 */
export function deserializeTags(tags: string | null): string[] | undefined {
  return tags ? JSON.parse(tags) : undefined;
}

export default db;
