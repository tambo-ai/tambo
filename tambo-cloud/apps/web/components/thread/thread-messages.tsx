import { Card } from "@/components/ui/card";
import { RouterOutputs } from "@/trpc/react";
import { LegacyComponentDecision } from "@tambo-ai-cloud/core";

type ThreadType = RouterOutputs["thread"]["getThread"];

interface ThreadMessagesProps {
  thread: ThreadType;
}

export function ThreadMessages({ thread }: Readonly<ThreadMessagesProps>) {
  const messages = thread?.messages || [];

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card key={message.id} className="p-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <p className="text-sm text-muted-foreground capitalize">
                {message.role}
              </p>
              <p className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
                {message.actionType && (
                  <p className="text-sm font-medium">{message.actionType}</p>
                )}
              </p>
            </div>
            <div className="whitespace-pre-wrap">
              {typeof message.content === "object" ? (
                <pre className="max-h-[400px] max-w-full overflow-auto">
                  {JSON.stringify(message.content, null, 2)}
                </pre>
              ) : (
                `${message.content}`
              )}
            </div>
            {message.componentDecision && (
              <div className="mt-2 text-sm text-muted-foreground">
                <div>
                  {message.componentDecision.componentName && (
                    <code className="font-mono">
                      &lt;{message.componentDecision.componentName}
                      {message.componentDecision.props &&
                        ` ${Object.keys(message.componentDecision.props)
                          .map((key) => `${key}={...}`)
                          .join(" ")}`}{" "}
                      /&gt;
                    </code>
                  )}
                </div>

                {!!message.suggestedActions?.length && (
                  <div className="mt-1">
                    Suggested Actions:
                    <ul className="list-disc list-inside">
                      {message.suggestedActions.map((action, i) => (
                        <li key={i}>{action.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {message.toolCallRequest && (
              <div className="mt-1">
                <div>Tool calls</div>
                <div>{message.toolCallRequest.toolName}(</div>
                {message.toolCallRequest.parameters.length > 0 && (
                  <ul className="list-disc list-inside">
                    {message.toolCallRequest.parameters.map((param, i) => (
                      <li key={i}>
                        {param.parameterName} ={" "}
                        {JSON.stringify(param.parameterValue)}
                      </li>
                    ))}
                  </ul>
                )}
                <div>)</div>
              </div>
            )}
            <div>
              ToolCallId:{" "}
              {message.toolCallId && <pre>id = {message.toolCallId}</pre>}
            </div>
            {message.toolCallRequest?.tool_call_id && (
              <div className="text-xs text-muted-foreground">
                <pre>id = {message.toolCallRequest.tool_call_id}</pre>
                (deprecated)
              </div>
            )}
            <div>
              {
                (message.componentDecision as LegacyComponentDecision)
                  ?.toolCallId
              }
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
