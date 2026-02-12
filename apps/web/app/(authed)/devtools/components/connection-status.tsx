"use client";

interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
}

export function ConnectionStatus({
  isConnected,
  error,
}: ConnectionStatusProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <span className="text-sm text-muted-foreground">{error}</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
        <span className="text-sm text-muted-foreground">
          Connected to DevTools server
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
      <span className="text-sm text-muted-foreground">
        Disconnected from DevTools server
      </span>
    </div>
  );
}
