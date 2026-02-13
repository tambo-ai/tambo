import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** SDK-agnostic thread interface. */
interface ThreadListThread {
  id: string;
  createdAt: string | Date;
}

interface ThreadListProps {
  threads: ThreadListThread[];
  selectedThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  isLoading: boolean;
}

export function ThreadList({
  threads,
  selectedThreadId,
  onThreadSelect,
  isLoading,
}: Readonly<ThreadListProps>) {
  if (threads.length === 0 && !isLoading) {
    return (
      <p className="text-center text-muted-foreground py-8">No threads found</p>
    );
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <Button
          key={thread.id}
          variant="ghost"
          className={cn(
            "w-full justify-start text-left h-auto py-3",
            selectedThreadId === thread.id && "bg-muted",
          )}
          onClick={() => onThreadSelect(thread.id)}
        >
          <div>
            <p className="font-medium">{thread.id}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(thread.createdAt).toLocaleString()}
            </p>
          </div>
        </Button>
      ))}
    </div>
  );
}

export type { ThreadListProps, ThreadListThread };
