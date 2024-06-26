import { DynamicMessage } from "../model/dynamic-message";

interface DynamicMessageHistoryProps {
  messages: DynamicMessage[];
}

import { useEffect, useRef } from "react";

export default function DynamicMessageHistory({
  messages,
}: DynamicMessageHistoryProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col bg-black text-white p-4 mb-16">
      <div className="flex-grow overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index} className="mb-6">
            <p className="whitespace-pre-line text-lg">
              <strong>{message.who}:</strong>
            </p>
            <p className="whitespace-pre-line text-gray-300">
              {message.message}
            </p>
            {message.type === "component" && message.component}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
