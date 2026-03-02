"use client";

import { Message } from "@tambo-ai/react-ui-base/message";
import { MessageInput } from "@tambo-ai/react-ui-base/message-input";
import type React from "react";
import { mockMessages } from "./examples-data";

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: 420,
  width: "100%",
  maxWidth: 480,
  margin: "0 auto",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  overflow: "hidden",
  backgroundColor: "#ffffff",
};

const messagesAreaStyles: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "16px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const inputContainerStyles: React.CSSProperties = {
  borderTop: "1px solid #e5e7eb",
  padding: "10px 12px",
  backgroundColor: "#f9fafb",
};

const textareaStyles: React.CSSProperties = {
  flex: 1,
  resize: "none",
  border: "1px solid #d1d5db",
  borderRadius: 20,
  padding: "8px 14px",
  fontSize: 14,
  lineHeight: 1.5,
  outline: "none",
  fontFamily: "inherit",
  backgroundColor: "#ffffff",
  color: "#1f2937",
  minHeight: 36,
  maxHeight: 100,
};

const submitButtonStyles: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 20,
  border: "none",
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  flexShrink: 0,
};

const avatarStyle = (role: string): React.CSSProperties => ({
  width: 28,
  height: 28,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 700,
  flexShrink: 0,
  backgroundColor: role === "user" ? "#3b82f6" : "#e5e7eb",
  color: role === "user" ? "#ffffff" : "#4b5563",
});

const bubbleStyle = (role: string): React.CSSProperties => ({
  maxWidth: "72%",
  padding: "9px 14px",
  borderRadius: 18,
  borderTopLeftRadius: role === "assistant" ? 4 : 18,
  borderTopRightRadius: role === "user" ? 4 : 18,
  backgroundColor: role === "user" ? "#3b82f6" : "#f3f4f6",
  color: role === "user" ? "#ffffff" : "#1f2937",
});

export function MinimalChat() {
  return (
    <div style={containerStyles}>
      <div style={messagesAreaStyles}>
        {mockMessages.map((message) => (
          <Message.Root
            key={message.id}
            message={message}
            role={message.role === "system" ? "assistant" : message.role}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              ...(message.role === "user"
                ? { flexDirection: "row-reverse" as const }
                : {}),
            }}
          >
            <div style={avatarStyle(message.role)}>
              {message.role === "user" ? "U" : "A"}
            </div>
            <div style={bubbleStyle(message.role)}>
              <Message.Content style={{ fontSize: 14, lineHeight: 1.5 }} />
            </div>
          </Message.Root>
        ))}
      </div>
      <MessageInput.Root style={inputContainerStyles}>
        <MessageInput.Content
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <MessageInput.Textarea
            placeholder="Type a message..."
            style={textareaStyles}
          />
          <MessageInput.SubmitButton style={submitButtonStyles}>
            Send
          </MessageInput.SubmitButton>
        </MessageInput.Content>
      </MessageInput.Root>
    </div>
  );
}
