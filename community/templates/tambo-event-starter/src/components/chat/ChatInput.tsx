'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Mic, Paperclip } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = 'Ask about the event, register, or get help...',
  disabled = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white/5 backdrop-blur-xl border rounded-2xl transition-all duration-300 ${
        isFocused
          ? 'border-purple-500/50 shadow-lg shadow-purple-500/20'
          : 'border-white/10'
      }`}
    >
      <div className="flex items-end gap-2 p-3">
        {/* Attachment Button (placeholder) */}
        <button
          type="button"
          className="p-2 text-white/50 hover:text-white/80 transition-colors rounded-lg hover:bg-white/5"
          title="Attach file (coming soon)"
          disabled
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-white/40 resize-none focus:outline-none text-sm leading-relaxed py-2 max-h-[150px]"
        />

        {/* Voice Input Button (placeholder) */}
        <button
          type="button"
          className="p-2 text-white/50 hover:text-white/80 transition-colors rounded-lg hover:bg-white/5"
          title="Voice input (coming soon)"
          disabled
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Send Button */}
        <motion.button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || isLoading || disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-2.5 rounded-xl transition-all duration-300 ${
            value.trim() && !isLoading && !disabled
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      {/* Character count */}
      {value.length > 200 && (
        <div className="absolute -top-6 right-2 text-xs text-white/40">
          {value.length}/500
        </div>
      )}
    </motion.div>
  );
}

export default ChatInput;
