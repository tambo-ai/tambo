import { Card } from "@/components/ui/card";
import { RouterOutputs } from "@/trpc/react";

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
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground capitalize">
                {message.role}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>
            <p className="whitespace-pre-wrap">{`${message.content}`}</p>
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

                {message.componentDecision.suggestedActions?.length > 0 && (
                  <div className="mt-1">
                    Suggested Actions:
                    <ul className="list-disc list-inside">
                      {message.componentDecision.suggestedActions.map(
                        (action, i) => (
                          <li key={i}>{action.label}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

                {message.componentDecision.toolCallRequest && (
                  <div className="mt-1">
                    Tool Call:{" "}
                    {message.componentDecision.toolCallRequest.toolName}
                    {message.componentDecision.toolCallRequest.parameters
                      .length > 0 && (
                      <ul className="list-disc list-inside">
                        {message.componentDecision.toolCallRequest.parameters.map(
                          (param, i) => (
                            <li key={i}>{param.parameterName}</li>
                          ),
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
