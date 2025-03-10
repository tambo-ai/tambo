'use client'

import { useState, useEffect } from "react"
import { ChatThread } from "@/components/ui/chat-thread"
import { ChatInput } from "@/components/ui/chat-input"
import { motion, AnimatePresence } from "framer-motion"
import { Graph } from "@/components/ui/graph"

const demoData = {
  type: 'line' as const,
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [{
    label: 'Q1 Performance',
    data: [400, 300, 600, 800, 500],
    color: 'hsl(var(--chart-1))'
  }]
}

export function MessagesComponent() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedText, setStreamedText] = useState("")
  const [showChart, setShowChart] = useState(false)

  // Loop the animation
  useEffect(() => {
    const startAnimation = async () => {
      setIsStreaming(false)
      setStreamedText("")
      setShowChart(false)
      
      // Small delay to ensure state is reset
      await new Promise(resolve => setTimeout(resolve, 100))
      
      setIsStreaming(true)
    }

    const animationInterval = setInterval(() => {
      startAnimation()
    }, 8000) // Restart every 8 seconds

    startAnimation() // Start immediately
    return () => clearInterval(animationInterval)
  }, [])

  // Streaming effect
  useEffect(() => {
    if (isStreaming) {
      const text = "Let me analyze the sales data for you. Based on the trends, we can observe significant growth in Q1..."
      let index = 0
      
      setStreamedText(text[0]) // Start with first character
      
      const streamInterval = setInterval(() => {
        if (index < text.length - 1) { // -1 since we start at 0
          index++
          setStreamedText(text.slice(0, index + 1)) // Use slice to get full text up to current index
        } else {
          setIsStreaming(false)
          setShowChart(true)
          clearInterval(streamInterval)
        }
      }, 50)

      return () => clearInterval(streamInterval)
    }
  }, [isStreaming])

  return (
    <main className="flex flex-col items-center gap-8 px-[12%]">
      <div className="grid grid-cols-12 gap-4 w-full">
        {/* Chat Variants */}
        <div className="col-span-6 border rounded-lg bg-card p-6 flex flex-col h-[700px]">
          <h3 className="font-semibold mb-4">Chat Variants</h3>
          <div className="flex flex-col gap-4 flex-1">
            {/* Default Style */}
            <div className="flex flex-col overflow-hidden flex-1">
              <p className="text-sm text-muted-foreground mb-2">Default</p>
              <div className="flex-1">
                <ChatThread 
                  messages={[
                    { role: 'assistant', content: 'How can I help you today?' },
                    { role: 'user', content: "Can you analyze our sales data?" },
                  ]} 
                  variant="default"
                  className="h-full" 
                />
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Bordered Style */}
            <div className="flex flex-col overflow-hidden flex-1">
              <p className="text-sm text-muted-foreground mb-2">Bordered</p>
              <div className="flex-1">
                <ChatThread 
                  messages={[
                    { role: 'assistant', content: 'How can I help you today?' },
                    { role: 'user', content: "Can you analyze our sales data?" },
                  ]} 
                  variant="bordered"
                  className="h-full" 
                />
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Solid Style */}
            <div className="flex flex-col overflow-hidden flex-1">
              <p className="text-sm text-muted-foreground mb-2">Solid</p>
              <div className="flex-1">
                <ChatThread 
                  messages={[
                    { role: 'assistant', content: 'How can I help you today?' },
                    { role: 'user', content: "Can you analyze our sales data?" },
                  ]} 
                  variant="solid"
                  className="h-full" 
                />
              </div>
            </div>
          </div>
          <ChatInput 
            placeholder="Type your message..."
            onValueSubmit={() => {
              setIsStreaming(true)
              setStreamedText("")
            }}
          />
        </div>
        
        {/* Bordered Variant with Animation */}
        <div className="col-span-6 border rounded-lg bg-card p-6 flex flex-col h-[700px]">
          <h3 className="font-semibold mb-4">Interactive Demo</h3>
          <div className="flex-1 relative">
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1">
                <ChatThread 
                  messages={[
                    { role: 'assistant', content: 'I can help analyze that for you.' },
                    { role: 'user', content: "Show me the Q1 performance" },
                    { role: 'assistant', content: streamedText },
                  ]} 
                  variant="bordered"
                  className="h-full" 
                />
              </div>
              <AnimatePresence mode="wait">
                {showChart && (
                  <motion.div
                    initial={{ opacity: 1, height: 'auto' }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full bg-muted/30 rounded-lg p-4"
                  >
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <Graph 
                        data={demoData}
                        variant="bordered"
                        size="sm"
                        className="h-[300px]"
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <ChatInput 
            variant="bordered"
            className="mt-6"
            placeholder="Type your message..."
            onValueSubmit={() => {
              setIsStreaming(true)
              setStreamedText("")
            }}
          />
        </div>

        {/* Full-width Solid Variant */}
        <div className="col-span-12 border rounded-lg bg-card p-6 min-h-[400px] flex flex-col">
          <h3 className="font-semibold mb-4">Solid Style with Typing Indicator</h3>
          <div className="flex-1 overflow-hidden">
            <ChatThread 
              messages={[
                { role: 'assistant', content: 'I can help you with data visualization. I support multiple chart types and interactive features.' },
                { role: 'user', content: "What types of charts can you generate?" },
              ]} 
              variant="solid"
              className="h-full" 
            />
          </div>

            <div className="flex gap-2 items-center text-sm text-muted-foreground my-4 ml-4">
              <motion.div 
                className="w-2 h-2 bg-primary rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div 
                className="w-2 h-2 bg-primary rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div 
                className="w-2 h-2 bg-primary rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>

          <ChatInput 
            variant="solid"
            className="mt-4"
            placeholder="Type your message..."
            onValueSubmit={() => {
              setIsStreaming(true)
              setStreamedText("")
            }}
          />
        </div>
      </div>
    </main>
  )
}
