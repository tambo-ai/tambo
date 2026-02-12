"use client";

import { useMemo, useState } from "react";

import type { StateSnapshot } from "@/devtools-server/types";

type ThreadStatus = "all" | "idle" | "streaming" | "waiting";
type MessageRole = "all" | "user" | "assistant" | "system";
type ContentType = "all" | "text" | "tool_use" | "tool_result" | "component";

type SnapshotThread = StateSnapshot["threads"][number];
type SnapshotMessage = SnapshotThread["messages"][number];

export interface UseDevtoolsFiltersReturn {
  threadStatusFilter: ThreadStatus;
  setThreadStatusFilter: (v: ThreadStatus) => void;
  messageRoleFilter: MessageRole;
  setMessageRoleFilter: (v: MessageRole) => void;
  messageContentTypeFilter: ContentType;
  setMessageContentTypeFilter: (v: ContentType) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredThreads: StateSnapshot["threads"];
  filterMessages: (messages: SnapshotMessage[]) => SnapshotMessage[];
}

function matchesSearch(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

function threadMatchesSearch(
  thread: StateSnapshot["threads"][number],
  query: string,
): boolean {
  if (thread.name && matchesSearch(thread.name, query)) return true;
  return thread.messages.some((msg) =>
    msg.content.some((c) => {
      if (
        "text" in c &&
        typeof c.text === "string" &&
        matchesSearch(c.text, query)
      )
        return true;
      if (
        "name" in c &&
        typeof c.name === "string" &&
        matchesSearch(c.name, query)
      )
        return true;
      return false;
    }),
  );
}

/**
 * Manages filter and search state for devtools threads and messages.
 * Provides filtered threads and a function to filter individual message arrays.
 *
 * @returns Filter states, setters, filtered threads, and a message filter function.
 */
export function useDevtoolsFilters(
  snapshot: StateSnapshot | undefined,
): UseDevtoolsFiltersReturn {
  const [threadStatusFilter, setThreadStatusFilter] =
    useState<ThreadStatus>("all");
  const [messageRoleFilter, setMessageRoleFilter] =
    useState<MessageRole>("all");
  const [messageContentTypeFilter, setMessageContentTypeFilter] =
    useState<ContentType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredThreads = useMemo(() => {
    const threads = snapshot?.threads ?? [];
    return threads.filter((t) => {
      if (threadStatusFilter !== "all" && t.status !== threadStatusFilter)
        return false;
      if (searchQuery && !threadMatchesSearch(t, searchQuery)) return false;
      return true;
    });
  }, [snapshot?.threads, threadStatusFilter, searchQuery]);

  const filterMessages = useMemo(() => {
    return (messages: SnapshotMessage[]): SnapshotMessage[] =>
      messages.filter((msg) => {
        if (messageRoleFilter !== "all" && msg.role !== messageRoleFilter)
          return false;
        if (messageContentTypeFilter !== "all") {
          const hasType = msg.content.some(
            (c) => c.type === messageContentTypeFilter,
          );
          if (!hasType) return false;
        }
        if (searchQuery) {
          const matches = msg.content.some((c) => {
            if (
              "text" in c &&
              typeof c.text === "string" &&
              matchesSearch(c.text, searchQuery)
            )
              return true;
            if (
              "name" in c &&
              typeof c.name === "string" &&
              matchesSearch(c.name, searchQuery)
            )
              return true;
            return false;
          });
          if (!matches) return false;
        }
        return true;
      });
  }, [messageRoleFilter, messageContentTypeFilter, searchQuery]);

  return {
    threadStatusFilter,
    setThreadStatusFilter,
    messageRoleFilter,
    setMessageRoleFilter,
    messageContentTypeFilter,
    setMessageContentTypeFilter,
    searchQuery,
    setSearchQuery,
    filteredThreads,
    filterMessages,
  };
}
