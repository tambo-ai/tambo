import React, { useState } from "react";
import HydraClient from "../../hydra-ai-client";
import HydraChatMessage from "./hydra-chat-message";
import HydraMessageHistory from "./hydra-message-history";
import SendIcon from "./send-icon";
import SpokeSpinner from "./spoke-spinner";

interface HydraChatProps {
  hydraClient: HydraClient;
  initialMessages: HydraChatMessage[];
  aiName?: string;
  inputBackgroundColor?: string;
  inputTextColor?: string;
}

export default function HydraChat({
  hydraClient: hydra,
  initialMessages,
  aiName = "Hydra",
  inputBackgroundColor = "#111827",
  inputTextColor = "",
}: HydraChatProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageHistory, setMessageHistory] = useState<HydraChatMessage[]>([
    ...initialMessages,
  ]);

  const handleSendMessage = async (text: string) => {
    if (!text) return;
    const userMessage: HydraChatMessage = {
      sender: "Input",
      message: text,
      type: "text",
    };
    setMessageHistory((prevHistory) => [...prevHistory, userMessage]);
    await processUserMessage(text);
  };

  const processUserMessage = async (message: string) => {
    setIsLoading(true);
    const response = await hydra.generateComponent(
      `previous messages are ${JSON.stringify(
        messageHistory
      )} latest message: ${message}`
    );
    const hydraMessage: HydraChatMessage = {
      component: response.component,
      sender: aiName,
      type: "component",
      message: response.message,
    };
    setIsLoading(false);
    setMessageHistory((prevHistory) => [...prevHistory, hydraMessage]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage(inputMessage);
      setInputMessage(""); // Clear the input after submission
    }
  };

  return (
    <div className="relative flex flex-col p-4 h-full w-full">
      <div className="flex-grow overflow-auto mb-20">
        <HydraMessageHistory messages={messageHistory} />
        {isLoading && (
          <div className="text-center">
            <SpokeSpinner />
          </div>
        )}
      </div>
      <div
        className={`flex items-center rounded-lg p-2 m-2 absolute bottom-4 left-0 right-0 w-full max-w-full mx-auto`}
        style={{ backgroundColor: inputBackgroundColor }}
      >
        <input
          type="text"
          placeholder="message hydraai..."
          className="flex-grow bg-transparent placeholder-gray-500 outline-none"
          style={{ color: inputTextColor }}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          value={inputMessage}
        />
        <div className="flex ml-2">
          <SendIcon
            className="w-3 h-3 cursor-pointer button"
            onClick={() => {
              handleSendMessage(inputMessage);
              setInputMessage("");
            }}
          />
        </div>
      </div>
    </div>
  );
}
