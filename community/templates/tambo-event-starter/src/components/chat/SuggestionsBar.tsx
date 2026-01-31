'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Users, MapPin, Ticket, HelpCircle, Award } from 'lucide-react';

interface SuggestionsBarProps {
  onSuggestionClick: (suggestion: string) => void;
  disabled?: boolean;
}

const suggestions = [
  {
    icon: Calendar,
    text: 'Show me the schedule',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    text: 'Who are the speakers?',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Ticket,
    text: 'How do I register?',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Award,
    text: 'What are the prizes?',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: MapPin,
    text: 'Where is the venue?',
    color: 'from-rose-500 to-red-500',
  },
  {
    icon: HelpCircle,
    text: 'Tell me about the event',
    color: 'from-indigo-500 to-violet-500',
  },
];

export function SuggestionsBar({
  onSuggestionClick,
  disabled = false,
}: SuggestionsBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-white/60">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Try asking:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <motion.button
              key={suggestion.text}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSuggestionClick(suggestion.text)}
              disabled={disabled}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div
                className={`p-1 rounded-md bg-gradient-to-br ${suggestion.color} opacity-80 group-hover:opacity-100 transition-opacity`}
              >
                <Icon className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                {suggestion.text}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default SuggestionsBar;
