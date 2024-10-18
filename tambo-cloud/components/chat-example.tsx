import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatExampleProps {
  userMessages: string[];
  components: React.ReactNode[];
  userLabel?: string;
  aiLabel?: string;
  aiResponseTexts?: string[];
  inputPlaceholder?: string;
}

const ChatExample: React.FC<ChatExampleProps> = ({
  userMessages,
  components,
  userLabel = "User",
  aiLabel = "AI",
  aiResponseTexts = ["Here's the component you requested:"],
  inputPlaceholder = "Type your message...",
}) => {
  const initialMessages = userMessages.flatMap((msg, index) => [
    { sender: userLabel, content: msg },
    {
      sender: aiLabel,
      content: aiResponseTexts[index] || aiResponseTexts[0],
      component: components[index],
    },
  ]);

  const [messages, setMessages] = useState(initialMessages);
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
              "I'm sorry, I can only provide the initial responses for this demo.",
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
