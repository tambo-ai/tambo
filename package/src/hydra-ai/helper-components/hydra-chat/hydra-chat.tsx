import React, { useState } from "react";
import HydraClient from "../../hydra-ai-client";
import HydraChatMessage from "./hydra-chat-message";
import HydraMessageHistory from "./hydra-message-history";
import SendIcon from "./send-icon";
import SpokeSpinner from "./spoke-spinner";
import "./styles.css";

interface HydraChatProps {
  hydraClient: HydraClient;
  initialMessages: HydraChatMessage[];
  aiName?: string;
  aiMessageColor?: string;
  userMessageColor?: string;
  aiIconColor?: string;
  userIconColor?: string;
  inputBackgroundColor?: string;
  inputTextColor?: string;
  inputPlaceholder?: string;
  loadingIconColor?: string;
  handleComponent?: (component: React.ReactElement) => any;
}

export default function HydraChat({
  hydraClient: hydra,
  initialMessages,
  aiName = "Hydra",
  aiMessageColor = "",
  userMessageColor = "",
  aiIconColor,
  userIconColor,
  inputBackgroundColor = "#111827",
  inputTextColor = "",
  inputPlaceholder = "message hydraai",
  loadingIconColor,
  handleComponent,
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

    let hydraMessage: HydraChatMessage;
    if (
      typeof response === "object"
    ) {
      if (response.component && handleComponent) {
        handleComponent(response.component);
      }

      hydraMessage = {
        component: response.component,
        sender: aiName,
        type: "component",
        message: response.message,
      };
    } else {
      hydraMessage = {
        sender: aiName,
        message: response,
        type: "text",
      };
    }
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
        <HydraMessageHistory
          messages={messageHistory}
          hideComponent={handleComponent ? true : false}
          aiMessageColor={aiMessageColor}
          userMessageColor={userMessageColor}
          aiIconColor={aiIconColor}
          userIconColor={userIconColor}
        />
        {isLoading && (
          <div className="text-center p-4">
            <SpokeSpinner color={loadingIconColor} />
          </div>
        )}
      </div>
      <div
        className={`flex items-center rounded-lg p-2 m-2 bottom-4 left-0 right-0 w-full max-w-full mx-auto`}
        style={{ backgroundColor: inputBackgroundColor }}
      >
        <input
          type="text"
          placeholder={inputPlaceholder}
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
