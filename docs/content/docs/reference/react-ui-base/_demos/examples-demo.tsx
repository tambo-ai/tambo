"use client";

import { useDemoControls } from "@/components/demos/demo-controls";
import { DemoPreview } from "@/components/demos/demo-preview";
import type React from "react";
import { GlassChat } from "./examples-glass";
import { MinimalChat } from "./examples-minimal";
import { TerminalChat } from "./examples-terminal";

type Theme = "minimal" | "terminal" | "glass";

const THEME_COMPONENTS: Record<Theme, React.FC> = {
  minimal: MinimalChat,
  terminal: TerminalChat,
  glass: GlassChat,
};

export const examplesDemoCode = [
  {
    name: "chat-minimal.tsx",
    code: `
import { Message } from "@tambo-ai/react-ui-base/message";
import { MessageInput } from "@tambo-ai/react-ui-base/message-input";
import type { TamboThreadMessage } from "@tambo-ai/react";

const messages: TamboThreadMessage[] = [
  { id: "1", role: "user", content: [{ type: "text", text: "What's the weather in Tokyo?" }] },
  { id: "2", role: "assistant", content: [{ type: "text", text: "It's 18°C and clear!" }] },
];

// Modern minimal: rounded bubbles, avatars, role-based colors
export function MinimalChat() {
  return (
    <div style={{ borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg) => (
          <Message.Root key={msg.id} message={msg} role={msg.role}
            style={{ display: "flex", gap: 8, ...(msg.role === "user" ? { flexDirection: "row-reverse" } : {}) }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
              backgroundColor: msg.role === "user" ? "#3b82f6" : "#e5e7eb",
              color: msg.role === "user" ? "#fff" : "#4b5563",
            }}>{msg.role === "user" ? "U" : "A"}</div>
            <div style={{
              padding: "9px 14px", borderRadius: 18,
              backgroundColor: msg.role === "user" ? "#3b82f6" : "#f3f4f6",
              color: msg.role === "user" ? "#fff" : "#1f2937",
            }}>
              <Message.Content style={{ fontSize: 14, lineHeight: 1.5 }} />
            </div>
          </Message.Root>
        ))}
      </div>
      <MessageInput.Root style={{ borderTop: "1px solid #e5e7eb", padding: "10px 12px" }}>
        <MessageInput.Content style={{ display: "flex", gap: 8 }}>
          <MessageInput.Textarea placeholder="Type a message..."
            style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 20, padding: "8px 14px", fontSize: 14, outline: "none" }} />
          <MessageInput.SubmitButton style={{ padding: "8px 16px", borderRadius: 20, border: "none", backgroundColor: "#3b82f6", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Send
          </MessageInput.SubmitButton>
        </MessageInput.Content>
      </MessageInput.Root>
    </div>
  );
}`.trimStart(),
  },
  {
    name: "chat-terminal.tsx",
    code: `
import { Message } from "@tambo-ai/react-ui-base/message";
import { MessageInput } from "@tambo-ai/react-ui-base/message-input";
import type { TamboThreadMessage } from "@tambo-ai/react";
import type React from "react";

const messages: TamboThreadMessage[] = [
  { id: "1", role: "user", content: [{ type: "text", text: "What's the weather in Tokyo?" }] },
  { id: "2", role: "assistant", content: [{ type: "text", text: "It's 18°C and clear!" }] },
];

const FONT = '"Courier New", Courier, monospace';

const containerStyles: React.CSSProperties & { [key: \`--\${string}\`]: string } = {
  "--terminal-text": "rgb(132, 222, 255)",
  "--terminal-text-alt": "rgb(59, 255, 163)",
  "--terminal-border": "rgb(59, 255, 163)",
  background: "radial-gradient(rgb(4, 26, 15), rgb(4, 26, 15), #000000)",
  color: "var(--terminal-text)",
  fontFamily: FONT, fontSize: 13, lineHeight: 1.6, fontWeight: 500,
  padding: 16, display: "flex", flexDirection: "column", gap: 8, minHeight: 320,
};

// Retro terminal: green on black, monospace, CSS custom properties
export function TerminalChat() {
  return (
    <div style={containerStyles}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {messages.map((msg) => (
          <Message.Root key={msg.id} message={msg} role={msg.role}
            style={{ display: "flex", gap: 8,
              color: msg.role === "user" ? "var(--terminal-text)" : "var(--terminal-text-alt)",
            }}>
            <span>{msg.role === "user" ? ">" : "$"}</span>
            <Message.Content style={{ fontSize: 13, lineHeight: 1.6 }} />
          </Message.Root>
        ))}
      </div>
      <div style={{
        borderTop: "1px solid var(--terminal-border)", paddingTop: 8,
        display: "flex", alignItems: "flex-start", gap: 8, marginTop: "auto",
      }}>
        <span style={{ color: "var(--terminal-text)", flexShrink: 0 }}>{">"}</span>
        <MessageInput.Root style={{ flex: 1 }}>
          <MessageInput.Content style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MessageInput.Textarea placeholder="_"
              style={{ background: "transparent", border: "none", color: "var(--terminal-text)",
                fontFamily: FONT, fontSize: 13, lineHeight: 1.6, outline: "none", resize: "none",
                width: "100%", padding: 0 }} />
            <MessageInput.SubmitButton style={{ background: "transparent",
              border: "1px solid var(--terminal-border)", color: "var(--terminal-text)",
              cursor: "pointer", fontFamily: FONT, fontSize: 12, letterSpacing: 1,
              padding: "2px 8px" }}>
              RUN
            </MessageInput.SubmitButton>
          </MessageInput.Content>
        </MessageInput.Root>
      </div>
    </div>
  );
}`.trimStart(),
  },
  {
    name: "chat-glass.tsx",
    code: `
import { Message } from "@tambo-ai/react-ui-base/message";
import { MessageInput } from "@tambo-ai/react-ui-base/message-input";
import type { TamboThreadMessage } from "@tambo-ai/react";
import type React from "react";

const messages: TamboThreadMessage[] = [
  { id: "1", role: "user", content: [{ type: "text", text: "What's the weather in Tokyo?" }] },
  { id: "2", role: "assistant", content: [{ type: "text", text: "It's 18°C and clear!" }] },
];

const containerStyles: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(53, 255, 157, 0.4), rgba(75, 207, 255, 0.4))",
  padding: 20, borderRadius: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: 320,
};

const glassCard = (role: string): React.CSSProperties => ({
  background: "rgba(255,255,255,0.3)", color: "#002173",
  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.4)", borderRadius: 14, padding: "10px 14px",
});

// Glassmorphism: frosted glass cards, green/cyan gradient, backdrop blur
export function GlassChat() {
  return (
    <div style={containerStyles}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg) => (
          <Message.Root key={msg.id} message={msg} role={msg.role}
            style={glassCard(msg.role)}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>
                {msg.role === "user" ? "\\u{1F60E}" : "\\u{1F916}"}
              </span>
              <Message.Content style={{ paddingTop: 4, fontSize: 14, lineHeight: 1.5 }} />
            </div>
          </Message.Root>
        ))}
      </div>
      <MessageInput.Root style={{
        ...glassCard("input"), marginTop: "auto",
      }}>
        <MessageInput.Content style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MessageInput.Textarea placeholder="Type a message..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 14, lineHeight: 1.5, resize: "none", width: "100%", fontFamily: "inherit" }} />
          <MessageInput.SubmitButton style={{ background: "rgba(59,130,246,0.8)", color: "#ffffff",
            border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 14, cursor: "pointer",
            flexShrink: 0 }}>
            Send
          </MessageInput.SubmitButton>
        </MessageInput.Content>
      </MessageInput.Root>
    </div>
  );
}`.trimStart(),
  },
];

export function ExamplesDemoPreview() {
  return (
    <DemoPreview code={examplesDemoCode}>
      <ExamplesDemo />
    </DemoPreview>
  );
}

function ExamplesDemo() {
  const { theme } = useDemoControls({
    theme: {
      options: ["minimal", "terminal", "glass"] as const,
      default: "minimal" as const,
      label: "Theme",
    },
  });

  const ThemeComponent = THEME_COMPONENTS[theme];
  return <ThemeComponent />;
}
