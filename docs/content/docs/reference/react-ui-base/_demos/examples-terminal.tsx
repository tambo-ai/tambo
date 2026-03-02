"use client";

import { Message } from "@tambo-ai/react-ui-base/message";
import { MessageInput } from "@tambo-ai/react-ui-base/message-input";
import type React from "react";
import { mockMessages } from "./examples-data";

const FONT = '"Courier New", Courier, monospace';

const containerStyles: React.CSSProperties & { [key: `--${string}`]: string } =
  {
    "--terminal-text": "rgb(132, 222, 255)",
    "--terminal-text-alt": "rgb(59, 255, 163)",
    "--terminal-border": "rgb(59, 255, 163)",
    background: "radial-gradient(rgb(4, 26, 15), rgb(4, 26, 15), #000000)",
    color: "var(--terminal-text)",
    fontFamily: FONT,
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: 500,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 320,
  };

const textareaStyles: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--terminal-text)",
  fontFamily: FONT,
  fontSize: 13,
  lineHeight: 1.6,
  outline: "none",
  resize: "none",
  width: "100%",
  padding: 0,
};

const submitStyles: React.CSSProperties = {
  background: "transparent",
  border: `1px solid var(--terminal-border)`,
  color: "var(--terminal-text)",
  cursor: "pointer",
  fontFamily: FONT,
  fontSize: 12,
  letterSpacing: 1,
  padding: "2px 8px",
};

export function TerminalChat() {
  return (
    <div style={containerStyles}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {mockMessages.map((message) => (
          <Message.Root
            key={message.id}
            message={message}
            role={message.role === "system" ? "assistant" : message.role}
            style={{
              display: "flex",
              gap: 8,
              color:
                message.role === "user"
                  ? "var(--terminal-text)"
                  : "var(--terminal-text-alt)",
            }}
          >
            <span>{message.role === "user" ? ">" : "$"}</span>
            <Message.Content style={{ fontSize: 13, lineHeight: 1.6 }} />
          </Message.Root>
        ))}
      </div>
      <div
        style={{
          borderTop: `1px solid var(--terminal-border)`,
          paddingTop: 8,
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          marginTop: "auto",
        }}
      >
        <span style={{ color: "var(--terminal-text)", flexShrink: 0 }}>
          {">"}
        </span>
        <MessageInput.Root style={{ flex: 1 }}>
          <MessageInput.Content
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <MessageInput.Textarea placeholder="_" style={textareaStyles} />
            <MessageInput.SubmitButton style={submitStyles}>
              RUN
            </MessageInput.SubmitButton>
          </MessageInput.Content>
        </MessageInput.Root>
      </div>
    </div>
  );
}
