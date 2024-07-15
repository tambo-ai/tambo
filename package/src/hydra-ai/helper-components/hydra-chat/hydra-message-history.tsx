interface HydraMessageHistoryProps {
  messages: HydraChatMessage[];
}

import React, { useEffect, useRef } from "react";
import HydraChatMessage from "./hydra-chat-message";

export default function HydraMessageHistory({
  messages,
}: HydraMessageHistoryProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col p-4">
      <div className="flex-grow overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index} className="mb-2">
            <p className="whitespace-pre-line text-lg">
              <strong>{message.sender}:</strong>
            </p>
            <p className="whitespace-pre-line">{message.message}</p>
            {message.type === "component" && message.component}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
