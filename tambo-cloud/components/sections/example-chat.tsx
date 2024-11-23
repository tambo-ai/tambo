"use client";
import { useState, useEffect } from "react";
import { Section } from "@/components/section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import React from "react"; // Add React import to fix UMD global errors

interface TransferFormProps {
  amount: number;
  setAmount: (amount: number) => void;
  recipient: string;
  setRecipient: (recipient: string) => void;
  accountType: "checking" | "savings";
  setAccountType: (type: "checking" | "savings") => void;
}

const TransferForm = ({
  amount,
  setAmount,
  recipient,
  setRecipient,
  accountType,
  setAccountType,
}: TransferFormProps) => (
  <Card className="animate-fade-in">
    <CardContent className="p-4 space-y-4">
      <div className="space-y-3">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
              min={0}
              step={50}
              className="pl-8 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="recipient">Recipient</Label>
          <Select
            value={recipient}
            onValueChange={setRecipient}
            defaultValue="Mom (**** 1234)"
          >
            <SelectTrigger className="h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400">
              <SelectValue>Mom (**** 1234)</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mom (**** 1234)">Mom (**** 1234)</SelectItem>
              <SelectItem value="Mom 2 (**** 5678)">
                Mom 2 (**** 5678)
              </SelectItem>
              <SelectItem value="Dad (**** 9012)">Dad (**** 9012)</SelectItem>
              <SelectItem value="Savings (**** 3456)">
                Savings (**** 3456)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="account">From Account</Label>
          <Select
            value={accountType}
            onValueChange={(value) =>
              setAccountType(value as "checking" | "savings")
            }
          >
            <SelectTrigger className="h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400">
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking">Checking (**** 4891)</SelectItem>
              <SelectItem value="savings">Savings (**** 7239)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm">Confirm Transfer</Button>
      </div>
    </CardContent>
  </Card>
);

interface TransferSummaryProps {
  amount: number;
  recipient: string;
  accountType: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => (
  <div
    className={`flex ${
      message.role === "user" ? "justify-end" : "justify-start"
    }`}
  >
    {message.role === "assistant" && (
      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
        <span className="text-blue-600 dark:text-blue-400 text-sm">AI</span>
      </div>
    )}
    <div
      className={`max-w-[80%] p-4 rounded-2xl ${
        message.role === "user"
          ? "bg-blue-600 text-white rounded-tr-none"
          : "bg-gray-100 dark:bg-gray-800 rounded-tl-none"
      } shadow-md`}
    >
      {message.content}
    </div>
  </div>
);

const LoadingDots = () => (
  <div className="flex space-x-1">
    <div
      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
      style={{ animationDelay: "0ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
      style={{ animationDelay: "150ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
      style={{ animationDelay: "300ms" }}
    ></div>
  </div>
);

export function ExampleChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to SecureBank! I'm your virtual assistant. How can I help you today?",
    },
  ]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(500);
  const [recipient, setRecipient] = useState("Mom");
  const [accountType, setAccountType] = useState<"checking" | "savings">(
    "checking"
  );

  useEffect(() => {
    // Show typing indicator
    const typingTimer = setTimeout(() => {
      setIsTyping(true);
    }, 1000);

    // Add user message
    const messageTimer = setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: "send $500 to my mom" },
      ]);
      setIsLoading(true);
    }, 4000);

    // Show transfer form
    const transferTimer = setTimeout(() => {
      setIsLoading(false);
      setShowTransfer(true);
    }, 7000);

    return () => {
      clearTimeout(typingTimer);
      clearTimeout(messageTimer);
      clearTimeout(transferTimer);
    };
  }, []);

  return (
    <Section id="example-chat">
      <div className="container mx-auto p-4 min-h-[350px] flex justify-center items-start">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="space-y-3 border-r dark:border-gray-800 pr-4 md:pr-4">
            {messages.map((message, i) => (
              <ChatMessage key={i} message={message} />
            ))}
            {isTyping && (
              <div className="flex justify-end">
                <div className="max-w-[80%] p-4 rounded-2xl bg-gray-100 dark:bg-gray-800">
                  <LoadingDots />
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="md:pl-4 flex items-center justify-center">
              <div className="space-y-2 text-center">
                <LoadingDots />
                <p className="text-sm text-gray-500">
                  Generating transfer form...
                </p>
              </div>
            </div>
          ) : (
            showTransfer && (
              <div className="md:pl-4">
                <TransferForm
                  amount={amount}
                  setAmount={setAmount}
                  recipient={recipient}
                  setRecipient={setRecipient}
                  accountType={accountType}
                  setAccountType={setAccountType}
                />
              </div>
            )
          )}
        </div>
      </div>
    </Section>
  );
}
