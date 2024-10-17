import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatExampleProps {
  userMessage: string;
  component: React.ReactNode;
  userLabel?: string;
  aiLabel?: string;
  aiResponseText?: string;
  inputPlaceholder?: string;
}

const ChatExample: React.FC<ChatExampleProps> = ({
  userMessage,
  component,
  userLabel = "User",
  aiLabel = "AI",
  aiResponseText = "Here&apos;s the component you requested:",
  inputPlaceholder = "Type your message...",
}) => {
  const [messages, setMessages] = useState([
    { sender: userLabel, content: userMessage },
    { sender: aiLabel, content: aiResponseText, component },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, { sender: userLabel, content: inputMessage }]);
      setInputMessage("");
      // Simulate AI response (you can replace this with actual AI integration)
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: aiLabel,
            content:
              "I'm sorry, I can only provide the initial response for this demo.",
          },
        ]);
      }, 1000);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardContent className="p-6 space-y-4 max-h-[40rem] overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              message.sender === userLabel ? "bg-muted" : "bg-primary/10"
            }`}
          >
            <p className="font-semibold">{message.sender}:</p>
            <p>{message.content}</p>
            {message.component && (
              <div className="mt-2">{message.component}</div>
            )}
          </div>
        ))}
      </CardContent>
      <CardFooter className="p-4">
        <div className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder={inputPlaceholder}
            className="flex-grow"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button size="icon" onClick={handleSendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ChatExample;
