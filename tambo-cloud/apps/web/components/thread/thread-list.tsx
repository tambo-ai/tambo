import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RouterOutputs } from "@/trpc/react";

type ThreadType = RouterOutputs["thread"]["getThreads"][number];

interface ThreadListProps {
  threads: ThreadType[];
  selectedThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

export function ThreadList({
  threads,
  selectedThreadId,
  onThreadSelect,
}: Readonly<ThreadListProps>) {
  if (threads.length === 0) {
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
              {new Date(thread.createdAt).toLocaleDateString()}
            </p>
          </div>
        </Button>
      ))}
    </div>
  );
}
