import { useTamboThreadInput, useTamboThread } from "@tambo-ai/react";
import type React from "react";

export const Chat = () => {
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { thread } = useTamboThread();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isPending) return;
    await submit();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-left">
          <h3>AI Assistant</h3>
          <span className="chat-subtitle">
            Manage bookmarks via natural language
          </span>
        </div>
      </div>
      <div className="chat-messages">
        {thread.messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="chat-empty-title">Start a conversation</p>
            <p className="chat-empty-hint">
              Try: "Create a bookmark for https://hono.dev" or "Show me all
              bookmarks"
            </p>
          </div>
        ) : (
          <>
            {thread.messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.role === "user" ? "user" : "assistant"}`}
              >
                <div className="message-avatar">
                  {message.role === "user" ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <path d="M9 9h6M9 15h6" />
                    </svg>
                  )}
                </div>
                <div className="message-wrapper">
                  <div className="message-content">
                    {Array.isArray(message.content) ? (
                      message.content.map((part, i) =>
                        part.type === "text" ? (
                          <p key={i}>{part.text}</p>
                        ) : null,
                      )
                    ) : (
                      <p>{String(message.content)}</p>
                    )}
                  </div>
                  {message.renderedComponent && (
                    <div className="message-component">
                      {message.renderedComponent}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="chat-message assistant">
                <div className="message-avatar">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <path d="M9 9h6M9 15h6" />
                  </svg>
                </div>
                <div className="message-wrapper">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask me to create, update, or manage bookmarks..."
          disabled={isPending}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={isPending || !value.trim()}
          className="chat-submit"
        >
          {isPending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};
