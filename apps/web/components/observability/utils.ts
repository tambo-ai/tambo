import { getSafeContent } from "@/lib/thread-hooks";
import { type RouterOutputs } from "@/trpc/react";
import { SortDirection, SortField } from "./hooks/useThreadList";
import { MessageItem, ThreadStats } from "./messages/stats-header";

type MessageType = ThreadType["messages"][0];
type ThreadType = RouterOutputs["thread"]["getThread"];

// Date Utils ------------------------------------------------------------------

export const formatTime = (date: string | Date) => {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Date separator utils ------------------------------------------------------------------

export const isSameDay = (date1: string | Date, date2: string | Date) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const formatDateSeparator = (date: string | Date) => {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(messageDate, today)) {
    return "Today";
  } else if (isSameDay(messageDate, yesterday)) {
    return "Yesterday";
  } else {
    return messageDate.toLocaleDateString([], {
      month: "long",
      day: "numeric",
      year:
        messageDate.getFullYear() !== today.getFullYear()
          ? "numeric"
          : undefined,
    });
  }
};

// Role Utils ------------------------------------------------------------------

export const getRoleColor = (role: string) => {
  switch (role) {
    case "user":
      return "blue";
    case "assistant":
      return "green";
    default:
      return "gray";
  }
};

// Thread Stats -----------------------------------------------------------------

export const calculateThreadStats = (messages: MessageType[]): ThreadStats => {
  const stats: ThreadStats = {
    messages: messages.length,
    components: 0,
    errors: 0,
    tools: 0,
  };

  messages.forEach((message: MessageType) => {
    if (message.componentDecision?.componentName) {
      stats.components++;
    }

    if (isErrorMessage(message)) {
      stats.errors++;
    }

    if (message.toolCallRequest || message.toolCallId) {
      stats.tools++;
    }
  });

  return stats;
};

export const isErrorMessage = (message: MessageType): boolean => {
  // Check if message has an explicit error field
  if ("error" in message && message.error) {
    return true;
  }

  // Check content for error keywords using getSafeContent
  const safeContent = getSafeContent(message.content as any);
  if (
    typeof safeContent === "string" &&
    safeContent.toLowerCase().includes("error")
  ) {
    return true;
  }

  // Check for object content with error property
  if (
    typeof message.content === "object" &&
    message.content &&
    "error" in message.content &&
    message.content.error
  ) {
    return true;
  }

  return false;
};

// Message Items ----------------------------------------------------------------

export const createMessageItems = (
  messages: MessageType[],
): {
  messageItems: MessageItem[];
  componentItems: MessageItem[];
  errorItems: MessageItem[];
  toolItems: MessageItem[];
} => {
  const messageItems: MessageItem[] = [];
  const componentItems: MessageItem[] = [];
  const errorItems: MessageItem[] = [];
  const toolItems: MessageItem[] = [];

  messages.forEach((message: MessageType) => {
    // Add to messages list
    const messageTitle = `${message.role} message`;
    const safeContent = getSafeContent(message.content as any);
    const contentPreview =
      typeof safeContent === "string"
        ? safeContent.slice(0, 50)
        : "Content with elements";

    messageItems.push({
      id: `msg-${message.id}`,
      type: "message",
      title: messageTitle,
      subtitle: contentPreview || "Empty message",
      messageId: message.id,
    });

    // Components
    if (message.componentDecision?.componentName) {
      componentItems.push({
        id: `comp-${message.id}`,
        type: "component",
        title: message.componentDecision.componentName,
        subtitle: `Used in ${message.role} message`,
        messageId: message.id,
      });
    }

    // Errors
    if (isErrorMessage(message)) {
      errorItems.push({
        id: `err-${message.id}`,
        type: "error",
        title: "Error detected",
        subtitle: `In ${message.role} message`,
        messageId: message.id,
      });
    }

    // Tools
    if (message.toolCallRequest || message.toolCallId) {
      toolItems.push({
        id: `tool-${message.id}`,
        type: "tool",
        title:
          message.toolCallRequest?.toolName ||
          `Tool call ${message.toolCallId?.slice(-8) || "unknown"}`,
        subtitle: `Called in ${message.role} message`,
        messageId: message.id,
      });
    }
  });

  return { messageItems, componentItems, errorItems, toolItems };
};

// Thread Table Utils ------------------------------------------------------------

export const THREADS_PER_PAGE = 5;

export const SORT_FIELDS: readonly SortField[] = [
  "created",
  "updated",
  "threadId",
  "threadName",
  "contextKey",
  "messages",
  "errors",
] as const;

export const formatDateThreadTable = (dateString: string) => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return {
      date: "Invalid Date",
      time: "Invalid Time",
    };
  }

  return {
    date: date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
};

export const getSortLabel = (field: SortField): string => {
  switch (field) {
    case "created":
      return "Created";
    case "updated":
      return "Updated";
    case "threadId":
      return "Thread ID";
    case "threadName":
      return "Thread Name";
    case "contextKey":
      return "Context Key";
    case "messages":
      return "Messages";
    case "errors":
      return "Errors";
    default:
      return "";
  }
};

export const getSortDirectionLabel = (
  field: SortField,
  direction: SortDirection,
): string => {
  switch (field) {
    case "created":
    case "updated":
      return direction === "asc" ? "Oldest first" : "Newest first";
    case "messages":
    case "errors":
      return direction === "asc" ? "Lowest first" : "Highest first";
    default:
      return direction === "asc" ? "A → Z" : "Z → A";
  }
};

// Tool Response Formatting Utils -----------------------------------------------

const deepParseJson = (value: any): any => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      // If it's an object or array, recursively parse its contents
      if (typeof parsed === "object" && parsed !== null) {
        return deepParseJson(parsed);
      }
      return parsed;
    } catch {
      return value;
    }
  } else if (Array.isArray(value)) {
    return value.map(deepParseJson);
  } else if (typeof value === "object" && value !== null) {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = deepParseJson(val);
    }
    return result;
  }
  return value;
};

export const formatToolResponseContent = (content: any): string => {
  try {
    // Handle null or undefined content
    if (content == null) {
      return "null";
    }

    // If content is an array (like message.content format)
    if (Array.isArray(content)) {
      // Extract text from content parts (similar to validateToolResponse in backend)
      const textParts = content
        .filter((part) => part && part.type === "text" && part.text)
        .map((part) => part.text);

      if (textParts.length === 0) {
        return "No text content found";
      }

      const combinedText = textParts.join("");
      // Recursively process the combined text
      return formatToolResponseContent(combinedText);
    }

    // If content is a string
    if (typeof content === "string") {
      // Use the same logic as backend's tryParseJson
      if (!content.startsWith("{") && !content.startsWith("[")) {
        return content;
      }

      try {
        const parsed = JSON.parse(content);
        const deepParsed = deepParseJson(parsed);
        return JSON.stringify(deepParsed, null, 2);
      } catch {
        // handle escaped characters
        if (content.includes("\\n") || content.includes('\\"')) {
          try {
            const unescaped = content
              .replaceAll("\\n", "\n")
              .replaceAll('\\"', '"')
              .replaceAll("\\\\", "\\");

            const parsed = JSON.parse(unescaped);
            const deepParsed = deepParseJson(parsed);
            return JSON.stringify(deepParsed, null, 2);
          } catch {
            // Return unescaped version for better readability
            return content
              .replaceAll("\\n", "\n")
              .replaceAll('\\"', '"')
              .replaceAll("\\\\", "\\");
          }
        }

        // Return original content if parsing fails
        return content;
      }
    }

    // If it's already an object, use deepParseJson and stringify
    const deepParsed = deepParseJson(content);
    return JSON.stringify(deepParsed, null, 2);
  } catch (error) {
    console.error("Error formatting response content:", error);
    return String(content);
  }
};

export const formatToolParameters = (
  parameters: Array<{ parameterName: string; parameterValue: string }>,
): string => {
  if (!parameters || parameters.length === 0) return "{}";

  const paramObj: Record<string, any> = {};
  parameters.forEach((param) => {
    try {
      // Try to parse the parameter value if it's a string
      if (typeof param.parameterValue === "string") {
        try {
          const parsed = JSON.parse(param.parameterValue);
          // Use deepParseJson to handle nested JSON strings
          paramObj[param.parameterName] = deepParseJson(parsed);
        } catch {
          paramObj[param.parameterName] = param.parameterValue;
        }
      } else {
        paramObj[param.parameterName] = param.parameterValue;
      }
    } catch {
      paramObj[param.parameterName] = param.parameterValue;
    }
  });

  return JSON.stringify(paramObj, null, 2);
};

// Message Content Utils ------------------------------------------------------------------

/**
 * Represents a component context item to display in messages
 */
export interface MessageComponentContext {
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
}

/**
 * Minimal message shape needed to extract contexts
 */
export interface MessageWithContext {
  role?: string;
  additionalContext?: Record<string, unknown> | null;
}

/**
 * Extracts selected interactables from the message's additionalContext.
 * Looks for interactables in additionalContext.interactables.components where isSelectedForInteraction is true.
 * @param message - The thread message or minimal message data
 * @returns Array of component contexts (empty if none)
 */
export function extractSelectedInteractablesFromAdditionalContext(
  message: MessageType | MessageWithContext | undefined | null,
): MessageComponentContext[] {
  if (!message) return [];

  // Only look for contexts on user messages
  if (message.role !== "user") return [];

  // Context helpers store data in additionalContext
  const additionalContext = message.additionalContext;

  if (!additionalContext) return [];

  // Interactables are stored under the key "interactables" with a components array
  const interactablesContext = additionalContext.interactables;

  if (
    !interactablesContext ||
    typeof interactablesContext !== "object" ||
    !("components" in interactablesContext)
  ) {
    return [];
  }

  const components = interactablesContext.components;
  if (!Array.isArray(components)) {
    return [];
  }

  const contexts: MessageComponentContext[] = [];

  for (const component of components) {
    if (
      component &&
      typeof component === "object" &&
      component.isSelectedForInteraction === true &&
      component.componentName &&
      typeof component.componentName === "string"
    ) {
      contexts.push({
        id: component.id || "",
        name: component.componentName,
        metadata: component,
      });
    }
  }

  return contexts;
}
