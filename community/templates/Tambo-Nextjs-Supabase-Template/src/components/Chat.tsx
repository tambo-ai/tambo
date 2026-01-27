import { useTamboThreadInput, useTamboThread } from "@tambo-ai/react";
import { useEffect, useRef, type FormEvent } from "react";

export const Chat = () => {
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { thread } = useTamboThread();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isPending) return;
    await submit();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread.messages, isPending]);

  return (
    <div
      className="chat-container"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div
        className="chat-messages"
        ref={scrollRef}
        style={{ flex: 1, overflowY: "auto" }}
      >
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
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
            </div>
            <p className="chat-empty-title">Start a conversation</p>
            <p className="chat-empty-hint">
              Try: "Add a record for Sales: 500" or "Show me the latest
              analytics"
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2a10 10 0 0 0-4.3 19.4" />
                      <path d="M12 2a10 10 0 0 1 4.3 19.4" />
                      <path d="M2 12h2.5" />
                      <path d="M19.5 12H22" />
                      <path d="M12 2v2.5" />
                      <path d="M12 19.5V22" />
                      <path d="M4.7 4.7l1.8 1.8" />
                      <path d="M17.5 17.5l1.8 1.8" />
                      <path d="M4.7 19.3l1.8-1.8" />
                      <path d="M17.5 6.5l1.8-1.8" />
                      <path d="M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0Z" />
                      <path d="M12 15a3 3 0 0 0 3-3" />
                      <path d="M12 9a3 3 0 0 1-3 3" />
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
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a10 10 0 0 0-4.3 19.4" />
                    <path d="M12 2a10 10 0 0 1 4.3 19.4" />
                    <path d="M2 12h2.5" />
                    <path d="M19.5 12H22" />
                    <path d="M12 2v2.5" />
                    <path d="M12 19.5V22" />
                    <path d="M4.7 4.7l1.8 1.8" />
                    <path d="M17.5 17.5l1.8 1.8" />
                    <path d="M4.7 19.3l1.8-1.8" />
                    <path d="M17.5 6.5l1.8-1.8" />
                    <path d="M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0Z" />
                    <path d="M12 15a3 3 0 0 0 3-3" />
                    <path d="M12 9a3 3 0 0 1-3 3" />
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
          placeholder="Ask me to add records or analyze data..."
          disabled={isPending}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={isPending || !value.trim()}
          className="chat-submit"
          aria-label="Send message"
        >
          {isPending && (
            <svg
              className="animate-spin"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};
