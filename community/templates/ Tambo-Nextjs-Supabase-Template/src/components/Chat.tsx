import { useTamboThreadInput, useTamboThread } from "@tambo-ai/react";
import { useEffect, useRef, type FormEvent } from "react";
import {
  BiBarChart,
  BiBot,
  BiUser,
  BiSend,
  BiLoaderCircle,
} from "react-icons/bi";
import "./Chat.css";

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
    <div className="chat-container">
      <div className="chat-messages" ref={scrollRef}>
        {thread.messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <BiBarChart size={48} color="white"/>
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
                    <BiUser size={20}  color="black"/>
                  ) : (
                    <BiBot size={20} color="white"/>
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
                  <BiBot size={20} color="white"/>
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
          {isPending ? <BiLoaderCircle size={20} color="white"/> : <BiSend size={20} color="white" />}
        </button>
      </form>
    </div>
  );
};
