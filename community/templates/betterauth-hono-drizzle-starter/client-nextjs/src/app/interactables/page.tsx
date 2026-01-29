"use client";

import {
  MessageInput,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/tambo/message-input";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { ShoppingDemo } from "./components/shopping-demo";
import { authClient } from "@/lib/auth-client";

export default function InteractablesPage() {
  const { data: session } = authClient.useSession();

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      userToken={session?.session?.token}
    >
    
      <div className="h-screen w-screen flex flex-col lg:flex-row bg-gray-50 font-[family-name:var(--font-geist-sans)] overflow-hidden">
        
        
        <div className="w-full lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col h-1/2 lg:h-screen">
         
          <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-lg font-semibold text-gray-900">AI Shopping Assistant</h2>
            <p className="text-sm text-gray-600 mt-1">Try: "add headphones to cart" or "show me the cart"</p>
          </div>

          
          <div className="flex-1 overflow-y-auto min-h-0">
            <ScrollableMessageContainer className="h-full">
              <ThreadContent variant="default">
                <ThreadContentMessages />
              </ThreadContent>
            </ScrollableMessageContainer>
          </div>

         
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
            <MessageInput variant="bordered">
              <MessageInputTextarea 
                placeholder="Ask the AI to help with shopping..." 
                className="max-h-24"
              />
              <MessageInputToolbar>
                <MessageInputSubmitButton />
              </MessageInputToolbar>
            </MessageInput>
          </div>
        </div>

        
        <div className="flex-1 overflow-y-auto bg-gray-50 h-1/2 lg:h-screen">
          <div className="p-4 lg:p-6 h-full">
            <ShoppingDemo />
          </div>
        </div>
      </div>
    </TamboProvider>
  );
}