'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTamboThread, useTamboThreadInput } from '@tambo-ai/react';
import { MessageSquare, X, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { SuggestionsBar } from './SuggestionsBar';

interface ChatInterfaceProps {
  initialOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'fullscreen';
}

export function ChatInterface({
  initialOpen = false,
  position = 'bottom-right',
}: ChatInterfaceProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending, error } = useTamboThreadInput();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thread?.messages]);

  const handleSubmit = async () => {
    if (!value.trim() || isPending) return;

    try {
      await submit({
        streamResponse: true,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    fullscreen: 'inset-0',
  };

  const hasMessages = thread?.messages && thread.messages.length > 0;

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={`fixed ${positionClasses[position]} z-50 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-shadow`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed ${
              position === 'fullscreen'
                ? 'inset-4 md:inset-8'
                : `${positionClasses[position]} w-[450px] max-w-[calc(100vw-48px)]`
            } z-50 flex flex-col bg-gradient-to-b from-slate-900/98 to-slate-950/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden`}
            style={{ height: isMinimized ? 'auto' : position === 'fullscreen' ? 'calc(100% - 64px)' : '70vh', maxHeight: '750px', minHeight: isMinimized ? 'auto' : '500px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Event Assistant</h3>
                  <p className="text-xs text-white/60">
                    {isPending ? 'Typing...' : 'Online • Ready to help'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                    {!hasMessages && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-full text-center py-8"
                      >
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                          <Sparkles className="w-8 h-8 text-purple-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Welcome to AI Innovation Hackathon!
                        </h4>
                        <p className="text-sm text-white/60 max-w-[280px]">
                          I'm your AI assistant. Ask me about the schedule, speakers, registration, or anything else!
                        </p>
                      </motion.div>
                    )}

                    {/* Render Messages */}
                    {thread?.messages.map((message) => {
                      const hasComponent = !!message.renderedComponent;
                      
                      return (
                        <div key={message.id} className="space-y-3">
                          {/* Text Content - only show if not primarily a component response */}
                          {Array.isArray(message.content) ? (
                            message.content.map((part, i) => {
                              if (part.type === 'text' && part.text) {
                                // Skip JSON-heavy content that will be shown as component
                                const text = part.text.trim();
                                const isJsonData = text.startsWith('[{') || (text.startsWith('{') && text.includes('"id":'));
                                
                                if (isJsonData && hasComponent) {
                                  return null; // Component will display this data
                                }
                                
                                return (
                                  <MessageBubble
                                    key={`${message.id}-text-${i}`}
                                    role={message.role as 'user' | 'assistant'}
                                    content={part.text}
                                    timestamp={new Date()}
                                  />
                                );
                              }
                              return null;
                            })
                          ) : (
                            <MessageBubble
                              role={message.role as 'user' | 'assistant'}
                              content={String(message.content)}
                              timestamp={new Date()}
                            />
                          )}

                          {/* Rendered Component */}
                          {message.renderedComponent && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-3 overflow-x-auto"
                            >
                              <div className="min-w-0">
                                {message.renderedComponent}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}

                    {/* Streaming/Loading indicator */}
                    {isPending && (
                      <MessageBubble
                        role="assistant"
                        content=""
                        isStreaming={true}
                      />
                    )}

                    {/* Error Message */}
                    {error && (
                      <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-300">
                        Something went wrong: {error.message}
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggestions (only show when no messages) */}
                  {!hasMessages && (
                    <div className="px-4 pb-2">
                      <SuggestionsBar
                        onSuggestionClick={handleSuggestionClick}
                        disabled={isPending}
                      />
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="p-4 border-t border-white/10">
                    <ChatInput
                      value={value}
                      onChange={setValue}
                      onSubmit={handleSubmit}
                      isLoading={isPending}
                      placeholder="Ask about the event..."
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatInterface;
