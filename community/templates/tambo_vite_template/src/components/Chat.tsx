import {
  useTamboThread,
  useTamboThreadInput,
} from "@tambo-ai/react";

export default function Chat() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } =
    useTamboThreadInput();

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Vite + React + Tambo</h2>

      <div>
        {thread?.messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 12 }}>
            <strong>{m.role}:</strong>

            {Array.isArray(m.content) &&
              m.content.map((c, i) =>
                c.type === "text" ? (
                  <p key={i}>{c.text}</p>
                ) : null
              )}

            {m.renderedComponent}
          </div>
        ))}
      </div>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask something…"
        style={{ width: "100%" }}
      />

      <button onClick={() => submit()} disabled={isPending}>
        Send
      </button>
    </div>
  );
}
