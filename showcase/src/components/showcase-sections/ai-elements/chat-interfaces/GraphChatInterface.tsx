import { Graph } from "@/components/ui/graph";
import { Message } from "@/components/ui/message";
import { MessageInput } from "@/components/ui/message-input";
import { sampleGraphData } from "@/constants/graph-data";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "../index";

export const GraphChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I can help you visualize data with various types of graphs. Try the quick prompts below!",
    },
  ]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickPrompts = [
    {
      label: "Show Sales Graph",
      action: () => {
        setMessages([
          ...messages,
          { role: "user", content: "Can you show me the sales data?" },
          {
            role: "assistant",
            content: "Here's a visualization of your sales and revenue data:",
            renderedComponent: (
              <Graph
                data={sampleGraphData}
                title="Sales Overview"
                variant="bordered"
                size="lg"
              />
            ),
          },
        ]);
      },
    },
    {
      label: "Show Line Graph",
      action: () => {
        setMessages([
          ...messages,
          { role: "user", content: "Can you show me a line graph?" },
          {
            role: "assistant",
            content: "Here's a line graph showing the trend:",
            renderedComponent: (
              <Graph
                data={{ ...sampleGraphData, type: "line" }}
                title="Trend Analysis"
                variant="solid"
                size="lg"
              />
            ),
          },
        ]);
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4 h-[800px]">
      <div
        ref={chatContainerRef}
        className="flex-1 border rounded-lg p-4 overflow-y-auto flex flex-col gap-4"
      >
        {messages.map((message, index) => (
          <div key={index}>
            <Message
              role={message.role}
              content={message.content}
              variant={message.role === "user" ? "solid" : "default"}
              message={{
                id: `msg-${index}`,
                role: message.role,
                content: [{ type: "text", text: message.content }],
                createdAt: new Date().toISOString(),
                threadId: "graph-thread",
                componentState: {},
                renderedComponent: null,
              }}
            />
            {message.renderedComponent && (
              <div className="mt-4 w-full max-w-4xl mx-auto px-4">
                {message.renderedComponent}
              </div>
            )}
          </div>
        ))}
      </div>
      <MessageInput
        contextKey="graph-thread"
        variant="bordered"
        className="pointer-events-none opacity-50"
      />
      <div className="flex gap-2">
        {quickPrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={prompt.action}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            {prompt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
