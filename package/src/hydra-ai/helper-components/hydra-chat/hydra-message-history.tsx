interface HydraMessageHistoryProps {
  messages: HydraChatMessage[];
  hideComponent?: boolean;
  aiMessageColor?: string;
  userMessageColor?: string;
  aiIconColor?: string;
  userIconColor?: string;
}

import React, { useEffect, useRef } from "react";
import HydraChatMessage from "./hydra-chat-message";

export default function HydraMessageHistory({
  messages,
  hideComponent = false,
  aiMessageColor = "",
  userMessageColor = "",
  aiIconColor = "black",
  userIconColor = "#B7E1FF",
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
          <div key={index} className="mb-6">
            <div className=" flex flex-row items-start">
              <div
                style={{
                  height: 25,
                  width: 25,
                  minWidth: 25,
                  minHeight: 25,
                  borderRadius: 5,
                  backgroundColor:
                    message.sender == "Input" ? userIconColor : aiIconColor,
                  marginRight: 15,
                }}
              ></div>
              <div
                style={{
                  color:
                    message.sender == "Input"
                      ? userMessageColor
                      : aiMessageColor,
                }}
              >
                {message.message}
              </div>
            </div>
            {message.type === "component" &&
              !hideComponent &&
              message.component}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
