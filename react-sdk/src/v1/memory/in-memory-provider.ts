/**
 * InMemoryProvider
 *
 * Default memory storage implementation using a plain Map.
 * Memory is lost when the page is refreshed. Use this as a starting point
 * or for development/testing. For production, implement MemoryProvider
 * with a persistent backend (localStorage, IndexedDB, or server-side storage).
 */

import type { MemoryEntry, MemoryProvider } from "./types";

export class InMemoryProvider implements MemoryProvider {
  private store = new Map<string, MemoryEntry>();

  async set(key: string, value: unknown, tags?: string[]): Promise<void> {
    const existing = this.store.get(key);
    const now = Date.now();
    this.store.set(key, {
      key,
      value,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      tags,
    });
  }

  async get(key: string): Promise<MemoryEntry | null> {
    return this.store.get(key) ?? null;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(tags?: string[]): Promise<MemoryEntry[]> {
    const entries = Array.from(this.store.values());
    if (!tags || tags.length === 0) return entries;
    return entries.filter(
      (entry) =>
        entry.tags && tags.some((tag) => entry.tags!.includes(tag)),
    );
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
