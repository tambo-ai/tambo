"use client";

import { useState } from "react";
import {
  TamboProvider,
  useTamboThread,
  useTamboThreadInput,
} from "@tambo-ai/react";
import { tamboComponents, tamboTools } from "../lib/tambo";
import { Send, Users, MessageSquare } from "lucide-react";
import Link from "next/link";
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {thread.messages.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">Start a conversation about your contacts</h3>
            <p className="text-lg text-gray-600 leading-relaxed">Ask me to add contacts, search for people, or manage your CRM data</p>
          </div>
        )}
        {thread.messages.map((message) => (
          <div key={message.id} className="space-y-4">
            <div
              className={`p-6 rounded-3xl max-w-4xl text-base ${
                message.role === "user"
                  ? "bg-black text-white ml-auto shadow-2xl"
                  : "bg-gray-100 text-gray-900 mr-auto shadow-lg"
              }`}
            >
              {Array.isArray(message.content) ? (
                message.content.map((part, i) =>
                  part.type === "text" ? (
                    <p key={i} className="leading-relaxed">
                      {part.text}
                    </p>
                  ) : null,
                )
              ) : (
                <p className="leading-relaxed">{String(message.content)}</p>
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

      <div className="p-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask about contacts..."
            className="flex-1 px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-black bg-white transition-colors"
            disabled={isPending}
          />
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!value.trim() || isPending}
            className="px-8 py-4 bg-black text-white rounded-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg transition-all duration-200"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  
  const systemPrompt =
    "You are a CRM assistant. Your job is to help users manage their contacts. When a user provides contact details, use the add_contact tool. Once the tool succeeds, always render the ContactCard to confirm. For search queries, use the search_contacts tool and render results with ContactList.";

  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-md border border-white/20">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Missing API Key</h2>
          <p className="text-gray-700 mb-4">
            Please add your Tambo API key to the environment variables.
          </p>
          <p className="text-sm text-gray-500">
            Create a <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file with:
            <br />
            <code className="bg-gray-100 px-2 py-1 rounded mt-2 block">
              NEXT_PUBLIC_TAMBO_API_KEY=your_api_key_here
            </code>
          </p>
        </div>
      </div>
    );
  }

  if (showChat) {
    return (
      <TamboProvider
        apiKey={apiKey}
        components={tamboComponents}
        tools={tamboTools}
        systemPrompt={systemPrompt}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {/* Header */}
          <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    CRM Intelligence
                  </span>
                </Link>
                <div className="flex items-center gap-6">
                  <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => setShowChat(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                  >
                    Home
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Chat Interface */}
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-3xl shadow-2xl h-[500px]" style={{width: 'calc(100% + 10px)'}}>
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">AI Assistant</h3>
                <p className="text-gray-600 mt-1">Ask about your contacts</p>
              </div>
              <ChatInterface />
            </div>
          </div>
        </div>
      </TamboProvider>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-violet-500/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl mb-6">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-emerald-200 to-blue-200 bg-clip-text text-transparent mb-4">
              CRM Intelligence
            </h1>
            <h3 className="text-3xl font-semibold text-gray-300 mb-4">
              AI-Powered Relationship Management
            </h3>
            <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Build relationships that adapt to your business. Let AI handle the complexity while you focus on what matters most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowChat(true)}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl hover:from-emerald-600 hover:to-blue-600 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Get Started
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 bg-slate-800/80 backdrop-blur-md border border-slate-700 text-gray-300 rounded-xl hover:bg-slate-700/80 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Why Choose CRM Intelligence?</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience the future of customer relationship management with AI-powered insights and automation.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-200">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Natural Language Interface</h3>
            <p className="text-gray-400">Interact with your CRM using natural language. No complex forms or workflows required.</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-200">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Smart Contact Management</h3>
            <p className="text-gray-400">AI automatically organizes and enriches your contact data for better relationship insights.</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-200">
            <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Intelligent Automation</h3>
            <p className="text-gray-400">Automate routine tasks and focus on building meaningful relationships with your customers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
