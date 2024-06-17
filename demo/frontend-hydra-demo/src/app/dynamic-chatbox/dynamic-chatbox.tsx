import { useState } from "react";
import { DynamicMessage } from "../model/dynamic-message";
import { generateDynamicMessage } from "../services/component-gen.service";
import DynamicMessageHistory from "./dynamic-message-history";

export default function DynamicChatbox() {
  const [inputMessage, setInputMessage] = useState("");
  const [messageHistory, setMessageHistory] = useState<DynamicMessage[]>([]);

  const handleSendMessage = async (text: string) => {
    if (!text) return;
    console.log("Sending message:", text);
    const userMessage: DynamicMessage = {
      who: "Input",
      message: text,
      type: "string",
    };
    setMessageHistory((prevHistory) => [...prevHistory, userMessage]);
    await processUserMessage(text);
    setInputMessage("");
  };

  const processUserMessage = async (message: string) => {
    const response = await generateDynamicMessage(message);
    console.log("Response:", response);
    const hydraMessage: DynamicMessage = {
      ...response,
      who: "HydraAI",
      message: "Here is your component rendered by HydraAI",
    };
    setMessageHistory((prevHistory) => [...prevHistory, hydraMessage]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage(inputMessage);
    }
  };

  return (
    <div className="flex flex-col bg-black text-white p-4 w-full">
      <DynamicMessageHistory messages={messageHistory} />
      <div className="flex items-center bg-gray-900 rounded-lg p-2 fixed bottom-0 w-1/3">
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
            onClick={() => handleSendMessage(inputMessage)}
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
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
