/** Memory category for classification. */
export type MemoryCategory = "preference" | "fact" | "goal" | "relationship";

/** A stored memory about a user. */
export interface Memory {
  readonly id: string;
  readonly content: string;
  readonly category: MemoryCategory;
  readonly importance: number;
}

/**
 * Client for the memory REST API.
 * Wraps the v1/memories endpoints with typed methods.
 */
export class MemoryClient {
  constructor(
    private readonly baseURL: string,
    private readonly apiKey: string,
    private readonly userKey: string | undefined,
    private readonly userToken: string | undefined,
  ) {}

  private get headers(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
    };
    if (this.userToken) {
      headers.Authorization = `Bearer ${this.userToken}`;
    }
    return headers;
  }

  private get userKeyParam(): string {
    if (this.userKey) {
      return `userKey=${encodeURIComponent(this.userKey)}`;
    }
    return "";
  }

  /**
   * List active memories for the current user.
   * @returns Array of active memories.
   */
  async list(): Promise<Memory[]> {
    const url = `${this.baseURL}/v1/memories?${this.userKeyParam}`;
    const response = await fetch(url, { headers: this.headers });
    if (!response.ok) {
      throw new Error(`Failed to list memories: ${response.status}`);
    }
    const data = (await response.json()) as { memories: Memory[] };
    return data.memories;
  }

  /**
   * Create a new memory for the current user.
   * @returns The created memory.
   */
  async create(
    content: string,
    category: MemoryCategory,
    importance?: number,
  ): Promise<Memory> {
    const url = `${this.baseURL}/v1/memories`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        userKey: this.userKey,
        content,
        category,
        importance,
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create memory: ${response.status}`);
    }
    const data = (await response.json()) as { memory: Memory };
    return data.memory;
  }

  /**
   * Soft-delete a specific memory by ID.
   */
  async delete(memoryId: string): Promise<void> {
    const url = `${this.baseURL}/v1/memories/${encodeURIComponent(memoryId)}?${this.userKeyParam}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.headers,
    });
    if (!response.ok) {
      throw new Error(`Failed to delete memory: ${response.status}`);
    }
  }

  /**
   * Soft-delete ALL memories for the current user ("forget me").
   */
  async deleteAll(): Promise<void> {
    const url = `${this.baseURL}/v1/memories?${this.userKeyParam}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.headers,
    });
    if (!response.ok) {
      throw new Error(`Failed to delete all memories: ${response.status}`);
    }
  }
}
