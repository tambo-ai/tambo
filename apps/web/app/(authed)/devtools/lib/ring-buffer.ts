/**
 * A fixed-capacity circular buffer that evicts oldest items when full.
 */
export class RingBuffer<T> {
  private readonly items: (T | undefined)[];
  private head = 0;
  private count = 0;
  private totalPushed = 0;

  constructor(private readonly capacity: number = 5000) {
    this.items = new Array<T | undefined>(capacity);
  }

  /**
   * Adds an item to the buffer, evicting the oldest if at capacity.
   *
   * @returns The buffer instance for chaining.
   */
  push(item: T): this {
    if (this.count < this.capacity) {
      this.items[(this.head + this.count) % this.capacity] = item;
      this.count++;
    } else {
      this.items[this.head] = item;
      this.head = (this.head + 1) % this.capacity;
    }
    this.totalPushed++;
    return this;
  }

  /**
   * Returns all items in chronological order (oldest first).
   *
   * @returns A new array of buffered items.
   */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      result.push(this.items[(this.head + i) % this.capacity] as T);
    }
    return result;
  }

  /** Current number of items in the buffer. */
  get length(): number {
    return this.count;
  }

  /** Total number of items evicted due to overflow. */
  get droppedCount(): number {
    return Math.max(0, this.totalPushed - this.capacity);
  }

  /** Resets the buffer to empty state. */
  clear(): void {
    this.head = 0;
    this.count = 0;
    this.totalPushed = 0;
    this.items.fill(undefined);
  }
}
