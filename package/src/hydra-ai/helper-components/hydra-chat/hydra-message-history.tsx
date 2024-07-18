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
          <div key={index} className="mb-4">
            <div className=" flex flex-row items-start">
              <div
                style={{
                  height: 25,
                  width: 25,
                  minWidth: 25,
                  minHeight: 25,
                  borderRadius: 5,
                  backgroundColor:
                    message.sender == "Input" ? "#B7E1FF" : "black",
                  marginRight: 5,
                }}
              ></div>
              <div>{message.message}</div>
            </div>
            {message.type === "component" && message.component}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
