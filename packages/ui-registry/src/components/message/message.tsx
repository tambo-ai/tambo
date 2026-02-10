"use client";

import { TamboThreadMessage } from "@tambo-ai/react";
import {
  Message as MessageBase,
  type MessageContentProps as MessageBaseContentProps,
  type MessageContentRenderProps as MessageBaseContentRenderProps,
  type MessageImagesProps as MessageBaseImagesProps,
  type MessageRenderedComponentProps as MessageBaseRenderedComponentProps,
  type MessageLoadingIndicatorProps,
  type MessageRootProps,
} from "@tambo-ai/react-ui-base/message";
import {
  ReasoningInfo as ReasoningInfoBase,
  type ReasoningInfoRootProps,
} from "@tambo-ai/react-ui-base/reasoning-info";
import {
  ToolcallInfo as ToolcallInfoBase,
  type ToolcallInfoRootProps as ToolcallInfoBaseRootProps,
} from "@tambo-ai/react-ui-base/toolcall-info";
import { cn } from "@tambo-ai/ui-registry/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown, ExternalLink, Loader2, X } from "lucide-react";
import * as React from "react";
import { Streamdown, defaultRehypePlugins } from "streamdown";
import { defaultSchema } from "rehype-sanitize";
import type { Pluggable, PluggableList } from "unified";
import { getSafeContent } from "../../lib/thread-hooks";
import {
  createMarkdownComponents,
  markdownComponents,
} from "./markdown-components";

const streamdownSanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), "tambo-resource"],
  },
};

const streamdownSanitizePlugin: Pluggable = Array.isArray(
  defaultRehypePlugins.sanitize,
)
  ? (defaultRehypePlugins.sanitize[0] as Pluggable)
  : (defaultRehypePlugins.sanitize as Pluggable);

const streamdownRehypePlugins: PluggableList = [
  defaultRehypePlugins.raw,
  [streamdownSanitizePlugin, streamdownSanitizeSchema] as Pluggable,
  defaultRehypePlugins.harden,
];

/**
 * CSS variants for the message container
 * @typedef {Object} MessageVariants
 * @property {string} default - Default styling
 * @property {string} solid - Solid styling with shadow effects
 */
const messageVariants = cva("flex", {
  variants: {
    variant: {
      default: "",
      solid: [
        "[&>div>div:first-child]:shadow-md",
        "[&>div>div:first-child]:bg-container/50",
        "[&>div>div:first-child]:hover:bg-container",
        "[&>div>div:first-child]:transition-all",
        "[&>div>div:first-child]:duration-200",
      ].join(" "),
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * Props for the Message component.
 */
export interface MessageProps extends MessageRootProps {
  /** Optional styling variant for the message container. */
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * The root container for a message component.
 * It establishes the context for its children and applies alignment styles based on the role.
 * @component Message
 * @example
 * ```tsx
 * <Message role="user" message={messageData} variant="solid">
 *   <Message.Bubble />
 *   <Message.RenderedComponentArea />
 * </Message>
 * ```
 */
const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, variant, message, children, role, ...props }, ref) => {
    return (
      <MessageBase.Root
        ref={ref}
        className={cn(
          messageVariants({ variant }),
          "data-[message-role=assistant]:w-full",
          className,
        )}
        message={message}
        role={role}
        {...props}
      >
        {children}
      </MessageBase.Root>
    );
  },
);
Message.displayName = "Message";

/**
 * Loading indicator with bouncing dots animation.
 *
 * A reusable component that displays three animated dots for loading states.
 * Used in message content and tool status areas.
 *
 * @component
 * @param props - Standard HTML div props
 * @param props.className - Optional CSS classes to apply
 * @returns Animated loading indicator component
 */
const LoadingIndicator: React.FC<MessageLoadingIndicatorProps> = ({
  className,
  ...props
}) => {
  return (
    <MessageBase.LoadingIndicator
      className={cn(
        [
          "flex items-center gap-1",
          "*:data-dot:h-1 *:data-dot:w-1 *:data-dot:bg-current *:data-dot:rounded-full *:data-dot:animate-bounce",
          "*:data-[dot=1]:[animation-delay:-0.3s]",
          "*:data-[dot=2]:[animation-delay:-0.2s]",
          "*:data-[dot=3]:[animation-delay:-0.1s]",
        ],
        className,
      )}
      {...props}
    />
  );
};
LoadingIndicator.displayName = "LoadingIndicator";

/**
 * Internal component to render message content based on its type
 */
function MessageContentRenderer({
  contentToRender,
  markdownContent,
  markdown,
}: {
  contentToRender: unknown;
  markdownContent: string;
  markdown: boolean;
}) {
  if (!contentToRender) {
    return <span className="text-muted-foreground italic">Empty message</span>;
  }
  if (React.isValidElement(contentToRender)) {
    return contentToRender;
  }
  if (markdown) {
    return (
      <Streamdown
        components={markdownComponents}
        rehypePlugins={streamdownRehypePlugins}
      >
        {markdownContent}
      </Streamdown>
    );
  }
  return markdownContent;
}

/**
 * Props for the MessageImages component.
 */
export type MessageImagesProps = Omit<
  MessageBaseImagesProps,
  "renderImage" | "children"
>;

/**
 * Displays images from message content horizontally.
 * @component MessageImages
 */
const MessageImages = React.forwardRef<HTMLDivElement, MessageImagesProps>(
  ({ className, ...props }, ref) => {
    return (
      <MessageBase.Images
        ref={ref}
        className={cn("flex flex-wrap gap-2 mb-2", className)}
        renderImage={({ url, index }) => (
          <div
            key={index}
            className="w-32 h-32 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <img
              src={url}
              alt={`Image ${index + 1}`}
              width={128}
              height={128}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {...props}
      />
    );
  },
);
MessageImages.displayName = "MessageImages";

/**
 * Props for the MessageContent component.
 */
export type MessageContentProps = Omit<MessageBaseContentProps, "children">;

/**
 * Displays the message content with optional markdown formatting.
 * Only shows text content - tool calls are handled by ToolcallInfo component.
 * @component MessageContent
 */
const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  ({ className, content, markdown = true, ...props }, ref) => {
    return (
      <MessageBase.Content
        ref={ref}
        className={cn(
          "relative block rounded-3xl px-4 py-2 text-[15px] leading-relaxed transition-all duration-200 font-medium max-w-full [&_p]:py-1 [&_li]:list-item",
          className,
        )}
        content={content}
        markdown={markdown}
        render={({
          content: contentToRender,
          markdownContent,
          markdown,
          isLoading,
          isCancelled,
          isReasoning,
        }: MessageBaseContentRenderProps) => {
          if (isLoading && !isReasoning) {
            return (
              <div
                className="flex items-center justify-start h-4 py-1"
                data-slot="message-loading-indicator"
              >
                <LoadingIndicator />
              </div>
            );
          }

          return (
            <div
              className={cn(
                "wrap-break-word",
                !markdown && "whitespace-pre-wrap",
              )}
              data-slot="message-content-text"
            >
              <MessageContentRenderer
                contentToRender={contentToRender}
                markdownContent={markdownContent}
                markdown={markdown}
              />
              {isCancelled && (
                <span className="text-muted-foreground text-xs">cancelled</span>
              )}
            </div>
          );
        }}
        {...props}
      />
    );
  },
);
MessageContent.displayName = "MessageContent";

/**
 * Props for the ToolcallInfo component.
 */
export interface ToolcallInfoProps extends Omit<
  ToolcallInfoBaseRootProps,
  "children" | "message"
> {
  /** Optional flag to render response content as Markdown. Default is true. */
  markdown?: boolean;
}

const toolStatusIconClassName = cva("h-3 w-3 text-bold", {
  variants: {
    status: {
      error: "text-red-500",
      loading: "text-muted-foreground animate-spin",
      success: "text-green-500",
    },
  },
  defaultVariants: {
    status: "success",
  },
});

function ToolcallStatusIcon() {
  return (
    <ToolcallInfoBase.StatusIcon
      render={({ status }) => {
        let Icon = Check;
        if (status === "error") Icon = X;
        if (status === "loading") Icon = Loader2;
        return <Icon className={toolStatusIconClassName({ status })} />;
      }}
    />
  );
}

function ToolResultDisplay({
  content,
  hasResult,
  enableMarkdown,
}: {
  content: TamboThreadMessage["content"] | null;
  hasResult: boolean;
  enableMarkdown: boolean;
}) {
  if (!hasResult) {
    return <span className="text-muted-foreground italic">Empty response</span>;
  }
  if (!content) {
    return null;
  }
  return (
    <ToolResultContent content={content} enableMarkdown={enableMarkdown} />
  );
}

function ToolcallInfoContent({ markdown }: { markdown: boolean }) {
  return (
    <ToolcallInfoBase.Content
      forceMount
      className={cn(
        "flex flex-col gap-1 p-3 pl-7 overflow-auto transition-[max-height,opacity,padding] duration-300 w-full truncate",
        "data-[state=open]:max-h-auto data-[state=open]:opacity-100",
        "data-[state=closed]:max-h-0 data-[state=closed]:opacity-0 data-[state=closed]:p-0",
      )}
    >
      {({ message }) => (
        <>
          <ToolcallInfoBase.ToolName
            className="whitespace-pre-wrap pl-2"
            render={({ toolName }) => `tool: ${toolName}`}
          />
          <ToolcallInfoBase.Parameters
            className="whitespace-pre-wrap pl-2"
            render={({ parametersString }) =>
              `parameters:\n${parametersString}`
            }
          />
          <SamplingSubThread parentMessageId={message.id} />
          <ToolcallInfoBase.Result className="pl-2">
            {({ content, hasResult }) => (
              <>
                <span className="whitespace-pre-wrap">result:</span>
                <div>
                  <ToolResultDisplay
                    content={content}
                    hasResult={hasResult}
                    enableMarkdown={markdown}
                  />
                </div>
              </>
            )}
          </ToolcallInfoBase.Result>
        </>
      )}
    </ToolcallInfoBase.Content>
  );
}

type ToolcallInfoTriggerProps = React.ComponentProps<
  typeof ToolcallInfoBase.Trigger
>;
const ToolcallInfoTrigger = React.forwardRef<
  HTMLButtonElement,
  ToolcallInfoTriggerProps
>(function ToolcallInfoTrigger({ children, className, ...props }, ref) {
  return (
    <ToolcallInfoBase.Trigger
      ref={ref}
      className={cn(
        "group/trigger flex items-center gap-1 cursor-pointer hover:bg-muted rounded-md p-1 select-none w-fit",
        className,
      )}
      {...props}
    >
      {children}
    </ToolcallInfoBase.Trigger>
  );
});
ToolcallInfoTrigger.displayName = "ToolcallInfoTrigger";

/**
 * Displays tool call information in a collapsible dropdown.
 * Shows tool name, parameters, and associated tool response.
 * @component ToolcallInfo
 */
const ToolcallInfo = React.forwardRef<HTMLDivElement, ToolcallInfoProps>(
  ({ className, markdown = true, ...props }, ref) => {
    return (
      <ToolcallInfoBase.Root
        ref={ref}
        className={cn(
          "flex flex-col items-start text-xs opacity-50",
          className,
        )}
        {...props}
      >
        <div className="flex flex-col w-full">
          <ToolcallInfoTrigger>
            <ToolcallStatusIcon />
            <ToolcallInfoBase.StatusText />
            <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=closed]/trigger:-rotate-90" />
          </ToolcallInfoTrigger>
          <ToolcallInfoContent markdown={markdown} />
        </div>
      </ToolcallInfoBase.Root>
    );
  },
);
ToolcallInfo.displayName = "ToolcallInfo";
/**
 * Displays a message's child messages in a collapsible dropdown.
 * Used for MCP sampling sub-threads.
 */
const SamplingSubThread = ({
  parentMessageId: _parentMessageId,
  titleText = "finished additional work",
}: {
  parentMessageId: string;
  titleText?: string;
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const samplingDetailsId = React.useId();

  // In V1, messages no longer have parentMessageId, so sub-threads are not supported.
  // Render nothing until a V1 equivalent is available.
  const childMessages: TamboThreadMessage[] = [];

  if (!childMessages.length) return null;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={samplingDetailsId}
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-1 cursor-pointer hover:bg-muted-foreground/10 rounded-md p-2 select-none w-fit",
        )}
      >
        <span>{titleText}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            !isExpanded && "-rotate-90",
          )}
        />
      </button>
      <div
        id={samplingDetailsId}
        className={cn(
          "transition-[max-height,opacity] duration-300",
          isExpanded
            ? "max-h-96 opacity-100 overflow-auto"
            : "max-h-0 opacity-0 overflow-hidden",
        )}
        aria-hidden={!isExpanded}
      >
        <div className="pl-2">
          <div className="border-l-2 border-muted-foreground p-2 flex flex-col gap-4">
            {childMessages?.map((m: TamboThreadMessage) => (
              <div key={m.id} className={`${m.role === "user" && "pl-2"}`}>
                <span
                  className={cn(
                    "whitespace-pre-wrap",
                    m.role === "assistant" &&
                      "bg-muted/50 rounded-md p-2 inline-block w-fit",
                  )}
                >
                  {getSafeContent(m.content)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
SamplingSubThread.displayName = "SamplingSubThread";

/**
 * Props for the ReasoningInfo component.
 */
export type ReasoningInfoProps = Omit<
  ReasoningInfoRootProps,
  "children" | "message"
>;

/**
 * Displays reasoning information in a collapsible dropdown.
 * Shows the reasoning strings provided by the LLM when available.
 * @component ReasoningInfo
 */
const ReasoningInfo = React.forwardRef<HTMLDivElement, ReasoningInfoProps>(
  ({ className, ...props }, ref) => {
    return (
      <ReasoningInfoBase.Root
        ref={ref}
        className={cn(
          "flex flex-col items-start text-xs opacity-50",
          className,
        )}
        {...props}
      >
        <div className="flex flex-col w-full">
          <ReasoningInfoBase.Trigger
            className={
              "group/trigger flex items-center gap-1 cursor-pointer hover:bg-muted-foreground/10 rounded-md px-3 py-1 select-none w-fit"
            }
          >
            <ReasoningInfoBase.StatusText
              className={"data-loading:animate-thinking-gradient"}
            />
            <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=closed]/trigger:-rotate-90" />
          </ReasoningInfoBase.Trigger>
          <ReasoningInfoBase.Content
            forceMount
            className={cn(
              "flex flex-col gap-1 px-3 py-3 overflow-auto transition-[max-height,opacity,padding] duration-300 w-full",
              "data-[state=open]:max-h-96 data-[state=open]:opacity-100",
              "data-[state=closed]:max-h-0 data-[state=closed]:opacity-0 data-[state=closed]:p-0",
            )}
          >
            <ReasoningInfoBase.Steps
              className="space-y-4"
              render={({ steps, showStepNumbers }) =>
                steps.map((reasoningStep, index) => (
                  <div key={index} className="flex flex-col gap-1">
                    {showStepNumbers && (
                      <span className="text-muted-foreground text-xs font-medium">
                        Step {index + 1}:
                      </span>
                    )}
                    {reasoningStep && (
                      <div className="bg-muted/50 rounded-md p-3 text-xs overflow-x-auto overflow-y-auto max-w-full">
                        <div className="whitespace-pre-wrap wrap-break-word">
                          <Streamdown
                            components={markdownComponents}
                            rehypePlugins={streamdownRehypePlugins}
                          >
                            {reasoningStep}
                          </Streamdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              }
            />
          </ReasoningInfoBase.Content>
        </div>
      </ReasoningInfoBase.Root>
    );
  },
);
ReasoningInfo.displayName = "ReasoningInfo";

/**
 * Renders an image from a tool result.
 */
function ToolResultImage({ url, index }: { url: string; index: number }) {
  return (
    <div className="rounded-md overflow-hidden shadow-sm max-w-xs">
      <img
        src={url}
        alt={`Tool result image ${index + 1}`}
        loading="lazy"
        decoding="async"
        className="max-w-full h-auto object-contain"
      />
    </div>
  );
}

interface ToolResultResourceProps {
  resource: {
    uri?: string;
    text?: string;
    blob?: string;
    name?: string;
    mimeType?: string;
  };
  index: number;
}

/**
 * Renders a resource from a tool result.
 * Handles text, blob (images), and URI resources.
 */
function ToolResultResource({ resource, index }: ToolResultResourceProps) {
  // Handle blob content (e.g., base64-encoded images)
  if (resource.blob && resource.mimeType?.startsWith("image/")) {
    const dataUrl = `data:${resource.mimeType};base64,${resource.blob}`;
    return (
      <div className="rounded-md overflow-hidden shadow-sm max-w-xs">
        <img
          src={dataUrl}
          alt={resource.name ?? `Resource image ${index + 1}`}
          loading="lazy"
          decoding="async"
          className="max-w-full h-auto object-contain"
        />
      </div>
    );
  }

  // Handle text content
  if (resource.text) {
    return (
      <div className="whitespace-pre-wrap">
        {resource.name && (
          <span className="font-medium text-muted-foreground">
            {resource.name}:{" "}
          </span>
        )}
        {resource.text}
      </div>
    );
  }

  // Handle URI reference
  if (resource.uri) {
    return (
      <div className="flex items-center gap-1">
        <span className="font-medium text-muted-foreground">
          {resource.name ?? "Resource"}:
        </span>
        <span className="font-mono text-xs truncate">{resource.uri}</span>
      </div>
    );
  }

  return null;
}

/**
 * Renders tool result content with appropriate formatting.
 * Handles text (with JSON pretty-printing), images, and MCP resources.
 */
function ToolResultContent({
  content,
  enableMarkdown = true,
}: {
  content: TamboThreadMessage["content"];
  enableMarkdown?: boolean;
}) {
  if (!content) return null;

  // Handle string content directly
  if (typeof content === "string") {
    return <ToolResultText text={content} enableMarkdown={enableMarkdown} />;
  }

  // Handle array content with mixed types
  if (Array.isArray(content)) {
    const textParts: string[] = [];
    const nonTextItems: Array<{
      type: "image" | "resource";
      url?: string;
      resource?: ToolResultResourceProps["resource"];
      index: number;
    }> = [];

    content.forEach((item, index) => {
      if (!item?.type) return;

      if (item.type === "text" && item.text) {
        textParts.push(item.text);
      } else if (item.type === "resource" && item.resource) {
        nonTextItems.push({ type: "resource", resource: item.resource, index });
      }
    });

    const combinedText = textParts.join("");

    // If we only have text, return it directly
    if (nonTextItems.length === 0) {
      return combinedText ? (
        <ToolResultText text={combinedText} enableMarkdown={enableMarkdown} />
      ) : null;
    }

    // If we have mixed content, render in a flex container
    return (
      <div className="flex flex-col gap-2">
        {combinedText && (
          <ToolResultText text={combinedText} enableMarkdown={enableMarkdown} />
        )}
        <div className="flex flex-wrap gap-2">
          {nonTextItems.map((item) => {
            switch (item.type) {
              case "image":
                return item.url ? (
                  <ToolResultImage
                    key={`image-${item.index}`}
                    url={item.url}
                    index={item.index}
                  />
                ) : null;
              case "resource":
                return item.resource ? (
                  <ToolResultResource
                    key={`resource-${item.index}`}
                    resource={item.resource}
                    index={item.index}
                  />
                ) : null;
            }
          })}
        </div>
      </div>
    );
  }

  // Fallback for unknown content types
  return getSafeContent(content);
}

/**
 * Renders text content, attempting JSON parsing for pretty-printing.
 */
function ToolResultText({
  text,
  enableMarkdown,
}: {
  text: string;
  enableMarkdown: boolean;
}) {
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    return (
      <pre
        className={cn(
          "bg-muted/50 rounded-md p-3 text-xs overflow-x-auto overflow-y-auto max-w-full max-h-64",
        )}
      >
        <code className="font-mono wrap-break-word whitespace-pre-wrap">
          {JSON.stringify(parsed, null, 2)}
        </code>
      </pre>
    );
  } catch {
    // JSON parsing failed, render as markdown or plain text
    if (!enableMarkdown) return text;
    return (
      <Streamdown
        components={markdownComponents}
        rehypePlugins={streamdownRehypePlugins}
      >
        {text}
      </Streamdown>
    );
  }
}

/**
 * Props for the MessageRenderedComponent component.
 */
export type MessageRenderedComponentAreaProps = Omit<
  MessageBaseRenderedComponentProps,
  "children"
>;

/**
 * Displays the `renderedComponent` associated with an assistant message.
 * Shows a button to view in canvas if a canvas space exists, otherwise renders inline.
 * Only renders if the message role is 'assistant' and `message.renderedComponent` exists.
 */
const MessageRenderedComponentArea = React.forwardRef<
  HTMLDivElement,
  MessageRenderedComponentAreaProps
>(({ className, ...props }, ref) => {
  return (
    <MessageBase.RenderedComponent
      ref={ref}
      className={cn(className)}
      {...props}
    >
      <div className="flex justify-start pl-4">
        <MessageBase.RenderedComponentCanvasButton className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer group">
          View component
          <ExternalLink className="w-3.5 h-3.5" />
        </MessageBase.RenderedComponentCanvasButton>
      </div>
      <MessageBase.RenderedComponentContent className="w-full pt-2 px-2" />
    </MessageBase.RenderedComponent>
  );
});
MessageRenderedComponentArea.displayName = "Message.RenderedComponentArea";

export {
  createMarkdownComponents,
  LoadingIndicator,
  markdownComponents,
  Message,
  MessageContent,
  MessageImages,
  MessageRenderedComponentArea,
  messageVariants,
  ReasoningInfo,
  ToolcallInfo,
};
