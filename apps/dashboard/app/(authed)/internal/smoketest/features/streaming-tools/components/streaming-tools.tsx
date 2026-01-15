"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTambo } from "@tambo-ai/react";
import React from "react";
import { StreamingStory } from "../components/streaming-story";
import { getWriteStoryTool } from "../tools/writeStory";

export function StreamingTools() {
  const { registerTool } = useTambo();
  const [{ calls, text }, dispatch] = React.useReducer(
    (
      state: { calls: number; text: string },
      action: { type: "reset" } | { type: "update"; text: string },
    ) => {
      switch (action.type) {
        case "reset":
          return {
            calls: 0,
            text: "",
          };
        case "update":
          return {
            calls: state.calls + 1,
            text: action.text,
          };
        default:
          return state;
      }
    },
    { calls: 0, text: "" },
  );
  const reset = React.useCallback(() => dispatch({ type: "reset" }), []);
  const update = React.useCallback(
    (text: string) => dispatch({ type: "update", text }),
    [],
  );

  const writeStoryTool = React.useMemo(
    () => getWriteStoryTool(update),
    [update],
  );

  React.useEffect(() => {
    registerTool(writeStoryTool);
  }, [registerTool, writeStoryTool]);

  return (
    <Card className="p-4 mt-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Streaming Story</h3>
          <Badge variant="outline">{calls} calls</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Reset
        </Button>
      </div>
      {!text ? (
        <Card className="p-4">
          <div className="max-h-[200px] overflow-y-auto space-y-2">
            <p className="text-sm text-muted-foreground">No tool calls yet</p>
          </div>
        </Card>
      ) : (
        <StreamingStory text={text} />
      )}
      <p className="text-xs text-muted-foreground mt-4">
        Test: &quot;Write a short story&quot; - the count will go up and the
        story will update as the tool streams results.
      </p>
    </Card>
  );
}
