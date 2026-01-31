"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";

export default function ChatPage() {
  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl h-full bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-white">
          <h1 className="font-semibold text-gray-800">Tambo AI Chat</h1>
        </div>
        <div className="flex-1 overflow-auto">
          <MessageThreadFull />
        </div>
      </div>
    </div>
  );
}