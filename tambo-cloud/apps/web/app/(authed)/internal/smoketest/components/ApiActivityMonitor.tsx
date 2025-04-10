import { Button } from "@/components/ui/button";
import { AlertCircle, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

interface ApiState {
  isRunning: boolean;
  startTime: number | null;
  duration: number | null;
  isPaused: boolean;
  shouldError: boolean;
  tokens: number | null;
}

interface ApiActivityMonitorProps {
  name: string;
  state: ApiState;
  onPauseToggle: (currentlyPaused: boolean) => void;
  onErrorToggle: (currentlyErroring: boolean) => void;
  tokens?: number;
}

export function ApiActivityMonitor({
  name,
  state,
  onPauseToggle,
  onErrorToggle,
  tokens,
}: ApiActivityMonitorProps) {
  const [currentDuration, setCurrentDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!state.isRunning || !state.startTime) {
      setCurrentDuration(state.duration);
      return;
    }

    const interval = setInterval(() => {
      setCurrentDuration((Date.now() - state.startTime!) / 1000);
    }, 100);

    return () => clearInterval(interval);
  }, [state.isRunning, state.startTime, state.duration]);

  return (
    <div className="flex items-center gap-2 p-2 text-sm">
      <span className="w-24 font-medium">{name}:</span>
      <span className="w-6 mr-2 inline-flex justify-center">
        {state.isRunning ? (
          <span className="animate-spin">⟳</span>
        ) : (
          <span className="opacity-0">⟳</span>
        )}
      </span>
      <span className="w-20">
        {currentDuration !== null ? `${currentDuration.toFixed(1)}s` : "-"}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPauseToggle(state.isPaused)}
        disabled={state.isRunning && !state.isPaused}
      >
        {state.isPaused ? <Play size={16} /> : <Pause size={16} />}
      </Button>
      <Button
        size="sm"
        variant={state.shouldError ? "destructive" : "outline"}
        onClick={() => onErrorToggle(state.shouldError)}
        disabled={state.isRunning}
      >
        <AlertCircle size={16} />
      </Button>
      {!!tokens && (
        <span className="w-20 text-muted-foreground">
          {tokens.toLocaleString()} tokens
        </span>
      )}
    </div>
  );
}

export type { ApiActivityMonitorProps, ApiState };
