import React from "react";
import {
  TamboProvider,
  useTamboThread,
  useTamboThreadInput,
} from "@tambo-ai/react";
import { z } from "zod";
import { TaskList } from "./components/tambo/TaskList";

const components = [
  {
    component: TaskList,
    name: "TaskList",
    description:
      "Use this tool WHENEVER the user mentions tasks, todos, or lists.",
    propsSchema: z.object({
      filter: z.string().optional(),
      title: z.string().optional(),
    }),
  },
];

function ChatInterface() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  const formatMessageContent = (content: any) => {
    try {
      let data = content;
      if (
        typeof content === "string" &&
        (content.startsWith("[") || content.startsWith("{"))
      ) {
        try {
          data = JSON.parse(content);
        } catch (e) {
          return content;
        }
      }
      if (Array.isArray(data)) {
        const textPart = data.find((item: any) => item.text);
        return textPart ? textPart.text : "";
      }
      if (typeof data === "object" && data !== null) return data.text || "";
      return String(data);
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-area">
        {(!thread?.messages || thread.messages.length === 0) && (
          <div className="empty-state">
            <h3 style={{ marginBottom: "20px", color: "#666" }}>
              How can I help you manage tasks?
            </h3>
            {/* ✨ FIXED: Added Suggestion Buttons back */}
            <div className="suggestion-chips">
              <button
                className="chip"
                onClick={() => setValue("Show my pending tasks")}
              >
                Show pending tasks
              </button>
              <button
                className="chip"
                onClick={() => setValue("Add a new task")}
              >
                Add a new task
              </button>
              <button
                className="chip"
                onClick={() => setValue("Show all tasks")}
              >
                Show all tasks
              </button>
            </div>
          </div>
        )}

        {thread?.messages?.map((m: any, i: number) => {
          const displayText = formatMessageContent(m.content);

          return (
            <div key={i} className={`message-wrapper ${m.role}`}>
              {displayText && (
                <div className="message-bubble">{displayText}</div>
              )}

              {m.component && (
                <div className="component-wrapper">
                  {m.component.renderedComponent || (
                    <TaskList title="My Tasks" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="input-form"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a command (e.g., Show my tasks)..."
          disabled={isPending}
          className="message-input"
        />
        <button type="submit" disabled={isPending} className="send-button">
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
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}

function App() {
  const apiKey = import.meta.env.VITE_TAMBO_API_KEY;

  // ✨ FIXED: New Thread Logic
  const handleNewThread = () => {
    if (confirm("Start a new conversation? This will clear current chat.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <TamboProvider apiKey={apiKey} components={components}>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Tambo Conversations</h2>
          </div>

          {/* ✨ FIXED: Added onClick handler */}
          <button className="new-thread-btn" onClick={handleNewThread}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New thread
          </button>

          <div className="recents-section">
            <h3>RECENTS</h3>
            <div className="recent-item active">Task List Overview</div>
          </div>
        </aside>

        <main className="main-content">
          <ChatInterface />
        </main>
      </div>
    </TamboProvider>
  );
}

export default App;
