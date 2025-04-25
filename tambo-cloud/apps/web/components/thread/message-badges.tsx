import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface ActionBadgeProps {
  type: string;
}

export function ActionBadge({ type }: ActionBadgeProps) {
  return (
    <Badge variant="secondary" className="font-normal">
      {type}
    </Badge>
  );
}

interface ToolCallBadgeProps {
  id: string;
  onHover?: (id: string | null) => void;
}

export function ToolCallBadge({ id, onHover }: ToolCallBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="font-mono text-xs cursor-help inline-flex items-center"
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
      title={id}
    >
      <span className="max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap block">
        {id}
      </span>
    </Badge>
  );
}

interface ToolCallCodeProps {
  toolName: string;
  parameters: Array<{ parameterName: string; parameterValue: any }>;
}

export function ToolCallCode({ toolName, parameters }: ToolCallCodeProps) {
  const [expanded, setExpanded] = useState(false);

  const formatValue = (value: any) => {
    return JSON.stringify(value, null, expanded ? 2 : 0);
  };

  if (expanded) {
    return (
      <div className="font-mono text-sm bg-muted/50 p-3 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">{toolName}</span>
          <button
            onClick={() => setExpanded(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Collapse
          </button>
        </div>
        <div className="space-y-1">
          {parameters.map((param, i) => (
            <div key={i} className="ml-4">
              <span className="text-muted-foreground">
                {param.parameterName}:{" "}
              </span>
              <span>{formatValue(param.parameterValue)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Create the full parameter string
  const paramString = parameters
    .map(
      (param) => `${param.parameterName}: ${formatValue(param.parameterValue)}`,
    )
    .join(", ");

  return (
    <div className="font-mono text-sm bg-muted/50 p-3 rounded-md">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="overflow-hidden whitespace-nowrap">
            <span className="font-semibold">{toolName}</span>
            <span>(</span>
            <span className="text-ellipsis overflow-hidden" title={paramString}>
              {paramString}
            </span>
            <span>)</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-muted-foreground hover:text-foreground shrink-0"
        >
          Expand
        </button>
      </div>
    </div>
  );
}

interface SuggestedActionsProps {
  actions: Array<{ title: string }>;
}

export function SuggestedActions({ actions }: SuggestedActionsProps) {
  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">
        Suggested Actions
      </h4>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, i) => (
          <Badge
            key={i}
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80"
          >
            {action.title}
          </Badge>
        ))}
      </div>
    </div>
  );
}
