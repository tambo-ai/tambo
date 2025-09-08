import {
  TamboProvider,
  TamboThreadMessage,
  useTambo,
} from "@tambo-ai/react-sdk";
import React from "react";

// Example initial messages for different use cases
const CUSTOMER_SUPPORT_MESSAGES: TamboThreadMessage[] = [
  {
    id: "system-1",
    role: "system",
    content: [
      {
        type: "text",
        text: "You are a customer support agent for TechCorp. Be helpful, professional, and always ask for the customer's order number if they have an issue.",
      },
    ],
    createdAt: new Date().toISOString(),
    componentState: {},
  },
  {
    id: "welcome-1",
    role: "assistant",
    content: [
      {
        type: "text",
        text: "Hi! I'm here to help with any questions about your TechCorp products. What can I assist you with today?",
      },
    ],
    createdAt: new Date().toISOString(),
    componentState: {},
  },
];

const EDUCATIONAL_MESSAGES: TamboThreadMessage[] = [
  {
    id: "system-2",
    role: "system",
    content: [
      {
        type: "text",
        text: "You are an educational assistant. Always encourage learning, ask clarifying questions, and provide step-by-step explanations.",
      },
    ],
    createdAt: new Date().toISOString(),
    componentState: {},
  },
  {
    id: "welcome-2",
    role: "assistant",
    content: [
      {
        type: "text",
        text: "Welcome to your learning session! What topic would you like to explore today?",
      },
    ],
    createdAt: new Date().toISOString(),
    componentState: {},
  },
];

const CODING_ASSISTANT_MESSAGES: TamboThreadMessage[] = [
  {
    id: "system-3",
    role: "system",
    content: [
      {
        type: "text",
        text: "You are a coding assistant. Help users write better code, explain programming concepts, and debug issues. Always provide code examples when relevant.",
      },
    ],
    createdAt: new Date().toISOString(),
    componentState: {},
  },
  {
    id: "welcome-3",
    role: "assistant",
    content: [
      {
        type: "text",
        text: "👋 Hi! I'm your coding assistant. I can help you with programming questions, code reviews, debugging, and learning new concepts. What are you working on?",
      },
    ],
    createdAt: new Date().toISOString(),
    componentState: {},
  },
];

// Chat component that uses Tambo
function ChatComponent() {
  const { sendThreadMessage, thread, isIdle } = useTambo();
  const [input, setInput] = React.useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      await sendThreadMessage(input);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {thread.messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <strong>{message.role}:</strong>
            {message.content.map((content, _index) => (
              <div key={_index}>
                {content.type === "text"
                  ? content.text
                  : JSON.stringify(content)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              void handleSend();
            }
          }}
          placeholder="Type your message..."
          disabled={!isIdle}
        />
        <button onClick={handleSend} disabled={!isIdle || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

// Main example app
function InitialMessagesExample() {
  const [selectedMode, setSelectedMode] = React.useState<
    "support" | "education" | "coding"
  >("support");

  const getInitialMessages = () => {
    switch (selectedMode) {
      case "support":
        return CUSTOMER_SUPPORT_MESSAGES;
      case "education":
        return EDUCATIONAL_MESSAGES;
      case "coding":
        return CODING_ASSISTANT_MESSAGES;
      default:
        return [];
    }
  };

  return (
    <div className="app">
      <h1>Tambo Initial Messages Example</h1>

      <div className="mode-selector">
        <h3>Select Assistant Mode:</h3>
        <label>
          <input
            type="radio"
            name="mode"
            value="support"
            checked={selectedMode === "support"}
            onChange={(e) =>
              setSelectedMode(
                e.target.value as "support" | "education" | "coding",
              )
            }
          />
          Customer Support
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            value="education"
            checked={selectedMode === "education"}
            onChange={(e) =>
              setSelectedMode(
                e.target.value as "support" | "education" | "coding",
              )
            }
          />
          Educational Assistant
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            value="coding"
            checked={selectedMode === "coding"}
            onChange={(e) =>
              setSelectedMode(
                e.target.value as "support" | "education" | "coding",
              )
            }
          />
          Coding Assistant
        </label>
      </div>

      <TamboProvider
        key={selectedMode} // Re-mount provider when mode changes
        tamboUrl={process.env.REACT_APP_TAMBO_URL || "https://api.tambo.ai"}
        apiKey={process.env.REACT_APP_TAMBO_API_KEY || ""}
        initialMessages={getInitialMessages()}
      >
        <ChatComponent />
      </TamboProvider>

      <div className="initial-messages-preview">
        <h3>Initial Messages for {selectedMode} mode:</h3>
        <pre>{JSON.stringify(getInitialMessages(), null, 2)}</pre>
      </div>
    </div>
  );
}

export default InitialMessagesExample;
