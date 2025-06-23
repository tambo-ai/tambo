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
  "date",
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
    case "date":
      return "Date";
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
    case "date":
      return direction === "asc" ? "Oldest first" : "Newest first";
    case "messages":
    case "errors":
      return direction === "asc" ? "Lowest first" : "Highest first";
    default:
      return direction === "asc" ? "A → Z" : "Z → A";
  }
};
