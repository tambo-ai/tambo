"use client";

import { Message } from "@tambo-ai/react-ui-base/message";
import { MessageInput } from "@tambo-ai/react-ui-base/message-input";
import type React from "react";
import { mockMessages } from "./examples-data";

const containerStyles: React.CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(53, 255, 157, 0.4), rgba(75, 207, 255, 0.4))",
  padding: 20,
  borderRadius: 16,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  minHeight: 320,
};

const glassCardStyles: React.CSSProperties = {
  background: "rgba(255,255,255,0.3)",
  color: "#002173",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.4)",
  borderRadius: 14,
  padding: "10px 14px",
};

const messageCardStyles: React.CSSProperties = glassCardStyles;

const inputCardStyles: React.CSSProperties = {
  ...glassCardStyles,
  marginTop: "auto",
};

const textareaStyles: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  fontSize: 14,
  lineHeight: 1.5,
  resize: "none",
  width: "100%",
  fontFamily: "inherit",
};

const submitStyles: React.CSSProperties = {
  background: "rgba(59,130,246,0.8)",
  color: "#ffffff",
  border: "none",
  borderRadius: 10,
  padding: "8px 16px",
  fontSize: 14,
  cursor: "pointer",
  flexShrink: 0,
};

export function GlassChat() {
  return (
    <div style={containerStyles}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mockMessages.map((message) => (
          <Message.Root
            key={message.id}
            message={message}
            // Treat 'system' messages as 'assistant' for styling
            role={message.role === "system" ? "assistant" : message.role}
            style={messageCardStyles}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>
                {message.role === "user" ? "😎" : "🤖"}
              </span>
              <Message.Content
                style={{
                  paddingTop: 4,
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              />
            </div>
          </Message.Root>
        ))}
      </div>
      <MessageInput.Root style={inputCardStyles}>
        <MessageInput.Content
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <MessageInput.Textarea
            placeholder="Type a message..."
            style={textareaStyles}
          />
          <MessageInput.SubmitButton style={submitStyles}>
            Send
          </MessageInput.SubmitButton>
        </MessageInput.Content>
      </MessageInput.Root>
    </div>
  );
}
