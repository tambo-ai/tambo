import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { getMessageText } from "../utils/tambo-thread";

export function TamboChat() {
  const { thread, generationStatusMessage, isIdle } = useTamboThread();
  const { value, setValue, submit, isPending, error } = useTamboThreadInput();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }

    try {
      await submit({ streamResponse: true });
    } catch {
      // Error is surfaced via `error` state below.
    }
  };

  return (
    <section className="chat-container">
      <header className="chat-header">
        <h2>Tambo chat</h2>
        {!isIdle && <span className="chat-status">Thinking…</span>}
      </header>

      <div className="chat-messages">
        {thread.messages.length === 0 ? (
          <p className="chat-empty">
            Start a conversation with Tambo by asking a question.
          </p>
        ) : (
          thread.messages.map((message) => {
            const text = getMessageText(message);
            const role =
              message.role === "user" || message.role === "assistant"
                ? message.role
                : "assistant";

            if (!text && !message.renderedComponent) {
              return null;
            }

            return (
              <div
                key={message.id}
                className={`chat-message chat-message-${role}`}
              >
                <div className="chat-message-role">
                  {role === "user" ? "You" : "Tambo"}
                </div>
                {text ? <div className="chat-message-text">{text}</div> : null}
                {message.renderedComponent}
              </div>
            );
          })
        )}
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask Tambo anything…"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={isPending}
        />
        <button type="submit" disabled={isPending || !value.trim()}>
          {isPending ? "Sending…" : "Send"}
        </button>
      </form>

      {generationStatusMessage ? (
        <p className="chat-status-text">{generationStatusMessage}</p>
      ) : null}
      {error instanceof Error ? (
        <p className="chat-error">Error: {error.message}</p>
      ) : null}
    </section>
  );
}
