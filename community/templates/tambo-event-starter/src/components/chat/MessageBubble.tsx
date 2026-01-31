'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Sparkles } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  isStreaming?: boolean;
}

// Helper function to detect and filter out raw JSON data
function filterJsonContent(content: string): string {
  if (!content) return '';
  
  // Check if the content is primarily JSON (starts with [ or { and is mostly JSON-like)
  const trimmed = content.trim();
  
  // If it looks like a JSON array or object that's the whole message, skip it
  if ((trimmed.startsWith('[{') && trimmed.endsWith('}]')) || 
      (trimmed.startsWith('{') && trimmed.endsWith('}') && trimmed.includes('"id":'))) {
    return ''; // This is likely tool output, skip it
  }
  
  // Filter out JSON blocks embedded in text
  const jsonBlockRegex = /\[?\{[\s\S]*?"id"[\s\S]*?\}[\s\S]*?\]?/g;
  const filtered = content.replace(jsonBlockRegex, '').trim();
  
  // If filtering removed everything meaningful, return empty
  if (!filtered || filtered.length < 5) return '';
  
  return filtered;
}

export function MessageBubble({
  role,
  content,
  timestamp,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = role === 'user';
  
  // Filter content to remove JSON
  const displayContent = isUser ? content : filterJsonContent(content);
  
  // Don't render if there's no content to show (after filtering)
  if (!isStreaming && !displayContent) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-purple-600'
            : 'bg-gradient-to-br from-emerald-500 to-cyan-600'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-md'
              : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-bl-md'
          }`}
        >
          {isStreaming && !content ? (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Thinking...</span>
              <motion.div
                className="flex gap-1"
                initial="start"
                animate="end"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 bg-current rounded-full"
                    animate={{
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {displayContent}
            </p>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span
            className={`text-xs text-white/50 mt-1 block ${
              isUser ? 'text-right' : 'text-left'
            }`}
          >
            {timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default MessageBubble;
