import { useTamboThread, useTamboThreadList } from "@tambo-ai/react";
import { useState, useMemo, useCallback } from "react";
import { cn } from "~/lib/utils";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  PlusIcon,
  SearchIcon,
} from "lucide-react";

export function ThreadHistory() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: threads, isLoading, refetch } = useTamboThreadList();
  const {
    thread: currentThread,
    switchCurrentThread,
    startNewThread,
  } = useTamboThread();

  const filteredThreads = useMemo(() => {
    if (isCollapsed || !threads?.items) return [];
    const query = searchQuery.toLowerCase();
    return threads.items.filter((thread) => {
      const nameMatches = thread.name?.toLowerCase().includes(query) ?? false;
      const idMatches = thread.id.toLowerCase().includes(query);
      return idMatches || nameMatches;
    });
  }, [isCollapsed, threads, searchQuery]);

  const handleNewThread = useCallback(async () => {
    await startNewThread();
    await refetch();
  }, [startNewThread, refetch]);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-slate-200 bg-slate-50/50 transition-all duration-300 flex-none",
        isCollapsed ? "w-12" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex flex-col h-full",
          isCollapsed ? "py-4 px-2" : "p-4",
        )}
      >
        {/* Header */}
        <div className="flex items-center mb-4 relative p-1">
          <h2
            className={cn(
              "text-sm text-slate-500 whitespace-nowrap",
              isCollapsed
                ? "opacity-0 max-w-0 overflow-hidden"
                : "opacity-100 max-w-none transition-all duration-300 delay-75",
            )}
          >
            Conversations
          </h2>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-slate-50/50 p-1 hover:bg-slate-100 transition-colors rounded-md cursor-pointer absolute right-1 flex items-center justify-center"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ArrowRightToLine className="h-4 w-4 text-slate-500" />
            ) : (
              <ArrowLeftToLine className="h-4 w-4 text-slate-500" />
            )}
          </button>
        </div>

        {/* New Thread Button */}
        <button
          onClick={handleNewThread}
          className={cn(
            "flex items-center rounded-md mb-4 hover:bg-slate-100 transition-colors cursor-pointer relative",
            isCollapsed ? "p-1 justify-center" : "p-2 gap-2",
          )}
          title="New thread"
        >
          <PlusIcon className="h-4 w-4 bg-green-600 rounded-full text-white p-0.5" />
          <span
            className={cn(
              "text-sm font-medium whitespace-nowrap absolute left-8 pb-[2px]",
              isCollapsed
                ? "opacity-0 max-w-0 overflow-hidden pointer-events-none"
                : "opacity-100 transition-all duration-300 delay-100",
            )}
          >
            New thread
          </span>
        </button>

        {/* Search */}
        <div className="mb-4 relative">
          <button
            onClick={() => setIsCollapsed(false)}
            className={cn(
              "p-1 hover:bg-slate-100 rounded-md cursor-pointer absolute left-1/2 -translate-x-1/2",
              isCollapsed
                ? "opacity-100 pointer-events-auto transition-all duration-300"
                : "opacity-0 pointer-events-none",
            )}
            title="Search threads"
          >
            <SearchIcon className="h-4 w-4 text-slate-400" />
          </button>

          <div
            className={cn(
              isCollapsed
                ? "opacity-0 pointer-events-none"
                : "opacity-100 delay-100 transition-all duration-500",
            )}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-full text-sm rounded-md bg-white border border-slate-200 focus:outline-none focus:border-slate-300"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Thread List */}
        <div
          className={cn(
            "overflow-y-auto flex-1 transition-all duration-300 ease-in-out",
            isCollapsed
              ? "opacity-0 max-h-0 overflow-hidden pointer-events-none"
              : "opacity-100 max-h-full pointer-events-auto",
          )}
        >
          {isLoading ? (
            <div className="text-sm text-slate-500 p-2">Loading threads...</div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-sm text-slate-500 p-2">
              {searchQuery ? "No matching threads" : "No previous threads"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredThreads.map((thread) => (
                <button
                  type="button"
                  key={thread.id}
                  onClick={() => switchCurrentThread(thread.id)}
                  aria-pressed={currentThread?.id === thread.id}
                  className={cn(
                    "w-full text-left p-2 rounded-md hover:bg-slate-100 cursor-pointer group",
                    currentThread?.id === thread.id ? "bg-slate-100" : "",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium line-clamp-1 block",
                      currentThread?.id === thread.id
                        ? "text-slate-900"
                        : "text-slate-500",
                    )}
                  >
                    {thread.name ?? `Thread ${thread.id.substring(0, 8)}`}
                  </span>
                  <p className="text-xs text-slate-400 truncate mt-1">
                    {new Date(thread.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
