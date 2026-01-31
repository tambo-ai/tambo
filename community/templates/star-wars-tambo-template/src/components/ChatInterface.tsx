'use client';

import { useTamboThread, useTamboThreadInput } from '@tambo-ai/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function ChatInterface() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [thread.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isPending) {
      submit();
    }
  };

  const examplePrompts = [
    'Show me Luke Skywalker',
    'Tell me about the Millennium Falcon',
    'Create an opening crawl for a new episode',
    'Compare X-Wing and TIE Fighter',
  ];

  return (
    <div className="flex flex-col h-screen bg-sw-space">
      {/* Header */}
      <div className="border-b border-sw-yellow/20 bg-black/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-sw-yellow animate-pulse-glow" />
            <div>
              <h1 className="text-xl font-bold text-sw-yellow">Star Wars Archive</h1>
              <p className="text-xs text-gray-400">Powered by Tambo AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {thread.messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Sparkles className="w-16 h-16 text-sw-yellow mx-auto mb-4 animate-pulse-glow" />
              <h2 className="text-2xl font-bold text-sw-yellow mb-2">
                Welcome to the Star Wars Archive
              </h2>
              <p className="text-gray-400 mb-6">
                Ask me about characters, starships, or request an opening crawl
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setValue(prompt);
                      setTimeout(() => submit(), 100);
                    }}
                    className="px-4 py-3 rounded-lg border border-sw-yellow/30 hover:border-sw-yellow/60 bg-black/20 hover:bg-black/40 text-left text-sm text-gray-300 hover:text-white transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {thread.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl ${
                      message.role === 'user'
                        ? 'bg-sw-yellow/10 border-sw-yellow/30'
                        : 'bg-sw-blue/10 border-sw-blue/30'
                    } border rounded-lg p-4`}
                  >
                    {Array.isArray(message.content) ? (
                      <div className="space-y-3">
                        {message.content.map((part, i) =>
                          part.type === 'text' ? (
                            <p key={i} className="text-gray-200 whitespace-pre-wrap">
                              {part.text}
                            </p>
                          ) : null,
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-200 whitespace-pre-wrap">
                        {String(message.content)}
                      </p>
                    )}
                    {message.renderedComponent && (
                      <div className="mt-4">{message.renderedComponent}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-sw-yellow/20 bg-black/40 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask about a character, starship, or request an opening crawl..."
              disabled={isPending}
              className="flex-1 px-4 py-3 rounded-lg border border-sw-yellow/30 bg-black/40 text-white placeholder-gray-500 focus:outline-none focus:border-sw-yellow/60 focus:ring-2 focus:ring-sw-yellow/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!value.trim() || isPending}
              className="px-6 py-3 rounded-lg bg-sw-yellow text-black font-semibold hover:bg-sw-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
