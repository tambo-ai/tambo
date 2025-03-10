'use client'

import { useState } from 'react'
import { ThreadList } from '@/components/ui/thread-list'
import { ChatInput } from '@/components/ui/chat-input'
import { ChatThread, Message } from '@/components/ui/chat-thread'

export function ThreadsComponent() {
  const [selectedThread, setSelectedThread] = useState<string | null>(null)

  const threadMessages = {
    '1': [
      { role: 'assistant', content: 'Hello! How can I help you with the API integration today?' },
      { role: 'user', content: 'I need help connecting to the REST endpoints.' },
      { role: 'assistant', content: 'I can help with that. Which specific endpoints are you trying to access?' },
      { role: 'user', content: 'The authentication endpoints. I keep getting 401 errors.' },
      { role: 'assistant', content: "Let's check your authentication headers. Are you including the Bearer token correctly?" }
    ],
    '2': [
      { role: 'assistant', content: 'Welcome back! Shall we continue discussing the database schema?' },
      { role: 'user', content: 'Yes, I have questions about the relationship tables.' },
      { role: 'assistant', content: 'Sure! What would you like to know about the relationships?' },
      { role: 'user', content: 'Should I use one-to-many or many-to-many for users and roles?' },
      { role: 'assistant', content: 'For user roles, a many-to-many relationship is often better as it allows users to have multiple roles and roles to be assigned to multiple users. Would you like me to show you an example schema?' }
    ],
    '3': [
      { role: 'assistant', content: 'I understand you need help with the UI component library.' },
      { role: 'user', content: 'Yes, I need to create a reusable modal component.' },
      { role: 'assistant', content: "Great! Let's design it. What features do you need in the modal?" },
      { role: 'user', content: 'I need it to be accessible and handle different sizes.' },
      { role: 'assistant', content: "Perfect. We'll use React Portal for accessibility and create a size prop. Here's the component specifications you requested..." }
    ]
  }

  const threads = [
    {
      id: '1',
      title: 'API Integration Help',
      timestamp: '2h ago',
      unread: true,
      lastMessage: 'Let\'s check your authentication headers. Are you including the Bearer token correctly?'
    },
    {
      id: '2',
      title: 'Database Schema Discussion',
      timestamp: '5h ago',
      unread: false,
      lastMessage: 'For user roles, a many-to-many relationship is often better...'
    },
    {
      id: '3',
      title: 'UI Component Library',
      timestamp: '1d ago',
      unread: false,
      lastMessage: 'Here\'s the component specifications you requested...'
    }
  ]

  return (
    <main className="flex flex-col items-center gap-8 px-[12%]">
      <div className="grid grid-cols-12 gap-4 w-full min-h-[600px]">
        {/* Threads Sidebar */}
        <div className="col-span-4 p-6 border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">AI Conversations</h2>
            <button className="p-2 rounded-full hover:bg-muted">
              <span className="sr-only">Create new thread</span>
              +
            </button>
          </div>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full p-2 rounded-lg border bg-background/50 text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <ThreadList
              threads={threads}
              variant="bordered"
              size="compact"
              onThreadSelect={setSelectedThread}
              className="overflow-y-auto"
            />
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-span-8 p-6 border rounded-lg bg-card">
          {selectedThread ? (
            <>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-8 h-8 rounded-full bg-primary/10" />
                <div>
                  <h2 className="font-semibold">{threads.find(t => t.id === selectedThread)?.title}</h2>
                  <p className="text-sm text-muted-foreground">AI Assistant</p>
                </div>
              </div>
              
              <div className="h-px bg-border/40 mb-4 -mt-6" />
              
              <div className="space-y-4 mt-10">
                <ChatThread 
                  messages={threadMessages[selectedThread as keyof typeof threadMessages] as Message[]} 
                  variant="bordered" 
                  className="h-[400px] mb-4" 
                />
                
                <ChatInput 
                  variant="bordered"
                  className="relative"
                  placeholder="Type your message..."
                  onValueSubmit={() => {}}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
