"use client";

import { useState } from "react";
import { TamboProvider } from "@tambo-ai/react";
import { tamboComponents, tamboTools } from "../lib/tambo";
import Chat from "../components/Chat";
import { Users, MessageSquare } from "lucide-react";
import "./globals.css";

export default function Home() {
  const [showChat, setShowChat] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-md border border-white/20">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Missing API Key
          </h2>
          <p className="text-gray-700 mb-4">
            Please add your Tambo API key to the environment variables.
          </p>
          <p className="text-sm text-gray-500">
            Create a{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>{" "}
            file with:
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
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {/* Header */}
          <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    CRM Intelligence
                  </span>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                >
                  Home
                </button>
              </div>
            </div>
          </nav>

          {/* Chat Interface */}
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div
              className="bg-white rounded-3xl shadow-2xl h-[500px]"
              style={{ width: "calc(100% + 10px)" }}
            >
              <Chat />
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
              Build relationships that adapt to your business. Let AI handle the
              complexity while you focus on what matters most.
            </p>
            <button
              onClick={() => setShowChat(true)}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl hover:from-emerald-600 hover:to-blue-600 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Why Choose CRM Intelligence?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience the future of customer relationship management with
            AI-powered insights and automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-200">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Natural Language Interface
            </h3>
            <p className="text-gray-400">
              Interact with your CRM using natural language. No complex forms or
              workflows required.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-200">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Smart Contact Management
            </h3>
            <p className="text-gray-400">
              AI automatically organizes and enriches your contact data for
              better relationship insights.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-200">
            <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Intelligent Automation
            </h3>
            <p className="text-gray-400">
              Automate routine tasks and focus on building meaningful
              relationships with your customers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
