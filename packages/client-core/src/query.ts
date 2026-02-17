/**
 * Query key factories for TanStack Query cache management
 */

export const threadKeys = {
  all: ["threads"] as const,
  lists: () => [...threadKeys.all, "list"] as const,
  list: (params: object) => [...threadKeys.lists(), params] as const,
  details: () => [...threadKeys.all, "detail"] as const,
  detail: (threadId: string) => [...threadKeys.details(), threadId] as const,
  messages: (threadId: string) =>
    [...threadKeys.detail(threadId), "messages"] as const,
};
