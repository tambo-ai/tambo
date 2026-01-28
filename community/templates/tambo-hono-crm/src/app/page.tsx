"use client";

import {
  TamboProvider,
  useTamboThread,
  useTamboThreadInput,
} from "@tambo-ai/react";
import { tamboComponents, tamboTools } from "../lib/tambo";
import { Send } from "lucide-react";
import "./globals.css";

function ChatInterface() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isPending) {
      submit();
    }
  };

  return (
    <div className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread.messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div
              className={`p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-100 ml-8"
                  : "bg-gray-100 mr-8"
              }`}
            >
              {Array.isArray(message.content) ? (
                message.content.map((part, i) =>
                  part.type === "text" ? (
                    <p key={i} className="text-gray-800">
                      {part.text}
                    </p>
                  ) : null,
                )
              ) : (
                <p className="text-gray-800">{String(message.content)}</p>
              )}
            </div>
            {message.renderedComponent && (
              <div className="flex justify-center">
                {message.renderedComponent}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tell me about a contact..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={!value.trim() || isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {isPending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Home() {
  const systemPrompt =
    "You are a CRM assistant. Your job is to help users manage their contacts. When a user provides contact details, use the add_contact tool. Once the tool succeeds, always render the ContactCard to confirm.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          CRM Dashboard
        </h1>

        <div className="backdrop-blur-md bg-white/30 rounded-2xl border border-white/20 shadow-xl p-6">
          <TamboProvider
            components={tamboComponents}
            tools={tamboTools}
            systemPrompt={systemPrompt}
          >
            <ChatInterface />
          </TamboProvider>
        </div>
      </div>
    </div>
  );
}
