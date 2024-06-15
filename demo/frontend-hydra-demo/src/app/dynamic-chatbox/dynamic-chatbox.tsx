import { useState } from "react";
import MessageHistory from "./message-history";

export default function DynamicChatbox() {
  const [inputMessage, setInputMessage] = useState("");
  const [messageHistory, setMessageHistory] = useState<string[]>([]);

  const handleSendMessage = (text: string) => {
    if (!text) return;
    console.log("Sending message:", text);
    setMessageHistory([...messageHistory, text]);
    setInputMessage("");
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-1100">
      <input
        type="text"
        placeholder="Type a message"
        className="text-black p-4 m-4 rounded-md"
        onChange={(e) => setInputMessage(e.target.value)}
      />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 m-4 rounded"
        onClick={() => handleSendMessage(inputMessage)}
      >
        send
      </button>
      <MessageHistory messages={messageHistory} />
    </div>
  );
}
