'use client';

import { useEffect } from 'react';
import { useTamboThreadInput, useTamboThread } from '@tambo-ai/react';

interface MessageThreadProps {
  onNotesUpdate?: () => void;
}

export function MessageThread({ onNotesUpdate }: MessageThreadProps) {
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { thread } = useTamboThread();

  useEffect(() => {
    if (thread?.messages?.length && onNotesUpdate) {
      onNotesUpdate();
    }
  }, [thread?.messages?.length, onNotesUpdate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      submit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread?.messages?.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {typeof message.content === 'string' 
                  ? message.content 
                  : Array.isArray(message.content) 
                    ? message.content.map((part: { text?: string }, i: number) => (
                        <div key={i}>{part.text || JSON.stringify(part)}</div>
                      ))
                    : JSON.stringify(message.content)
                }
              </div>
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Try: 'Create a note called Ship Tambo template with content Ready to deploy' or 'Show all notes'"
            disabled={isPending}
            className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isPending || !value.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
