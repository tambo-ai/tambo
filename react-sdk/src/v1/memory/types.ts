/**
 * Memory Storage Types
 *
 * Defines the interface for pluggable memory storage backends.
 * Memory entries are key-value pairs that persist across conversations
 * and are automatically provided to the AI as context.
 */

/**
 * A single memory entry stored by the system.
 */
export interface MemoryEntry {
  /** Unique key identifying this memory */
  key: string;
  /** The stored value (any JSON-serializable data) */
  value: unknown;
  /** When this memory was created */
  createdAt: number;
  /** When this memory was last updated */
  updatedAt: number;
  /** Optional metadata tags for categorization */
  tags?: string[];
}

/**
 * Interface for memory storage backends.
 * Implement this to provide custom storage (localStorage, IndexedDB, server-side, etc.).
 */
export interface MemoryProvider {
  /** Store or update a memory entry */
  set(key: string, value: unknown, tags?: string[]): Promise<void>;
  /** Retrieve a memory entry by key */
  get(key: string): Promise<MemoryEntry | null>;
  /** Remove a memory entry */
  delete(key: string): Promise<void>;
  /** List all memory entries, optionally filtered by tags */
  list(tags?: string[]): Promise<MemoryEntry[]>;
  /** Clear all memory entries */
  clear(): Promise<void>;
}
