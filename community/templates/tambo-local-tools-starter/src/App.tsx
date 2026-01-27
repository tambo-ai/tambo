import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";

export default function App() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  return (
    <div style={{ width: "100%", maxWidth: 800, padding: "80px 24px" }}>
      <header style={{ textAlign: "center", marginBottom: 64 }}>
        <h1>Hi 👋</h1>
        <p className="subtitle">Ask me to recommend or compare products.</p>
      </header>

      <main style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="input-container">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g., Recommend a coding laptop..."
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <button onClick={() => submit()} disabled={isPending}>
            Ask
          </button>
        </div>

        <div className="messages-container">
          {thread.messages.map((m: any) => {
            // Skip raw tool/system messages, but look for tool results to show "no results" box
            if (m.role === "tool") {
              try {
                const result = m.content?.[0]?.text ? JSON.parse(m.content[0].text) : null;
                if (result?.results?.length === 0 && result?.message) {
                  return (
                    <div key={m.id} className="empty-state">
                      {result.message}
                    </div>
                  );
                }
              } catch (e) {
                // Silently skip if not JSON
              }
              return null; // Don't show raw JSON
            }

            if (m.role === "system") return null;

            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* User query or Assistant text */}
                {m.content?.map((part: any, i: number) =>
                  part.type === "text" && part.text && (
                    <p
                      key={i}
                      style={{
                        margin: 0,
                        color: m.role === "user" ? "#111827" : "#374151",
                        fontWeight: m.role === "user" ? 500 : 400,
                        fontSize: "0.9375rem",
                        lineHeight: 1.6
                      }}
                    >
                      {part.text}
                    </p>
                  )
                )}

                {/* Rendered tool components */}
                {m.renderedComponent}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
