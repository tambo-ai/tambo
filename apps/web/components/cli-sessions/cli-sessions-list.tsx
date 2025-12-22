"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import { Laptop, Trash2 } from "lucide-react";
import { useState } from "react";

interface CliSession {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

function SessionSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-9 w-20" />
    </div>
  );
}

function SessionItem({
  session,
  onRevoke,
  isRevoking,
}: {
  session: CliSession;
  onRevoke: (sessionId: string) => void;
  isRevoking: boolean;
}) {
  const createdAt = new Date(session.createdAt);
  const expiresAt = session.expiresAt ? new Date(session.expiresAt) : null;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Laptop className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">CLI Session</p>
          <p className="text-sm text-muted-foreground">
            Created {formatDistanceToNow(createdAt, { addSuffix: true })}
            {expiresAt && (
              <span className="ml-2">
                · Expires {formatDistanceToNow(expiresAt, { addSuffix: true })}
              </span>
            )}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => onRevoke(session.id)}
        disabled={isRevoking}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Revoke
      </Button>
    </div>
  );
}

export function CliSessionsList() {
  const { toast } = useToast();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const {
    data: sessions,
    isLoading,
    refetch,
  } = api.deviceAuth.listSessions.useQuery();

  const revokeMutation = api.deviceAuth.revokeSession.useMutation({
    onSuccess: async () => {
      toast({
        title: "Session revoked",
        description: "The CLI session has been revoked successfully.",
      });
      await refetch();
    },
    onError: (error) => {
      toast({
        title: "Failed to revoke session",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setRevokingId(null);
    },
  });

  const handleRevoke = (sessionId: string) => {
    setRevokingId(sessionId);
    revokeMutation.mutate({ sessionId });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SessionSkeleton />
        <SessionSkeleton />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <Laptop className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No active CLI sessions</h3>
        <p className="text-sm text-muted-foreground mt-1">
          When you authenticate via{" "}
          <code className="bg-muted px-1 py-0.5 rounded">tambo init</code>, your
          sessions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          session={session}
          onRevoke={handleRevoke}
          isRevoking={revokingId === session.id}
        />
      ))}
    </div>
  );
}
