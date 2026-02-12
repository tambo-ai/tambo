"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  threadStatusFilter: string;
  setThreadStatusFilter: (v: "all" | "idle" | "streaming" | "waiting") => void;
  messageRoleFilter: string;
  setMessageRoleFilter: (v: "all" | "user" | "assistant" | "system") => void;
  messageContentTypeFilter: string;
  setMessageContentTypeFilter: (
    v: "all" | "text" | "tool_use" | "tool_result" | "component",
  ) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

const DEBOUNCE_MS = 200;

/**
 * Horizontal filter bar with thread status, message role, content type selects
 * and a debounced search input.
 *
 * @returns A compact filter bar for narrowing devtools data.
 */
export function FilterBar({
  threadStatusFilter,
  setThreadStatusFilter,
  messageRoleFilter,
  setMessageRoleFilter,
  messageContentTypeFilter,
  setMessageContentTypeFilter,
  searchQuery,
  setSearchQuery,
}: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={threadStatusFilter} onValueChange={setThreadStatusFilter}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Thread status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Threads</SelectItem>
          <SelectItem value="idle">Idle</SelectItem>
          <SelectItem value="streaming">Streaming</SelectItem>
          <SelectItem value="waiting">Waiting</SelectItem>
        </SelectContent>
      </Select>

      <Select value={messageRoleFilter} onValueChange={setMessageRoleFilter}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="assistant">Assistant</SelectItem>
          <SelectItem value="system">System</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={messageContentTypeFilter}
        onValueChange={setMessageContentTypeFilter}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Content type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="text">Text</SelectItem>
          <SelectItem value="tool_use">Tool Use</SelectItem>
          <SelectItem value="tool_result">Tool Result</SelectItem>
          <SelectItem value="component">Component</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search messages and tools..."
          className="pl-9"
        />
      </div>
    </div>
  );
}
