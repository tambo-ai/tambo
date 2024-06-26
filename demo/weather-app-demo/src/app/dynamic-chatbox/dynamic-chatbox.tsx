import { useState } from "react";
import { DynamicMessage } from "../model/dynamic-message";
import { generateDynamicMessage } from "../services/component-gen.service";
import DynamicMessageHistory from "./dynamic-message-history";

const initialMessages: DynamicMessage[] = [
  {
    who: "HydraAI",
    message:
      "Hello! Hydra is a package that lets you register components, and lets AI choose them based on context. This is a demo weather app that registers components for displaying weather info, and tries to show the ones you care about.",
    type: "text",
  },
  {
    who: "HydraAI",
    message:
      "Try typing 'show me the current weather' or 'show me the rain forecast for the next week.'",
    type: "text",
  },
];

export default function DynamicChatbox() {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageHistory, setMessageHistory] = useState<DynamicMessage[]>([
    ...initialMessages,
  ]);

  const handleSendMessage = async (text: string) => {
    if (!text) return;
    const userMessage: DynamicMessage = {
      who: "Input",
      message: text,
      type: "text",
    };
    setMessageHistory((prevHistory) => [...prevHistory, userMessage]);
    await processUserMessage(text);
  };

  const processUserMessage = async (message: string) => {
    setIsLoading(true);
    const response = await generateDynamicMessage(
      `previous messages ${JSON.stringify(
        messageHistory
      )} latest message: ${message}`
    );
    const hydraMessage: DynamicMessage = {
      component: response,
      who: "HydraAI",
      type: "component",
      message: "",
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
    <div className="flex flex-col bg-black text-white p-4 w-full">
      <DynamicMessageHistory messages={messageHistory} />
      {isLoading && <div className="text-center">Loading...</div>}
      <div className="flex items-center bg-gray-900 rounded-lg p-2 fixed bottom-4  w-1/3">
        <input
          type="text"
          placeholder="message hydraai..."
          className="flex-grow bg-transparent text-white placeholder-gray-500 outline-none"
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          value={inputMessage}
        />
        <div className="flex ml-2">
          <SendIcon
            className="w-6 h-6"
            onClick={() => {
              handleSendMessage(inputMessage);
              setInputMessage(""); // Clear the input after submission
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      onClick={props.onClick}
    >
      <path d="M2 12h20" />
      <path d="M12 2l10 10-10 10" />
    </svg>
  );
}
