import { ThrottlerStorage } from "@nestjs/throttler";

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

interface RateLimitEntry {
  totalHits: number;
  windowStart: number;
  blockedUntil: number;
  expiresAt: number;
}

const MAX_ENTRIES = 10_000;
const OVERFLOW_KEY = "rate-limit:overflow";

export class BoundedThrottlerStorage implements ThrottlerStorage {
  private readonly entries = new Map<string, RateLimitEntry>();
  private readonly cleanupInterval = setInterval(
    () => this.removeExpiredEntries(),
    60_000,
  );

  constructor() {
    this.cleanupInterval.unref();
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const now = Date.now();
    const storageKey = this.getStorageKey(key);
    const currentEntry = this.entries.get(storageKey);
    const entry = this.getActiveEntry(currentEntry, now, ttl);

    if (entry.blockedUntil > now) {
      return this.toStorageRecord(entry, now, ttl, true);
    }

    const nextEntry: RateLimitEntry = {
      totalHits: entry.totalHits + 1,
      windowStart: entry.windowStart,
      blockedUntil: entry.blockedUntil,
      expiresAt: entry.expiresAt,
    };
    if (nextEntry.totalHits > limit) {
      nextEntry.blockedUntil = now + blockDuration;
      nextEntry.expiresAt = Math.max(
        nextEntry.expiresAt,
        nextEntry.blockedUntil,
      );
    }
    this.entries.set(storageKey, nextEntry);

    return this.toStorageRecord(
      nextEntry,
      now,
      ttl,
      nextEntry.blockedUntil > now,
    );
  }

  private getStorageKey(key: string): string {
    this.removeExpiredEntries();

    if (this.entries.has(key) || this.entries.has(OVERFLOW_KEY)) {
      return this.entries.has(key) ? key : OVERFLOW_KEY;
    }
    if (this.entries.size < MAX_ENTRIES) {
      return key;
    }

    const firstKey = this.entries.keys().next().value;
    if (typeof firstKey === "string") {
      this.entries.delete(firstKey);
    }
    return OVERFLOW_KEY;
  }

  private getActiveEntry(
    entry: RateLimitEntry | undefined,
    now: number,
    ttl: number,
  ): RateLimitEntry {
    if (!entry || entry.expiresAt <= now) {
      return this.createEntry(now, ttl);
    }
    if (entry.blockedUntil > 0 && entry.blockedUntil <= now) {
      return this.createEntry(now, ttl);
    }
    return entry;
  }

  private createEntry(now: number, ttl: number): RateLimitEntry {
    return {
      totalHits: 0,
      windowStart: now,
      blockedUntil: 0,
      expiresAt: now + ttl,
    };
  }

  private removeExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  private toStorageRecord(
    entry: RateLimitEntry,
    now: number,
    ttl: number,
    isBlocked: boolean,
  ): ThrottlerStorageRecord {
    return {
      totalHits: entry.totalHits,
      timeToExpire: Math.max(
        0,
        Math.ceil((entry.windowStart + ttl - now) / 1000),
      ),
      isBlocked,
      timeToBlockExpire: Math.max(
        0,
        Math.ceil((entry.blockedUntil - now) / 1000),
      ),
    };
  }
}
