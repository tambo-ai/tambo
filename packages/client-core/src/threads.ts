/**
 * ThreadsClient - Thread and message management
 */

import type { TamboClient } from "./client.js";
import type {
  Thread,
  Message,
  CreateThreadParams,
  SendMessageParams,
  ListThreadsParams,
  ContentPart,
} from "./types.js";

/**
 * Client for managing threads and messages
 */
export class ThreadsClient {
  /**
   * Create a new ThreadsClient
   *
   * @param client - TamboClient instance for API calls
   */
  constructor(private readonly client: TamboClient) {}

  /**
   * Create a new thread
   *
   * @param params - Thread creation parameters
   * @returns Promise resolving to created thread
   */
  async create(params: CreateThreadParams): Promise<Thread> {
    return await this.client.fetch<Thread>("/threads", {
      method: "POST",
      body: params,
    });
  }

  /**
   * List threads for a project
   *
   * @param params - List parameters (projectId, contextKey, limit, offset)
   * @returns Promise resolving to array of threads
   */
  async list(params: ListThreadsParams): Promise<Thread[]> {
    const queryParams = new URLSearchParams();
    if (params.contextKey) {
      queryParams.append("contextKey", params.contextKey);
    }
    if (params.limit !== undefined) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params.offset !== undefined) {
      queryParams.append("offset", params.offset.toString());
    }

    const query = queryParams.toString();
    const path = `/threads/project/${params.projectId}${query ? `?${query}` : ""}`;

    const response = await this.client.fetch<{
      items: Thread[];
      total: number;
      offset: number;
      limit: number;
      count: number;
    }>(path);

    return response.items;
  }

  /**
   * Get a thread by ID
   *
   * @param threadId - Thread ID to retrieve
   * @returns Promise resolving to thread with messages
   */
  async get(threadId: string): Promise<Thread> {
    return await this.client.fetch<Thread>(`/threads/${threadId}`);
  }

  /**
   * Delete a thread
   *
   * @param threadId - Thread ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(threadId: string): Promise<void> {
    await this.client.fetch<void>(`/threads/${threadId}`, {
      method: "DELETE",
    });
  }

  /**
   * Send a message to a thread
   *
   * @param threadId - Thread ID to send message to
   * @param params - Message parameters (content and optional metadata)
   * @returns Promise resolving to created message
   */
  async sendMessage(
    threadId: string,
    params: SendMessageParams,
  ): Promise<Message> {
    // Convert string content to ContentPart array
    const content: ContentPart[] =
      typeof params.content === "string"
        ? [{ type: "text", text: params.content }]
        : params.content;

    return await this.client.fetch<Message>(`/threads/${threadId}/messages`, {
      method: "POST",
      body: {
        role: "user",
        content,
        metadata: params.metadata,
      },
    });
  }
}
