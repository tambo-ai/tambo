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
    setMessageHistory([
      ...messageHistory,
      { message: `user: ${text}`, type: "string" },
    ]);
    await processUserMessage(text);
    setInputMessage("");
  };

  const processUserMessage = async (message: string) => {
    const response = await generateDynamicMessage(message);
    console.log("Response:", response);
    setMessageHistory([...messageHistory, response]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage(inputMessage);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-1100">
      <div className="w-full">
        <DynamicMessageHistory messages={messageHistory} />
      </div>
      <div className="w-full fixed bottom-0 flex items-center">
        <input
          type="text"
          placeholder="Type a message"
          className="text-black p-4 m-4 rounded-md max-w-[75%] w-full h-12"
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          value={inputMessage}
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 m-4 rounded max-w-[20%] w-full h-12"
          onClick={() => handleSendMessage(inputMessage)}
        >
          send
        </button>
      </div>
    </div>
  );
}
