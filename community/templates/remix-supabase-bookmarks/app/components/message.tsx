import { useTambo, type TamboThreadMessage } from "@tambo-ai/react";
import { useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { cn } from "~/lib/utils";
import { Loader2, Check, X, ChevronDown } from "lucide-react";
import type TamboAI from "@tambo-ai/typescript-sdk";
import stringify from "json-stringify-pretty-compact";

// ============================================================================
// Utilities
// ============================================================================

function getMessageTextContent(message: TamboThreadMessage): string {
  const raw = message.content;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .filter(
        (part): part is { type: "text"; text: string } =>
          part?.type === "text" && typeof part.text === "string",
      )
      .map((part) => part.text)
      .join(" ");
  }
  return "";
}

function getToolCallRequest(
  message: TamboThreadMessage,
): TamboAI.ToolCallRequest | undefined {
  return message.toolCallRequest ?? message.component?.toolCallRequest;
}

function keyifyParameters(parameters: TamboAI.ToolCallParameter[] | undefined) {
  if (!parameters) return undefined;
  return Object.fromEntries(
    parameters.map((p) => [p.parameterName, p.parameterValue]),
  );
}

function extractContentString(
  content: TamboThreadMessage["content"],
): string | null {
  if (!content) return null;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (item?.type === "text") {
          return item.text ?? "";
        }
        return "";
      })
      .join("");
  }
  return null;
}

function formatToolResult(
  content: TamboThreadMessage["content"],
): React.ReactNode {
  const contentString = extractContentString(content);

  if (contentString) {
    try {
      const parsed = JSON.parse(contentString);
      return (
        <pre className="text-xs bg-slate-50 p-2 rounded overflow-auto">
          {stringify(parsed)}
        </pre>
      );
    } catch {
      return <div className="text-xs whitespace-pre-wrap">{contentString}</div>;
    }
  }

  return null;
}

function getMessageImages(content: TamboThreadMessage["content"]): string[] {
  if (!content || !Array.isArray(content)) return [];
  return content
    .filter(
      (item): item is { type: "image_url"; image_url: { url: string } } =>
        item?.type === "image_url" && !!item.image_url?.url,
    )
    .map((item) => item.image_url.url);
}

// ============================================================================
// Components
// ============================================================================

function MessageImages({ message }: { message: TamboThreadMessage }) {
  const images = getMessageImages(message.content);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {images.map((imageUrl, index) => (
        <div
          key={index}
          className="w-32 h-32 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <img
            src={imageUrl}
            alt={`Image ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.2s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.1s]" />
    </div>
  );
}

function UserMessage({ message }: { message: TamboThreadMessage }) {
  const content = useMemo(() => getMessageTextContent(message), [message]);
  const images = useMemo(() => getMessageImages(message.content), [message]);

  if (!content.trim() && images.length === 0) return null;

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] space-y-2">
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className="w-32 h-32 rounded-md overflow-hidden shadow-sm"
              >
                <img
                  src={imageUrl}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
        {content.trim() && (
          <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
            <div className="text-sm">{content}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function AssistantMessage({
  message,
  isLoading,
}: {
  message: TamboThreadMessage;
  isLoading: boolean;
}) {
  const content = useMemo(() => getMessageTextContent(message), [message]);
  const hasContent = content.trim().length > 0;

  // Skip if this message has a rendered component
  if (message.renderedComponent) return null;

  // Show loading dots only when streaming text (no tool call active)
  const hasToolCall =
    message.toolCallRequest ?? message.component?.toolCallRequest;
  const showLoading = isLoading && !hasContent && !hasToolCall;

  if (!showLoading && !hasContent) return null;

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2x py-2 text-black">
        {showLoading ? (
          <LoadingIndicator />
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
            <Streamdown>{content}</Streamdown>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallInfo({
  message,
  isLoading,
}: {
  message: TamboThreadMessage;
  isLoading: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { thread } = useTambo();

  // Find associated tool response
  const associatedToolResponse = useMemo(() => {
    if (!thread?.messages) return null;
    const currentIndex = thread.messages.findIndex((m) => m.id === message.id);
    if (currentIndex === -1) return null;

    for (let i = currentIndex + 1; i < thread.messages.length; i++) {
      const nextMessage = thread.messages[i];
      if (nextMessage.role === "tool") {
        return nextMessage;
      }
      if (nextMessage.role === "assistant" && getToolCallRequest(nextMessage)) {
        break;
      }
    }
    return null;
  }, [message.id, thread?.messages]);

  const toolCallRequest = getToolCallRequest(message);
  if (!toolCallRequest) return null;

  const hasToolError = !!message.error;

  const toolStatusMessage = isLoading
    ? `Calling ${toolCallRequest.toolName}`
    : `Called ${toolCallRequest.toolName}`;

  return (
    <div className="flex flex-col items-start text-xs opacity-70 mt-1">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 hover:bg-slate-100 rounded px-2 py-1 transition-colors"
      >
        {hasToolError ? (
          <X className="w-3 h-3 text-red-500" />
        ) : isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
        ) : (
          <Check className="w-3 h-3 text-green-500" />
        )}
        <span className="text-slate-600">{toolStatusMessage}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform",
            !isExpanded && "-rotate-90",
          )}
        />
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-2 pl-6 pr-2 py-2 text-slate-600 w-full">
          <div>
            <span className="font-medium">Tool:</span>{" "}
            {toolCallRequest.toolName}
          </div>
          <div>
            <span className="font-medium">Parameters:</span>
            <pre className="text-xs bg-slate-50 p-2 rounded mt-1 overflow-auto">
              {stringify(keyifyParameters(toolCallRequest.parameters))}
            </pre>
          </div>
          {associatedToolResponse && (
            <div>
              <span className="font-medium">Result:</span>
              <div className="mt-1">
                {!associatedToolResponse.content ? (
                  <span className="italic text-slate-400">Empty response</span>
                ) : (
                  formatToolResult(associatedToolResponse.content)
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RenderedComponent({ message }: { message: TamboThreadMessage }) {
  if (!message.renderedComponent) return null;

  return <div className="w-full">{message.renderedComponent}</div>;
}

export function Message({
  message,
  isLoading,
}: {
  message: TamboThreadMessage;
  isLoading: boolean;
}) {
  if (message.role === "user") {
    return <UserMessage message={message} />;
  }

  return (
    <div className="space-y-1">
      <MessageImages message={message} />
      <AssistantMessage message={message} isLoading={isLoading} />
      <ToolCallInfo message={message} isLoading={isLoading} />
      <RenderedComponent message={message} />
    </div>
  );
}

Message.displayName = "Message";
